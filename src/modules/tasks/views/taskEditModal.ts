import { App, Modal, Notice, Setting } from "obsidian";
import { TaskService } from "../services/taskService";
import type { ForgeTasksSettings } from "../settings/settings";
import type { Task, TaskStatus, TaskPriority, TaskFrontmatter } from "../types/task";
import { getOrderedStatuses } from "../types/task";

export class TaskEditModal extends Modal {
	private taskService: TaskService;
	private settings: ForgeTasksSettings;
	private task: Task;

	private status: TaskStatus;
	private priority: TaskPriority;
	private dueDate: string;
	private project: string;
	private tags: string;
	private parent: string;

	constructor(app: App, taskService: TaskService, settings: ForgeTasksSettings, task: Task) {
		super(app);
		this.taskService = taskService;
		this.settings = settings;
		this.task = task;
		this.status = task.frontmatter.status;
		this.priority = task.frontmatter.priority;
		this.dueDate = task.frontmatter.due || "";
		this.project = task.frontmatter.project || "";
		this.tags = task.frontmatter.tags?.join(", ") || "";
		this.parent = task.frontmatter.parent || "";
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("vt-create-modal");

		contentEl.createEl("h3", { text: `Edit: ${this.task.title}` });

		const orderedStatuses = getOrderedStatuses(
			this.settings.customStatuses,
			this.settings.statusOrder
		);
		new Setting(contentEl).setName("Status").addDropdown((dd) => {
			for (const s of orderedStatuses) {
				dd.addOption(s.value, s.label);
			}
			dd.setValue(this.status).onChange((v) => {
				this.status = v as TaskStatus;
			});
		});

		new Setting(contentEl).setName("Priority").addDropdown((dd) =>
			dd
				.addOption("low", "Low")
				.addOption("medium", "Medium")
				.addOption("high", "High")
				.addOption("urgent", "Urgent")
				.setValue(this.priority)
				.onChange((v) => {
					this.priority = v as TaskPriority;
				})
		);

		new Setting(contentEl)
			.setName("Due date")
			.setDesc("YYYY-MM-DD")
			.addText((text) =>
				text
					.setPlaceholder("2026-03-01")
					.setValue(this.dueDate)
					.onChange((v) => {
						this.dueDate = v;
					})
			);

		new Setting(contentEl).setName("Project").addText((text) =>
			text
				.setPlaceholder("Project name")
				.setValue(this.project)
				.onChange((v) => {
					this.project = v;
				})
		);

		new Setting(contentEl)
			.setName("Tags")
			.setDesc("Comma-separated")
			.addText((text) =>
				text
					.setPlaceholder("design, ui")
					.setValue(this.tags)
					.onChange((v) => {
						this.tags = v;
					})
			);

		new Setting(contentEl)
			.setName("Parent task")
			.setDesc("Wikilink to parent")
			.addText((text) =>
				text
					.setPlaceholder("[[parent-task]]")
					.setValue(this.parent)
					.onChange((v) => {
						this.parent = v;
					})
			);

		const buttonRow = new Setting(contentEl);

		buttonRow.addButton((btn) =>
			btn
				.setButtonText("Save")
				.setCta()
				.onClick(() => this.handleSave())
		);

		buttonRow.addButton((btn) =>
			btn
				.setButtonText("Delete")
				.setWarning()
				.onClick(() => this.handleDelete())
		);
	}

	private async handleSave(): Promise<void> {
		const updates: Partial<TaskFrontmatter> = {
			status: this.status,
			priority: this.priority,
			due: this.dueDate || undefined,
			project: this.project || undefined,
			tags: this.tags
				? this.tags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean)
				: undefined,
			parent: this.parent || undefined,
		};

		try {
			await this.taskService.updateTaskFrontmatter(
				this.task.filePath,
				updates
			);
			new Notice("Task updated");
			this.close();
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "Unknown error";
			new Notice(`Failed: ${msg}`);
		}
	}

	private async handleDelete(): Promise<void> {
		try {
			await this.taskService.deleteTask(this.task.filePath);
			this.close();
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "Unknown error";
			new Notice(`Failed: ${msg}`);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
