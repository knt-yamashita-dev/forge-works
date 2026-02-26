import type { LogFormat, PomodoroLogEntry } from "../types/pomodoro";

export interface PomodoroSettings {
	// Timer durations (minutes)
	workDuration: number;
	shortBreakDuration: number;
	longBreakDuration: number;
	pomodorosBeforeLongBreak: number;

	// Auto-start behavior
	autoStartBreak: boolean;
	autoStartWork: boolean;

	// Logging
	enableLogging: boolean;
	enableWorkNote: boolean;
	logFilePath: string;
	logToDailyNote: boolean;
	logFormat: LogFormat;
	dailyNoteHeading: string;

	// Sound
	enableSound: boolean;
	soundWorkEnd: boolean;
	soundBreakEnd: boolean;
	soundVolume: number;

	// Notifications
	enableNotice: boolean;
	enableSystemNotification: boolean;

	// Task
	defaultTask: string;
	rememberLastTask: boolean;
	lastTask: string;

	// Persisted data
	logEntries: PomodoroLogEntry[];
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
	workDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	pomodorosBeforeLongBreak: 4,
	autoStartBreak: false,
	autoStartWork: false,
	enableLogging: true,
	enableWorkNote: true,
	logFilePath: "Pomodoro/Log.md",
	logToDailyNote: false,
	logFormat: "table",
	dailyNoteHeading: "## Pomodoro",
	enableSound: true,
	soundWorkEnd: true,
	soundBreakEnd: true,
	soundVolume: 0.5,
	enableNotice: true,
	enableSystemNotification: false,
	defaultTask: "",
	rememberLastTask: true,
	lastTask: "",
	logEntries: [],
};
