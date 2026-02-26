import { Plugin, TFile } from "obsidian";
import { ChatView, CHAT_VIEW_TYPE } from "./views/chatView";
import { GeminiService } from "./services/geminiService";
import { ChatService } from "./services/chatService";
import { FileOperationService } from "./services/fileOperationService";
import { KnowledgeService } from "./services/knowledgeService";
import { createGhostTextExtension } from "./completion/ghostText";
import { CompletionProvider } from "./completion/completionProvider";
import type { ForgeAISettings } from "./settings/settings";
import type { ForgeModule } from "../../types/module";

export class AIModule implements ForgeModule {
	private plugin!: Plugin;
	settings!: ForgeAISettings;
	private geminiService: GeminiService | null = null;
	private chatService!: ChatService;
	private fileOperationService!: FileOperationService;
	private knowledgeService!: KnowledgeService;
	private completionProvider!: CompletionProvider;
	private ghostTextHandle!: ReturnType<typeof createGhostTextExtension>;

	private static readonly PROMPT_FILENAME = "__prompt__.md";
	private promptFiles: Map<string, string> = new Map();
	private promptContextDirs: Set<string> = new Set();

	async onload(plugin: Plugin, settings: ForgeAISettings): Promise<void> {
		this.plugin = plugin;
		this.settings = settings;

		this.initGeminiService();
		await this.loadAllPromptFiles();
		this.watchPromptFiles();
		this.initChatService();
		this.fileOperationService = new FileOperationService(
			plugin.app.vault
		);
		this.knowledgeService = new KnowledgeService(plugin.app.vault);

		// Register ghost text inline completion
		this.completionProvider = new CompletionProvider();
		this.completionProvider.setGeminiService(this.geminiService);
		this.ghostTextHandle = createGhostTextExtension(
			this.completionProvider,
			{
				enabled: this.settings.enableInlineCompletion,
				debounceMs: this.settings.completionDebounceMs,
				streaming: this.settings.completionStreaming,
			}
		);
		plugin.registerEditorExtension(this.ghostTextHandle.extension);

		plugin.registerView(CHAT_VIEW_TYPE, (leaf) => {
			const view = new ChatView(leaf);
			view.setGeminiService(this.geminiService);
			view.setSavePath(this.settings.defaultSavePath);
			view.setChatService(this.chatService);
			view.setFileOperationService(this.fileOperationService);
			view.setConfirmFileOperations(
				this.settings.confirmFileOperations
			);
			view.setKnowledgeService(this.knowledgeService);
			view.setMaxKnowledgeFiles(this.settings.maxKnowledgeFiles);
			view.setAgentMode(this.settings.agentMode);
			view.setMaxOperationsPerMessage(
				this.settings.maxOperationsPerMessage
			);
			view.setOnPromptContextChange((filePaths, folderPaths) => {
				this.updatePromptContextDirs(filePaths, folderPaths);
			});
			return view;
		});

		plugin.addRibbonIcon("sparkles", "Open ForgeAI", () => {
			this.activateChatView();
		});

		plugin.addCommand({
			id: "open-ai-chat",
			name: "Open ForgeAI",
			callback: () => {
				this.activateChatView();
			},
		});
	}

	async onunload(): Promise<void> {
		this.plugin.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
	}

	onSettingsChange(): void {
		this.initGeminiService();
		this.updateVaultPrompt();
		this.updateChatViews();
		this.completionProvider.setGeminiService(this.geminiService);
		this.ghostTextHandle.updateConfig({
			enabled: this.settings.enableInlineCompletion,
			debounceMs: this.settings.completionDebounceMs,
			streaming: this.settings.completionStreaming,
		});
	}

	private initChatService(): void {
		this.chatService = new ChatService(
			this.settings.chatSessions,
			this.settings.activeSessionId,
			(sessions, activeId) => {
				this.settings.chatSessions = sessions;
				this.settings.activeSessionId = activeId;
				this.plugin.saveData(
					(this.plugin as any).settings // parent settings object
				);
			}
		);
	}

	private initGeminiService(): void {
		if (this.settings.apiKey) {
			this.geminiService = new GeminiService(
				this.settings.apiKey,
				this.settings.model,
				this.settings.systemPrompt
			);
			this.geminiService.setWebSearchEnabled(
				this.settings.enableWebSearch
			);
		} else {
			this.geminiService = null;
		}
	}

