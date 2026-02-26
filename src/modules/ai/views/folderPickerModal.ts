import { App, FuzzySuggestModal, TFolder, TFile } from "obsidian";
import type { KnowledgeService } from "../services/knowledgeService";

export class FolderPickerModal extends FuzzySuggestModal<TFolder> {
    private excludePaths: Set<string>;
    private onChoose: (folder: TFolder) => void;
    private knowledgeService: KnowledgeService;

    constructor(
        app: App,
        knowledgeService: KnowledgeService,
        excludePaths: string[],
        onChoose: (folder: TFolder) => void
    ) {
        super(app);
        this.knowledgeService = knowledgeService;
        this.excludePaths = new Set(excludePaths);
        this.onChoose = onChoose;
        this.setPlaceholder("Search folders...");
    }

    getItems(): TFolder[] {
        return this.knowledgeService
            .getAllFolders()
            .filter((f) => !this.excludePaths.has(f.path))
            .sort((a, b) => a.path.localeCompare(b.path));
    }

    getItemText(folder: TFolder): string {
        const fileCount = folder.children.filter(
            (c) => c instanceof TFile && c.extension === "md"
        ).length;
        return `📁 ${folder.path} (${fileCount} files)`;
    }

    onChooseItem(folder: TFolder): void {
        this.onChoose(folder);
    }
}
