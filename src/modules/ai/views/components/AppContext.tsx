import * as React from "react";
import type { App } from "obsidian";
import type { GeminiService } from "../../services/geminiService";
import type { ChatService } from "../../services/chatService";
import type { FileOperationService } from "../../services/fileOperationService";
import type { KnowledgeService } from "../../services/knowledgeService";
import type { ChatMessage } from "../../types/chat";
import type { AgentModeSettings } from "../../types/agent";

interface AppContextValue {
	app: App | null;
	geminiService: GeminiService | null;
	chatService: ChatService | null;
	fileOperationService: FileOperationService | null;
	knowledgeService: KnowledgeService | null;
	savePath: string;
	confirmFileOperations: boolean;
	maxKnowledgeFiles: number;
	agentMode: AgentModeSettings;
	maxOperationsPerMessage: number;
	onSaveChat?: (messages: ChatMessage[]) => void;
	onPickFile?: (
		excludePaths: string[],
		callback: (path: string) => void
	) => void;
	onPromptContextChange?: (
		filePaths: string[],
		folderPaths: string[]
	) => void;
}

export const AppContext = React.createContext<AppContextValue>({
	app: null,
	geminiService: null,
	chatService: null,
	fileOperationService: null,
	knowledgeService: null,
	savePath: "AI Chats",
	confirmFileOperations: true,
	maxKnowledgeFiles: 5,
	agentMode: {
		enabled: false,
		maxSteps: 10,
		autoApprove: true,
		pauseOnError: true,
		contextWindowSteps: 3,
	},
	maxOperationsPerMessage: 10,
});

export function useAppContext(): AppContextValue {
	return React.useContext(AppContext);
}

