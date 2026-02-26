import * as React from "react";
import type { AgentTask } from "../../types/agent";

interface Props {
    task: AgentTask | null;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onApprovePlan: () => void;
    onRejectPlan: () => void;
    onRetryStep: (stepIndex: number) => void;
    onSkipStep: (stepIndex: number) => void;
}

export const AgentTaskPanel: React.FC<Props> = ({
    task,
    onPause,
    onResume,
    onStop,
    onApprovePlan,
    onRejectPlan,
    onRetryStep,
    onSkipStep,
}) => {
    if (!task) return null;

    const progress =
        task.steps.length > 0
            ? (task.currentStepIndex / task.steps.length) * 100
            : 0;

    const getStatusIcon = (status: string): string => {
        switch (status) {
            case "completed":
            case "approved":
                return "\u2713";
            case "running":
                return "\u231B";
            case "failed":
            case "error":
                return "\u2717";
            case "paused":
                return "\u23F8";
            case "plan_review":
                return "\uD83D\uDCCB";
            case "skipped":
                return "\u23ED";
            case "rejected":
                return "\u2298";
            default:
                return "\u25CB";
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case "completed":
            case "approved":
                return "#4caf50";
            case "running":
                return "#2196f3";
            case "failed":
            case "error":
                return "#f44336";
            case "paused":
            case "rejected":
                return "#ff9800";
            case "plan_review":
                return "#9c27b0";
            case "skipped":
                return "#9e9e9e";
            default:
                return "#9e9e9e";
        }
    };

    const isPlanReview = task.status === "plan_review";
    const isPaused = task.status === "paused";

    return (
        <div className="agent-task-panel">
            <div className="agent-header">
                <span className="agent-icon">🤖</span>
                <span
                    className="agent-status"
                    style={{ color: getStatusColor(task.status) }}
                >
                    Agent Mode: {isPlanReview ? "Plan Review" : task.status}
                </span>
            </div>

            <div className="agent-goal">
                <strong>Task:</strong> {task.goal}
            </div>

            {!isPlanReview && (
                <div className="agent-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: getStatusColor(task.status),
                            }}
                        />
                    </div>
                    <span className="progress-text">
                        Step {task.currentStepIndex} / {task.steps.length}
                    </span>
                </div>
            )}

            <div className="agent-steps">
                {task.steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`agent-step agent-step-${step.status}`}
                    >
                        <span
                            className="step-icon"
                            style={{ color: getStatusColor(step.status) }}
                        >
                            {getStatusIcon(step.status)}
                        </span>
                        <div className="step-content">
                            <div className="step-description">
                                <strong>Step {index + 1}:</strong>{" "}
                                {step.description}
                            </div>
                            {step.result && step.status === "completed" && (
                                <div className="step-result">{step.result}</div>
                            )}
                            {step.error && (
                                <div className="step-error">
                                    Error: {step.error}
                                </div>
                            )}
                            {step.fileOperations &&
                                step.fileOperations.length > 0 && (
                                    <div className="step-operations">
                                        {step.fileOperations.map((op, i) => (
                                            <div
                                                key={i}
                                                className="operation-item"
                                            >
                                                <span
                                                    className="operation-icon"
                                                    style={{
                                                        color: getStatusColor(
                                                            op.status
                                                        ),
                                                    }}
                                                >
                                                    {getStatusIcon(op.status)}
                                                </span>
                                                <span className="operation-type">
                                                    {op.type}
                                                </span>
                                                <span className="operation-path">
                                                    {op.targetPath}
                                                </span>
                                                {op.errorMessage && (
                                                    <span className="operation-error">
                                                        {op.errorMessage}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            {/* Retry/Skip buttons for failed or skipped steps */}
                            {(step.status === "failed" || step.status === "skipped") &&
                                (task.status === "paused" || task.status === "failed" || task.status === "completed") && (
                                <div className="step-actions">
                                    <button
                                        className="step-action-button step-retry-button"
                                        onClick={() => onRetryStep(index)}
                                        title="Retry this step"
                                    >
                                        ↻ Retry
                                    </button>
                                    {step.status === "failed" && (
                                        <button
                                            className="step-action-button step-skip-button"
                                            onClick={() => onSkipStep(index)}
                                            title="Skip this step"
                                        >
                                            ⏭ Skip
                                        </button>
                                    )}
                                </div>
                            )}
                            {/* Skip button for pending steps when paused */}
                            {step.status === "pending" && isPaused && (
                                <div className="step-actions">
                                    <button
                                        className="step-action-button step-skip-button"
                                        onClick={() => onSkipStep(index)}
                                        title="Skip this step"
                                    >
                                        ⏭ Skip
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="agent-controls">
                {isPlanReview && (
                    <>
                        <button
                            className="agent-button agent-approve"
                            onClick={onApprovePlan}
                        >
                            ▶ Approve & Run
                        </button>
                        <button
                            className="agent-button agent-reject"
                            onClick={onRejectPlan}
                        >
                            ✗ Reject
                        </button>
                    </>
                )}
                {task.status === "running" && (
                    <button
                        className="agent-button agent-pause"
                        onClick={onPause}
                    >
                        ⏸ Pause
                    </button>
                )}
                {isPaused && (
                    <button
                        className="agent-button agent-resume"
                        onClick={onResume}
                    >
                        ▶ Resume
                    </button>
                )}
                {(task.status === "running" || isPaused || isPlanReview) && (
                    <button className="agent-button agent-stop" onClick={onStop}>
                        ⏹ Stop
                    </button>
                )}
            </div>
        </div>
    );
};
