// Timer phase types
export type TimerPhase = "work" | "short-break" | "long-break";

// Timer status
export type TimerStatus = "idle" | "running" | "paused";

// Timer state (snapshot)
export interface TimerState {
	status: TimerStatus;
	phase: TimerPhase;
	remainingSeconds: number;
	totalSeconds: number;
	completedPomodoros: number;
	totalCompletedToday: number;
	currentTask: string;
	phaseStartedAt: number | null;
}

// Log entry for a completed pomodoro
export interface PomodoroLogEntry {
	date: string;          // YYYY-MM-DD
	startTime: string;     // HH:MM
	endTime: string;       // HH:MM
	duration: number;      // minutes
	phase: TimerPhase;
	task: string;
	sessionNumber: number;
	note: string;          // Work note (empty = not provided)
}

// Daily statistics
export interface DailyStats {
	date: string;
	pomodoroCount: number;
	totalFocusMinutes: number;
	tasks: string[];
}

// Statistics overview
export interface StatsOverview {
	today: DailyStats;
	thisWeek: DailyStats[];
	thisMonth: DailyStats[];
	currentStreak: number;
	longestStreak: number;
	totalPomodoros: number;
	totalFocusMinutes: number;
}

// Sound types
export type SoundType = "work-end" | "break-end";

// Log format options
export type LogFormat = "table" | "list";

// Phase display labels
export const PHASE_LABELS: Record<TimerPhase, string> = {
	"work": "Focus",
	"short-break": "Short Break",
	"long-break": "Long Break",
};

// Phase icons for status bar
export const PHASE_ICONS: Record<TimerPhase, string> = {
	"work": "\u{1F345}",
	"short-break": "\u2615",
	"long-break": "\u{1F3D6}\uFE0F",
};
