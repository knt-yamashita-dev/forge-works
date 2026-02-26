import * as React from "react";
import { useAppContext } from "./AppContext";
import type { TaskFilter, TaskStatus, TaskPriority, TaskSortKey, TaskGroupKey } from "../../types/task";
import { TASK_PRIORITIES, TASK_SORT_OPTIONS, TASK_GROUP_OPTIONS, getOrderedStatuses } from "../../types/task";

interface TaskFilterBarProps {
	filter: TaskFilter;
	projects: string[];
	onFilterChange: (filter: TaskFilter) => void;
	sortKey: TaskSortKey;
	groupKey: TaskGroupKey;
	onSortChange: (key: TaskSortKey) => void;
	onGroupChange: (key: TaskGroupKey) => void;
}

export function TaskFilterBar({
	filter,
	projects,
	onFilterChange,
	sortKey,
	groupKey,
	onSortChange,
	onGroupChange,
}: TaskFilterBarProps): React.ReactElement {
	const { settings } = useAppContext();

	const orderedStatuses = React.useMemo(
		() => getOrderedStatuses(settings.customStatuses, settings.statusOrder),
		[settings.customStatuses, settings.statusOrder]
	);

	const toggleStatus = (status: TaskStatus) => {
		const current = filter.statusFilter;
		const next = current.includes(status)
			? current.filter((s) => s !== status)
			: [...current, status];
		if (next.length > 0) {
			onFilterChange({ ...filter, statusFilter: next });
		}
	};

	const togglePriority = (priority: TaskPriority) => {
		const current = filter.priorityFilter;
		const next = current.includes(priority)
			? current.filter((p) => p !== priority)
			: [...current, priority];
		if (next.length > 0) {
			onFilterChange({ ...filter, priorityFilter: next });
		}
	};

	return (
		<div className="vt-filter-bar">
			<div className="vt-filter-row">
				<span className="vt-filter-label">Status:</span>
				{orderedStatuses.map((s) => (
					<button
						key={s.value}
						className={`vt-filter-chip${filter.statusFilter.includes(s.value) ? " vt-filter-active" : ""}`}
						onClick={() => toggleStatus(s.value)}
					>
						{s.label}
					</button>
				))}
			</div>
			<div className="vt-filter-row">
				<span className="vt-filter-label">Priority:</span>
				{TASK_PRIORITIES.map((p) => (
					<button
						key={p.value}
						className={`vt-filter-chip${filter.priorityFilter.includes(p.value) ? " vt-filter-active" : ""}`}
						onClick={() => togglePriority(p.value)}
					>
						{p.label}
					</button>
				))}
			</div>
			<div className="vt-filter-row">
				<span className="vt-filter-label">Project:</span>
				<select
					className="vt-filter-select"
					value={filter.projectFilter || ""}
					onChange={(e) =>
						onFilterChange({
							...filter,
							projectFilter: e.target.value || null,
						})
					}
				>
					<option value="">All</option>
					{projects.map((p) => (
						<option key={p} value={p}>
							{p}
						</option>
					))}
				</select>
			</div>
			<div className="vt-filter-row">
				<span className="vt-filter-label">Sort:</span>
				<select
					className="vt-filter-select"
					value={sortKey}
					onChange={(e) => onSortChange(e.target.value as TaskSortKey)}
				>
					{TASK_SORT_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>
			<div className="vt-filter-row">
				<span className="vt-filter-label">Group:</span>
				<select
					className="vt-filter-select"
					value={groupKey}
					onChange={(e) => onGroupChange(e.target.value as TaskGroupKey)}
				>
					{TASK_GROUP_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>
			<div className="vt-filter-row">
				<input
					type="text"
					className="vt-filter-search"
					placeholder="Search tasks..."
					value={filter.searchQuery}
					onChange={(e) =>
						onFilterChange({
							...filter,
							searchQuery: e.target.value,
						})
					}
				/>
			</div>
		</div>
	);
}
