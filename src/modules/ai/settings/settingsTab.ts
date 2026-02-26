import { Setting } from "obsidian";
import type { ForgeAISettings } from "./settings";

export function renderAISettings(
	containerEl: HTMLElement,
	settings: ForgeAISettings,
	save: () => Promise<void>
): void {
	new Setting(containerEl)
		.setName("Gemini API Key")
		.setDesc("Enter your API key from Google AI Studio")
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
		.setName("Model")
		.setDesc("Gemini model to use")
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
		.setName("System Prompt")
		.setDesc("System prompt that defines AI behavior")
		.addTextArea((text) =>
			text
				.setValue(settings.systemPrompt)
				.onChange(async (value) => {
					settings.systemPrompt = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Chat save folder")
		.setDesc("Folder path for saving chat files")
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
		.setName("Confirm file operations")
		.setDesc("Show confirmation before AI creates or edits files")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.confirmFileOperations)
				.onChange(async (value) => {
					settings.confirmFileOperations = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Max knowledge files")
		.setDesc(
			"Maximum number of files to attach as context per session"
		)
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

	containerEl.createEl("h3", { text: "Web Search" });

	new Setting(containerEl)
		.setName("Enable web search")
		.setDesc(
			"Allow AI to search the web using Google Search when answering questions. Uses the existing Gemini API key."
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableWebSearch)
				.onChange(async (value) => {
					settings.enableWebSearch = value;
					await save();
				})
		);

	containerEl.createEl("h3", { text: "Inline Completion" });

	new Setting(containerEl)
		.setName("Enable inline completion")
		.setDesc(
			"Show AI-powered text completions while typing in the editor"
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableInlineCompletion)
				.onChange(async (value) => {
					settings.enableInlineCompletion = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Completion delay")
		.setDesc(
			"Milliseconds to wait after typing stops before requesting completion (100-2000)"
		)
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
		.setName("Streaming completion")
		.setDesc(
			"Show completion text progressively as it streams from the AI (lower latency)"
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.completionStreaming)
				.onChange(async (value) => {
					settings.completionStreaming = value;
					await save();
				})
		);

	containerEl.createEl("h3", { text: "Agent Mode" });

	new Setting(containerEl)
		.setName("Enable agent mode")
		.setDesc(
			"Allow AI to autonomously execute multi-step tasks with file operations"
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.agentMode.enabled)
				.onChange(async (value) => {
					settings.agentMode.enabled = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Max agent steps")
		.setDesc(
			"Maximum number of steps the agent can execute in a single task (1-20)"
		)
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
		.setName("Auto-approve file operations")
		.setDesc(
			"Automatically execute file operations without confirmation (agent mode only)"
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.agentMode.autoApprove)
				.onChange(async (value) => {
					settings.agentMode.autoApprove = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Pause on error")
		.setDesc(
			"Pause agent execution when an error occurs instead of failing completely"
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.agentMode.pauseOnError)
				.onChange(async (value) => {
					settings.agentMode.pauseOnError = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Max operations per message")
		.setDesc(
			"Maximum number of file operations allowed in a single AI response (1-20)"
		)
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
