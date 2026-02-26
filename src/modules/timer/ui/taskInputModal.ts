import { App, Modal, Setting } from "obsidian";

export class TaskInputModal extends Modal {
	private task: string;
	private onSubmit: (task: string) => void;
	private recentTasks: string[];

	constructor(
		app: App,
		currentTask: string,
		recentTasks: string[],
		onSubmit: (task: string) => void
	) {
		super(app);
		this.task = currentTask;
		this.onSubmit = onSubmit;
		this.recentTasks = recentTasks;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("pomo-task-modal");
		contentEl.createEl("h3", { text: "Set Task Name" });

		new Setting(contentEl)
			.setName("Task")
			.addText((text) => {
				text.setPlaceholder("What are you working on?")
					.setValue(this.task)
					.onChange((value) => {
						this.task = value;
					});
				text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
					if (e.key === "Enter") {
						this.submit();
					}
				});
				// Auto-focus
				setTimeout(() => text.inputEl.focus(), 10);
			});

		if (this.recentTasks.length > 0) {
			contentEl.createEl("h4", {
				text: "Recent Tasks",
				cls: "pomo-recent-heading",
			});

			const recentContainer = contentEl.createDiv("pomo-recent-tasks");
			for (const task of this.recentTasks) {
				const btn = recentContainer.createEl("button", {
					text: task,
					cls: "pomo-recent-task-btn",
				});
				btn.addEventListener("click", () => {
					this.task = task;
					this.submit();
				});
			}
		}

		new Setting(contentEl).addButton((btn) =>
			btn.setButtonText("Set").setCta().onClick(() => this.submit())
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private submit(): void {
		this.onSubmit(this.task);
		this.close();
	}
}
