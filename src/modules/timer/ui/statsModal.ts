import { App, Modal } from "obsidian";
import { StatsService } from "../services/statsService";
import type { PomodoroLogEntry } from "../types/pomodoro";
import { formatMinutesAsHoursMinutes } from "../utils/formatUtils";

export class StatsModal extends Modal {
	private statsService: StatsService;
	private entries: PomodoroLogEntry[];

	constructor(
		app: App,
		statsService: StatsService,
		entries: PomodoroLogEntry[]
	) {
		super(app);
		this.statsService = statsService;
		this.entries = entries;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("pomo-stats-modal");

		contentEl.createEl("h2", { text: "\u{1F4CA} Pomodoro Statistics" });

		const overview = this.statsService.calculateOverview(this.entries);

		// Summary cards
		const grid = contentEl.createDiv("pomo-stats-grid");

		this.createCard(
			grid,
			"Today",
			`\u{1F345} ${overview.today.pomodoroCount}`,
			formatMinutesAsHoursMinutes(overview.today.totalFocusMinutes)
		);

		const weekTotal = overview.thisWeek.reduce(
			(sum, d) => sum + d.pomodoroCount,
			0
		);
		const weekMinutes = overview.thisWeek.reduce(
			(sum, d) => sum + d.totalFocusMinutes,
			0
		);
		this.createCard(
			grid,
			"This Week",
			`\u{1F345} ${weekTotal}`,
			formatMinutesAsHoursMinutes(weekMinutes)
		);

		const monthTotal = overview.thisMonth.reduce(
			(sum, d) => sum + d.pomodoroCount,
			0
		);
		const monthMinutes = overview.thisMonth.reduce(
			(sum, d) => sum + d.totalFocusMinutes,
			0
		);
		this.createCard(
			grid,
			"This Month",
			`\u{1F345} ${monthTotal}`,
			formatMinutesAsHoursMinutes(monthMinutes)
		);

		// Streaks
		const streakDiv = contentEl.createDiv("pomo-streak");
		streakDiv.createSpan({
			text: `\u{1F525} Current Streak: ${overview.currentStreak} day${overview.currentStreak !== 1 ? "s" : ""}`,
		});
		streakDiv.createEl("br");
		streakDiv.createSpan({
			text: `\u{1F3C6} Longest Streak: ${overview.longestStreak} day${overview.longestStreak !== 1 ? "s" : ""}`,
		});

		// Weekly bar chart
		contentEl.createEl("h3", { text: "Weekly Overview" });
		const weeklyData = this.statsService.getWeeklyBreakdown(
			this.entries
		);
		const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);

		for (const { day, count } of weeklyData) {
			const row = contentEl.createDiv("pomo-bar-row");
			row.createSpan({ text: day, cls: "pomo-bar-label" });
			const track = row.createDiv("pomo-bar-track");
			const fill = track.createDiv("pomo-bar-fill");
			fill.style.width = `${(count / maxCount) * 100}%`;
			row.createSpan({
				text: String(count),
				cls: "pomo-bar-count",
			});
		}

		// Top tasks
		const topTasks = this.statsService.getTopTasks(this.entries);
		if (topTasks.length > 0) {
			contentEl.createEl("h3", { text: "Top Tasks" });
			const taskList = contentEl.createEl("ul", {
				cls: "pomo-task-list",
			});
			for (const { task, count } of topTasks) {
				taskList.createEl("li", {
					text: `${task} \u2014 ${count} \u{1F345}`,
				});
			}
		}

		// All-time totals
		contentEl.createEl("h3", { text: "All Time" });
		const totalDiv = contentEl.createDiv("pomo-all-time");
		totalDiv.createEl("p", {
			text: `Total: ${overview.totalPomodoros} \u{1F345} \u00B7 ${formatMinutesAsHoursMinutes(overview.totalFocusMinutes)}`,
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private createCard(
		parent: HTMLElement,
		label: string,
		value: string,
		subtitle: string
	): void {
		const card = parent.createDiv("pomo-stats-card");
		card.createDiv({ text: value, cls: "pomo-stats-card-value" });
		card.createDiv({ text: subtitle, cls: "pomo-stats-card-subtitle" });
		card.createDiv({ text: label, cls: "pomo-stats-card-label" });
	}
}
