import type { DueUrgency } from "../types/task";

/**
 * Classify due date urgency relative to today.
 * - "overdue": past due and not done
 * - "today": due today
 * - "soon": due within the next 3 days
 * - "normal": due further out
 * - "none": no due date or task is done
 */
export function getDueUrgency(
	due: string | undefined,
	isDone: boolean
): DueUrgency {
	if (!due || isDone) return "none";

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Force local timezone parse to avoid off-by-one from UTC
	const dueDate = new Date(due + "T00:00:00");
	dueDate.setHours(0, 0, 0, 0);

	const diffMs = dueDate.getTime() - today.getTime();
	const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 0) return "overdue";
	if (diffDays === 0) return "today";
	if (diffDays <= 3) return "soon";
	return "normal";
}

/**
 * Get CSS class for a given urgency level.
 */
export function getDueUrgencyClass(urgency: DueUrgency): string {
	switch (urgency) {
		case "overdue":
			return "vt-overdue";
		case "today":
			return "vt-due-today";
		case "soon":
			return "vt-due-soon";
		default:
			return "";
	}
}

/**
 * Get display label prefix for a given urgency level.
 */
export function getDueUrgencyLabel(urgency: DueUrgency): string {
	switch (urgency) {
		case "overdue":
			return "Overdue: ";
		case "today":
			return "Today: ";
		case "soon":
			return "Soon: ";
		default:
			return "";
	}
}
