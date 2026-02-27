import { Setting } from "obsidian";
import type { PomodoroSettings } from "./settings";
import type { LogFormat } from "../types/pomodoro";
import { t } from "../../../i18n";

export function renderTimerSettings(
	containerEl: HTMLElement,
	settings: PomodoroSettings,
	save: () => Promise<void>
): void {
	// --- Timer ---
	containerEl.createEl("h3", { text: t("timer.timer.heading") });

	new Setting(containerEl)
		.setName(t("timer.workDuration.name"))
		.setDesc(t("timer.workDuration.desc"))
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
		.setName(t("timer.shortBreak.name"))
		.setDesc(t("timer.shortBreak.desc"))
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
		.setName(t("timer.longBreak.name"))
		.setDesc(t("timer.longBreak.desc"))
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
		.setName(t("timer.pomodorosBeforeLong.name"))
		.setDesc(t("timer.pomodorosBeforeLong.desc"))
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
	containerEl.createEl("h3", { text: t("timer.autoStart.heading") });

	new Setting(containerEl)
		.setName(t("timer.autoStartBreak.name"))
		.setDesc(t("timer.autoStartBreak.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.autoStartBreak)
				.onChange(async (value) => {
					settings.autoStartBreak = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("timer.autoStartWork.name"))
		.setDesc(t("timer.autoStartWork.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.autoStartWork)
				.onChange(async (value) => {
					settings.autoStartWork = value;
					await save();
				})
		);

	// --- Logging ---
	containerEl.createEl("h3", { text: t("timer.logging.heading") });

	new Setting(containerEl)
		.setName(t("timer.enableLogging.name"))
		.setDesc(t("timer.enableLogging.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableLogging)
				.onChange(async (value) => {
					settings.enableLogging = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("timer.workNote.name"))
		.setDesc(t("timer.workNote.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableWorkNote)
				.onChange(async (value) => {
					settings.enableWorkNote = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("timer.logPath.name"))
		.setDesc(t("timer.logPath.desc"))
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
		.setName(t("timer.dailyNote.name"))
		.setDesc(t("timer.dailyNote.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.logToDailyNote)
				.onChange(async (value) => {
					settings.logToDailyNote = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("timer.logFormat.name"))
		.setDesc(t("timer.logFormat.desc"))
		.addDropdown((dropdown) =>
			dropdown
				.addOption("table", t("timer.logFormat.table"))
				.addOption("list", t("timer.logFormat.list"))
				.setValue(settings.logFormat)
				.onChange(async (value) => {
					settings.logFormat = value as LogFormat;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("timer.dailyHeading.name"))
		.setDesc(t("timer.dailyHeading.desc"))
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
	containerEl.createEl("h3", { text: t("timer.sound.heading") });

	new Setting(containerEl)
		.setName(t("timer.enableSound.name"))
		.setDesc(t("timer.enableSound.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableSound)
				.onChange(async (value) => {
					settings.enableSound = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("timer.soundWorkEnd.name"))
		.setDesc(t("timer.soundWorkEnd.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.soundWorkEnd)
				.onChange(async (value) => {
					settings.soundWorkEnd = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("timer.soundBreakEnd.name"))
		.setDesc(t("timer.soundBreakEnd.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.soundBreakEnd)
				.onChange(async (value) => {
					settings.soundBreakEnd = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("timer.volume.name"))
		.setDesc(t("timer.volume.desc"))
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
	containerEl.createEl("h3", { text: t("timer.notifications.heading") });

	new Setting(containerEl)
		.setName(t("timer.notice.name"))
		.setDesc(t("timer.notice.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableNotice)
				.onChange(async (value) => {
					settings.enableNotice = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("timer.systemNotification.name"))
		.setDesc(t("timer.systemNotification.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.enableSystemNotification)
				.onChange(async (value) => {
					settings.enableSystemNotification = value;
					await save();
				})
		);

	// --- Task ---
	containerEl.createEl("h3", { text: t("timer.task.heading") });

	new Setting(containerEl)
		.setName(t("timer.defaultTask.name"))
		.setDesc(t("timer.defaultTask.desc"))
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
		.setName(t("timer.rememberTask.name"))
		.setDesc(t("timer.rememberTask.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.rememberLastTask)
				.onChange(async (value) => {
					settings.rememberLastTask = value;
					await save();
				})
		);
}
