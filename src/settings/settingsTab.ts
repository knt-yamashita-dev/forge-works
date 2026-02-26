import { App, PluginSettingTab, Setting } from "obsidian";
import type ForgeWorksPlugin from "../main";
import { renderAISettings } from "../modules/ai/settings/settingsTab";
import { renderTasksSettings } from "../modules/tasks/settings/settingsTab";
import { renderTimerSettings } from "../modules/timer/settings/settingsTab";
import { renderUtilsSettings } from "../modules/utils/settings/settingsTab";

export class ForgeWorksSettingTab extends PluginSettingTab {
	plugin: ForgeWorksPlugin;

	constructor(app: App, plugin: ForgeWorksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Module Toggles ---
		containerEl.createEl("h2", { text: "Modules" });

		new Setting(containerEl)
			.setName("AI Chat & Completion")
			.setDesc(
				"AI-powered chat assistant with knowledge context and inline completion (requires restart)"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableAI)
					.onChange(async (value) => {
						this.plugin.settings.enableAI = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Task Management")
			.setDesc(
				"Kanban board, matrix view, and task list with 1-task-1-file principle (requires restart)"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTasks)
					.onChange(async (value) => {
						this.plugin.settings.enableTasks = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Pomodoro Timer")
			.setDesc(
				"Pomodoro timer with session logging and statistics (requires restart)"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTimer)
					.onChange(async (value) => {
						this.plugin.settings.enableTimer = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Editor Utilities")
			.setDesc(
				"@now timestamp replacement, focus mode, and more (requires restart)"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableUtils)
					.onChange(async (value) => {
						this.plugin.settings.enableUtils = value;
						await this.plugin.saveSettings();
					})
			);

		// --- Per-module settings ---
		if (this.plugin.settings.enableAI) {
			containerEl.createEl("h2", { text: "AI Chat & Completion" });
			renderAISettings(
				containerEl,
				this.plugin.settings.ai,
				() => this.plugin.saveSettings()
			);
		}

		if (this.plugin.settings.enableTasks) {
			containerEl.createEl("h2", { text: "Task Management" });
			renderTasksSettings(
				containerEl,
				this.plugin.settings.tasks,
				() => this.plugin.saveSettings(),
				() => this.display()
			);
		}

		if (this.plugin.settings.enableTimer) {
			containerEl.createEl("h2", { text: "Pomodoro Timer" });
			renderTimerSettings(
				containerEl,
				this.plugin.settings.timer,
				() => this.plugin.saveSettings()
			);
		}

		if (this.plugin.settings.enableUtils) {
			containerEl.createEl("h2", { text: "Editor Utilities" });
			renderUtilsSettings(
				containerEl,
				this.plugin.settings.utils,
				() => this.plugin.saveSettings()
			);
		}
	}
}
