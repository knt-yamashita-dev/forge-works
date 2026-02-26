import * as React from "react";
import { useAppContext } from "./AppContext";
import type { Task } from "../../types/task";
import {
	getDueUrgency,
	getDueUrgencyClass,
} from "../../utils/dueDateUtils";
import { InlineEdit } from "./InlineEdit";

interface KanbanCardProps {
	task: Task;
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

export function KanbanCard({ task }: KanbanCardProps): React.ReactElement {
	const { onOpenTask, taskService } = useAppContext();

	const dueUrgency = getDueUrgency(
		task.frontmatter.due,
		task.frontmatter.status === "done"
	);

	const parentTask = task.frontmatter.parent
		? taskService?.getParentTask(task.filePath)
		: null;

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData("text/plain", task.filePath);
		e.dataTransfer.effectAllowed = "move";
	};

	return (
		<div
			className="vt-kanban-card"
			draggable
			onDragStart={handleDragStart}
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
			<div className="vt-kanban-card-header">
				<InlineEdit
					value={task.title}
					className="vt-kanban-card-title"
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
						color: PRIORITY_COLORS[task.frontmatter.priority],
					}}
					onClick={(e) => {
						e.stopPropagation();
						taskService?.cycleTaskPriority(task.filePath);
					}}
					title={`Priority: ${task.frontmatter.priority} (click to cycle)`}
				>
					{PRIORITY_LABELS[task.frontmatter.priority]}
				</span>
			</div>
			{(task.frontmatter.due || task.frontmatter.project) && (
				<div className="vt-kanban-card-meta">
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
				</div>
			)}
		</div>
	);
}
