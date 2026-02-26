import { Plugin } from "obsidian";
import type { Extension } from "@codemirror/state";
import type { ForgeUtilsSettings } from "./settings/settings";
import { createTimestampReplacer } from "./features/timestampReplacer";
import { createFocusModeExtension } from "./features/focusMode";
import type { ForgeModule } from "../../types/module";

export class UtilsModule implements ForgeModule {
	private plugin!: Plugin;
	settings!: ForgeUtilsSettings;
	private focusModeExtArray: Extension[] = [];

	async onload(
		plugin: Plugin,
		settings: ForgeUtilsSettings
	): Promise<void> {
		this.plugin = plugin;
		this.settings = settings;

		// Register CM6 extension for @now replacement
		plugin.registerEditorExtension(
			createTimestampReplacer(() => this.settings.dateFormat)
		);

		// Register Focus Mode extension (dynamic)
		plugin.registerEditorExtension(this.focusModeExtArray);
		this.applyFocusMode();

		// Register toggle command
		plugin.addCommand({
			id: "toggle-focus-mode",
			name: "Toggle Focus Mode",
			callback: () => {
				this.settings.focusModeEnabled =
					!this.settings.focusModeEnabled;
				(plugin as any).saveSettings();
			},
		});
	}

	async onunload(): Promise<void> {
		document.body.style.removeProperty(
			"--forge-utils-focus-dimmed-opacity"
		);
	}

	onSettingsChange(): void {
		this.applyFocusMode();
	}

	private applyFocusMode(): void {
		document.body.style.setProperty(
			"--forge-utils-focus-dimmed-opacity",
			String(this.settings.focusModeOpacity)
		);

		this.focusModeExtArray.length = 0;
		if (this.settings.focusModeEnabled) {
			this.focusModeExtArray.push(createFocusModeExtension());
		}
		this.plugin.app.workspace.updateOptions();
	}
}
