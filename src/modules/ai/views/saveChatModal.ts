import { App, Modal, Setting, Notice, TFolder } from "obsidian";
import type { ChatMessage } from "../types/chat";
import type { GeminiService } from "../services/geminiService";
import {
	formatChatAsMarkdown,
	generateFileName,
} from "../utils/markdownFormatter";

export type SaveMode = "raw" | "summary" | "custom";

export class SaveChatModal extends Modal {
	private messages: ChatMessage[];
	private geminiService: GeminiService | null;
	private savePath: string;
	private saveMode: SaveMode = "raw";
	private customInstruction = "";
	private fileName: string;

	constructor(
		app: App,
		messages: ChatMessage[],
		geminiService: GeminiService | null,
		savePath: string
	) {
		super(app);
		this.messages = messages;
		this.geminiService = geminiService;
		this.savePath = savePath;
		this.fileName = generateFileName(messages);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("vs-save-modal");

		contentEl.createEl("h3", { text: "Save Chat" });

		new Setting(contentEl)
			.setName("File name")
			.addText((text) =>
				text.setValue(this.fileName).onChange((v) => {
					this.fileName = v;
				})
			);

		new Setting(contentEl)
			.setName("Save mode")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("raw", "Save as is")
					.addOption("summary", "Summarize & save")
					.addOption("custom", "Custom instruction")
					.setValue(this.saveMode)
					.onChange((v) => {
						this.saveMode = v as SaveMode;
						this.renderCustomInput(contentEl);
					})
			);

		this.renderCustomInput(contentEl);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Save")
				.setCta()
				.onClick(() => this.handleSave())
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderCustomInput(containerEl: HTMLElement): void {
		const existing = containerEl.querySelector(".vs-custom-instruction");
		if (existing) existing.remove();

		if (this.saveMode === "custom") {
			const wrapper = containerEl.createDiv({
				cls: "vs-custom-instruction",
			});
			new Setting(wrapper)
				.setName("Instruction")
				.setDesc("Enter transformation instructions for AI")
				.addTextArea((text) =>
					text
						.setPlaceholder(
							"e.g. Summarize key points as bullet list"
						)
						.setValue(this.customInstruction)
						.onChange((v) => {
							this.customInstruction = v;
						})
				);

			// Insert before the save button
			const saveBtn = containerEl.querySelector(
				".setting-item:last-child"
			);
			if (saveBtn) {
				containerEl.insertBefore(wrapper, saveBtn);
			}
		}
	}

	private async handleSave(): Promise<void> {
		const completedMessages = this.messages.filter((m) => !m.isStreaming);
		if (completedMessages.length === 0) {
			new Notice("No messages to save");
			return;
		}

		let content: string;

		try {
			if (this.saveMode === "raw") {
				content = formatChatAsMarkdown(completedMessages);
			} else if (this.saveMode === "summary") {
				if (!this.geminiService) {
					new Notice("API key is not configured");
					return;
				}
				new Notice("Generating summary...");
				const summary = await this.geminiService.transformChat(
					completedMessages,
					"Summarize the following chat history concisely in Markdown format."
				);
				content = `# Chat Summary\n\n${summary}`;
			} else {
				if (!this.geminiService) {
					new Notice("API key is not configured");
					return;
				}
				if (!this.customInstruction.trim()) {
					new Notice("Please enter an instruction");
					return;
				}
				new Notice("Transforming...");
				const result = await this.geminiService.transformChat(
					completedMessages,
					this.customInstruction
				);
				content = result;
			}

			await this.saveFile(content);
			new Notice(`Saved: ${this.savePath}/${this.fileName}.md`);
			this.close();
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "Unknown error";
			new Notice(`Failed to save: ${msg}`);
		}
	}

	private async saveFile(content: string): Promise<void> {
		const { vault } = this.app;

		// Ensure save directory exists
		const folder = vault.getAbstractFileByPath(this.savePath);
		if (!folder) {
			await vault.createFolder(this.savePath);
		} else if (!(folder instanceof TFolder)) {
			throw new Error(`${this.savePath} is not a folder`);
		}

		const filePath = `${this.savePath}/${this.fileName}.md`;

		// Avoid overwriting
		const existing = vault.getAbstractFileByPath(filePath);
		if (existing) {
			throw new Error(`File already exists: ${filePath}`);
		}

		await vault.create(filePath, content);
	}
}
