import { Setting } from "obsidian";
import type { PomodoroSettings } from "./settings";
import type { LogFormat } from "../types/pomodoro";

export function renderTimerSettings(
	containerEl: HTMLElement,
	settings: PomodoroSettings,
	save: () => Promise<void>
): void {
	// --- Timer ---
	containerEl.createEl("h3", { text: "Timer" });

	new Setting(containerEl)
		.setName("Work duration")
		.setDesc("Focus session length in minutes")
		.addSlider((slider) =>
			slider
				.setLimits(1, 60, 1)
				.setValue(settings.workDuration)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.workDuration = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Short break duration")
		.setDesc("Short break length in minutes")
		.addSlider((slider) =>
			slider
				.setLimits(1, 30, 1)
				.setValue(settings.shortBreakDuration)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.shortBreakDuration = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Long break duration")
		.setDesc("Long break length in minutes")
		.addSlider((slider) =>
			slider
				.setLimits(1, 60, 1)
				.setValue(settings.longBreakDuration)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.longBreakDuration = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Pomodoros before long break")
		.setDesc("Number of work sessions before a long break")
		.addSlider((slider) =>
			slider
				.setLimits(1, 8, 1)
				.setValue(settings.pomodorosBeforeLongBreak)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.pomodorosBeforeLongBreak = value;
					await save();
				})
		);

	// --- Auto-start ---
	containerEl.createEl("h3", { text: "Auto-start" });

	new Setting(containerEl)
		.setName("Auto-start break")
		.setDesc("Automatically start break after work session ends")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.autoStartBreak)
				.onChange(async (value) => {
					settings.autoStartBreak = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Auto-start work")
		.setDesc("Automatically start work session after break ends")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.autoStartWork)
				.onChange(async (value) => {
					settings.autoStartWork = value;
					await save();
				})
		);

	// --- Logging ---
	containerEl.createEl("h3", { text: "Logging" });

	new Setting(containerEl)
		.setName("Enable logging")
		.setDesc("Record completed pomodoro sessions")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableLogging)
				.onChange(async (value) => {
					settings.enableLogging = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Ask for work note")
		.setDesc(
			"Show a modal to record what you did after each focus session"
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableWorkNote)
				.onChange(async (value) => {
					settings.enableWorkNote = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Log file path")
		.setDesc("Path for the log file (e.g. Pomodoro/Log.md)")
		.addText((text) =>
			text
				.setPlaceholder("Pomodoro/Log.md")
				.setValue(settings.logFilePath)
				.onChange(async (value) => {
					settings.logFilePath = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Log to daily note")
		.setDesc(
			"Append log entries to the daily note instead of the log file"
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.logToDailyNote)
				.onChange(async (value) => {
					settings.logToDailyNote = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Log format")
		.setDesc("Format for log entries")
		.addDropdown((dropdown) =>
			dropdown
				.addOption("table", "Table")
				.addOption("list", "List")
				.setValue(settings.logFormat)
				.onChange(async (value) => {
					settings.logFormat = value as LogFormat;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Daily note heading")
		.setDesc("Heading to append under in the daily note")
		.addText((text) =>
			text
				.setPlaceholder("## Pomodoro")
				.setValue(settings.dailyNoteHeading)
				.onChange(async (value) => {
					settings.dailyNoteHeading = value;
					await save();
				})
		);

	// --- Sound ---
	containerEl.createEl("h3", { text: "Sound" });

	new Setting(containerEl)
		.setName("Enable sound")
		.setDesc("Play a sound when a phase completes")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableSound)
				.onChange(async (value) => {
					settings.enableSound = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Work end sound")
		.setDesc("Play sound when a focus session ends")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.soundWorkEnd)
				.onChange(async (value) => {
					settings.soundWorkEnd = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Break end sound")
		.setDesc("Play sound when a break ends")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.soundBreakEnd)
				.onChange(async (value) => {
					settings.soundBreakEnd = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Volume")
		.setDesc("Sound volume (0-100)")
		.addSlider((slider) =>
			slider
				.setLimits(0, 100, 5)
				.setValue(Math.round(settings.soundVolume * 100))
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.soundVolume = value / 100;
					await save();
				})
		);

	// --- Notifications ---
	containerEl.createEl("h3", { text: "Notifications" });

	new Setting(containerEl)
		.setName("Show notice")
		.setDesc("Show an Obsidian notice when a phase completes")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableNotice)
				.onChange(async (value) => {
					settings.enableNotice = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("System notification")
		.setDesc(
			"Send an OS-level notification when a phase completes. Visible even when Obsidian is not focused."
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableSystemNotification)
				.onChange(async (value) => {
					settings.enableSystemNotification = value;
					await save();
				})
		);

	// --- Task ---
	containerEl.createEl("h3", { text: "Task" });

	new Setting(containerEl)
		.setName("Default task")
		.setDesc("Default task name for new sessions")
		.addText((text) =>
			text
				.setPlaceholder("(empty)")
				.setValue(settings.defaultTask)
				.onChange(async (value) => {
					settings.defaultTask = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Remember last task")
		.setDesc("Restore the last used task name on plugin load")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.rememberLastTask)
				.onChange(async (value) => {
					settings.rememberLastTask = value;
					await save();
				})
		);
}
