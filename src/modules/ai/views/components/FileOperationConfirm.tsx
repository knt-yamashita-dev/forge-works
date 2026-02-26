import * as React from "react";
import type {
	FileOperationRequest,
	FileOperationStatus,
} from "../../types/fileOperation";

interface Props {
	operation: FileOperationRequest;
	onApprove: () => void;
	onReject: () => void;
}

const TYPE_LABELS: Record<string, string> = {
	create: "Create file",
	edit: "Edit file",
	append: "Append to file",
};

const STATUS_LABELS: Record<FileOperationStatus, string> = {
	pending: "",
	approved: "Applied",
	rejected: "Rejected",
	error: "Error",
};

export function FileOperationConfirm({
	operation,
	onApprove,
	onReject,
}: Props): React.ReactElement {
	const [expanded, setExpanded] = React.useState(false);
	const isPending = operation.status === "pending";
	const isError = operation.status === "error";

	return (
		<div className={`vs-fileop vs-fileop-${operation.status}`}>
			<div className="vs-fileop-header">
				<span className="vs-fileop-type">
					{TYPE_LABELS[operation.type] ?? operation.type}
				</span>
				<span className="vs-fileop-path">
					{operation.targetPath}
				</span>
				<button
					className="vs-fileop-expand"
					onClick={() => setExpanded(!expanded)}
					title={expanded ? "Collapse" : "Expand"}
				>
					{expanded ? "\u25BE" : "\u25B8"}
				</button>
			</div>
			<div className={`vs-fileop-preview ${expanded ? "vs-fileop-preview-expanded" : ""}`}>
				<pre>{operation.content}</pre>
			</div>
			{isPending && (
				<div className="vs-fileop-actions">
					<button
						className="vs-fileop-approve"
						onClick={onApprove}
					>
						Approve
					</button>
					<button
						className="vs-fileop-reject"
						onClick={onReject}
					>
						Reject
					</button>
				</div>
			)}
			{!isPending && (
				<div
					className={`vs-fileop-status vs-fileop-status-${operation.status}`}
				>
					{STATUS_LABELS[operation.status]}
					{isError && operation.errorMessage && (
						<span className="vs-fileop-error">
							: {operation.errorMessage}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
