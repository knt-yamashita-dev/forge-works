import type { TimerPhase, TimerState, TimerStatus } from "../types/pomodoro";
import type { PomodoroSettings } from "../settings/settings";

type ChangeListener = (state: TimerState) => void;
type PhaseCompleteListener = (phase: TimerPhase, state: TimerState) => void;

export class TimerService {
	private status: TimerStatus = "idle";
	private phase: TimerPhase = "work";
	private remainingSeconds: number;
	private totalSeconds: number;
	private completedPomodoros = 0;
	private totalCompletedToday = 0;
	private currentTask = "";
	private phaseStartedAt: number | null = null;
	private phaseEndAt: number | null = null;

	private intervalId: number | null = null;
	private settings: PomodoroSettings;

	private changeListeners: Set<ChangeListener> = new Set();
	private phaseCompleteListeners: Set<PhaseCompleteListener> = new Set();

	constructor(settings: PomodoroSettings) {
		this.settings = settings;
		this.totalSeconds = settings.workDuration * 60;
		this.remainingSeconds = this.totalSeconds;
	}

	getState(): TimerState {
		return {
			status: this.status,
			phase: this.phase,
			remainingSeconds: this.remainingSeconds,
			totalSeconds: this.totalSeconds,
			completedPomodoros: this.completedPomodoros,
			totalCompletedToday: this.totalCompletedToday,
			currentTask: this.currentTask,
			phaseStartedAt: this.phaseStartedAt,
		};
	}

	getIntervalId(): number | null {
		return this.intervalId;
	}

	start(): void {
		if (this.status === "running") return;

		this.status = "running";
		const now = Date.now();
		this.phaseStartedAt = now;
		this.phaseEndAt = now + this.remainingSeconds * 1000;

		this.startInterval();
		this.notifyChange();
	}

	pause(): void {
		if (this.status !== "running") return;

		this.status = "paused";
		this.stopInterval();
		// Recalculate remaining from the drift-resistant end time
		if (this.phaseEndAt !== null) {
			this.remainingSeconds = Math.max(0, Math.ceil((this.phaseEndAt - Date.now()) / 1000));
		}
		this.phaseEndAt = null;
		this.notifyChange();
	}

	resume(): void {
		if (this.status !== "paused") return;
		this.start();
	}

	skip(): void {
		this.stopInterval();
		this.transitionToNextPhase();
	}

	reset(): void {
		this.stopInterval();
		this.status = "idle";
		this.phase = "work";
		this.totalSeconds = this.settings.workDuration * 60;
		this.remainingSeconds = this.totalSeconds;
		this.completedPomodoros = 0;
		this.phaseStartedAt = null;
		this.phaseEndAt = null;
		this.notifyChange();
	}

	setTask(task: string): void {
		this.currentTask = task;
		this.notifyChange();
	}

	updateSettings(settings: PomodoroSettings): void {
		this.settings = settings;
		// If idle, update the displayed duration
		if (this.status === "idle") {
			this.totalSeconds = this.getDurationForPhase(this.phase);
			this.remainingSeconds = this.totalSeconds;
			this.notifyChange();
		}
	}

	onChange(listener: ChangeListener): void {
		this.changeListeners.add(listener);
	}

	offChange(listener: ChangeListener): void {
		this.changeListeners.delete(listener);
	}

	onPhaseComplete(listener: PhaseCompleteListener): void {
		this.phaseCompleteListeners.add(listener);
	}

	offPhaseComplete(listener: PhaseCompleteListener): void {
		this.phaseCompleteListeners.delete(listener);
	}

	destroy(): void {
		this.stopInterval();
		this.changeListeners.clear();
		this.phaseCompleteListeners.clear();
	}

	private startInterval(): void {
		this.stopInterval();
		this.intervalId = window.setInterval(() => this.tick(), 1000);
	}

	private stopInterval(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private tick(): void {
		if (this.status !== "running" || this.phaseEndAt === null) return;

		// Drift-resistant: calculate remaining from target end time
		this.remainingSeconds = Math.max(0, Math.ceil((this.phaseEndAt - Date.now()) / 1000));

		if (this.remainingSeconds <= 0) {
			this.remainingSeconds = 0;
			const completedPhase = this.phase;
			const stateSnapshot = this.getState();

			// Notify phase complete before transitioning
			for (const listener of this.phaseCompleteListeners) {
				listener(completedPhase, stateSnapshot);
			}

			this.transitionToNextPhase();
			return;
		}

		this.notifyChange();
	}

	private transitionToNextPhase(): void {
		const wasWork = this.phase === "work";

		if (wasWork) {
			this.completedPomodoros++;
			this.totalCompletedToday++;

			if (this.completedPomodoros >= this.settings.pomodorosBeforeLongBreak) {
				this.phase = "long-break";
				this.completedPomodoros = 0;
			} else {
				this.phase = "short-break";
			}
		} else {
			this.phase = "work";
		}

		this.totalSeconds = this.getDurationForPhase(this.phase);
		this.remainingSeconds = this.totalSeconds;

		const shouldAutoStart =
			(this.phase === "work" && this.settings.autoStartWork) ||
			(this.phase !== "work" && this.settings.autoStartBreak);

		if (shouldAutoStart) {
			this.status = "running";
			const now = Date.now();
			this.phaseStartedAt = now;
			this.phaseEndAt = now + this.remainingSeconds * 1000;
			this.startInterval();
		} else {
			this.status = "idle";
			this.phaseStartedAt = null;
			this.phaseEndAt = null;
			this.stopInterval();
		}

		this.notifyChange();
	}

	private getDurationForPhase(phase: TimerPhase): number {
		switch (phase) {
			case "work":
				return this.settings.workDuration * 60;
			case "short-break":
				return this.settings.shortBreakDuration * 60;
			case "long-break":
				return this.settings.longBreakDuration * 60;
		}
	}

	private notifyChange(): void {
		const state = this.getState();
		for (const listener of this.changeListeners) {
			listener(state);
		}
	}
}
