import type { DailyStats, PomodoroLogEntry, StatsOverview } from "../types/pomodoro";
import { formatDate, todayString } from "../utils/formatUtils";

export class StatsService {
	calculateOverview(entries: PomodoroLogEntry[]): StatsOverview {
		const workEntries = entries.filter((e) => e.phase === "work");
		const today = todayString();
		const todayStats = this.getDailyStats(workEntries, today);

		const now = new Date();
		const weekStart = this.getWeekStart(now);
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		const thisWeek = this.getDailyStatsInRange(
			workEntries,
			formatDate(weekStart),
			today
		);
		const thisMonth = this.getDailyStatsInRange(
			workEntries,
			formatDate(monthStart),
			today
		);

		const { current, longest } = this.calculateStreak(workEntries);

		return {
			today: todayStats,
			thisWeek: thisWeek,
			thisMonth: thisMonth,
			currentStreak: current,
			longestStreak: longest,
			totalPomodoros: workEntries.length,
			totalFocusMinutes: workEntries.reduce(
				(sum, e) => sum + e.duration,
				0
			),
		};
	}

	getDailyStats(
		entries: PomodoroLogEntry[],
		date: string
	): DailyStats {
		const dayEntries = entries.filter((e) => e.date === date);
		const tasks = [
			...new Set(
				dayEntries
					.map((e) => e.task)
					.filter((t) => t !== "(no task)")
			),
		];
		return {
			date,
			pomodoroCount: dayEntries.length,
			totalFocusMinutes: dayEntries.reduce(
				(sum, e) => sum + e.duration,
				0
			),
			tasks,
		};
	}

	calculateStreak(
		entries: PomodoroLogEntry[]
	): { current: number; longest: number } {
		if (entries.length === 0) return { current: 0, longest: 0 };

		// Get unique dates sorted descending
		const dates = [...new Set(entries.map((e) => e.date))].sort(
			(a, b) => b.localeCompare(a)
		);

		let current = 0;
		let longest = 0;
		let streak = 0;
		let prevDate: Date | null = null;

		// Walk from most recent to oldest
		for (const dateStr of dates) {
			const date = new Date(dateStr + "T00:00:00");

			if (prevDate === null) {
				// Check if the most recent date is today or yesterday
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const diffDays = Math.floor(
					(today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
				);
				if (diffDays <= 1) {
					streak = 1;
				} else {
					// Streak is broken (most recent activity was >1 day ago)
					current = 0;
					streak = 1;
				}
			} else {
				const diffDays = Math.floor(
					(prevDate.getTime() - date.getTime()) /
						(1000 * 60 * 60 * 24)
				);
				if (diffDays === 1) {
					streak++;
				} else {
					if (current === 0) current = streak;
					longest = Math.max(longest, streak);
					streak = 1;
				}
			}

			prevDate = date;
		}

		if (current === 0) current = streak;
		longest = Math.max(longest, streak);

		return { current, longest };
	}

	getWeeklyBreakdown(
		entries: PomodoroLogEntry[]
	): { day: string; count: number }[] {
		const now = new Date();
		const weekStart = this.getWeekStart(now);
		const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
		const result: { day: string; count: number }[] = [];

		for (let i = 0; i < 7; i++) {
			const date = new Date(weekStart);
			date.setDate(date.getDate() + i);
			const dateStr = formatDate(date);
			const count = entries.filter(
				(e) => e.date === dateStr && e.phase === "work"
			).length;
			result.push({ day: days[i], count });
		}

		return result;
	}

	getTopTasks(
		entries: PomodoroLogEntry[],
		limit = 5
	): { task: string; count: number }[] {
		const taskCounts = new Map<string, number>();
		for (const entry of entries) {
			if (entry.phase === "work" && entry.task !== "(no task)") {
				taskCounts.set(
					entry.task,
					(taskCounts.get(entry.task) || 0) + 1
				);
			}
		}
		return Array.from(taskCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit)
			.map(([task, count]) => ({ task, count }));
	}

	private getDailyStatsInRange(
		entries: PomodoroLogEntry[],
		startDate: string,
		endDate: string
	): DailyStats[] {
		const filtered = entries.filter(
			(e) => e.date >= startDate && e.date <= endDate
		);
		const dateSet = new Set(filtered.map((e) => e.date));
		return Array.from(dateSet)
			.sort()
			.map((date) => this.getDailyStats(filtered, date));
	}

	private getWeekStart(date: Date): Date {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
		d.setDate(diff);
		d.setHours(0, 0, 0, 0);
		return d;
	}
}
