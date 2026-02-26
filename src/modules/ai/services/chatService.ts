import type { ChatMessage, ChatSession, FolderScope } from "../types/chat";
import type { AgentTask } from "../types/agent";

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export class ChatService {
	private sessions: ChatSession[];
	private activeSessionId: string | null;
	private onSave: (
		sessions: ChatSession[],
		activeId: string | null
	) => void;

	constructor(
		sessions: ChatSession[],
		activeSessionId: string | null,
		onSave: (sessions: ChatSession[], activeId: string | null) => void
	) {
		this.sessions = sessions;
		this.activeSessionId = activeSessionId;
		this.onSave = onSave;
	}

	getSessions(): ChatSession[] {
		return this.sessions;
	}

	getActiveSession(): ChatSession | null {
		if (!this.activeSessionId) return null;
		return (
			this.sessions.find((s) => s.id === this.activeSessionId) ?? null
		);
	}

	getActiveSessionId(): string | null {
		return this.activeSessionId;
	}

	createSession(): ChatSession {
		const session: ChatSession = {
			id: generateId(),
			title: "New Chat",
			messages: [],
			knowledgeFiles: [],
			folderScopes: [],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		this.sessions.unshift(session);
		this.activeSessionId = session.id;
		this.save();
		return session;
	}

	switchSession(sessionId: string): ChatSession | null {
		const session = this.sessions.find((s) => s.id === sessionId);
		if (!session) return null;
		this.activeSessionId = sessionId;
		this.save();
		return session;
	}

	deleteSession(sessionId: string): void {
		this.sessions = this.sessions.filter((s) => s.id !== sessionId);
		if (this.activeSessionId === sessionId) {
			this.activeSessionId = this.sessions[0]?.id ?? null;
		}
		this.save();
	}

	updateSessionMessages(messages: ChatMessage[]): void {
		const session = this.getActiveSession();
		if (!session) return;

		session.messages = messages
			.filter((m) => !m.isStreaming)
			.map(({ isStreaming: _, ...rest }) => rest);
		session.updatedAt = Date.now();

		if (session.title === "New Chat") {
			const firstUser = session.messages.find(
				(m) => m.role === "user"
			);
			if (firstUser) {
				session.title =
					firstUser.content.slice(0, 50).trim() || "New Chat";
			}
		}

		this.save();
	}

	updateSessionKnowledgeFiles(knowledgeFiles: string[]): void {
		const session = this.getActiveSession();
		if (!session) return;
		session.knowledgeFiles = knowledgeFiles;
		session.updatedAt = Date.now();
		this.save();
	}

	updateSessionFolderScopes(folderScopes: FolderScope[]): void {
		const session = this.getActiveSession();
		if (!session) return;
		session.folderScopes = folderScopes;
		session.updatedAt = Date.now();
		this.save();
	}

	updateSessionAgentTask(task: AgentTask | null): void {
		const session = this.getActiveSession();
		if (!session) return;
		session.activeAgentTask = task ?? undefined;
		session.updatedAt = Date.now();
		this.save();
	}

	private save(): void {
		this.onSave(this.sessions, this.activeSessionId);
	}
}
