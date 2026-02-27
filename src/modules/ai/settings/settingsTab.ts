import { Setting } from "obsidian";
import type { ForgeAISettings } from "./settings";
import { t } from "../../../i18n";

export function renderAISettings(
	containerEl: HTMLElement,
	settings: ForgeAISettings,
	save: () => Promise<void>
): void {
	new Setting(containerEl)
		.setName(t("ai.apiKey.name"))
		.setDesc(t("ai.apiKey.desc"))
		.addText((text) =>
			text
				.setPlaceholder("API Key")
				.setValue(settings.apiKey)
				.onChange(async (value) => {
					settings.apiKey = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.model.name"))
		.setDesc(t("ai.model.desc"))
		.addDropdown((dropdown) =>
			dropdown
				.addOption("gemini-2.0-flash", "Gemini 2.0 Flash")
				.addOption("gemini-2.5-flash", "Gemini 2.5 Flash")
				.addOption("gemini-2.5-pro", "Gemini 2.5 Pro")
				.setValue(settings.model)
				.onChange(async (value) => {
					settings.model = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.systemPrompt.name"))
		.setDesc(t("ai.systemPrompt.desc"))
		.addTextArea((text) =>
			text
				.setValue(settings.systemPrompt)
				.onChange(async (value) => {
					settings.systemPrompt = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.savePath.name"))
		.setDesc(t("ai.savePath.desc"))
		.addText((text) =>
			text
				.setPlaceholder("AI Chats")
				.setValue(settings.defaultSavePath)
				.onChange(async (value) => {
					settings.defaultSavePath = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.confirmOps.name"))
		.setDesc(t("ai.confirmOps.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.confirmFileOperations)
				.onChange(async (value) => {
					settings.confirmFileOperations = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.maxKnowledge.name"))
		.setDesc(t("ai.maxKnowledge.desc"))
		.addSlider((slider) =>
			slider
				.setLimits(1, 10, 1)
				.setValue(settings.maxKnowledgeFiles)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.maxKnowledgeFiles = value;
					await save();
				})
		);

	containerEl.createEl("h3", { text: t("ai.webSearch.heading") });

	new Setting(containerEl)
		.setName(t("ai.webSearch.name"))
		.setDesc(t("ai.webSearch.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableWebSearch)
				.onChange(async (value) => {
					settings.enableWebSearch = value;
					await save();
				})
		);

	containerEl.createEl("h3", { text: t("ai.completion.heading") });

	new Setting(containerEl)
		.setName(t("ai.completion.enable.name"))
		.setDesc(t("ai.completion.enable.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableInlineCompletion)
				.onChange(async (value) => {
					settings.enableInlineCompletion = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.completion.delay.name"))
		.setDesc(t("ai.completion.delay.desc"))
		.addSlider((slider) =>
			slider
				.setLimits(100, 2000, 100)
				.setValue(settings.completionDebounceMs)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.completionDebounceMs = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.completion.streaming.name"))
		.setDesc(t("ai.completion.streaming.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.completionStreaming)
				.onChange(async (value) => {
					settings.completionStreaming = value;
					await save();
				})
		);

	containerEl.createEl("h3", { text: t("ai.agent.heading") });

	new Setting(containerEl)
		.setName(t("ai.agent.enable.name"))
		.setDesc(t("ai.agent.enable.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.agentMode.enabled)
				.onChange(async (value) => {
					settings.agentMode.enabled = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.agent.maxSteps.name"))
		.setDesc(t("ai.agent.maxSteps.desc"))
		.addSlider((slider) =>
			slider
				.setLimits(1, 20, 1)
				.setValue(settings.agentMode.maxSteps)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.agentMode.maxSteps = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.agent.autoApprove.name"))
		.setDesc(t("ai.agent.autoApprove.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.agentMode.autoApprove)
				.onChange(async (value) => {
					settings.agentMode.autoApprove = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.agent.pauseOnError.name"))
		.setDesc(t("ai.agent.pauseOnError.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.agentMode.pauseOnError)
				.onChange(async (value) => {
					settings.agentMode.pauseOnError = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("ai.maxOps.name"))
		.setDesc(t("ai.maxOps.desc"))
		.addSlider((slider) =>
			slider
				.setLimits(1, 20, 1)
				.setValue(settings.maxOperationsPerMessage)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.maxOperationsPerMessage = value;
					await save();
				})
		);
}
