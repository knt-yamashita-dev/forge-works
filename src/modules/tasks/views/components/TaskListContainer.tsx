import * as React from "react";
import { useAppContext } from "./AppContext";
import { TaskCard } from "./TaskCard";
import { TaskFilterBar } from "./TaskFilterBar";
import { KanbanBoard } from "./KanbanBoard";
import { MatrixBoard } from "./MatrixBoard";
import type {
	Task,
	TaskFilter,
	TaskStatus,
	TaskPriority,
	TaskTreeNode,
	TaskSortKey,
	TaskGroupKey,
	ViewMode,
} from "../../types/task";
import {
	DEFAULT_FILTER,
	TASK_PRIORITIES,
	COMPLETION_STATUS,
	getOrderedStatuses,
} from "../../types/task";

interface TaskSection {
	key: string;
	label: string;
	tasks: Task[];
	tree: TaskTreeNode[];
}

function sortTasks(tasks: Task[], sortKey: TaskSortKey): Task[] {
	const sorted = [...tasks];
	switch (sortKey) {
		case "due":
			sorted.sort((a, b) => {
				const aDue = a.frontmatter.due || "9999-99-99";
				const bDue = b.frontmatter.due || "9999-99-99";
				return aDue.localeCompare(bDue);
			});
			break;
		case "priority": {
			const order: Record<TaskPriority, number> = {
				urgent: 0,
				high: 1,
				medium: 2,
				low: 3,
			};
			sorted.sort(
				(a, b) =>
					order[a.frontmatter.priority] -
					order[b.frontmatter.priority]
			);
			break;
		}
		default:
			sorted.sort((a, b) =>
				a.frontmatter.updated.localeCompare(
					b.frontmatter.updated
				)
			);
	}
	return sorted;
}

