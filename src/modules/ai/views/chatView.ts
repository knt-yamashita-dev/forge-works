import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { AppContext } from "./components/AppContext";
import { ChatContainer } from "./components/ChatContainer";
import { SaveChatModal } from "./saveChatModal";
import { FilePickerModal } from "./filePickerModal";
import type { GeminiService } from "../services/geminiService";
import type { ChatService } from "../services/chatService";
import type { FileOperationService } from "../services/fileOperationService";
import type { KnowledgeService } from "../services/knowledgeService";
import type { ChatMessage } from "../types/chat";
import type { AgentModeSettings } from "../types/agent";

export const CHAT_VIEW_TYPE = "ai-chat-view";

export class ChatView extends ItemView {
	private root: Root | null = null;
	private geminiService: GeminiService | null = null;
	private chatService: ChatService | null = null;
	private fileOperationService: FileOperationService | null = null;
	private knowledgeService: KnowledgeService | null = null;
	private confirmFileOperations = true;
	private maxKnowledgeFiles = 5;
	private savePath = "AI Chats";
	private agentMode: AgentModeSettings = {
		enabled: false,
		maxSteps: 10,
		autoApprove: true,
		pauseOnError: true,
		contextWindowSteps: 3,
	};
	private maxOperationsPerMessage = 10;
	private onPromptContextChange:
		| ((filePaths: string[], folderPaths: string[]) => void)
		| null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return CHAT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "ForgeAI";
	}

	getIcon(): string {
		return "sparkles";
	}

	setGeminiService(service: GeminiService | null): void {
		this.geminiService = service;
		this.renderReact();
	}

	setSavePath(path: string): void {
		this.savePath = path;
		this.renderReact();
	}

	setChatService(service: ChatService): void {
		this.chatService = service;
		this.renderReact();
	}

	setFileOperationService(service: FileOperationService): void {
		this.fileOperationService = service;
		this.renderReact();
	}

	setConfirmFileOperations(confirm: boolean): void {
		this.confirmFileOperations = confirm;
		this.renderReact();
	}

	setKnowledgeService(service: KnowledgeService): void {
		this.knowledgeService = service;
		this.renderReact();
	}

	setMaxKnowledgeFiles(max: number): void {
		this.maxKnowledgeFiles = max;
		this.renderReact();
	}

	setAgentMode(mode: AgentModeSettings): void {
		this.agentMode = mode;
		this.renderReact();
	}

	setMaxOperationsPerMessage(max: number): void {
		this.maxOperationsPerMessage = max;
		this.renderReact();
	}

	setOnPromptContextChange(
		callback: (filePaths: string[], folderPaths: string[]) => void
	): void {
		this.onPromptContextChange = callback;
		this.renderReact();
	}

	async onOpen(): Promise<void> {
		this.root = createRoot(this.contentEl);
		this.renderReact();
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
		this.root = null;
	}

	private handleSaveChat = (messages: ChatMessage[]): void => {
		new SaveChatModal(
			this.app,
			messages,
			this.geminiService,
			this.savePath
		).open();
	};

	private handlePickFile = (
		excludePaths: string[],
		callback: (path: string) => void
	): void => {
		new FilePickerModal(this.app, excludePaths, (file) => {
			callback(file.path);
		}).open();
	};

	private handlePromptContextChange = (
		filePaths: string[],
		folderPaths: string[]
	): void => {
		this.onPromptContextChange?.(filePaths, folderPaths);
	};

	private renderReact(): void {
		if (!this.root) return;

		this.root.render(
			React.createElement(
				AppContext.Provider,
				{
					value: {
						app: this.app,
						geminiService: this.geminiService,
						chatService: this.chatService,
						fileOperationService: this.fileOperationService,
						knowledgeService: this.knowledgeService,
						savePath: this.savePath,
						confirmFileOperations: this.confirmFileOperations,
						maxKnowledgeFiles: this.maxKnowledgeFiles,
						agentMode: this.agentMode,
						maxOperationsPerMessage: this.maxOperationsPerMessage,
						onSaveChat: this.handleSaveChat,
						onPickFile: this.handlePickFile,
						onPromptContextChange: this.handlePromptContextChange,
					},
				},
				React.createElement(ChatContainer)
			)
		);
	}
}
