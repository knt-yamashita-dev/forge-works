import * as React from "react";
import { useAppContext } from "./AppContext";
import { KanbanCard } from "./KanbanCard";
import type { Task, TaskStatus, TaskPriority } from "../../types/task";
import { TASK_PRIORITIES, COMPLETION_STATUS, getOrderedStatuses } from "../../types/task";

interface MatrixBoardProps {
	compact?: boolean;
}

export function MatrixBoard({
	compact = false,
}: MatrixBoardProps): React.ReactElement {
	const { taskService, settings, onUpdateSettings, onCreateTask } =
		useAppContext();
	const [tasks, setTasks] = React.useState<Task[]>([]);
	const [dragOverCell, setDragOverCell] = React.useState<string | null>(null);

	const hideDone = settings.kanbanHideDone;

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

	const cellKey = (priority: string, status: string) =>
		`${priority}:${status}`;

	// Build matrix data first, then derive visible rows/columns
	const { visibleStatuses, visiblePriorities, matrix } = React.useMemo(() => {
		// Collect which statuses/priorities have tasks
		const statusSet = new Set<string>();
		const prioritySet = new Set<string>();

		for (const task of filteredTasks) {
			statusSet.add(task.frontmatter.status);
			prioritySet.add(task.frontmatter.priority);
		}

		// Use ordered statuses from settings, filtered by kanbanVisibleStatuses and task presence
		const allStatuses = getOrderedStatuses(
			settings.customStatuses,
			settings.statusOrder
		);
		const statuses = allStatuses.filter(
			(s) =>
				statusSet.has(s.value) &&
				settings.kanbanVisibleStatuses.includes(s.value) &&
				!(hideDone && s.value === COMPLETION_STATUS)
		);

		// Filter priorities: must have tasks, ordered urgent first
		const priorities = [...TASK_PRIORITIES]
			.reverse()
			.filter((p) => prioritySet.has(p.value));

		// Build cell map
		const cells = new Map<string, Task[]>();
		for (const p of priorities) {
			for (const s of statuses) {
				cells.set(cellKey(p.value, s.value), []);
			}
		}
		for (const task of filteredTasks) {
			const key = cellKey(
				task.frontmatter.priority,
				task.frontmatter.status
			);
			const cell = cells.get(key);
			if (cell) {
				cell.push(task);
			}
		}

		return {
			visibleStatuses: statuses,
			visiblePriorities: priorities,
			matrix: cells,
		};
	}, [filteredTasks, settings.customStatuses, settings.statusOrder, settings.kanbanVisibleStatuses, hideDone]);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (
		e: React.DragEvent,
		targetStatus: TaskStatus,
		targetPriority: TaskPriority
	) => {
		e.preventDefault();
		setDragOverCell(null);
		const filePath = e.dataTransfer.getData("text/plain");
		if (filePath && taskService) {
			taskService.updateTaskFrontmatter(filePath, {
				status: targetStatus,
				priority: targetPriority,
			});
		}
	};

	const handleDragEnter = (e: React.DragEvent, key: string) => {
		e.preventDefault();
		setDragOverCell(key);
	};

	const handleDragLeave = (e: React.DragEvent, cellEl: HTMLElement) => {
		if (!cellEl.contains(e.relatedTarget as Node)) {
			setDragOverCell(null);
		}
	};

	const handleToggleHideDone = () => {
		onUpdateSettings({ kanbanHideDone: !hideDone });
	};

	const colCount = visibleStatuses.length;

	if (visiblePriorities.length === 0 || visibleStatuses.length === 0) {
		return (
			<div
				className={`vt-matrix${compact ? " vt-matrix-compact" : ""}`}
			>
				<div className="vt-matrix-toolbar">
					<label className="vt-matrix-toolbar-item">
						<input
							type="checkbox"
							checked={hideDone}
							onChange={handleToggleHideDone}
						/>
						<span>Hide Done</span>
					</label>
				</div>
				<div className="vt-matrix-empty">No tasks</div>
			</div>
		);
	}

	return (
		<div
			className={`vt-matrix${compact ? " vt-matrix-compact" : ""}`}
		>
			<div className="vt-matrix-toolbar">
				<button
					className="vt-matrix-toolbar-button"
					onClick={onCreateTask}
					title="Create new task"
				>
					+
				</button>
				<label className="vt-matrix-toolbar-item">
					<input
						type="checkbox"
						checked={hideDone}
						onChange={handleToggleHideDone}
					/>
					<span>Hide Done</span>
				</label>
			</div>
			<div
				className="vt-matrix-grid"
				style={{
					gridTemplateColumns: `auto repeat(${colCount}, 1fr)`,
					gridTemplateRows: `auto repeat(${visiblePriorities.length}, 1fr)`,
				}}
			>
				{/* Corner cell */}
				<div className="vt-matrix-corner" />

				{/* Column headers (Status) */}
				{visibleStatuses.map((s) => (
					<div
						key={s.value}
						className="vt-matrix-col-header"
					>
						{s.label}
					</div>
				))}

				{/* Rows (Priority) */}
				{visiblePriorities.map((p) => (
					<React.Fragment key={p.value}>
						<div className="vt-matrix-row-header">
							{p.label}
						</div>
						{visibleStatuses.map((s) => {
							const key = cellKey(p.value, s.value);
							const cellTasks = matrix.get(key) || [];
							return (
								<div
									key={key}
									className={`vt-matrix-cell${dragOverCell === key ? " vt-drag-over" : ""}`}
									onDragOver={handleDragOver}
									onDrop={(e) =>
										handleDrop(
											e,
											s.value,
											p.value
										)
									}
									onDragEnter={(e) =>
										handleDragEnter(e, key)
									}
									onDragLeave={(e) =>
										handleDragLeave(
											e,
											e.currentTarget as HTMLElement
										)
									}
								>
									{cellTasks.length > 0 && (
										<span className="vt-matrix-cell-count">
											{cellTasks.length}
										</span>
									)}
									{cellTasks.map((task) => (
										<KanbanCard
											key={task.filePath}
											task={task}
										/>
									))}
								</div>
							);
						})}
					</React.Fragment>
				))}
			</div>
		</div>
	);
}
