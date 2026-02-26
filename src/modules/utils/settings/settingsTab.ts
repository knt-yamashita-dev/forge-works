import { Setting } from "obsidian";
import type { ForgeUtilsSettings } from "./settings";
import { formatDate } from "../utils/dateFormatter";

export function renderUtilsSettings(
	containerEl: HTMLElement,
	settings: ForgeUtilsSettings,
	save: () => Promise<void>
): void {
	const previewEl = containerEl.createEl("p", {
		cls: "setting-item-description",
	});
	const updatePreview = () => {
		previewEl.textContent = `Preview: ${formatDate(settings.dateFormat)}`;
	};

	new Setting(containerEl)
		.setName("Date format")
		.setDesc(
			"Format for @now replacement. Tokens: YYYY, MM, DD, HH, mm, ss"
		)
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
	containerEl.createEl("h3", { text: "Focus Mode" });

	new Setting(containerEl)
		.setName("Enable Focus Mode")
		.setDesc(
			"Dim all paragraphs except the one your cursor is in. Can also be toggled via command palette."
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settings.focusModeEnabled)
				.onChange(async (value) => {
					settings.focusModeEnabled = value;
					await save();
				})
		);

	new Setting(containerEl)
		.setName("Dimmed text opacity")
		.setDesc(
			"Opacity for non-focused paragraphs (0.0 = invisible, 1.0 = fully visible)"
		)
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
}
