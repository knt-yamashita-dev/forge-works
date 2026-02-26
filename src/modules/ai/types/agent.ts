import type { FileOperationRequest } from "./fileOperation";

export type AgentTaskStatus =
	| "pending"
	| "plan_review"
	| "running"
	| "completed"
	| "failed"
	| "paused"
	| "skipped";

/** Internal state of AgentService (not persisted in AgentTask) */
export type AgentServiceState = "idle" | "running" | "pausing" | "stopped";

export interface AgentStep {
	id: string;
	description: string;
	fileOperations: FileOperationRequest[];
	status: AgentTaskStatus;
	result?: string;
	error?: string;
	startedAt?: number;
	completedAt?: number;
}

export interface AgentTask {
	id: string;
	goal: string; // User's goal
	steps: AgentStep[]; // Execution steps
	currentStepIndex: number; // Current step index
	status: AgentTaskStatus;
	createdAt: number;
	completedAt?: number;
}

export interface AgentModeSettings {
	enabled: boolean;
	maxSteps: number; // Maximum steps to prevent runaway
	autoApprove: boolean; // Auto-approve file operations
	pauseOnError: boolean; // Pause on error
	contextWindowSteps: number; // Recent steps to include in full context (default: 3)
}
