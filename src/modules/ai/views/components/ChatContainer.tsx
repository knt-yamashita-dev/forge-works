import * as React from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SessionList } from "./SessionList";
import { KnowledgeBar } from "./KnowledgeBar";
import { AgentTaskPanel } from "./AgentTaskPanel";
import { useAppContext } from "./AppContext";
import {
	parseFileOperations,
	stripFileOperationCommands,
} from "../../utils/commandParser";
import type { ChatMessage as ChatMessageType, FolderScope, SearchSource } from "../../types/chat";
import type { FileOperationStatus } from "../../types/fileOperation";
import type { AgentTask } from "../../types/agent";
import { AgentService } from "../../services/agentService";

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function ChatContainer(): React.ReactElement {
	const [messages, setMessages] = React.useState<ChatMessageType[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [isWaiting, setIsWaiting] = React.useState(false);
	const [showSessionList, setShowSessionList] = React.useState(false);
	const [knowledgeFiles, setKnowledgeFiles] = React.useState<string[]>([]);
	const [folderScopes, setFolderScopes] = React.useState<FolderScope[]>([]);
	const [agentTask, setAgentTask] = React.useState<AgentTask | null>(null);
	const [agentModeActive, setAgentModeActive] = React.useState(false);
	const agentServiceRef = React.useRef<AgentService | null>(null);
	const abortControllerRef = React.useRef<AbortController | null>(null);
	const messagesEndRef = React.useRef<HTMLDivElement>(null);
	const {
		app,
		geminiService,
		chatService,
		fileOperationService,
		knowledgeService,
		confirmFileOperations,
		maxKnowledgeFiles,
		agentMode,
		maxOperationsPerMessage,
		onSaveChat,
		onPickFile,
		onPromptContextChange,
	} = useAppContext();

	// Initialize AgentService
	React.useEffect(() => {
		if (
			geminiService &&
			fileOperationService &&
			knowledgeService &&
			!agentServiceRef.current
		) {
			agentServiceRef.current = new AgentService(
				geminiService,
				fileOperationService,
				knowledgeService,
				agentMode,
				(task) => setAgentTask({ ...task })
			);
		}
		if (agentServiceRef.current) {
			agentServiceRef.current.updateMode(agentMode);
		}
	}, [geminiService, fileOperationService, knowledgeService, agentMode]);

	// Initialize: load active session or create one
	React.useEffect(() => {
		if (!chatService) return;
		let session = chatService.getActiveSession();
		if (!session) {
			session = chatService.createSession();
		}
		setMessages(session.messages);

		// Restore knowledge files, filtering out deleted files
		const sessionFiles = session.knowledgeFiles ?? [];
		if (knowledgeService && sessionFiles.length > 0) {
			const validFiles =
				knowledgeService.filterExistingPaths(sessionFiles);
			setKnowledgeFiles(validFiles);
			// Update session if some files were removed
			if (validFiles.length !== sessionFiles.length) {
				chatService.updateSessionKnowledgeFiles(validFiles);
			}
		} else {
			setKnowledgeFiles([]);
		}

		// Restore folder scopes, filtering out deleted folders
		const sessionScopes = session.folderScopes ?? [];
		if (knowledgeService && sessionScopes.length > 0) {
			const validScopes =
				knowledgeService.filterExistingScopes(sessionScopes);
			setFolderScopes(validScopes);
			// Update session if some folders were removed
			if (validScopes.length !== sessionScopes.length) {
				chatService.updateSessionFolderScopes(validScopes);
			}
		} else {
			setFolderScopes([]);
		}

		// Restore agent task from session
		const savedTask = session.activeAgentTask;
		if (savedTask) {
			// Interrupted running tasks become paused
			if (savedTask.status === "running") {
				savedTask.status = "paused";
				for (const step of savedTask.steps) {
					if (step.status === "running") {
						step.status = "failed";
						step.error = "Interrupted by view switch";
					}
				}
			}
			setAgentTask(savedTask);
			agentServiceRef.current?.restoreTask(savedTask);
		}
	}, [chatService]);

	// Auto-scroll
	React.useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Persist messages after streaming completes
	React.useEffect(() => {
		if (!isLoading && chatService && messages.length > 0) {
			chatService.updateSessionMessages(messages);
		}
	}, [isLoading]);

	// Persist knowledge files when changed
	React.useEffect(() => {
		if (chatService) {
			chatService.updateSessionKnowledgeFiles(knowledgeFiles);
		}
	}, [knowledgeFiles]);

	// Persist folder scopes when changed
	React.useEffect(() => {
		if (chatService) {
			chatService.updateSessionFolderScopes(folderScopes);
		}
	}, [folderScopes]);

	// Notify plugin of prompt context changes
	React.useEffect(() => {
		if (onPromptContextChange) {
			const folderPaths = folderScopes.map((s) => s.path);
			onPromptContextChange(knowledgeFiles, folderPaths);
		}
	}, [knowledgeFiles, folderScopes, onPromptContextChange]);

	// Persist agent task when changed
	React.useEffect(() => {
		if (chatService) {
			chatService.updateSessionAgentTask(agentTask);
		}
	}, [agentTask]);

	const handleAddKnowledgeFile = (): void => {
		if (!onPickFile) return;
		onPickFile(knowledgeFiles, (path: string) => {
			setKnowledgeFiles((prev) => {
				if (prev.includes(path)) return prev;
				return [...prev, path];
			});
		});
	};

	const handleRemoveKnowledgeFile = (path: string): void => {
		setKnowledgeFiles((prev) => prev.filter((p) => p !== path));
	};

	const handleAddFolderScope = (): void => {
		if (!app || !knowledgeService) return;

		const { FolderPickerModal } = require("../folderPickerModal");
		const modal = new FolderPickerModal(
			app,
			knowledgeService,
			folderScopes.map((s) => s.path),
			(folder: any) => {
				const fileCount = knowledgeService.getFilesInFolder(
					folder.path,
					true,
					50,
					100
				).length;

				const newScope: FolderScope = {
					path: folder.path,
					recursive: true,
					fileCount,
					addedAt: Date.now(),
				};

				setFolderScopes((prev) => [...prev, newScope]);
			}
		);
		modal.open();
	};

	const handleRemoveFolderScope = (path: string): void => {
		setFolderScopes((prev) => prev.filter((s) => s.path !== path));
	};

	const updateOperationStatus = (
		messageId: string,
		operationIndex: number,
		status: FileOperationStatus,
		errorMessage?: string
	): void => {
		setMessages((prev) =>
			prev.map((m) => {
				if (m.id !== messageId || !m.fileOperations) return m;
				const updatedOps = m.fileOperations.map((op, i) =>
					i === operationIndex
						? {
							...op,
							status,
							...(errorMessage ? { errorMessage } : {}),
						}
						: op
				);
				return { ...m, fileOperations: updatedOps };
			})
		);
	};

	const handleApproveOperation = async (
		messageId: string,
		operationIndex: number
	): Promise<void> => {
		if (!fileOperationService) return;

		const message = messages.find((m) => m.id === messageId);
		const operation = message?.fileOperations?.[operationIndex];
		if (!operation || operation.status !== "pending") return;

		try {
			await fileOperationService.execute(operation);
			updateOperationStatus(messageId, operationIndex, "approved");
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Unknown error";
			updateOperationStatus(
				messageId,
				operationIndex,
				"error",
				errorMsg
			);
		}
	};

	const handleRejectOperation = (
		messageId: string,
		operationIndex: number
	): void => {
		updateOperationStatus(messageId, operationIndex, "rejected");
	};

	// Agent task handlers
	const handleStartAgentTask = async (goal: string): Promise<void> => {
		if (!agentServiceRef.current || !knowledgeService) return;

		try {
			setIsLoading(true);

			// Build context from knowledge files
			let context: string | undefined;
			if (knowledgeFiles.length > 0) {
				context = await knowledgeService.buildContext(knowledgeFiles);
			}

			// Start the task with chat history for context
			const chatHistory = messages.filter((m) => !m.isStreaming);
			const task = await agentServiceRef.current.startTask(
				goal,
				context,
				chatHistory
			);

			// Task is now in "plan_review" status, waiting for user approval
		} catch (error) {
			console.error("Agent task error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePauseAgentTask = (): void => {
		agentServiceRef.current?.pauseTask();
	};

	const handleResumeAgentTask = async (): Promise<void> => {
		if (!agentServiceRef.current) return;
		try {
			setIsLoading(true);
			await agentServiceRef.current.resumeTask();
		} finally {
			setIsLoading(false);
		}
	};

	const handleStopAgentTask = (): void => {
		agentServiceRef.current?.stopTask();
		setAgentTask(null);
	};

	const handleApprovePlan = async (): Promise<void> => {
		if (!agentServiceRef.current) return;
		try {
			setIsLoading(true);
			await agentServiceRef.current.approvePlan();
		} finally {
			setIsLoading(false);
		}
	};

	const handleRejectPlan = (): void => {
		agentServiceRef.current?.rejectPlan();
		setAgentTask(null);
	};

	const handleRetryStep = async (stepIndex: number): Promise<void> => {
		if (!agentServiceRef.current) return;
		try {
			setIsLoading(true);
			await agentServiceRef.current.retryStep(stepIndex);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSkipStep = (stepIndex: number): void => {
		agentServiceRef.current?.skipStep(stepIndex);
	};


	const handleSend = async (text: string): Promise<void> => {
		if (!geminiService) return;

		// Run as agent task if agent mode toggle is active
		if (agentModeActive && agentMode.enabled && agentServiceRef.current) {
			setAgentModeActive(false);
			await handleStartAgentTask(text);
			return;
		}

		const userMessage: ChatMessageType = {
			id: generateId(),
			role: "user",
			content: text,
			timestamp: Date.now(),
		};

		const assistantMessage: ChatMessageType = {
			id: generateId(),
			role: "assistant",
			content: "",
			timestamp: Date.now(),
			isStreaming: true,
		};

		setMessages((prev) => [...prev, userMessage, assistantMessage]);
		setIsLoading(true);
		setIsWaiting(true);

		try {
			// Build combined knowledge context (files + folder scopes)
			let knowledgeContext: string | undefined;
			if (
				knowledgeService &&
				(knowledgeFiles.length > 0 || folderScopes.length > 0)
			) {
				knowledgeContext =
					await knowledgeService.buildCombinedContext(
						knowledgeFiles,
						folderScopes,
						50,
						100
					);
				if (!knowledgeContext) knowledgeContext = undefined;
			}

			// History excludes the messages we just added
			const history = messages.filter((m) => !m.isStreaming);

			let searchSources: SearchSource[] = [];

			const abortController = new AbortController();
			abortControllerRef.current = abortController;

			let firstChunkReceived = false;
			for await (const chunk of geminiService.streamResponse(
				text,
				history,
				knowledgeContext,
				(sources) => {
					searchSources = sources;
				},
				abortController.signal
			)) {
				if (!firstChunkReceived) {
					firstChunkReceived = true;
					setIsWaiting(false);
				}
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantMessage.id
							? { ...m, content: m.content + chunk }
							: m
					)
				);
			}

			// Mark streaming complete and parse file operations
			setMessages((prev) =>
				prev.map((m) => {
					if (m.id !== assistantMessage.id) return m;

					const sources =
						searchSources.length > 0
							? searchSources
							: undefined;

					const operations = parseFileOperations(m.content);
					if (operations.length === 0) {
						return {
							...m,
							isStreaming: false,
							searchSources: sources,
						};
					}

					// Limit operations to maxOperationsPerMessage
					const limitedOperations = operations.slice(
						0,
						maxOperationsPerMessage
					);

					const cleanContent = stripFileOperationCommands(
						m.content
					);
					return {
						...m,
						content: cleanContent,
						isStreaming: false,
						fileOperations: limitedOperations,
						searchSources: sources,
					};
				})
			);

			// Auto-approve if confirmation is disabled
			if (!confirmFileOperations && fileOperationService) {
				// Use setTimeout to ensure state update has been applied
				setTimeout(async () => {
					setMessages((current) => {
						const msg = current.find(
							(m) => m.id === assistantMessage.id
						);
						if (msg?.fileOperations) {
							for (
								let i = 0;
								i < msg.fileOperations.length;
								i++
							) {
								if (
									msg.fileOperations[i].status === "pending"
								) {
									handleApproveOperation(
										assistantMessage.id,
										i
									);
								}
							}
						}
						return current;
					});
				}, 0);
			}
		} catch (error) {
			setIsWaiting(false);
			// If aborted by user, keep the streamed content as-is
			if (abortControllerRef.current?.signal.aborted) {
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantMessage.id
							? { ...m, isStreaming: false }
							: m
					)
				);
			} else {
				const errorText =
					error instanceof Error
						? error.message
						: "Unknown error";
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantMessage.id
							? {
								...m,
								content: `Error: ${errorText}`,
								isStreaming: false,
							}
							: m
					)
				);
			}
		} finally {
			abortControllerRef.current = null;
			setIsLoading(false);
			setIsWaiting(false);
		}
	};

	const handleStopGeneration = (): void => {
		abortControllerRef.current?.abort();
	};

	const handleNewChat = (): void => {
		if (!chatService) return;
		chatService.createSession();
		setMessages([]);
		setKnowledgeFiles([]);
		setFolderScopes([]);
		setShowSessionList(false);
	};

	const handleSwitchSession = (sessionId: string): void => {
		if (!chatService) return;
		const session = chatService.switchSession(sessionId);
		if (session) {
			setMessages(session.messages);
			// Restore knowledge files, filtering out deleted files
			const sessionFiles = session.knowledgeFiles ?? [];
			if (knowledgeService && sessionFiles.length > 0) {
				const validFiles =
					knowledgeService.filterExistingPaths(sessionFiles);
				setKnowledgeFiles(validFiles);
				if (validFiles.length !== sessionFiles.length) {
					chatService.updateSessionKnowledgeFiles(validFiles);
				}
			} else {
				setKnowledgeFiles([]);
			}
			// Restore folder scopes, filtering out deleted folders
			const sessionScopes = session.folderScopes ?? [];
			if (knowledgeService && sessionScopes.length > 0) {
				const validScopes =
					knowledgeService.filterExistingScopes(sessionScopes);
				setFolderScopes(validScopes);
				if (validScopes.length !== sessionScopes.length) {
					chatService.updateSessionFolderScopes(validScopes);
				}
			} else {
				setFolderScopes([]);
			}
		}
		setShowSessionList(false);
	};

	const handleDeleteSession = (sessionId: string): void => {
		if (!chatService) return;
		chatService.deleteSession(sessionId);
		const active = chatService.getActiveSession();
		setMessages(active?.messages ?? []);
	};

	const handleRegenerate = (): void => {
		if (isLoading || messages.length < 2) return;

		const lastIndex = messages.length - 1;
		if (messages[lastIndex].role !== "assistant") return;

		// Find the user message right before the last assistant message
		let lastUserIndex = -1;
		for (let i = lastIndex - 1; i >= 0; i--) {
			if (messages[i].role === "user") {
				lastUserIndex = i;
				break;
			}
		}
		if (lastUserIndex === -1) return;

		const userText = messages[lastUserIndex].content;

		// Remove both the last user message and the last assistant message
		setMessages(messages.slice(0, lastUserIndex));

		// Use setTimeout to ensure state update is applied before re-sending
		setTimeout(() => handleSend(userText), 0);
	};

	const hasMessages = messages.filter((m) => !m.isStreaming).length > 0;

	return (
		<div className="vs-container">
			<div className="vs-header">
				<button
					className="vs-header-button"
					onClick={handleNewChat}
					disabled={isLoading}
					title="New chat"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
					{" "}New
				</button>
				<button
					className="vs-header-button"
					onClick={() => setShowSessionList(!showSessionList)}
					title="Chat history"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
					{" "}History
				</button>
				<button
					className="vs-save-button"
					onClick={() => onSaveChat?.(messages)}
					disabled={!hasMessages || isLoading}
					title="Save chat"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
					{" "}Save
				</button>
			</div>
			{showSessionList && chatService && (
				<SessionList
					sessions={chatService.getSessions()}
					activeSessionId={chatService.getActiveSessionId()}
					onSelect={handleSwitchSession}
					onDelete={handleDeleteSession}
				/>
			)}
			{agentTask && (
				<AgentTaskPanel
					task={agentTask}
					onPause={handlePauseAgentTask}
					onResume={handleResumeAgentTask}
					onStop={handleStopAgentTask}
					onApprovePlan={handleApprovePlan}
					onRejectPlan={handleRejectPlan}
					onRetryStep={handleRetryStep}
					onSkipStep={handleSkipStep}
				/>
			)}
			<div className="vs-messages">
				{messages.length === 0 && (
					<div className="vs-empty">
						Send a message to start a conversation
					</div>
				)}
				{messages.map((msg, index) => {
					const isLastAssistant =
						msg.role === "assistant" &&
						!msg.isStreaming &&
						index === messages.length - 1;
					return (
						<ChatMessage
							key={msg.id}
							message={msg}
							isWaiting={
								isWaiting &&
								msg.role === "assistant" &&
								index === messages.length - 1
							}
							onRegenerate={isLastAssistant && !isLoading ? handleRegenerate : undefined}
							onApproveOperation={handleApproveOperation}
							onRejectOperation={handleRejectOperation}
						/>
					);
				})}
				<div ref={messagesEndRef} />
			</div>
			<KnowledgeBar
				files={knowledgeFiles}
				folders={folderScopes}
				maxFiles={maxKnowledgeFiles}
				maxFolders={3}
				onAddFile={handleAddKnowledgeFile}
				onRemoveFile={handleRemoveKnowledgeFile}
				onAddFolder={handleAddFolderScope}
				onRemoveFolder={handleRemoveFolderScope}
				disabled={isLoading}
			/>
			<ChatInput
				onSend={handleSend}
				onStop={handleStopGeneration}
				disabled={isLoading || !geminiService}
				isLoading={isLoading}
				agentModeActive={agentModeActive}
				onToggleAgentMode={() => setAgentModeActive((prev) => !prev)}
				agentModeEnabled={agentMode.enabled}
			/>
			{!geminiService && (
				<div className="vs-no-api-key">
					Please enter your API key in Settings
				</div>
			)}
		</div>
	);
}
