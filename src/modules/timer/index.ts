import { Notice, Plugin } from "obsidian";
import { TimerService } from "./services/timerService";
import { LogService } from "./services/logService";
import { StatsService } from "./services/statsService";
import { StatusBarItem } from "./ui/statusBarItem";
import { TaskInputModal } from "./ui/taskInputModal";
import { StatsModal } from "./ui/statsModal";
import { WorkNoteModal } from "./ui/workNoteModal";
import { SoundHelper } from "./utils/sounds";
import type { PomodoroSettings } from "./settings/settings";
import type {
	TimerPhase,
	TimerState,
	PomodoroLogEntry,
} from "./types/pomodoro";
import { PHASE_LABELS } from "./types/pomodoro";
import { formatDate, formatTime } from "./utils/formatUtils";
import { execFile } from "child_process";
import type { ForgeModule } from "../../types/module";

export class TimerModule implements ForgeModule {
	private plugin!: Plugin;
	settings!: PomodoroSettings;
	timerService!: TimerService;
	private logService!: LogService;
	private statsService!: StatsService;
	private statusBarItem!: StatusBarItem;
	private soundHelper!: SoundHelper;

	async onload(
		plugin: Plugin,
		settings: PomodoroSettings
	): Promise<void> {
		this.plugin = plugin;
		this.settings = settings;

		// Initialize services
		this.timerService = new TimerService(this.settings);
		this.logService = new LogService(plugin.app.vault, this.settings);
		this.statsService = new StatsService();
		this.soundHelper = new SoundHelper(this.settings);

		// Restore task name
		if (this.settings.rememberLastTask && this.settings.lastTask) {
			this.timerService.setTask(this.settings.lastTask);
		}

		// Status bar
		const statusBarEl = plugin.addStatusBarItem();
		this.statusBarItem = new StatusBarItem(statusBarEl, {
			timerService: this.timerService,
			openTaskInput: () => this.openTaskInput(),
			openStats: () => this.openStats(),
		});

		// Wire up timer -> UI updates
		this.timerService.onChange((state: TimerState) => {
			this.statusBarItem.update(state);
		});

		// Wire up phase completion
		this.timerService.onPhaseComplete(
			(phase: TimerPhase, state: TimerState) => {
				this.handlePhaseComplete(phase, state);
			}
		);

		// Register commands
		plugin.addCommand({
			id: "start-pause",
			name: "Start/Pause Pomodoro",
			callback: () => this.toggleStartPause(),
		});

		plugin.addCommand({
			id: "skip-phase",
			name: "Skip current phase",
			callback: () => this.timerService.skip(),
		});

		plugin.addCommand({
			id: "reset-timer",
			name: "Reset timer",
			callback: () => this.timerService.reset(),
		});

		plugin.addCommand({
			id: "open-stats",
			name: "Open statistics",
			callback: () => this.openStats(),
		});

		plugin.addCommand({
			id: "set-task",
			name: "Set task name",
			callback: () => this.openTaskInput(),
		});
	}

	async onunload(): Promise<void> {
		this.timerService.destroy();
		this.statusBarItem.destroy();
	}

	onSettingsChange(): void {
		this.timerService.updateSettings(this.settings);
		this.logService.updateSettings(this.settings);
		this.soundHelper.updateSettings(this.settings);
	}

	private openTaskInput(): void {
		const recentTasks = this.getRecentTasks();
		new TaskInputModal(
			this.plugin.app,
			this.timerService.getState().currentTask,
			recentTasks,
			(task) => {
				this.timerService.setTask(task);
				if (this.settings.rememberLastTask) {
					this.settings.lastTask = task;
					(this.plugin as any).saveSettings();
				}
			}
		).open();
	}

	private getRecentTasks(): string[] {
		const taskCounts = new Map<string, number>();
		for (const entry of this.settings.logEntries) {
			if (entry.task && entry.task !== "(no task)") {
				taskCounts.set(
					entry.task,
					(taskCounts.get(entry.task) || 0) + 1
				);
			}
		}
		return Array.from(taskCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([task]) => task)
			.slice(0, 10);
	}

	private openStats(): void {
		new StatsModal(
			this.plugin.app,
			this.statsService,
			this.settings.logEntries
		).open();
	}

	private toggleStartPause(): void {
		const state = this.timerService.getState();
		if (state.status === "running") {
			this.timerService.pause();
		} else if (state.status === "paused") {
			this.timerService.resume();
		} else {
			this.timerService.start();
		}
	}

	private sendSystemNotification(title: string, body: string): void {
		if (process.platform === "darwin") {
			const escaped = body.replace(/"/g, '\\"');
			const script = `say "${title}" using "Kyoko"\ndisplay dialog "${escaped}" with title "${title}"`;
			execFile("osascript", ["-e", script], (err) => {
				if (err && (err as NodeJS.ErrnoException).code !== "1")
					console.error(
						"System notification failed:",
						err
					);
			});
		}
	}

	private async handlePhaseComplete(
		phase: TimerPhase,
		state: TimerState
	): Promise<void> {
		// Play sound
		if (this.settings.enableSound) {
			if (phase === "work" && this.settings.soundWorkEnd) {
				this.soundHelper.play("work-end");
			} else if (
				phase !== "work" &&
				this.settings.soundBreakEnd
			) {
				this.soundHelper.play("break-end");
			}
		}

		// Show notice
		const label =
			phase === "work"
				? "Focus session complete! Time for a break."
				: `${PHASE_LABELS[phase]} is over! Ready to focus.`;

		if (this.settings.enableNotice) {
			new Notice(label);
		}

		// Send OS-level notification via osascript
		if (this.settings.enableSystemNotification) {
			const title =
				phase === "work"
					? "\u{1f345} Focus Complete"
					: "\u2615 Break Over";
			this.sendSystemNotification(title, label);
		}

		// Log completed work sessions
		if (phase === "work" && this.settings.enableLogging) {
			const now = new Date();
			const baseEntry = {
				date: formatDate(now),
				startTime: formatTime(
					new Date(state.phaseStartedAt!)
				),
				endTime: formatTime(now),
				duration: this.settings.workDuration,
				phase: "work" as const,
				task: state.currentTask || "(no task)",
				sessionNumber: state.completedPomodoros,
			};

			if (this.settings.enableWorkNote) {
				new WorkNoteModal(
					this.plugin.app,
					state.currentTask,
					async (note: string) => {
						const entry: PomodoroLogEntry = {
							...baseEntry,
							note,
						};
						this.settings.logEntries.push(entry);
						await (this.plugin as any).saveSettings();
						await this.logService.logSession(entry);
					}
				).open();
			} else {
				const entry: PomodoroLogEntry = {
					...baseEntry,
					note: "",
				};
				this.settings.logEntries.push(entry);
				await (this.plugin as any).saveSettings();
				await this.logService.logSession(entry);
			}
		}

		// Persist last task
		if (this.settings.rememberLastTask && state.currentTask) {
			this.settings.lastTask = state.currentTask;
			await (this.plugin as any).saveSettings();
		}
	}
}