export function TaskListContainer(): React.ReactElement {
	const { taskService, onCreateTask, settings, onUpdateSettings } =
		useAppContext();
	const [tasks, setTasks] = React.useState<Task[]>([]);
	const [filter, setFilter] = React.useState<TaskFilter>({
		...DEFAULT_FILTER,
		statusFilter: [...settings.statusOrder],
	});
	const [showFilter, setShowFilter] = React.useState(false);
	const [collapsedSections, setCollapsedSections] = React.useState<
		Set<string>
	>(new Set([COMPLETION_STATUS]));

	const viewMode = settings.sidebarViewMode;
	const sortKey = settings.sidebarSortKey;
	const groupKey = settings.sidebarGroupKey;

	const orderedStatuses = React.useMemo(
		() => getOrderedStatuses(settings.customStatuses, settings.statusOrder),
		[settings.customStatuses, settings.statusOrder]
	);

	const handleViewModeChange = (mode: ViewMode) => {
		onUpdateSettings({ sidebarViewMode: mode });
	};

	const handleSortChange = (key: TaskSortKey) => {
		onUpdateSettings({ sidebarSortKey: key });
	};

	const handleGroupChange = (key: TaskGroupKey) => {
		onUpdateSettings({ sidebarGroupKey: key });
	};

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
		if (!taskService) return [];

		let filtered = taskService.getFilteredTasks(filter);

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
					return (
						daysDiff <= settings.completedTaskRetentionDays
					);
				}
				return true;
			});
		}

		return filtered;
	}, [tasks, filter, taskService, settings]);

	const sections = React.useMemo((): TaskSection[] => {
		if (!taskService) return [];

		const sorted = sortTasks(filteredTasks, sortKey);

		if (groupKey === "none") {
			return [
				{
					key: "all",
					label: "All Tasks",
					tasks: sorted,
					tree: taskService.buildTree(sorted),
				},
			];
		}

		if (groupKey === "status") {
			return orderedStatuses.map((s) => {
				const groupTasks = sorted.filter(
					(t) => t.frontmatter.status === s.value
				);
				return {
					key: s.value,
					label: s.label,
					tasks: groupTasks,
					tree: taskService.buildTree(groupTasks),
				};
			});
		}

		if (groupKey === "priority") {
			return TASK_PRIORITIES.map((p) => {
				const groupTasks = sorted.filter(
					(t) => t.frontmatter.priority === p.value
				);
				return {
					key: p.value,
					label: p.label,
					tasks: groupTasks,
					tree: taskService.buildTree(groupTasks),
				};
			});
		}

		// groupKey === "project"
		const projectNames = [
			...new Set(
				sorted.map(
					(t) => t.frontmatter.project || "(No Project)"
				)
			),
		].sort();
		return projectNames.map((p) => {
			const groupTasks = sorted.filter(
				(t) =>
					(t.frontmatter.project || "(No Project)") === p
			);
			return {
				key: p,
				label: p,
				tasks: groupTasks,
				tree: taskService.buildTree(groupTasks),
			};
		});
	}, [filteredTasks, taskService, sortKey, groupKey, orderedStatuses]);

	const projects = React.useMemo(() => {
		if (!taskService) return [];
		return taskService.getProjects();
	}, [taskService, tasks]);

	const handleStatusChange = (
		filePath: string,
		newStatus: TaskStatus
	) => {
		if (!taskService) return;
		taskService.updateTaskStatus(filePath, newStatus);
	};

	const toggleSection = (key: string) => {
		setCollapsedSections((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	const renderTreeNodes = (nodes: TaskTreeNode[]): React.ReactElement[] => {
		const elements: React.ReactElement[] = [];
		for (const node of nodes) {
			elements.push(
				<TaskCard
					key={node.task.filePath}
					task={node.task}
					depth={node.depth}
					onStatusChange={handleStatusChange}
				/>
			);
			if (node.children.length > 0) {
				elements.push(...renderTreeNodes(node.children));
			}
		}
		return elements;
	};

	return (
		<div className="vt-container">
			<div className="vt-header">
				<button
					className="vt-header-button"
					onClick={onCreateTask}
					title="Create new task"
				>
					+
				</button>
				<span className="vt-header-title">ForgeTasks</span>
				<div className="vt-view-toggle">
					<button
						className={`vt-view-toggle-btn${viewMode === "list" ? " vt-active" : ""}`}
						onClick={() => handleViewModeChange("list")}
						title="List view"
					>
						{"\u2630"}
					</button>
					<button
						className={`vt-view-toggle-btn${viewMode === "kanban" ? " vt-active" : ""}`}
						onClick={() => handleViewModeChange("kanban")}
						title="Kanban view"
					>
						{"\u25a6"}
					</button>
					<button
						className={`vt-view-toggle-btn${viewMode === "matrix" ? " vt-active" : ""}`}
						onClick={() => handleViewModeChange("matrix")}
						title="Matrix view"
					>
						{"\u229e"}
					</button>
				</div>
				{viewMode === "list" && (
					<button
						className={`vt-header-button${showFilter ? " vt-active" : ""}`}
						onClick={() => setShowFilter(!showFilter)}
						title="Toggle filters"
					>
						Filter
					</button>
				)}
			</div>

			{viewMode === "matrix" ? (
				<MatrixBoard compact={true} />
			) : viewMode === "list" ? (
				<>
					{showFilter && (
						<TaskFilterBar
							filter={filter}
							projects={projects}
							onFilterChange={setFilter}
							sortKey={sortKey}
							groupKey={groupKey}
							onSortChange={handleSortChange}
							onGroupChange={handleGroupChange}
						/>
					)}

					<div className="vt-task-list">
						{sections.map((section) => {
							const isCollapsed = collapsedSections.has(
								section.key
							);
							return (
								<div
									key={section.key}
									className="vt-section"
								>
									<div
										className="vt-section-header"
										onClick={() =>
											toggleSection(section.key)
										}
									>
										<span
											className={`vt-section-arrow${isCollapsed ? " vt-collapsed" : ""}`}
										>
											{"\u25b6"}
										</span>
										<span className="vt-section-title">
											{section.label}
										</span>
										<span className="vt-section-count">
											{section.tasks.length}
										</span>
									</div>
									{!isCollapsed && (
										<div className="vt-section-content">
											{section.tasks.length ===
											0 ? (
												<div className="vt-empty-section">
													No tasks
												</div>
											) : (
												renderTreeNodes(
													section.tree
												)
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</>
			) : (
				<KanbanBoard compact={true} />
			)}
		</div>
	);
}