	private updateChatViews(): void {
		for (const leaf of this.plugin.app.workspace.getLeavesOfType(
			CHAT_VIEW_TYPE
		)) {
			const view = leaf.view as ChatView;
			view.setGeminiService(this.geminiService);
			view.setSavePath(this.settings.defaultSavePath);
			view.setChatService(this.chatService);
			view.setFileOperationService(this.fileOperationService);
			view.setConfirmFileOperations(
				this.settings.confirmFileOperations
			);
			view.setKnowledgeService(this.knowledgeService);
			view.setMaxKnowledgeFiles(this.settings.maxKnowledgeFiles);
			view.setAgentMode(this.settings.agentMode);
			view.setMaxOperationsPerMessage(
				this.settings.maxOperationsPerMessage
			);
			view.setOnPromptContextChange((filePaths, folderPaths) => {
				this.updatePromptContextDirs(filePaths, folderPaths);
			});
		}
	}

	private async loadAllPromptFiles(): Promise<void> {
		this.promptFiles.clear();
		for (const file of this.plugin.app.vault.getFiles()) {
			if (file.name === AIModule.PROMPT_FILENAME) {
				const content = await this.plugin.app.vault.read(file);
				this.promptFiles.set(file.path, content.trim());
			}
		}
		this.updateVaultPrompt();
	}

	private updateVaultPrompt(): void {
		const applicable: Array<{ depth: number; content: string }> = [];

		for (const [path, content] of this.promptFiles) {
			const promptDir = path.includes("/")
				? path.substring(0, path.lastIndexOf("/"))
				: "";

			if (promptDir === "") {
				applicable.push({ depth: 0, content });
				continue;
			}

			if (this.promptContextDirs.has(promptDir)) {
				const depth = promptDir.split("/").length;
				applicable.push({ depth, content });
			}
		}

		applicable.sort((a, b) => a.depth - b.depth);
		const combined = applicable.map((p) => p.content).join("\n\n");
		this.geminiService?.setVaultPrompt(combined);
	}

	private isPromptFile(path: string): boolean {
		return (
			path === AIModule.PROMPT_FILENAME ||
			path.endsWith("/" + AIModule.PROMPT_FILENAME)
		);
	}

	private watchPromptFiles(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("modify", async (file) => {
				if (
					this.isPromptFile(file.path) &&
					file instanceof TFile
				) {
					const content =
						await this.plugin.app.vault.read(file);
					this.promptFiles.set(file.path, content.trim());
					this.updateVaultPrompt();
				}
			})
		);
		this.plugin.registerEvent(
			this.plugin.app.vault.on("create", async (file) => {
				if (
					this.isPromptFile(file.path) &&
					file instanceof TFile
				) {
					const content =
						await this.plugin.app.vault.read(file);
					this.promptFiles.set(file.path, content.trim());
					this.updateVaultPrompt();
				}
			})
		);
		this.plugin.registerEvent(
			this.plugin.app.vault.on("delete", (file) => {
				if (this.isPromptFile(file.path)) {
					this.promptFiles.delete(file.path);
					this.updateVaultPrompt();
				}
			})
		);
		this.plugin.registerEvent(
			this.plugin.app.vault.on("rename", async (file, oldPath) => {
				if (this.isPromptFile(oldPath)) {
					this.promptFiles.delete(oldPath);
				}
				if (
					this.isPromptFile(file.path) &&
					file instanceof TFile
				) {
					const content =
						await this.plugin.app.vault.read(file);
					this.promptFiles.set(file.path, content.trim());
				}
				if (
					this.isPromptFile(oldPath) ||
					this.isPromptFile(file.path)
				) {
					this.updateVaultPrompt();
				}
			})
		);
	}

	private updatePromptContextDirs(
		filePaths: string[],
		folderPaths: string[]
	): void {
		this.promptContextDirs.clear();
		for (const filePath of filePaths) {
			const dir = filePath.includes("/")
				? filePath.substring(0, filePath.lastIndexOf("/"))
				: "";
			if (dir) this.promptContextDirs.add(dir);
		}
		for (const folderPath of folderPaths) {
			if (folderPath) this.promptContextDirs.add(folderPath);
		}
		this.updateVaultPrompt();
	}

	private async activateChatView(): Promise<void> {
		const { workspace } = this.plugin.app;

		const existing = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
		if (existing.length > 0) {
			workspace.revealLeaf(existing[0]);
			return;
		}

		const leaf = workspace.getLeaf("tab");
		await leaf.setViewState({
			type: CHAT_VIEW_TYPE,
			active: true,
		});
		workspace.revealLeaf(leaf);
	}
}
