import { Plugin, TFile } from "obsidian";
import { TaskView, TASK_VIEW_TYPE } from "./views/taskView";
import { KanbanView, KANBAN_VIEW_TYPE } from "./views/kanbanView";
import { MatrixView, MATRIX_VIEW_TYPE } from "./views/matrixView";
import { TaskCreateModal } from "./views/taskCreateModal";
import { TaskCodeBlockRenderer } from "./codeblock/taskCodeBlockProcessor";
import { TaskService } from "./services/taskService";
import {
	DEFAULT_STATUS_VALUES,
	getOrderedStatuses,
	buildStatusIcons,
} from "./types/task";
import type { ForgeTasksSettings } from "./settings/settings";
import type { ForgeModule } from "../../types/module";

export class TasksModule implements ForgeModule {
	private plugin!: Plugin;
	settings!: ForgeTasksSettings;
	private taskService!: TaskService;

	async onload(
		plugin: Plugin,
		settings: ForgeTasksSettings
	): Promise<void> {
		this.plugin = plugin;
		this.settings = settings;

		// Ensure all default statuses exist in statusOrder
		const order = this.settings.statusOrder;
		for (const v of DEFAULT_STATUS_VALUES) {
			if (!order.includes(v)) {
				order.push(v);
			}
		}

		this.taskService = new TaskService(
			plugin.app,
			this.settings.taskFolder
		);
		this.taskService.setValidStatuses(this.settings.statusOrder);

		// Wait for metadata cache to be ready, then scan
		plugin.app.workspace.onLayoutReady(() => {
			this.taskService.initialScan();
		});

		// Use metadataCache 'changed' event
		plugin.registerEvent(
			plugin.app.metadataCache.on("changed", (file) => {
				this.taskService.handleMetadataChanged(file);
			})
		);
		plugin.registerEvent(
			plugin.app.vault.on("delete", (file) => {
				this.taskService.handleFileDelete(file);
			})
		);
		plugin.registerEvent(
			plugin.app.vault.on("rename", (file, oldPath) => {
				this.taskService.handleFileRename(file, oldPath);
			})
		);

		const updateSettingsCallback = async (
			updates: Partial<ForgeTasksSettings>
		) => {
			Object.assign(this.settings, updates);
			await this.onSettingsChange();
			// Persist via parent plugin
			await (plugin as any).saveSettings();
		};

		// Register sidebar view
		plugin.registerView(TASK_VIEW_TYPE, (leaf) => {
			const view = new TaskView(leaf);
			view.setTaskService(this.taskService);
			view.setSettings(this.settings);
			view.setCreateTaskCallback(() => this.openCreateModal());
			view.setUpdateSettingsCallback(updateSettingsCallback);
			return view;
		});

		// Register kanban view (main area)
		plugin.registerView(KANBAN_VIEW_TYPE, (leaf) => {
			const view = new KanbanView(leaf);
			view.setTaskService(this.taskService);
			view.setSettings(this.settings);
			view.setCreateTaskCallback(() => this.openCreateModal());
			view.setUpdateSettingsCallback(updateSettingsCallback);
			return view;
		});

		// Register matrix view (main area)
		plugin.registerView(MATRIX_VIEW_TYPE, (leaf) => {
			const view = new MatrixView(leaf);
			view.setTaskService(this.taskService);
			view.setSettings(this.settings);
			view.setCreateTaskCallback(() => this.openCreateModal());
			view.setUpdateSettingsCallback(updateSettingsCallback);
			return view;
		});

		// Ribbon icon
		plugin.addRibbonIcon("check-square", "Open ForgeTasks", () => {
			this.activateTaskView();
		});

		// Commands
		plugin.addCommand({
			id: "open-task-board",
			name: "Open ForgeTasks",
			callback: () => {
				this.activateTaskView();
			},
		});

		plugin.addCommand({
			id: "open-kanban-board",
			name: "Open Kanban Board",
			callback: () => {
				this.activateKanbanView();
			},
		});

		plugin.addCommand({
			id: "open-matrix-view",
			name: "Open Matrix View",
			callback: () => {
				this.activateMatrixView();
			},
		});

		plugin.addCommand({
			id: "create-task",
			name: "Create new task",
			callback: () => {
				this.openCreateModal();
			},
		});

		plugin.addCommand({
			id: "create-child-task",
			name: "Create child task",
			checkCallback: (checking: boolean) => {
				const file = plugin.app.workspace.getActiveFile();
				if (
					!file ||
					!(file instanceof TFile) ||
					!this.taskService.isTaskFile(file)
				) {
					return false;
				}
				if (!checking) {
					const task = this.taskService.getTask(file.path);
					new TaskCreateModal(
						plugin.app,
						this.taskService,
						this.settings,
						{
							parent: `[[${file.basename}]]`,
							project: task?.frontmatter.project,
						}
					).open();
				}
				return true;
			},
		});

		plugin.addCommand({
			id: "complete-task",
			name: "Mark current file as done",
			checkCallback: (checking: boolean) => {
				const file = plugin.app.workspace.getActiveFile();
				if (
					!file ||
					!(file instanceof TFile) ||
					!this.taskService.isTaskFile(file)
				) {
					return false;
				}
				if (!checking) {
					this.taskService.updateTaskStatus(file.path, "done");
				}
				return true;
			},
		});

		// Code block processor
		plugin.registerMarkdownCodeBlockProcessor(
			"forge-tasks",
			(source, el, ctx) => {
				const ordered = getOrderedStatuses(
					this.settings.customStatuses,
					this.settings.statusOrder
				);
				const statusIcons = buildStatusIcons(ordered);
				const renderer = new TaskCodeBlockRenderer(
					el,
					this.taskService,
					source,
					(filePath) => {
						plugin.app.workspace.openLinkText(
							filePath,
							"",
							false
						);
					},
					statusIcons
				);
				ctx.addChild(renderer);
			}
		);
	}

