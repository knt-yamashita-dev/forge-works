import { Setting } from "obsidian";
import type { ForgeUtilsSettings } from "./settings";
import { formatDate } from "../utils/dateFormatter";
import { t } from "../../../i18n";

export function renderUtilsSettings(
	containerEl: HTMLElement,
	settings: ForgeUtilsSettings,
	save: () => Promise<void>
): void {
	const previewEl = containerEl.createEl("p", {
		cls: "setting-item-description",
	});
	const updatePreview = () => {
		previewEl.textContent = `${t("utils.dateFormat.preview")}: ${formatDate(settings.dateFormat)}`;
	};

	new Setting(containerEl)
		.setName(t("utils.dateFormat.name"))
		.setDesc(t("utils.dateFormat.desc"))
		.addText((text) =>
			text
				.setPlaceholder("YYYY-MM-DD HH:mm")
				.setValue(settings.dateFormat)
				.onChange(async (value) => {
					settings.dateFormat = value;
					await save();
					updatePreview();
				})
		);

	updatePreview();

	// --- Focus Mode ---
	containerEl.createEl("h3", { text: t("utils.focusMode.heading") });

	new Setting(containerEl)
		.setName(t("utils.focusMode.enable.name"))
		.setDesc(t("utils.focusMode.enable.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.focusModeEnabled)
				.onChange(async (value) => {
					settings.focusModeEnabled = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("utils.focusMode.opacity.name"))
		.setDesc(t("utils.focusMode.opacity.desc"))
		.addSlider((slider) =>
			slider
				.setLimits(0.05, 1.0, 0.05)
				.setValue(settings.focusModeOpacity)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.focusModeOpacity = value;
					await save();
				})
		);

	// --- Floating TOC ---
	containerEl.createEl("h3", {
		text: t("utils.floatingToc.heading"),
	});

	new Setting(containerEl)
		.setName(t("utils.floatingToc.enable.name"))
		.setDesc(t("utils.floatingToc.enable.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(settings.floatingTocEnabled)
				.onChange(async (value) => {
					settings.floatingTocEnabled = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName(t("utils.floatingToc.fadeDelay.name"))
		.setDesc(t("utils.floatingToc.fadeDelay.desc"))
		.addSlider((slider) =>
			slider
				.setLimits(1, 10, 1)
				.setValue(settings.floatingTocFadeDelay)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settings.floatingTocFadeDelay = value;
					await save();
				})
		);
}
