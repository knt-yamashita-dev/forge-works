import { MarkdownRenderChild } from "obsidian";
import type { TaskService } from "../services/taskService";
import type { Task, TaskStatus, TaskPriority } from "../types/task";
import { COMPLETION_STATUS } from "../types/task";
import {
	getDueUrgency,
	getDueUrgencyClass,
} from "../utils/dueDateUtils";

interface TaskQuery {
	status: TaskStatus[];
	priority: TaskPriority[];
	due: string | null; // "today" | "overdue" | "this-week" | "YYYY-MM-DD"
	updated: string | null; // "today" | "YYYY-MM-DD"
	project: string | null;
	sort: string; // "updated" | "due" | "priority"
}

function parseQuery(source: string): TaskQuery {
	const query: TaskQuery = {
		status: [],
		priority: [],
		due: null,
		updated: null,
		project: null,
		sort: "updated",
	};

	for (const line of source.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const colonIdx = trimmed.indexOf(":");
		if (colonIdx === -1) continue;

		const key = trimmed.substring(0, colonIdx).trim().toLowerCase();
		const value = trimmed.substring(colonIdx + 1).trim();

		switch (key) {
			case "status":
				query.status = value
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean) as TaskStatus[];
				break;
			case "priority":
				query.priority = value
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean) as TaskPriority[];
				break;
			case "due":
				query.due = value;
				break;
			case "updated":
				query.updated = value;
				break;
			case "project":
				query.project = value;
				break;
			case "sort":
				query.sort = value;
				break;
		}
	}

	return query;
}

function formatToday(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function getWeekEnd(): string {
	const d = new Date();
	const dayOfWeek = d.getDay();
	const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
	d.setDate(d.getDate() + daysUntilSunday);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function filterTasks(tasks: Task[], query: TaskQuery): Task[] {
	const today = formatToday();

	return tasks.filter((task) => {
		// Status filter
		if (
			query.status.length > 0 &&
			!query.status.includes(task.frontmatter.status)
		) {
			return false;
		}

		// Priority filter
		if (
			query.priority.length > 0 &&
			!query.priority.includes(task.frontmatter.priority)
		) {
			return false;
		}

		// Due filter
		if (query.due) {
			const due = task.frontmatter.due;
			switch (query.due) {
				case "today":
					if (due !== today) return false;
					break;
				case "overdue":
					if (!due || due >= today) return false;
					break;
				case "this-week":
					if (!due || due > getWeekEnd() || due < today)
						return false;
					break;
				default:
					// Exact date match
					if (due !== query.due) return false;
			}
		}

		// Updated filter
		if (query.updated) {
			const updated = task.frontmatter.updated;
			switch (query.updated) {
				case "today":
					if (updated !== today) return false;
					break;
				default:
					if (updated !== query.updated) return false;
			}
		}

		// Project filter
		if (query.project && task.frontmatter.project !== query.project) {
			return false;
		}

		return true;
	});
}

function sortTasks(tasks: Task[], sort: string): Task[] {
	const sorted = [...tasks];
	switch (sort) {
		case "due":
			sorted.sort((a, b) => {
				const aDue = a.frontmatter.due || "9999-99-99";
				const bDue = b.frontmatter.due || "9999-99-99";
				return aDue.localeCompare(bDue);
			});
			break;
		case "priority": {
			const order: Record<TaskPriority, number> = {
				urgent: 0,
				high: 1,
				medium: 2,
				low: 3,
			};
			sorted.sort(
				(a, b) =>
					order[a.frontmatter.priority] -
					order[b.frontmatter.priority]
			);
			break;
		}
		default:
			// "updated" - ascending
			sorted.sort((a, b) =>
				a.frontmatter.updated.localeCompare(
					b.frontmatter.updated
				)
			);
	}
	return sorted;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
	urgent: "var(--text-error)",
	high: "var(--color-orange)",
	medium: "var(--text-muted)",
	low: "var(--text-faint)",
};

export class TaskCodeBlockRenderer extends MarkdownRenderChild {
	private taskService: TaskService;
	private query: TaskQuery;
	private onOpenTask: (filePath: string) => void;
	private statusIcons: Record<string, string>;

	constructor(
		el: HTMLElement,
		taskService: TaskService,
		source: string,
		onOpenTask: (filePath: string) => void,
		statusIcons: Record<string, string> = {}
	) {
		super(el);
		this.taskService = taskService;
		this.query = parseQuery(source);
		this.onOpenTask = onOpenTask;
		this.statusIcons = statusIcons;
	}

	onload(): void {
		this.render();
		this.taskService.onChange(this.handleChange);
	}

	onunload(): void {
		this.taskService.offChange(this.handleChange);
	}

	private handleChange = (): void => {
		this.render();
	};

	private render(): void {
		const el = this.containerEl;
		el.empty();
		el.addClass("vt-codeblock");

		const allTasks = this.taskService.getTasks();
		const filtered = filterTasks(allTasks, this.query);
		const sorted = sortTasks(filtered, this.query.sort);

		if (sorted.length === 0) {
			const empty = el.createEl("div", {
				cls: "vt-codeblock-empty",
				text: "No matching tasks",
			});
			return;
		}

		const list = el.createEl("div", { cls: "vt-codeblock-list" });

		for (const task of sorted) {
			const row = list.createEl("div", {
				cls: "vt-codeblock-row",
			});
			row.addEventListener("click", () => {
				this.onOpenTask(task.filePath);
			});

			// Status icon
			row.createEl("span", {
				cls: "vt-codeblock-status",
				text: this.statusIcons[task.frontmatter.status] || "\u25cb",
			});

			// Title
			row.createEl("span", {
				cls: "vt-codeblock-title",
				text: task.title,
			});

			// Priority (urgent/high only)
			if (
				task.frontmatter.priority === "urgent" ||
				task.frontmatter.priority === "high"
			) {
				const badge = row.createEl("span", {
					cls: "vt-codeblock-priority",
					text:
						task.frontmatter.priority === "urgent"
							? "!!!"
							: "!!",
				});
				badge.style.color =
					PRIORITY_COLORS[task.frontmatter.priority];
			}

			// Due date
			if (task.frontmatter.due) {
				const urgency = getDueUrgency(
					task.frontmatter.due,
					task.frontmatter.status === COMPLETION_STATUS
				);
				const urgencyClass = getDueUrgencyClass(urgency);
				row.createEl("span", {
					cls: `vt-codeblock-due${urgencyClass ? " " + urgencyClass : ""}`,
					text: task.frontmatter.due,
				});
			}

			// Parent
			if (task.frontmatter.parent) {
				const parent =
					this.taskService.getParentTask(task.filePath);
				const parentName = parent
					? parent.title
					: task.frontmatter.parent.replace(
							/^\[\[|\]\]$/g,
							""
						);
				row.createEl("span", {
					cls: "vt-codeblock-parent",
					text: `↑ ${parentName}`,
				});
			}

			// Project
			if (task.frontmatter.project) {
				row.createEl("span", {
					cls: "vt-codeblock-project",
					text: task.frontmatter.project,
				});
			}
		}
	}
}
