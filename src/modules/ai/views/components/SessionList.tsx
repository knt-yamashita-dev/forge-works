import * as React from "react";
import type { ChatSession } from "../../types/chat";

interface Props {
	sessions: ChatSession[];
	activeSessionId: string | null;
	onSelect: (sessionId: string) => void;
	onDelete: (sessionId: string) => void;
}

export function SessionList({
	sessions,
	activeSessionId,
	onSelect,
	onDelete,
}: Props): React.ReactElement {
	const [confirmingId, setConfirmingId] = React.useState<string | null>(null);

	if (sessions.length === 0) {
		return (
			<div className="vs-session-list">
				<div className="vs-session-empty">No chat history</div>
			</div>
		);
	}

	return (
		<div className="vs-session-list">
			{sessions.map((session) => (
				<div
					key={session.id}
					className={`vs-session-item ${
						session.id === activeSessionId
							? "vs-session-active"
							: ""
					}`}
					onClick={() => onSelect(session.id)}
				>
					<div className="vs-session-title">{session.title}</div>
					<div className="vs-session-meta">
						{new Date(session.updatedAt).toLocaleDateString()}
						{" \u00B7 "}
						{session.messages.length} messages
					</div>
					{confirmingId === session.id ? (
						<div
							className="vs-session-confirm"
							onClick={(e) => e.stopPropagation()}
						>
							<span className="vs-session-confirm-text">
								Delete?
							</span>
							<button
								className="vs-session-confirm-yes"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(session.id);
									setConfirmingId(null);
								}}
							>
								Yes
							</button>
							<button
								className="vs-session-confirm-no"
								onClick={(e) => {
									e.stopPropagation();
									setConfirmingId(null);
								}}
							>
								No
							</button>
						</div>
					) : (
						<button
							className="vs-session-delete"
							onClick={(e) => {
								e.stopPropagation();
								setConfirmingId(session.id);
							}}
							title="Delete"
						>
							{"\u00D7"}
						</button>
					)}
				</div>
			))}
		</div>
	);
}
