import * as React from "react";
import type { FolderScope } from "../../types/chat";

interface Props {
    files: string[];
    folders: FolderScope[];
    maxFiles: number;
    maxFolders: number;
    onAddFile: () => void;
    onRemoveFile: (path: string) => void;
    onAddFolder: () => void;
    onRemoveFolder: (path: string) => void;
    disabled: boolean;
}

export function KnowledgeBar({
    files,
    folders,
    maxFiles,
    maxFolders,
    onAddFile,
    onRemoveFile,
    onAddFolder,
    onRemoveFolder,
    disabled,
}: Props): React.ReactElement {
    return (
        <div className="vs-knowledge-bar">
            <div className="vs-knowledge-items">
                {/* ファイルピル */}
                {files.map((path) => (
                    <span key={path} className="vs-knowledge-pill vs-file-pill">
                        <span className="pill-icon">📄</span>
                        <span className="pill-name" title={path}>
                            {path.split("/").pop() ?? path}
                        </span>
                        <button
                            className="vs-knowledge-pill-remove"
                            onClick={() => onRemoveFile(path)}
                            disabled={disabled}
                            title={`Remove ${path}`}
                        >
                            {"×"}
                        </button>
                    </span>
                ))}

                {/* フォルダピル */}
                {folders.map((scope) => (
                    <span
                        key={scope.path}
                        className="vs-knowledge-pill vs-folder-pill"
                        title={`${scope.path}\n${scope.fileCount} files\n${scope.recursive ? "Recursive" : "Non-recursive"}`}
                    >
                        <span className="pill-icon">📁</span>
                        <span className="pill-name">{scope.path}</span>
                        <span className="pill-count">({scope.fileCount})</span>
                        <button
                            className="vs-knowledge-pill-remove"
                            onClick={() => onRemoveFolder(scope.path)}
                            disabled={disabled}
                            title={`Remove ${scope.path}`}
                        >
                            {"×"}
                        </button>
                    </span>
                ))}
            </div>

            <div className="vs-knowledge-actions">
                {files.length < maxFiles && (
                    <button
                        className="vs-knowledge-add"
                        onClick={onAddFile}
                        disabled={disabled}
                        title="Add knowledge file"
                    >
                        + File
                    </button>
                )}
                {folders.length < maxFolders && (
                    <button
                        className="vs-knowledge-add"
                        onClick={onAddFolder}
                        disabled={disabled}
                        title="Add folder scope"
                    >
                        + Folder
                    </button>
                )}
                {(files.length > 0 || folders.length > 0) && (
                    <span
                        className="vs-knowledge-counter"
                        title={`${files.length}/${maxFiles} files, ${folders.length}/${maxFolders} folders`}
                    >
                        {files.length + folders.length}/{maxFiles + maxFolders}
                    </span>
                )}
            </div>
        </div>
    );
}
