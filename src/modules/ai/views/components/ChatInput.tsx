import * as React from "react";

interface Props {
	onSend: (message: string) => void;
	onStop: () => void;
	disabled: boolean;
	isLoading: boolean;
	agentModeActive: boolean;
	onToggleAgentMode: () => void;
	agentModeEnabled: boolean;
}

export function ChatInput({
	onSend,
	onStop,
	disabled,
	isLoading,
	agentModeActive,
	onToggleAgentMode,
	agentModeEnabled,
}: Props): React.ReactElement {
	const [text, setText] = React.useState("");
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const isComposingRef = React.useRef(false);

	const adjustHeight = React.useCallback(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		textarea.style.height = "auto";
		const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
		const maxHeight = lineHeight * 10;
		textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
		textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
	}, []);

	React.useEffect(() => {
		adjustHeight();
	}, [text, adjustHeight]);

	const handleSend = (): void => {
		const trimmed = text.trim();
		if (!trimmed || disabled) return;
		onSend(trimmed);
		setText("");
		requestAnimationFrame(() => {
			if (textareaRef.current) {
				textareaRef.current.style.height = "auto";
				textareaRef.current.style.overflowY = "hidden";
			}
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent): void => {
		if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className={`vs-input-area${agentModeActive ? " vs-input-area-agent" : ""}`}>
			{agentModeEnabled && (
				<button
					className={`vs-agent-toggle${agentModeActive ? " vs-agent-toggle-active" : ""}`}
					onClick={onToggleAgentMode}
					disabled={disabled}
					title={agentModeActive ? "Agent mode ON (click to disable)" : "Agent mode OFF (click to enable)"}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<rect x="3" y="11" width="18" height="10" rx="2" />
						<circle cx="12" cy="5" r="2" />
						<path d="M12 7v4" />
						<line x1="8" y1="16" x2="8" y2="16" />
						<line x1="16" y1="16" x2="16" y2="16" />
					</svg>
				</button>
			)}
			<textarea
				ref={textareaRef}
				className="vs-input"
				placeholder={agentModeActive ? "Describe a task for the agent..." : "Type a message..."}
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={handleKeyDown}
				onCompositionStart={() => { isComposingRef.current = true; }}
				onCompositionEnd={() => { isComposingRef.current = false; }}
				disabled={disabled}
				rows={1}
			/>
			{isLoading ? (
				<button
					className="vs-send-button vs-stop-button"
					onClick={onStop}
					title="Stop generation"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<rect x="6" y="6" width="12" height="12" rx="1" />
					</svg>
				</button>
			) : (
				<button
					className="vs-send-button"
					onClick={handleSend}
					disabled={disabled || !text.trim()}
				>
					{agentModeActive ? "Run" : "Send"}
				</button>
			)}
		</div>
	);
}
