import type { Plugin } from "obsidian";

export interface ForgeModule {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onload(plugin: Plugin, settings: any): Promise<void>;
	onunload(): Promise<void>;
	onSettingsChange?(): void;
}
