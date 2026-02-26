import { Vault, TFile, TFolder, Notice } from "obsidian";
import type { FileOperationRequest } from "../types/fileOperation";
import { validatePath } from "../utils/commandParser";

export class FileOperationService {
	private vault: Vault;

	constructor(vault: Vault) {
		this.vault = vault;
	}

	async execute(operation: FileOperationRequest): Promise<void> {
		if (!validatePath(operation.targetPath)) {
			throw new Error(`Invalid path: ${operation.targetPath}`);
		}

		switch (operation.type) {
			case "create":
				await this.createFile(
					operation.targetPath,
					operation.content
				);
				break;
			case "edit":
				await this.editFile(operation.targetPath, operation.content);
				break;
			case "append":
				await this.appendToFile(
					operation.targetPath,
					operation.content
				);
				break;
			default:
				throw new Error(`Unknown operation type: ${operation.type}`);
		}
	}

	private async createFile(path: string, content: string): Promise<void> {
		const dir = path.substring(0, path.lastIndexOf("/"));
		if (dir) {
			await this.ensureFolder(dir);
		}

		const existing = this.vault.getAbstractFileByPath(path);
		if (existing) {
			throw new Error(`File already exists: ${path}`);
		}

		await this.vault.create(path, content);
		new Notice(`Created: ${path}`);
	}

	private async editFile(path: string, content: string): Promise<void> {
		const file = this.vault.getAbstractFileByPath(path);
		if (!file || !(file instanceof TFile)) {
			throw new Error(`File not found: ${path}`);
		}

		await this.vault.modify(file, content);
		new Notice(`Updated: ${path}`);
	}

	private async appendToFile(path: string, content: string): Promise<void> {
		const file = this.vault.getAbstractFileByPath(path);
		if (!file || !(file instanceof TFile)) {
			throw new Error(`File not found: ${path}`);
		}

		await this.vault.process(file, (existingContent) => {
			return existingContent + "\n" + content;
		});
		new Notice(`Appended to: ${path}`);
	}

	private async ensureFolder(path: string): Promise<void> {
		const folder = this.vault.getAbstractFileByPath(path);
		if (!folder) {
			await this.vault.createFolder(path);
		} else if (!(folder instanceof TFolder)) {
			throw new Error(`${path} exists but is not a folder`);
		}
	}
}
