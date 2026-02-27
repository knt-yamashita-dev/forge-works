import { Setting } from "obsidian";
import type { ForgeTasksSettings } from "./settings";
import {
	DEFAULT_STATUS_VALUES,
	getOrderedStatuses,
} from "../types/task";
import type { StatusDefinition, TaskPriority } from "../types/task";
import { t } from "../../../i18n";

export function renderTasksSettings(
	containerEl: HTMLElement,
	settings: ForgeTasksSettings,
	save: () => Promise<void>,
	redisplay: () => void
): void {
	new Setting(containerEl)
		.setName(t("tasks.folder.name"))
		.setDesc(t("tasks.folder.desc"))
		.addText((text) =>
			text
				.setPlaceholder("Tasks")
				.setValue(settings.taskFolder)
				.onChange(async (value) => {
					settings.taskFolder = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("tasks.templateFolder.name"))
		.setDesc(t("tasks.templateFolder.desc"))
		.addText((text) =>
			text
				.setPlaceholder("Tasks/Templates")
				.setValue(settings.templateFolder)
				.onChange(async (value) => {
					settings.templateFolder = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("tasks.priority.name"))
		.setDesc(t("tasks.priority.desc"))
		.addDropdown((dropdown) =>
			dropdown
				.addOption("low", t("tasks.priority.low"))
				.addOption("medium", t("tasks.priority.medium"))
				.addOption("high", t("tasks.priority.high"))
				.addOption("urgent", t("tasks.priority.urgent"))
				.setValue(settings.defaultPriority)
				.onChange(async (value) => {
					settings.defaultPriority = value as TaskPriority;
					await save();
				})
		);

	// Dynamic status dropdown
	const orderedStatuses = getOrderedStatuses(
		settings.customStatuses,
		settings.statusOrder
	);

	new Setting(containerEl)
		.setName(t("tasks.status.name"))
		.setDesc(t("tasks.status.desc"))
		.addDropdown((dropdown) => {
			for (const s of orderedStatuses) {
				dropdown.addOption(s.value, s.label);
			}
			dropdown
				.setValue(settings.defaultStatus)
				.onChange(async (value) => {
					settings.defaultStatus = value;
					await save();
				});
		});

	new Setting(containerEl)
		.setName(t("tasks.project.name"))
		.setDesc(t("tasks.project.desc"))
		.addText((text) =>
			text
				.setPlaceholder("Project name")
				.setValue(settings.defaultProject)
				.onChange(async (value) => {
					settings.defaultProject = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("tasks.tags.name"))
		.setDesc(t("tasks.tags.desc"))
		.addText((text) =>
			text
				.setPlaceholder("work, daily")
				.setValue(settings.defaultTags)
				.onChange(async (value) => {
					settings.defaultTags = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("tasks.showCompleted.name"))
		.setDesc(t("tasks.showCompleted.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.showCompletedTasks)
				.onChange(async (value) => {
					settings.showCompletedTasks = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("tasks.retention.name"))
		.setDesc(t("tasks.retention.desc"))
		.addSlider((slider) =>
			slider
				.setLimits(0, 90, 1)
				.setValue(settings.completedTaskRetentionDays)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.completedTaskRetentionDays = value;
					await save();
				})
		);

	// --- Custom Statuses Section ---
	containerEl.createEl("h3", {
		text: t("tasks.customStatuses.heading"),
	});
	renderStatusList(containerEl, settings, save, redisplay);

	// --- Kanban Visible Statuses ---
	containerEl.createEl("h3", { text: t("tasks.kanban.heading") });
	containerEl.createEl("p", {
		text: t("tasks.kanban.desc"),
		cls: "setting-item-description",
	});
	renderKanbanVisibleStatuses(containerEl, settings, save);
}

function renderStatusList(
	containerEl: HTMLElement,
	settings: ForgeTasksSettings,
	save: () => Promise<void>,
	redisplay: () => void
): void {
	const statusListEl = containerEl.createDiv({ cls: "vt-status-list" });
	const orderedStatuses = getOrderedStatuses(
		settings.customStatuses,
		settings.statusOrder
	);

	for (let i = 0; i < orderedStatuses.length; i++) {
		const s = orderedStatuses[i];
		const isDefault = DEFAULT_STATUS_VALUES.includes(s.value);
		const setting = new Setting(statusListEl)
			.setName(`${s.icon} ${s.label}`)
			.setDesc(
				isDefault
					? `${s.value} ${t("tasks.customStatuses.builtIn")}`
					: s.value
			);

		if (i > 0) {
			setting.addExtraButton((btn) =>
				btn
					.setIcon("arrow-up")
					.setTooltip(t("tasks.customStatuses.moveUp"))
					.onClick(async () => {
						const order = [...settings.statusOrder];
						const idx = order.indexOf(s.value);
						if (idx > 0) {
							[order[idx - 1], order[idx]] = [
								order[idx],
								order[idx - 1],
							];
							settings.statusOrder = order;
							await save();
							redisplay();
						}
					})
			);
		}

		if (i < orderedStatuses.length - 1) {
			setting.addExtraButton((btn) =>
				btn
					.setIcon("arrow-down")
					.setTooltip(t("tasks.customStatuses.moveDown"))
					.onClick(async () => {
						const order = [...settings.statusOrder];
						const idx = order.indexOf(s.value);
						if (idx >= 0 && idx < order.length - 1) {
							[order[idx], order[idx + 1]] = [
								order[idx + 1],
								order[idx],
							];
							settings.statusOrder = order;
							await save();
							redisplay();
						}
					})
			);
		}

		if (!isDefault) {
			setting.addExtraButton((btn) =>
				btn
					.setIcon("trash")
					.setTooltip(t("tasks.customStatuses.remove"))
					.onClick(async () => {
						settings.customStatuses =
							settings.customStatuses.filter(
								(cs) => cs.value !== s.value
							);
						settings.statusOrder =
							settings.statusOrder.filter(
								(v) => v !== s.value
							);
						settings.kanbanVisibleStatuses =
							settings.kanbanVisibleStatuses.filter(
								(v) => v !== s.value
							);
						await save();
						redisplay();
					})
			);
		}
	}

	// Add new status form
	let newValue = "";
	let newLabel = "";
	let newIcon = "\u25a1";

	new Setting(statusListEl)
		.setName(t("tasks.customStatuses.add"))
		.addText((text) =>
			text.setPlaceholder("value (kebab-case)").onChange((v) => {
				newValue = v;
			})
		)
		.addText((text) =>
			text.setPlaceholder("Label").onChange((v) => {
				newLabel = v;
			})
		)
		.addText((text) =>
			text
				.setPlaceholder("Icon")
				.setValue(newIcon)
				.onChange((v) => {
					newIcon = v;
				})
		)
		.addButton((btn) =>
			btn
				.setButtonText(t("tasks.customStatuses.addBtn"))
				.setCta()
				.onClick(async () => {
					const value = newValue
						.trim()
						.toLowerCase()
						.replace(/\s+/g, "-");
					const label = newLabel.trim();
					const icon = newIcon.trim() || "\u25a1";

					if (!value || !label) return;

					const allValues = settings.statusOrder;
					if (allValues.includes(value)) return;

					if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) return;

					const newStatus: StatusDefinition = {
						value,
						label,
						icon,
					};
					settings.customStatuses = [
						...settings.customStatuses,
						newStatus,
					];
					const order = [...settings.statusOrder];
					order.splice(order.length - 1, 0, value);
					settings.statusOrder = order;
					settings.kanbanVisibleStatuses = [
						...settings.kanbanVisibleStatuses,
						value,
					];
					await save();
					redisplay();
				})
		);
}

function renderKanbanVisibleStatuses(
	containerEl: HTMLElement,
	settings: ForgeTasksSettings,
	save: () => Promise<void>
): void {
	const orderedStatuses = getOrderedStatuses(
		settings.customStatuses,
		settings.statusOrder
	);

	for (const s of orderedStatuses) {
		const isVisible = settings.kanbanVisibleStatuses.includes(
			s.value
		);

		new Setting(containerEl)
			.setName(`${s.icon} ${s.label}`)
			.addToggle((toggle) =>
				toggle.setValue(isVisible).onChange(async (value) => {
					if (value) {
						settings.kanbanVisibleStatuses = [
							...settings.kanbanVisibleStatuses,
							s.value,
						];
					} else {
						if (
							settings.kanbanVisibleStatuses.length <= 1
						) {
							toggle.setValue(true);
							return;
						}
						settings.kanbanVisibleStatuses =
							settings.kanbanVisibleStatuses.filter(
								(v) => v !== s.value
							);
					}
					await save();
				})
			);
	}
}
