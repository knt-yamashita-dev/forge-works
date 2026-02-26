import * as React from "react";
import { useAppContext } from "./AppContext";
import { KanbanCard } from "./KanbanCard";
import type { Task, TaskStatus, TaskPriority, KanbanSubGroup } from "../../types/task";
import { TASK_PRIORITIES, COMPLETION_STATUS, getOrderedStatuses } from "../../types/task";

interface KanbanBoardProps {
	compact?: boolean;
}

interface SubGroupSection {
	key: string;
	label: string;
	tasks: Task[];
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
	urgent: 0,
	high: 1,
	medium: 2,
	low: 3,
};

function buildSubGroups(
	tasks: Task[],
	subGroup: KanbanSubGroup
): SubGroupSection[] {
	if (subGroup === "none") {
		return [{ key: "all", label: "", tasks }];
	}

	if (subGroup === "priority") {
		return TASK_PRIORITIES.map((p) => ({
			key: p.value,
			label: p.label,
			tasks: tasks.filter((t) => t.frontmatter.priority === p.value),
		})).filter((g) => g.tasks.length > 0);
	}

	// subGroup === "project"
	const projectNames = [
		...new Set(
			tasks.map((t) => t.frontmatter.project || "(No Project)")
		),
	].sort();
	return projectNames
		.map((p) => ({
			key: p,
			label: p,
			tasks: tasks.filter(
				(t) => (t.frontmatter.project || "(No Project)") === p
			),
		}))
		.filter((g) => g.tasks.length > 0);
}

export function KanbanBoard({
	compact = false,
}: KanbanBoardProps): React.ReactElement {
	const { taskService, settings, onUpdateSettings } = useAppContext();
	const [tasks, setTasks] = React.useState<Task[]>([]);
	const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(
		null
	);

	const hideDone = settings.kanbanHideDone;
	const subGroup = settings.kanbanSubGroup;

	React.useEffect(() => {
		if (!taskService) return;

		const handleChange = (updatedTasks: Task[]) => {
			setTasks(updatedTasks);
		};

		taskService.onChange(handleChange);
		setTasks(taskService.getTasks());

		return () => {
			taskService.offChange(handleChange);
		};
	}, [taskService]);

	const filteredTasks = React.useMemo(() => {
		let filtered = tasks;

		// Apply completed task retention
		if (
			settings.completedTaskRetentionDays > 0 ||
			!settings.showCompletedTasks
		) {
			const now = new Date();
			filtered = filtered.filter((task) => {
				if (task.frontmatter.status !== COMPLETION_STATUS) return true;
				if (!settings.showCompletedTasks) return false;
				if (settings.completedTaskRetentionDays > 0) {
					const updated = new Date(task.frontmatter.updated);
					const daysDiff =
						(now.getTime() - updated.getTime()) /
						(1000 * 60 * 60 * 24);
					return daysDiff <= settings.completedTaskRetentionDays;
				}
				return true;
			});
		}

		return filtered;
	}, [tasks, settings]);

	const visibleStatuses = React.useMemo(() => {
		const allStatuses = getOrderedStatuses(
			settings.customStatuses,
			settings.statusOrder
		);
		let filtered = allStatuses.filter((s) =>
			settings.kanbanVisibleStatuses.includes(s.value)
		);
		if (hideDone) {
			filtered = filtered.filter((s) => s.value !== COMPLETION_STATUS);
		}
		return filtered;
	}, [settings.customStatuses, settings.statusOrder, settings.kanbanVisibleStatuses, hideDone]);

	const columns = React.useMemo(() => {
		return visibleStatuses.map((s) => ({
			status: s.value,
			label: s.label,
			tasks: filteredTasks.filter(
				(t) => t.frontmatter.status === s.value
			),
			subGroups: buildSubGroups(
				filteredTasks.filter(
					(t) => t.frontmatter.status === s.value
				),
				subGroup
			),
		}));
	}, [filteredTasks, visibleStatuses, subGroup]);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
		e.preventDefault();
		setDragOverColumn(null);
		const filePath = e.dataTransfer.getData("text/plain");
		if (filePath && taskService) {
			taskService.updateTaskStatus(filePath, targetStatus);
		}
	};

	const handleDragEnter = (e: React.DragEvent, status: string) => {
		e.preventDefault();
		setDragOverColumn(status);
	};

	const handleDragLeave = (e: React.DragEvent, columnEl: HTMLElement) => {
		if (!columnEl.contains(e.relatedTarget as Node)) {
			setDragOverColumn(null);
		}
	};

	const handleToggleHideDone = () => {
		onUpdateSettings({ kanbanHideDone: !hideDone });
	};

	const handleSubGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onUpdateSettings({
			kanbanSubGroup: e.target.value as KanbanSubGroup,
		});
	};

	return (
		<div
			className={`vt-kanban${compact ? " vt-kanban-compact" : ""}`}
		>
			<div className="vt-kanban-toolbar">
				<label className="vt-kanban-toolbar-item">
					<input
						type="checkbox"
						checked={hideDone}
						onChange={handleToggleHideDone}
					/>
					<span>Hide Done</span>
				</label>
				<div className="vt-kanban-toolbar-item">
					<span className="vt-kanban-toolbar-label">
						Sub-group:
					</span>
					<select
						className="vt-kanban-toolbar-select"
						value={subGroup}
						onChange={handleSubGroupChange}
					>
						<option value="none">None</option>
						<option value="priority">Priority</option>
						<option value="project">Project</option>
					</select>
				</div>
			</div>
			<div className="vt-kanban-columns">
				{columns.map((col) => (
					<div
						key={col.status}
						className={`vt-kanban-column${dragOverColumn === col.status ? " vt-drag-over" : ""}`}
						onDragOver={handleDragOver}
						onDrop={(e) => handleDrop(e, col.status)}
						onDragEnter={(e) =>
							handleDragEnter(e, col.status)
						}
						onDragLeave={(e) =>
							handleDragLeave(
								e,
								e.currentTarget as HTMLElement
							)
						}
					>
						<div className="vt-kanban-column-header">
							<span className="vt-kanban-column-title">
								{col.label}
							</span>
							<span className="vt-kanban-column-count">
								{col.tasks.length}
							</span>
						</div>
						<div className="vt-kanban-column-body">
							{col.tasks.length === 0 ? (
								<div className="vt-kanban-empty">
									No tasks
								</div>
							) : subGroup === "none" ? (
								col.tasks.map((task) => (
									<KanbanCard
										key={task.filePath}
										task={task}
									/>
								))
							) : (
								col.subGroups.map((sg) => (
									<div
										key={sg.key}
										className="vt-kanban-subgroup"
									>
										<div className="vt-kanban-subgroup-header">
											{sg.label}
											<span className="vt-kanban-subgroup-count">
												{sg.tasks.length}
											</span>
										</div>
										{sg.tasks.map((task) => (
											<KanbanCard
												key={task.filePath}
												task={task}
											/>
										))}
									</div>
								))
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
