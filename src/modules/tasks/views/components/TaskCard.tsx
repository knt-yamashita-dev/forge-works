import * as React from "react";
import { useAppContext } from "./AppContext";
import type { Task, TaskStatus } from "../../types/task";
import {
	getOrderedStatuses,
	buildStatusCycle,
	buildStatusIcons,
	COMPLETION_STATUS,
} from "../../types/task";
import {
	getDueUrgency,
	getDueUrgencyClass,
} from "../../utils/dueDateUtils";
import { InlineEdit } from "./InlineEdit";

interface TaskCardProps {
	task: Task;
	depth?: number;
	onStatusChange: (filePath: string, newStatus: TaskStatus) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
	urgent: "var(--text-error)",
	high: "var(--color-orange)",
	medium: "var(--color-blue)",
	low: "var(--text-muted)",
};

const PRIORITY_LABELS: Record<string, string> = {
	urgent: "!!!",
	high: "!!",
	medium: "!",
	low: "\u2212",
};

export function TaskCard({
	task,
	depth = 0,
	onStatusChange,
}: TaskCardProps): React.ReactElement {
	const { onOpenTask, onCreateChildTask, onEditTask, taskService, settings } =
		useAppContext();

	const orderedStatuses = React.useMemo(
		() => getOrderedStatuses(settings.customStatuses, settings.statusOrder),
		[settings.customStatuses, settings.statusOrder]
	);
	const statusCycle = React.useMemo(
		() => buildStatusCycle(orderedStatuses),
		[orderedStatuses]
	);
	const statusIcons = React.useMemo(
		() => buildStatusIcons(orderedStatuses),
		[orderedStatuses]
	);

	const isChild = !!task.frontmatter.parent;
	const isDone = task.frontmatter.status === COMPLETION_STATUS;

	const dueUrgency = getDueUrgency(
		task.frontmatter.due,
		task.frontmatter.status === COMPLETION_STATUS
	);

	const handleStatusClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isChild) {
			// Checkbox toggle: done ↔ parent's status
			if (isDone) {
				const parent = taskService?.getParentTask(task.filePath);
				onStatusChange(
					task.filePath,
					parent?.frontmatter.status || "todo"
				);
			} else {
				onStatusChange(task.filePath, COMPLETION_STATUS);
			}
		} else {
			// Normal cycle for parent tasks
			const nextStatus = statusCycle[task.frontmatter.status] || "todo";
			onStatusChange(task.filePath, nextStatus);
		}
	};

	const parentTask = task.frontmatter.parent
		? taskService?.getParentTask(task.filePath)
		: null;

	return (
		<div
			className={`vt-task-card${depth > 0 ? " vt-task-child" : ""}${isChild && isDone ? " vt-child-done" : ""}`}
			style={depth > 0 ? { marginLeft: depth * 16 } : undefined}
			onClick={() => onOpenTask(task.filePath)}
		>
			{task.frontmatter.parent && (
				<div className="vt-task-parent">
					↑{" "}
					{parentTask
						? parentTask.title
						: task.frontmatter.parent.replace(
								/^\[\[|\]\]$/g,
								""
							)}
				</div>
			)}
			<div className="vt-task-card-header">
				<button
					className={`vt-status-toggle${isChild ? " vt-checkbox" : ""}`}
					onClick={handleStatusClick}
					title={
						isChild
							? isDone
								? "Uncheck"
								: "Check as done"
							: `Change to ${statusCycle[task.frontmatter.status] || "todo"}`
					}
				>
					{isChild
						? isDone
							? "\u2611"
							: "\u2610"
						: statusIcons[task.frontmatter.status] || "\u25cb"}
				</button>
				<InlineEdit
					value={task.title}
					className="vt-task-title"
					onSave={(newTitle) => {
						taskService?.updateTaskTitle(
							task.filePath,
							newTitle
						);
					}}
				/>
				<span
					className="vt-priority-badge vt-inline-editable"
					style={{
						color: PRIORITY_COLORS[
							task.frontmatter.priority
						],
					}}
					onClick={(e) => {
						e.stopPropagation();
						taskService?.cycleTaskPriority(task.filePath);
					}}
					title={`Priority: ${task.frontmatter.priority} (click to cycle)`}
				>
					{PRIORITY_LABELS[task.frontmatter.priority]}
				</span>
				<button
					className="vt-edit-button"
					onClick={(e) => {
						e.stopPropagation();
						onCreateChildTask(task.filePath);
					}}
					title="Create child task"
				>
					{"+"}
				</button>
				<button
					className="vt-edit-button"
					onClick={(e) => {
						e.stopPropagation();
						onEditTask(task.filePath);
					}}
					title="Edit task"
				>
					{"\u270e"}
				</button>
			</div>
			<div className="vt-task-card-meta">
				{task.frontmatter.due && (
					<InlineEdit
						value={task.frontmatter.due}
						className={`vt-due-date${getDueUrgencyClass(dueUrgency) ? ` ${getDueUrgencyClass(dueUrgency)}` : ""}`}
						inputType="date"
						onSave={(newDate) => {
							taskService?.updateTaskFrontmatter(
								task.filePath,
								{ due: newDate }
							);
						}}
					/>
				)}
				{task.frontmatter.project && (
					<span className="vt-project-pill">
						{task.frontmatter.project}
					</span>
				)}
				{task.subtaskProgress && (
					<span className="vt-subtask-progress">
						{task.subtaskProgress.completed}/
						{task.subtaskProgress.total}
					</span>
				)}
			</div>
		</div>
	);
}
