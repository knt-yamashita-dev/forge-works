import type { AgentTask, AgentStep, AgentModeSettings, AgentServiceState } from "../types/agent";
import type { ChatMessage } from "../types/chat";
import type { GeminiService } from "./geminiService";
import type { FileOperationService } from "./fileOperationService";
import type { KnowledgeService } from "./knowledgeService";
import {
    parseFileOperations,
    stripFileOperationCommands,
} from "../utils/commandParser";

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export class AgentService {
    private geminiService: GeminiService;
    private fileOperationService: FileOperationService;
    private knowledgeService: KnowledgeService;
    private mode: AgentModeSettings;
    private currentTask: AgentTask | null = null;
    private onProgress: (task: AgentTask) => void;
    private serviceState: AgentServiceState = "idle";
    private abortController: AbortController | null = null;
    private chatHistory: ChatMessage[] = [];

    constructor(
        geminiService: GeminiService,
        fileOperationService: FileOperationService,
        knowledgeService: KnowledgeService,
        mode: AgentModeSettings,
        onProgress: (task: AgentTask) => void
    ) {
        this.geminiService = geminiService;
        this.fileOperationService = fileOperationService;
        this.knowledgeService = knowledgeService;
        this.mode = mode;
        this.onProgress = onProgress;
    }

    updateMode(mode: AgentModeSettings): void {
        this.mode = mode;
    }

    async startTask(goal: string, context?: string, chatHistory?: ChatMessage[]): Promise<AgentTask> {
        // Store chat history (limit to last 20 messages)
        this.chatHistory = (chatHistory ?? []).slice(-20);

        // Create initial task with planning step
        const task: AgentTask = {
            id: generateId(),
            goal,
            steps: [
                {
                    id: generateId(),
                    description: "Planning task execution",
                    fileOperations: [],
                    status: "pending",
                },
            ],
            currentStepIndex: 0,
            status: "pending",
            createdAt: Date.now(),
        };

        this.currentTask = task;
        this.onProgress(task);

        // Start planning
        await this.planTask(goal, context);

        // After planning, set to plan_review for user approval
        if (this.currentTask && this.currentTask.status !== "failed") {
            this.currentTask.status = "plan_review";
            this.onProgress(this.currentTask);
        }

        return this.currentTask!;
    }

    private async planTask(goal: string, context?: string): Promise<void> {
        if (!this.currentTask) return;

        const task = this.currentTask;
        const planningStep = task.steps[0];

        try {
            planningStep.status = "running";
            planningStep.startedAt = Date.now();
            this.onProgress(task);

            // Planning prompt
            const planningPrompt = `
You are an autonomous AI agent working in Obsidian. Break down the following goal into concrete, actionable steps.
Each step should be a clear task that can be accomplished with file operations (create, edit, or append).

Goal: ${goal}

${context ? `Context:\n${context}` : ""}

Provide a numbered step-by-step plan. Each step should be one clear sentence.
Format:
1. [First step description]
2. [Second step description]
3. [Third step description]
...

Keep the plan focused and achievable. Limit to ${this.mode.maxSteps} steps maximum.
			`.trim();

            // Get plan from AI
            let planResponse = "";
            for await (const chunk of this.geminiService.streamResponse(
                planningPrompt,
                this.chatHistory,
                undefined,
                undefined,
                this.abortController?.signal
            )) {
                planResponse += chunk;
            }

            // Parse steps from plan
            let steps = this.parseStepsFromPlan(planResponse);

            // Retry with explicit format request if parsing failed
            if (steps.length === 0) {
                let retryResponse = "";
                for await (const chunk of this.geminiService.streamResponse(
                    "Please reformat the plan as a simple numbered list:\n1. First step\n2. Second step\n...",
                    this.chatHistory,
                    undefined,
                    undefined,
                    this.abortController?.signal
                )) {
                    retryResponse += chunk;
                }
                steps = this.parseStepsFromPlan(retryResponse);
            }

            // Ultimate fallback: treat entire plan as a single step
            if (steps.length === 0) {
                steps = [
                    {
                        id: generateId(),
                        description: "Execute the planned task",
                        fileOperations: [],
                        status: "pending",
                    },
                ];
            }

            // Update task with parsed steps
            task.steps = steps;
            task.currentStepIndex = 0;
            planningStep.status = "completed";
            planningStep.completedAt = Date.now();
            planningStep.result = planResponse;

            this.onProgress(task);
        } catch (error) {
            planningStep.status = "failed";
            planningStep.error =
                error instanceof Error ? error.message : "Unknown error";
            task.status = "failed";
            this.onProgress(task);
        }
    }

    async executeNextStep(): Promise<boolean> {
        if (!this.currentTask) {
            throw new Error("No active task");
        }

        const task = this.currentTask;

        if (task.currentStepIndex >= task.steps.length) {
            task.status = "completed";
            task.completedAt = Date.now();
            this.onProgress(task);
            return false;
        }

        const step = task.steps[task.currentStepIndex];

        if (step.status !== "pending") {
            task.currentStepIndex++;
            return task.currentStepIndex < task.steps.length;
        }

        try {
            step.status = "running";
            step.startedAt = Date.now();
            this.onProgress(task);

            // Build step overview (always include all step descriptions)
            const stepOverview = task.steps
                .map(
                    (s, i) =>
                        `${i + 1}. ${s.description} [${s.status}]`
                )
                .join("\n");

            // Build detailed context from recent steps only
            const contextStart = Math.max(
                0,
                task.currentStepIndex - this.mode.contextWindowSteps
            );
            const recentContext = task.steps
                .slice(contextStart, task.currentStepIndex)
                .filter((s) => s.status === "completed" && s.result)
                .map(
                    (s, i) =>
                        `Step ${contextStart + i + 1} (${s.description}):\n${s.result}`
                )
                .join("\n\n");

            // Execution prompt
            const executionPrompt = `
You are executing step ${task.currentStepIndex + 1} of a multi-step task.

Overall goal: ${task.goal}

Plan overview:
${stepOverview}

Current step: ${step.description}

${recentContext ? `Recent steps detail:\n${recentContext}\n\n` : ""}

Execute this step now using file operation commands when needed.
Use the following format for file operations:

[CREATE_FILE:path/to/file.md]
File content here
[/FILE]

[EDIT_FILE:path/to/existing.md]
Replacement content here
[/FILE]

[APPEND_FILE:path/to/existing.md]
Content to append
[/FILE]

Do NOT wrap file content in code fences (\`\`\`). Provide a brief explanation of what you're doing, then execute the necessary file operations.
			`.trim();

            // Execute step with timeout (60s per step)
            const stepSignals: AbortSignal[] = [AbortSignal.timeout(60_000)];
            if (this.abortController) {
                stepSignals.push(this.abortController.signal);
            }
            const combinedSignal = AbortSignal.any(stepSignals);

            let fullResponse = "";
            for await (const chunk of this.geminiService.streamResponse(
                executionPrompt,
                this.chatHistory,
                undefined,
                undefined,
                combinedSignal
            )) {
                fullResponse += chunk;
            }

            // Parse file operations
            const operations = parseFileOperations(fullResponse);
            step.fileOperations = operations;

            // Execute operations if auto-approve is enabled
            if (this.mode.autoApprove && operations.length > 0) {
                let hasError = false;
                for (const op of operations) {
                    try {
                        await this.fileOperationService.execute(op);
                        op.status = "approved";
                    } catch (error) {
                        op.status = "error";
                        op.errorMessage =
                            error instanceof Error
                                ? error.message
                                : "Unknown error";
                        hasError = true;
                    }
                }

                if (hasError) {
                    const succeeded = operations.filter(
                        (o) => o.status === "approved"
                    ).length;
                    const failed = operations.filter(
                        (o) => o.status === "error"
                    ).length;
                    step.error = `Partial failure: ${succeeded} succeeded, ${failed} failed`;
                    step.status = "failed";
                    step.completedAt = Date.now();
                    step.result = stripFileOperationCommands(fullResponse);
                    task.currentStepIndex++;

                    if (this.mode.pauseOnError) {
                        task.status = "paused";
                    }

                    this.onProgress(task);
                    return (
                        task.currentStepIndex < task.steps.length &&
                        task.status === "running"
                    );
                }
            }

            step.status = "completed";
            step.completedAt = Date.now();
            step.result = stripFileOperationCommands(fullResponse);

            // Move to next step
            task.currentStepIndex++;

            if (task.currentStepIndex >= task.steps.length) {
                task.status = "completed";
                task.completedAt = Date.now();
            }

            this.onProgress(task);
            return task.currentStepIndex < task.steps.length;
        } catch (error) {
            step.status = "failed";
            step.error =
                error instanceof Error ? error.message : "Unknown error";

            if (this.mode.pauseOnError) {
                task.status = "paused";
            } else {
                task.status = "failed";
            }

            this.onProgress(task);
            return false;
        }
    }

    async runToCompletion(): Promise<void> {
        if (!this.currentTask) {
            throw new Error("No active task");
        }

        if (this.serviceState === "running") {
            throw new Error("Task is already running");
        }

        this.serviceState = "running";
        this.abortController = new AbortController();
        this.currentTask.status = "running";
        this.onProgress(this.currentTask);

        try {
            let hasMore = true;
            while (
                hasMore &&
                this.serviceState === "running" &&
                this.currentTask.status === "running"
            ) {
                hasMore = await this.executeNextStep();

                // Check max steps limit
                if (this.currentTask.currentStepIndex >= this.mode.maxSteps) {
                    this.currentTask.status = "paused";
                    this.onProgress(this.currentTask);
                    break;
                }
            }
        } finally {
            // serviceState may have been changed externally by pauseTask()
            // during an await in the loop, so we cast to avoid TS narrowing
            const finalState = this.serviceState as AgentServiceState;
            if (finalState === "pausing" && this.currentTask) {
                this.currentTask.status = "paused";
                this.onProgress(this.currentTask);
            }
            this.abortController = null;
            this.serviceState = "idle";
        }
    }

    pauseTask(): void {
        if (this.currentTask && this.serviceState === "running") {
            this.serviceState = "pausing";
            this.abortController?.abort();
            // Actual pause completion happens in runToCompletion() finally block
        }
    }

    async resumeTask(): Promise<void> {
        if (
            this.currentTask &&
            this.currentTask.status === "paused" &&
            this.serviceState === "idle"
        ) {
            await this.runToCompletion();
        }
    }

    stopTask(): void {
        if (this.currentTask) {
            this.serviceState = "stopped";
            this.abortController?.abort();
            this.abortController = null;
            this.currentTask.status = "failed";
            this.currentTask.completedAt = Date.now();
            this.onProgress(this.currentTask);
            this.currentTask = null;
            this.serviceState = "idle";
        }
    }

    async approvePlan(): Promise<void> {
        if (!this.currentTask || this.currentTask.status !== "plan_review") return;
        await this.runToCompletion();
    }

    rejectPlan(): void {
        if (!this.currentTask || this.currentTask.status !== "plan_review") return;
        this.currentTask.status = "failed";
        this.currentTask.completedAt = Date.now();
        this.onProgress(this.currentTask);
        this.currentTask = null;
    }

    async retryStep(stepIndex: number): Promise<void> {
        if (!this.currentTask || this.serviceState !== "idle") return;
        const step = this.currentTask.steps[stepIndex];
        if (!step || (step.status !== "failed" && step.status !== "skipped")) return;

        // Reset step state
        step.status = "pending";
        step.error = undefined;
        step.result = undefined;
        step.fileOperations = [];
        step.startedAt = undefined;
        step.completedAt = undefined;

        // Set currentStepIndex to retry from this step
        this.currentTask.currentStepIndex = stepIndex;
        this.onProgress(this.currentTask);

        // Resume execution from this step
        await this.runToCompletion();
    }

    skipStep(stepIndex: number): void {
        if (!this.currentTask) return;
        const step = this.currentTask.steps[stepIndex];
        if (!step || step.status === "completed" || step.status === "running") return;

        step.status = "skipped";
        step.completedAt = Date.now();

        // If this was the blocking step, advance
        if (stepIndex === this.currentTask.currentStepIndex) {
            this.currentTask.currentStepIndex++;
        }

        // Check if all remaining steps are done
        if (this.currentTask.currentStepIndex >= this.currentTask.steps.length) {
            this.currentTask.status = "completed";
            this.currentTask.completedAt = Date.now();
        }

        this.onProgress(this.currentTask);
    }

    restoreTask(task: AgentTask): void {
        if (this.serviceState !== "idle") return;
        this.currentTask = task;
    }

    getCurrentTask(): AgentTask | null {
        return this.currentTask;
    }

    isTaskRunning(): boolean {
        return this.serviceState === "running";
    }

    private parseStepsFromPlan(plan: string): AgentStep[] {
        const lines = plan.split("\n");
        const steps: AgentStep[] = [];

        for (const line of lines) {
            let description: string | null = null;

            // Pattern 1: "1. Step" / "1) Step" / "1. **Step**"
            let m = line.match(/^\s*\d+[.)]\s*\*{0,2}(.+?)\*{0,2}\s*$/);
            if (m) {
                description = m[1].trim();
            }

            // Pattern 2: "- Step" / "* Step" / "- Step 1: ..."
            if (!description) {
                m = line.match(/^\s*[-*]\s+(?:[Ss]tep\s+\d+[:.]\s*)?(.+)$/);
                if (m) {
                    description = m[1].trim();
                }
            }

            // Pattern 3: "### Step 1: ..." / "## Create file"
            if (!description) {
                m = line.match(
                    /^\s*#{1,3}\s+(?:[Ss]tep\s+)?\d*[:.]*\s*(.+)$/
                );
                if (m) {
                    description = m[1].trim();
                }
            }

            // Skip very short or empty descriptions
            if (description && description.length > 5) {
                steps.push({
                    id: generateId(),
                    description,
                    fileOperations: [],
                    status: "pending",
                });
            }
        }

        // Limit to max steps
        return steps.slice(0, this.mode.maxSteps);
    }
}
