import { App, Modal, Notice, Setting, TFile, TFolder } from "obsidian";
import { TaskService } from "../services/taskService";
import type { ForgeTasksSettings } from "../settings/settings";
import type { TaskStatus, TaskPriority, TaskCreateInput } from "../types/task";
import { getOrderedStatuses } from "../types/task";

function stripFrontmatter(content: string): string {
	const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
	return match ? content.slice(match[0].length).trim() : content.trim();
}

export interface TaskCreateModalOptions {
	parent?: string;
	project?: string;
}

export class TaskCreateModal extends Modal {
	private taskService: TaskService;
	private settings: ForgeTasksSettings;
	private options: TaskCreateModalOptions;

	private title = "";
	private status: TaskStatus;
	private priority: TaskPriority;
	private dueDate = "";
	private project = "";
	private tags = "";
	private parent = "";
	private description = "";
	private descriptionAreaEl: HTMLTextAreaElement | null = null;

	constructor(
		app: App,
		taskService: TaskService,
		settings: ForgeTasksSettings,
		options: TaskCreateModalOptions = {}
	) {
		super(app);
		this.taskService = taskService;
		this.settings = settings;
		this.options = options;
		this.status = settings.defaultStatus;
		this.priority = settings.defaultPriority;
		this.parent = options.parent || "";
		this.project = options.project || settings.defaultProject || "";
		this.tags = settings.defaultTags || "";
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("vt-create-modal");

		const heading = this.options.parent
			? "Create Child Task"
			: "Create Task";
		contentEl.createEl("h3", { text: heading });

		new Setting(contentEl).setName("Title").addText((text) =>
			text.setPlaceholder("Task title").onChange((v) => {
				this.title = v;
			})
		);

		// Template dropdown (only if templateFolder is configured)
		const templateFolder = this.settings.templateFolder;
		if (templateFolder) {
			const folder =
				this.app.vault.getAbstractFileByPath(templateFolder);
			if (folder instanceof TFolder) {
				const templates = folder.children.filter(
					(f): f is TFile =>
						f instanceof TFile && f.extension === "md"
				);
				if (templates.length > 0) {
					new Setting(contentEl)
						.setName("Template")
						.addDropdown((dd) => {
							dd.addOption("", "None");
							for (const tpl of templates) {
								dd.addOption(
									tpl.path,
									tpl.basename
								);
							}
							dd.onChange(async (path) => {
								if (!path) {
									this.description = "";
									this.updateDescriptionArea();
									return;
								}
								const file =
									this.app.vault.getAbstractFileByPath(
										path
									);
								if (file instanceof TFile) {
									const raw =
										await this.app.vault.read(
											file
										);
									this.description =
										stripFrontmatter(raw);
									this.updateDescriptionArea();
								}
							});
						});
				}
			}
		}

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
				text.setPlaceholder("2026-03-01").onChange((v) => {
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

		new Setting(contentEl).setName("Description").addTextArea((text) => {
			text.setPlaceholder("Task description...").onChange((v) => {
				this.description = v;
			});
			this.descriptionAreaEl = text.inputEl;
		});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Create")
				.setCta()
				.onClick(() => this.handleCreate())
		);
	}

	private updateDescriptionArea(): void {
		if (this.descriptionAreaEl) {
			this.descriptionAreaEl.value = this.description;
		}
	}

	private async handleCreate(): Promise<void> {
		if (!this.title.trim()) {
			new Notice("Title is required");
			return;
		}

		const input: TaskCreateInput = {
			title: this.title.trim(),
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
			description: this.description || undefined,
		};

		try {
			const file = await this.taskService.createTask(input);
			new Notice(`Created: ${file.basename}`);
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
