export type FileOperationType = "create" | "edit" | "append";

export type FileOperationStatus =
	| "pending"
	| "approved"
	| "rejected"
	| "error";

export interface FileOperationRequest {
	type: FileOperationType;
	targetPath: string;
	content: string;
	reason: string;
	status: FileOperationStatus;
	errorMessage?: string;
}
