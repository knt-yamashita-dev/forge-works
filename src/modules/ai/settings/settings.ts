import type { ChatSession } from "../types/chat";
import type { AgentModeSettings } from "../types/agent";

export interface ForgeAISettings {
	apiKey: string;
	model: string;
	systemPrompt: string;
	defaultSavePath: string;
	chatSessions: ChatSession[];
	activeSessionId: string | null;
	confirmFileOperations: boolean;
	maxKnowledgeFiles: number;
	enableWebSearch: boolean;
	enableInlineCompletion: boolean;
	completionDebounceMs: number;
	completionStreaming: boolean;
	agentMode: AgentModeSettings;
	maxOperationsPerMessage: number;
	// Folder scope settings
	maxFolderScopes: number;
	maxScopeFiles: number;
	recursiveFolderScope: boolean;
	maxFileSizeKB: number;
}

export const DEFAULT_SETTINGS: ForgeAISettings = {
	apiKey: "",
	model: "gemini-2.0-flash",
	systemPrompt:
		"You are a helpful AI assistant integrated into Obsidian. " +
		"Answer concisely and use Markdown formatting when appropriate.",
	defaultSavePath: "AI Chats",
	chatSessions: [],
	activeSessionId: null,
	confirmFileOperations: true,
	maxKnowledgeFiles: 5,
	enableWebSearch: false,
	enableInlineCompletion: true,
	completionDebounceMs: 500,
	completionStreaming: true,
	agentMode: {
		enabled: false,
		maxSteps: 10,
		autoApprove: true,
		pauseOnError: true,
		contextWindowSteps: 3,
	},
	maxOperationsPerMessage: 10,
	// Folder scope defaults
	maxFolderScopes: 3,
	maxScopeFiles: 50,
	recursiveFolderScope: true,
	maxFileSizeKB: 100,
};
