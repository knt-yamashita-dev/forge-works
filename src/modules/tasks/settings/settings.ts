import type { TaskPriority, TaskStatus, TaskSortKey, TaskGroupKey, ViewMode, KanbanSubGroup, StatusDefinition } from "../types/task";
import { DEFAULT_STATUS_VALUES } from "../types/task";

export interface ForgeTasksSettings {
	taskFolder: string;
	defaultPriority: TaskPriority;
	defaultStatus: TaskStatus;
	defaultProject: string;
	defaultTags: string;
	showCompletedTasks: boolean;
	completedTaskRetentionDays: number;
	sidebarSortKey: TaskSortKey;
	sidebarGroupKey: TaskGroupKey;
	sidebarViewMode: ViewMode;
	kanbanHideDone: boolean;
	kanbanSubGroup: KanbanSubGroup;
	customStatuses: StatusDefinition[];
	statusOrder: string[];
	kanbanVisibleStatuses: string[];
}

export const DEFAULT_SETTINGS: ForgeTasksSettings = {
	taskFolder: "Tasks",
	defaultPriority: "medium",
	defaultStatus: "todo",
	defaultProject: "",
	defaultTags: "",
	showCompletedTasks: true,
	completedTaskRetentionDays: 0,
	sidebarSortKey: "updated",
	sidebarGroupKey: "status",
	sidebarViewMode: "list",
	kanbanHideDone: false,
	kanbanSubGroup: "none",
	customStatuses: [],
	statusOrder: [...DEFAULT_STATUS_VALUES],
	kanbanVisibleStatuses: [...DEFAULT_STATUS_VALUES],
};
