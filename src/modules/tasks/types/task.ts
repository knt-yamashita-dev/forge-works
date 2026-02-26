export type TaskStatus = string;

export type DueUrgency = "overdue" | "today" | "soon" | "normal" | "none";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface StatusDefinition {
	value: string;
	label: string;
	icon: string;
}

export const DEFAULT_STATUS_DEFINITIONS: StatusDefinition[] = [
	{ value: "todo", label: "ToDo", icon: "\u25cb" },
	{ value: "in-progress", label: "In Progress", icon: "\u25d4" },
	{ value: "done", label: "Done", icon: "\u25cf" },
];

export const DEFAULT_STATUS_VALUES: string[] = ["todo", "in-progress", "done"];

export const COMPLETION_STATUS = "done";

export function getOrderedStatuses(
	customStatuses: StatusDefinition[],
	statusOrder: string[]
): StatusDefinition[] {
	const allDefs = [...DEFAULT_STATUS_DEFINITIONS, ...customStatuses];
	const defMap = new Map(allDefs.map((d) => [d.value, d]));

	const ordered: StatusDefinition[] = [];
	for (const value of statusOrder) {
		const def = defMap.get(value);
		if (def) {
			ordered.push(def);
		}
	}
	return ordered;
}

export function buildStatusCycle(
	orderedStatuses: StatusDefinition[]
): Record<string, string> {
	const cycle: Record<string, string> = {};
	for (let i = 0; i < orderedStatuses.length; i++) {
		const next = (i + 1) % orderedStatuses.length;
		cycle[orderedStatuses[i].value] = orderedStatuses[next].value;
	}
	return cycle;
}

export function buildStatusIcons(
	orderedStatuses: StatusDefinition[]
): Record<string, string> {
	const icons: Record<string, string> = {};
	for (const s of orderedStatuses) {
		icons[s.value] = s.icon;
	}
	return icons;
}

export interface TaskFrontmatter {
	status: TaskStatus;
	priority: TaskPriority;
	due?: string;
	project?: string;
	tags?: string[];
	parent?: string;
	created: string;
	updated: string;
}

export interface SubtaskProgress {
	completed: number;
	total: number;
}

export interface Task {
	filePath: string;
	title: string;
	frontmatter: TaskFrontmatter;
	hasSubtasks: boolean;
	subtaskProgress?: SubtaskProgress;
}

export interface TaskFilter {
	statusFilter: TaskStatus[];
	priorityFilter: TaskPriority[];
	projectFilter: string | null;
	searchQuery: string;
}

export const DEFAULT_FILTER: TaskFilter = {
	statusFilter: [...DEFAULT_STATUS_VALUES],
	priorityFilter: ["low", "medium", "high", "urgent"],
	projectFilter: null,
	searchQuery: "",
};

export interface TaskTreeNode {
	task: Task;
	children: TaskTreeNode[];
	depth: number;
}

export interface TaskCreateInput {
	title: string;
	status: TaskStatus;
	priority: TaskPriority;
	due?: string;
	project?: string;
	tags?: string[];
	parent?: string;
	description?: string;
}

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
	{ value: "low", label: "Low" },
	{ value: "medium", label: "Medium" },
	{ value: "high", label: "High" },
	{ value: "urgent", label: "Urgent" },
];

export type ViewMode = "list" | "kanban" | "matrix";
export type KanbanSubGroup = "none" | "priority" | "project";

export type TaskSortKey = "updated" | "due" | "priority";
export type TaskGroupKey = "status" | "priority" | "project" | "none";

export const TASK_SORT_OPTIONS: { value: TaskSortKey; label: string }[] = [
	{ value: "updated", label: "Updated" },
	{ value: "due", label: "Due Date" },
	{ value: "priority", label: "Priority" },
];

export const TASK_GROUP_OPTIONS: { value: TaskGroupKey; label: string }[] = [
	{ value: "status", label: "Status" },
	{ value: "priority", label: "Priority" },
	{ value: "project", label: "Project" },
	{ value: "none", label: "None" },
];
