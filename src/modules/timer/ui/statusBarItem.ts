import { Menu } from "obsidian";
import type { TimerService } from "../services/timerService";
import type { TimerState } from "../types/pomodoro";
import { PHASE_ICONS } from "../types/pomodoro";
import { formatSeconds } from "../utils/formatUtils";

export interface StatusBarCallbacks {
	timerService: TimerService;
	openTaskInput: () => void;
	openStats: () => void;
}

export class StatusBarItem {
	private el: HTMLElement;
	private callbacks: StatusBarCallbacks;

	constructor(statusBarEl: HTMLElement, callbacks: StatusBarCallbacks) {
		this.el = statusBarEl;
		this.callbacks = callbacks;
		this.el.addClass("pomo-status-bar");

		// Initial display
		this.update(callbacks.timerService.getState());

		// Click handler
		this.el.addEventListener("click", (e: MouseEvent) => {
			this.showMenu(e);
		});
	}

	update(state: TimerState): void {
		this.el.empty();

		if (state.status === "idle") {
			const icon = PHASE_ICONS[state.phase];
			if (state.phase === "work" && state.completedPomodoros === 0 && state.totalCompletedToday === 0) {
				this.el.setText(`${icon} Start`);
			} else {
				this.el.setText(`${icon} ${formatSeconds(state.remainingSeconds)}`);
			}
		} else if (state.status === "running") {
			const icon = PHASE_ICONS[state.phase];
			const text = `${icon} ${formatSeconds(state.remainingSeconds)}`;
			this.el.setText(text);
		} else if (state.status === "paused") {
			this.el.setText(`\u23F8 ${formatSeconds(state.remainingSeconds)}`);
		}
	}

	destroy(): void {
		this.el.remove();
	}

	private showMenu(e: MouseEvent): void {
		const menu = new Menu();
		const { timerService } = this.callbacks;
		const state = timerService.getState();

		if (state.status === "idle") {
			menu.addItem((item) =>
				item
					.setTitle("Start Pomodoro")
					.setIcon("play")
					.onClick(() => timerService.start())
			);
		} else if (state.status === "running") {
			menu.addItem((item) =>
				item
					.setTitle("Pause")
					.setIcon("pause")
					.onClick(() => timerService.pause())
			);
		} else if (state.status === "paused") {
			menu.addItem((item) =>
				item
					.setTitle("Resume")
					.setIcon("play")
					.onClick(() => timerService.resume())
			);
		}

		if (state.status !== "idle") {
			menu.addItem((item) =>
				item
					.setTitle("Skip Phase")
					.setIcon("skip-forward")
					.onClick(() => timerService.skip())
			);
			menu.addItem((item) =>
				item
					.setTitle("Reset")
					.setIcon("rotate-ccw")
					.onClick(() => timerService.reset())
			);
		}

		menu.addSeparator();

		menu.addItem((item) =>
			item
				.setTitle("Set Task...")
				.setIcon("pencil")
				.onClick(() => this.callbacks.openTaskInput())
		);

		menu.addItem((item) =>
			item
				.setTitle("Statistics")
				.setIcon("bar-chart-2")
				.onClick(() => this.callbacks.openStats())
		);

		menu.showAtMouseEvent(e);
	}
}
