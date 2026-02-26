import { Plugin } from "obsidian";
import { ForgeWorksSettingTab } from "./settings/settingsTab";
import { DEFAULT_SETTINGS, type ForgeWorksSettings } from "./settings/settings";
import type { ForgeModule } from "./types/module";

export default class ForgeWorksPlugin extends Plugin {
	settings: ForgeWorksSettings = DEFAULT_SETTINGS;
	private modules: ForgeModule[] = [];

	async onload(): Promise<void> {
		await this.loadSettings();

		if (this.settings.enableAI) {
			const { AIModule } = await import("./modules/ai/index");
			const mod = new AIModule();
			await mod.onload(this, this.settings.ai);
			this.modules.push(mod);
		}

		if (this.settings.enableTasks) {
			const { TasksModule } = await import("./modules/tasks/index");
			const mod = new TasksModule();
			await mod.onload(this, this.settings.tasks);
			this.modules.push(mod);
		}

		if (this.settings.enableTimer) {
			const { TimerModule } = await import("./modules/timer/index");
			const mod = new TimerModule();
			await mod.onload(this, this.settings.timer);
			this.modules.push(mod);
		}

		if (this.settings.enableUtils) {
			const { UtilsModule } = await import("./modules/utils/index");
			const mod = new UtilsModule();
			await mod.onload(this, this.settings.utils);
			this.modules.push(mod);
		}

		this.addSettingTab(new ForgeWorksSettingTab(this.app, this));
	}

	async onunload(): Promise<void> {
		for (const mod of this.modules) {
			await mod.onunload();
		}
	}

	async loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		// Deep merge sub-objects to ensure all keys exist
		if (data) {
			this.settings.ai = Object.assign(
				{},
				DEFAULT_SETTINGS.ai,
				data.ai
			);
			this.settings.tasks = Object.assign(
				{},
				DEFAULT_SETTINGS.tasks,
				data.tasks
			);
			this.settings.timer = Object.assign(
				{},
				DEFAULT_SETTINGS.timer,
				data.timer
			);
			this.settings.utils = Object.assign(
				{},
				DEFAULT_SETTINGS.utils,
				data.utils
			);
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		// Notify active modules of settings change
		for (const mod of this.modules) {
			mod.onSettingsChange?.();
		}
	}
}
