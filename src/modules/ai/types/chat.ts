import type { FileOperationRequest } from "./fileOperation";
import type { AgentTask } from "./agent";

export interface SearchSource {
	title: string;
	uri: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
	isStreaming?: boolean;
	fileOperations?: FileOperationRequest[];
	searchSources?: SearchSource[];
}

export interface FolderScope {
	path: string; // フォルダパス
	recursive: boolean; // 再帰的に読み込むか
	fileCount: number; // 含まれるファイル数（表示用）
	addedAt: number; // 追加日時
}

export interface ChatSession {
	id: string;
	title: string;
	messages: ChatMessage[];
	knowledgeFiles?: string[]; // 個別ファイル
	folderScopes?: FolderScope[]; // フォルダスコープ
	activeAgentTask?: AgentTask; // Persisted agent task state
	createdAt: number;
	updatedAt: number;
}
