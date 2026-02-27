import { App, PluginSettingTab, Setting } from "obsidian";
import type ForgeWorksPlugin from "../main";
import { renderAISettings } from "../modules/ai/settings/settingsTab";
import { renderTasksSettings } from "../modules/tasks/settings/settingsTab";
import { renderTimerSettings } from "../modules/timer/settings/settingsTab";
import { renderUtilsSettings } from "../modules/utils/settings/settingsTab";
import { t } from "../i18n";

interface ModuleTab {
	id: string;
	labelKey: "tab.ai" | "tab.tasks" | "tab.timer" | "tab.utils";
	enableKey: "enableAI" | "enableTasks" | "enableTimer" | "enableUtils";
	render: (container: HTMLElement) => void;
}

export class ForgeWorksSettingTab extends PluginSettingTab {
	plugin: ForgeWorksPlugin;
	private activeTab = "";

	constructor(app: App, plugin: ForgeWorksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Module Toggles ---
		containerEl.createEl("h2", { text: t("modules.title") });

		new Setting(containerEl)
			.setName(t("modules.ai.name"))
			.setDesc(t("modules.ai.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableAI)
					.onChange(async (value) => {
						this.plugin.settings.enableAI = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		new Setting(containerEl)
			.setName(t("modules.tasks.name"))
			.setDesc(t("modules.tasks.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTasks)
					.onChange(async (value) => {
						this.plugin.settings.enableTasks = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		new Setting(containerEl)
			.setName(t("modules.timer.name"))
			.setDesc(t("modules.timer.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTimer)
					.onChange(async (value) => {
						this.plugin.settings.enableTimer = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		new Setting(containerEl)
			.setName(t("modules.utils.name"))
			.setDesc(t("modules.utils.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableUtils)
					.onChange(async (value) => {
						this.plugin.settings.enableUtils = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		// --- Tabbed Module Settings ---
		const tabs: ModuleTab[] = [
			{
				id: "ai",
				labelKey: "tab.ai",
				enableKey: "enableAI",
				render: (el) =>
					renderAISettings(
						el,
						this.plugin.settings.ai,
						() => this.plugin.saveSettings()
					),
			},
			{
				id: "tasks",
				labelKey: "tab.tasks",
				enableKey: "enableTasks",
				render: (el) =>
					renderTasksSettings(
						el,
						this.plugin.settings.tasks,
						() => this.plugin.saveSettings(),
						() => this.display()
					),
			},
			{
				id: "timer",
				labelKey: "tab.timer",
				enableKey: "enableTimer",
				render: (el) =>
					renderTimerSettings(
						el,
						this.plugin.settings.timer,
						() => this.plugin.saveSettings()
					),
			},
			{
				id: "utils",
				labelKey: "tab.utils",
				enableKey: "enableUtils",
				render: (el) =>
					renderUtilsSettings(
						el,
						this.plugin.settings.utils,
						() => this.plugin.saveSettings()
					),
			},
		];

		const enabledTabs = tabs.filter(
			(tab) => this.plugin.settings[tab.enableKey]
		);
		if (enabledTabs.length === 0) return;

		// Fall back to first enabled tab if active tab is no longer available
		if (!enabledTabs.some((tab) => tab.id === this.activeTab)) {
			this.activeTab = enabledTabs[0].id;
		}

		// Tab bar
		const tabBar = containerEl.createDiv({ cls: "forge-settings-tabs" });
		const contentEl = containerEl.createDiv({
			cls: "forge-settings-tab-content",
		});

		const renderContent = () => {
			contentEl.empty();
			const tab = enabledTabs.find((tb) => tb.id === this.activeTab);
			if (tab) tab.render(contentEl);
		};

		for (const tab of enabledTabs) {
			const btn = tabBar.createEl("button", {
				text: t(tab.labelKey),
				cls: "forge-settings-tab",
			});
			if (tab.id === this.activeTab) {
				btn.classList.add("active");
			}
			btn.addEventListener("click", () => {
				this.activeTab = tab.id;
				tabBar
					.querySelectorAll(".forge-settings-tab")
					.forEach((el) => el.classList.remove("active"));
				btn.classList.add("active");
				renderContent();
			});
		}

		renderContent();
	}
}
