import * as React from "react";
import { MarkdownRenderer, Component } from "obsidian";
import { FileOperationConfirm } from "./FileOperationConfirm";
import { useAppContext } from "./AppContext";
import type { ChatMessage as ChatMessageType } from "../../types/chat";

interface Props {
	message: ChatMessageType;
	isWaiting?: boolean;
	onRegenerate?: () => void;
	onApproveOperation?: (messageId: string, index: number) => void;
	onRejectOperation?: (messageId: string, index: number) => void;
}

export function ChatMessage({
	message,
	isWaiting,
	onRegenerate,
	onApproveOperation,
	onRejectOperation,
}: Props): React.ReactElement {
	const { app } = useAppContext();
	const contentRef = React.useRef<HTMLDivElement>(null);
	const componentRef = React.useRef<Component | null>(null);
	const isUser = message.role === "user";
	const shouldRenderMarkdown = !isUser && !message.isStreaming;

	React.useEffect(() => {
		if (!shouldRenderMarkdown || !contentRef.current || !app) return;

		if (componentRef.current) {
			componentRef.current.unload();
		}
		componentRef.current = new Component();
		componentRef.current.load();

		const el = contentRef.current;
		el.innerHTML = "";

		MarkdownRenderer.render(
			app,
			message.content,
			el,
			"",
			componentRef.current
		);

		// Inject copy buttons onto code blocks
		const codeBlocks = el.querySelectorAll("pre > code");
		codeBlocks.forEach((codeEl) => {
			const pre = codeEl.parentElement;
			if (!pre || pre.querySelector(".vs-code-copy-btn")) return;

			const btn = document.createElement("button");
			btn.className = "vs-code-copy-btn";
			btn.textContent = "Copy";
			btn.addEventListener("click", async () => {
				const text = codeEl.textContent ?? "";
				await navigator.clipboard.writeText(text);
				btn.textContent = "Copied!";
				btn.classList.add("vs-code-copy-success");
				setTimeout(() => {
					btn.textContent = "Copy";
					btn.classList.remove("vs-code-copy-success");
				}, 2000);
			});

			pre.appendChild(btn);
		});

		return () => {
			componentRef.current?.unload();
			componentRef.current = null;
		};
	}, [shouldRenderMarkdown, message.content, app]);

	const [copied, setCopied] = React.useState(false);

	const handleCopy = async (): Promise<void> => {
		await navigator.clipboard.writeText(message.content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className={`vs-message vs-message-${message.role}`}>
			<div className="vs-message-role">
				{isUser ? "You" : "AI"}
				<span className="vs-message-time">
					{new Date(message.timestamp).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
			</div>
			<div
				className={`vs-message-content${message.isStreaming ? " vs-streaming" : ""}`}
				ref={contentRef}
			>
				{(isUser || message.isStreaming) ? (
					<>
						{isWaiting && !message.content ? (
							<span className="vs-thinking">
								Thinking<span className="vs-thinking-dots"></span>
							</span>
						) : (
							<>
								{message.content}
								{message.isStreaming && (
									<span className="vs-cursor">▊</span>
								)}
							</>
						)}
					</>
				) : null}
			</div>
			{!message.isStreaming &&
				message.searchSources &&
				message.searchSources.length > 0 && (
					<div className="vs-search-sources">
						<div className="vs-search-sources-label">
							Sources
						</div>
						<div className="vs-search-sources-list">
							{message.searchSources.map((source, i) => (
								<a
									key={i}
									className="vs-search-source-link"
									href={source.uri}
									target="_blank"
									rel="noopener noreferrer"
									title={source.uri}
								>
									{source.title}
								</a>
							))}
						</div>
					</div>
				)}
			{onRegenerate && (
				<button className="vs-regenerate-btn" onClick={onRegenerate}>
					{"↻ Regenerate"}
				</button>
			)}
			{message.fileOperations?.map((op, index) => (
				<FileOperationConfirm
					key={`${message.id}-op-${index}`}
					operation={op}
					onApprove={() =>
						onApproveOperation?.(message.id, index)
					}
					onReject={() =>
						onRejectOperation?.(message.id, index)
					}
				/>
			))}
			{!message.isStreaming && message.content && (
				<div className="vs-message-actions">
					<button
						className={`vs-copy-btn${copied ? " vs-copy-success" : ""}`}
						onClick={handleCopy}
						title="Copy message"
					>
						{copied ? "Copied!" : "Copy"}
					</button>
				</div>
			)}
		</div>
	);
}
