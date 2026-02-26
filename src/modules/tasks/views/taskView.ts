import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { AppContext } from "./components/AppContext";
import { TaskListContainer } from "./components/TaskListContainer";
import { TaskCreateModal } from "./taskCreateModal";
import { TaskEditModal } from "./taskEditModal";
import type { TaskService } from "../services/taskService";
import type { ForgeTasksSettings } from "../settings/settings";

export const TASK_VIEW_TYPE = "forge-tasks-view";

export class TaskView extends ItemView {
	private root: Root | null = null;
	private taskService: TaskService | null = null;
	private pluginSettings: ForgeTasksSettings | null = null;
	private createTaskCallback: () => void = () => {};
	private updateSettingsCallback: (updates: Partial<ForgeTasksSettings>) => void = () => {};

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return TASK_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "ForgeTasks";
	}

	getIcon(): string {
		return "check-square";
	}

	setTaskService(service: TaskService): void {
		this.taskService = service;
		this.renderReact();
	}

	setSettings(settings: ForgeTasksSettings): void {
		this.pluginSettings = settings;
		this.renderReact();
	}

	setCreateTaskCallback(callback: () => void): void {
		this.createTaskCallback = callback;
		this.renderReact();
	}

	setUpdateSettingsCallback(callback: (updates: Partial<ForgeTasksSettings>) => void): void {
		this.updateSettingsCallback = callback;
		this.renderReact();
	}

	async onOpen(): Promise<void> {
		this.root = createRoot(this.contentEl);
		this.renderReact();
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
		this.root = null;
	}

	private handleOpenTask = (filePath: string): void => {
		this.app.workspace.openLinkText(filePath, "", false);
	};

	private handleCreateChildTask = (parentFilePath: string): void => {
		if (!this.taskService || !this.pluginSettings) return;
		const task = this.taskService.getTask(parentFilePath);
		if (!task) return;
		const basename = parentFilePath
			.split("/")
			.pop()
			?.replace(/\.md$/, "");
		new TaskCreateModal(
			this.app,
			this.taskService,
			this.pluginSettings,
			{
				parent: `[[${basename}]]`,
				project: task.frontmatter.project,
			}
		).open();
	};

	private handleEditTask = (filePath: string): void => {
		if (!this.taskService || !this.pluginSettings) return;
		const task = this.taskService.getTask(filePath);
		if (!task) return;
		new TaskEditModal(this.app, this.taskService, this.pluginSettings, task).open();
	};

	private renderReact(): void {
		if (!this.root || !this.pluginSettings) return;

		this.root.render(
			React.createElement(
				AppContext.Provider,
				{
					value: {
						app: this.app,
						taskService: this.taskService,
						settings: this.pluginSettings,
						onCreateTask: this.createTaskCallback,
						onCreateChildTask: this.handleCreateChildTask,
						onOpenTask: this.handleOpenTask,
						onEditTask: this.handleEditTask,
						onUpdateSettings: this.updateSettingsCallback,
					},
				},
				React.createElement(TaskListContainer)
			)
		);
	}
}
