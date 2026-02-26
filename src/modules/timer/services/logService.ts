import type { Vault } from "obsidian";
import type { PomodoroLogEntry } from "../types/pomodoro";
import type { PomodoroSettings } from "../settings/settings";

export class LogService {
	private vault: Vault;
	private settings: PomodoroSettings;

	constructor(vault: Vault, settings: PomodoroSettings) {
		this.vault = vault;
		this.settings = settings;
	}

	async logSession(entry: PomodoroLogEntry): Promise<void> {
		if (this.settings.logToDailyNote) {
			await this.appendToDailyNote(entry);
		} else {
			await this.appendToLogFile(entry);
		}
	}

	updateSettings(settings: PomodoroSettings): void {
		this.settings = settings;
	}

	private async appendToLogFile(entry: PomodoroLogEntry): Promise<void> {
		const path = this.settings.logFilePath;
		const line = this.formatEntry(entry);

		const file = this.vault.getAbstractFileByPath(path);
		if (file) {
			const content = await this.vault.read(file as any);
			const newContent = this.appendEntryToContent(content, line);
			await this.vault.modify(file as any, newContent);
		} else {
			// Create file with header
			await this.ensureParentDir(path);
			const content = this.createNewLogContent(line);
			await this.vault.create(path, content);
		}
	}

	private async appendToDailyNote(entry: PomodoroLogEntry): Promise<void> {
		// Find daily note by date (YYYY-MM-DD.md in root)
		const dailyPath = `${entry.date}.md`;
		const file = this.vault.getAbstractFileByPath(dailyPath);
		const line = this.formatEntry(entry);

		if (file) {
			const content = await this.vault.read(file as any);
			const heading = this.settings.dailyNoteHeading;
			const headingIndex = content.indexOf(heading);

			if (headingIndex >= 0) {
				// Find the end of the heading section (next heading or EOF)
				const afterHeading = headingIndex + heading.length;
				const nextHeadingMatch = content
					.slice(afterHeading)
					.match(/\n##? /);
				const insertPos = nextHeadingMatch
					? afterHeading + nextHeadingMatch.index!
					: content.length;

				const before = content.slice(0, insertPos);
				const after = content.slice(insertPos);
				const newContent = before.trimEnd() + "\n" + line + "\n" + after;
				await this.vault.modify(file as any, newContent);
			} else {
				// Append heading + entry to end
				const newContent =
					content.trimEnd() +
					"\n\n" +
					heading +
					"\n\n" +
					this.createSectionContent(line) +
					"\n";
				await this.vault.modify(file as any, newContent);
			}
		}
		// If daily note doesn't exist, skip (don't create daily notes)
	}

	private formatEntry(entry: PomodoroLogEntry): string {
		const note = entry.note || "";
		if (this.settings.logFormat === "table") {
			return `| ${entry.date} | ${entry.startTime} | ${entry.endTime} | ${entry.duration} min | ${entry.task} | ${entry.sessionNumber} | ${note} |`;
		}
		let line = `- **${entry.date} ${entry.startTime}-${entry.endTime}** (${entry.duration} min) - ${entry.task} [${entry.sessionNumber}]`;
		if (note) {
			line += `\n  ${note}`;
		}
		return line;
	}

	private createNewLogContent(firstLine: string): string {
		if (this.settings.logFormat === "table") {
			return (
				"# Pomodoro Log\n\n" +
				"| Date | Start | End | Duration | Task | Session | Note |\n" +
				"|------|-------|-----|----------|------|---------|------|\n" +
				firstLine +
				"\n"
			);
		}
		return "# Pomodoro Log\n\n" + firstLine + "\n";
	}

	private createSectionContent(firstLine: string): string {
		if (this.settings.logFormat === "table") {
			return (
				"| Date | Start | End | Duration | Task | Session | Note |\n" +
				"|------|-------|-----|----------|------|---------|------|\n" +
				firstLine
			);
		}
		return firstLine;
	}

	private appendEntryToContent(
		content: string,
		line: string
	): string {
		return content.trimEnd() + "\n" + line + "\n";
	}

	private async ensureParentDir(path: string): Promise<void> {
		const parts = path.split("/");
		if (parts.length <= 1) return;

		const dirPath = parts.slice(0, -1).join("/");
		const dir = this.vault.getAbstractFileByPath(dirPath);
		if (!dir) {
			await this.vault.createFolder(dirPath);
		}
	}
}
