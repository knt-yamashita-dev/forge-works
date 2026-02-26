import * as React from "react";

interface Props {
	files: string[];
	maxFiles: number;
	onAdd: () => void;
	onRemove: (path: string) => void;
	disabled: boolean;
}

export function KnowledgeFileList({
	files,
	maxFiles,
	onAdd,
	onRemove,
	disabled,
}: Props): React.ReactElement {
	return (
		<div className="vs-knowledge-bar">
			<div className="vs-knowledge-files">
				{files.map((path) => (
					<span key={path} className="vs-knowledge-pill">
						<span className="vs-knowledge-pill-name">
							{path.split("/").pop() ?? path}
						</span>
						<button
							className="vs-knowledge-pill-remove"
							onClick={() => onRemove(path)}
							disabled={disabled}
							title={path}
						>
							{"\u00D7"}
						</button>
					</span>
				))}
			</div>
			{files.length < maxFiles && (
				<button
					className="vs-knowledge-add"
					onClick={onAdd}
					disabled={disabled}
					title="Add knowledge file"
				>
					+ Knowledge
				</button>
			)}
		</div>
	);
}
