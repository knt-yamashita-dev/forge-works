import { App, Modal, Setting } from "obsidian";

export class WorkNoteModal extends Modal {
	private note = "";
	private onSubmit: (note: string) => void;
	private taskName: string;
	private submitted = false;

	constructor(app: App, taskName: string, onSubmit: (note: string) => void) {
		super(app);
		this.taskName = taskName;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("pomo-work-note-modal");

		contentEl.createEl("h3", { text: "What did you do?" });

		if (this.taskName && this.taskName !== "(no task)") {
			contentEl.createEl("p", {
				text: `Task: ${this.taskName}`,
				cls: "pomo-work-note-task",
			});
		}

		new Setting(contentEl).setName("Note").addTextArea((textarea) => {
			textarea
				.setPlaceholder("Describe what you accomplished...")
				.onChange((value) => {
					this.note = value;
				});
			textarea.inputEl.rows = 4;
			textarea.inputEl.addClass("pomo-work-note-textarea");
			setTimeout(() => textarea.inputEl.focus(), 10);
		});

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Save")
					.setCta()
					.onClick(() => {
						this.submitted = true;
						this.onSubmit(this.note);
						this.close();
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Skip").onClick(() => {
					this.close();
				})
			);
	}

	onClose(): void {
		if (!this.submitted) {
			this.onSubmit("");
		}
		this.contentEl.empty();
	}
}
