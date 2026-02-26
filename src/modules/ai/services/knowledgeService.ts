import { Vault, TFile, TFolder } from "obsidian";
import type { FolderScope } from "../types/chat";

export class KnowledgeService {
	private vault: Vault;

	constructor(vault: Vault) {
		this.vault = vault;
	}

	getMarkdownFiles(): TFile[] {
		return this.vault
			.getMarkdownFiles()
			.sort((a, b) => b.stat.mtime - a.stat.mtime);
	}

	async buildContext(filePaths: string[]): Promise<string> {
		if (filePaths.length === 0) return "";

		const sections: string[] = [];

		for (const path of filePaths) {
			const file = this.vault.getAbstractFileByPath(path);
			if (!file || !(file instanceof TFile)) {
				continue;
			}
			const content = await this.vault.read(file);
			sections.push(
				`--- Reference: ${path} ---\n${content}\n--- End: ${path} ---`
			);
		}

		if (sections.length === 0) return "";

		return (
			"The following files from the user's vault are provided as reference context. " +
			"Use them to inform your responses when relevant.\n\n" +
			sections.join("\n\n")
		);
	}

	filterExistingPaths(paths: string[]): string[] {
		return paths.filter((p) => {
			const file = this.vault.getAbstractFileByPath(p);
			return file instanceof TFile;
		});
	}

	// フォルダ内のMarkdownファイルを取得
	getFilesInFolder(
		folderPath: string,
		recursive: boolean = true,
		maxFiles: number = 50,
		maxFileSizeKB: number = 100
	): TFile[] {
		const folder = this.vault.getAbstractFileByPath(folderPath);
		if (!folder || !(folder instanceof TFolder)) {
			return [];
		}

		const files: TFile[] = [];
		const maxSizeBytes = maxFileSizeKB * 1024;

		const collectFiles = (currentFolder: TFolder) => {
			for (const child of currentFolder.children) {
				if (files.length >= maxFiles) break;

				if (child instanceof TFile && child.extension === "md") {
					// ファイルサイズチェック
					if (child.stat.size <= maxSizeBytes) {
						files.push(child);
					}
				} else if (recursive && child instanceof TFolder) {
					collectFiles(child);
				}
			}
		};

		collectFiles(folder);
		return files.sort((a, b) => b.stat.mtime - a.stat.mtime);
	}

	// フォルダスコープからコンテキストを構築
	async buildScopeContext(
		scopes: FolderScope[],
		maxFiles: number,
		maxFileSizeKB: number
	): Promise<string> {
		if (scopes.length === 0) return "";

		const allFiles: TFile[] = [];
		const scopeSections: string[] = [];

		for (const scope of scopes) {
			const files = this.getFilesInFolder(
				scope.path,
				scope.recursive,
				maxFiles,
				maxFileSizeKB
			);

			scopeSections.push(
				`--- Folder Scope: ${scope.path} (${files.length} files) ---`
			);

			allFiles.push(...files);
		}

		// 重複ファイルを除外
		const uniqueFiles = Array.from(
			new Map(allFiles.map((f) => [f.path, f])).values()
		).slice(0, maxFiles);

		const fileSections: string[] = [];
		for (const file of uniqueFiles) {
			const content = await this.vault.read(file);
			fileSections.push(
				`--- File: ${file.path} ---\n${content}\n--- End: ${file.path} ---`
			);
		}

		if (fileSections.length === 0) return "";

		return (
			"The following folder scopes are active for this conversation:\n" +
			scopeSections.join("\n") +
			"\n\nFiles from these scopes:\n\n" +
			fileSections.join("\n\n")
		);
	}

	// 統合コンテキスト構築（個別ファイル + フォルダスコープ）
	async buildCombinedContext(
		filePaths: string[],
		scopes: FolderScope[],
		maxFiles: number,
		maxFileSizeKB: number
	): Promise<string> {
		const fileContext = await this.buildContext(filePaths);
		const scopeContext = await this.buildScopeContext(
			scopes,
			maxFiles,
			maxFileSizeKB
		);

		if (!fileContext && !scopeContext) return "";
		if (!fileContext) return scopeContext;
		if (!scopeContext) return fileContext;

		return `${scopeContext}\n\n${fileContext}`;
	}

	// Vault内の全フォルダを取得
	getAllFolders(): TFolder[] {
		const folders: TFolder[] = [];

		const collectFolders = (folder: TFolder) => {
			folders.push(folder);
			for (const child of folder.children) {
				if (child instanceof TFolder) {
					collectFolders(child);
				}
			}
		};

		const root = this.vault.getRoot();
		collectFolders(root);

		return folders.filter((f) => f.path !== "/");
	}

	// フォルダスコープの検証（削除されたフォルダを除外）
	filterExistingScopes(scopes: FolderScope[]): FolderScope[] {
		return scopes.filter((scope) => {
			const folder = this.vault.getAbstractFileByPath(scope.path);
			return folder instanceof TFolder;
		});
	}
}
