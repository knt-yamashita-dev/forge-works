import { App, FuzzySuggestModal, TFile } from "obsidian";

export class FilePickerModal extends FuzzySuggestModal<TFile> {
	private excludePaths: Set<string>;
	private onChoose: (file: TFile) => void;

	constructor(
		app: App,
		excludePaths: string[],
		onChoose: (file: TFile) => void
	) {
		super(app);
		this.excludePaths = new Set(excludePaths);
		this.onChoose = onChoose;
		this.setPlaceholder("Search knowledge files...");
	}

	getItems(): TFile[] {
		return this.app.vault
			.getMarkdownFiles()
			.filter((f) => !this.excludePaths.has(f.path))
			.sort((a, b) => b.stat.mtime - a.stat.mtime);
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.onChoose(file);
	}
}