	async onunload(): Promise<void> {
		this.plugin.app.workspace.detachLeavesOfType(TASK_VIEW_TYPE);
		this.plugin.app.workspace.detachLeavesOfType(KANBAN_VIEW_TYPE);
		this.plugin.app.workspace.detachLeavesOfType(MATRIX_VIEW_TYPE);
	}

	onSettingsChange(): void {
		this.taskService.setTaskFolder(this.settings.taskFolder);
		this.taskService.setValidStatuses(this.settings.statusOrder);
		this.updateTaskViews();
		this.updateKanbanViews();
		this.updateMatrixViews();
	}

	private openCreateModal(): void {
		new TaskCreateModal(
			this.plugin.app,
			this.taskService,
			this.settings
		).open();
	}

	private updateTaskViews(): void {
		for (const leaf of this.plugin.app.workspace.getLeavesOfType(
			TASK_VIEW_TYPE
		)) {
			const view = leaf.view as TaskView;
			view.setTaskService(this.taskService);
			view.setSettings(this.settings);
		}
	}

	private updateKanbanViews(): void {
		for (const leaf of this.plugin.app.workspace.getLeavesOfType(
			KANBAN_VIEW_TYPE
		)) {
			const view = leaf.view as KanbanView;
			view.setTaskService(this.taskService);
			view.setSettings(this.settings);
		}
	}

	private updateMatrixViews(): void {
		for (const leaf of this.plugin.app.workspace.getLeavesOfType(
			MATRIX_VIEW_TYPE
		)) {
			const view = leaf.view as MatrixView;
			view.setTaskService(this.taskService);
			view.setSettings(this.settings);
		}
	}

	private async activateTaskView(): Promise<void> {
		const { workspace } = this.plugin.app;

		const existing = workspace.getLeavesOfType(TASK_VIEW_TYPE);
		if (existing.length > 0) {
			workspace.revealLeaf(existing[0]);
			return;
		}

		const leaf = workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: TASK_VIEW_TYPE,
				active: true,
			});
			workspace.revealLeaf(leaf);
		}
	}

	private async activateKanbanView(): Promise<void> {
		const { workspace } = this.plugin.app;

		const existing = workspace.getLeavesOfType(KANBAN_VIEW_TYPE);
		if (existing.length > 0) {
			workspace.revealLeaf(existing[0]);
			return;
		}

		const leaf = workspace.getLeaf(true);
		if (leaf) {
			await leaf.setViewState({
				type: KANBAN_VIEW_TYPE,
				active: true,
			});
			workspace.revealLeaf(leaf);
		}
	}

	private async activateMatrixView(): Promise<void> {
		const { workspace } = this.plugin.app;

		const existing = workspace.getLeavesOfType(MATRIX_VIEW_TYPE);
		if (existing.length > 0) {
			workspace.revealLeaf(existing[0]);
			return;
		}

		const leaf = workspace.getLeaf(true);
		if (leaf) {
			await leaf.setViewState({
				type: MATRIX_VIEW_TYPE,
				active: true,
			});
			workspace.revealLeaf(leaf);
		}
	}
}
