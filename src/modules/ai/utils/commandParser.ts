import type {
	FileOperationRequest,
	FileOperationType,
} from "../types/fileOperation";

// Match command markers followed by content and closed by [/FILE]
// Uses \r?\n for cross-platform newline support, allows optional trailing whitespace after ]
const FILE_OP_PATTERN =
	/\[(CREATE_FILE|EDIT_FILE|APPEND_FILE):([^\]]+)\][ \t]*\r?\n([\s\S]*?)\[\/FILE\]/g;

// Strips code fences that wrap file operation commands
const CODE_FENCE_WRAP_PATTERN =
	/```[\w]*\r?\n(\[(?:CREATE_FILE|EDIT_FILE|APPEND_FILE):[\s\S]*?\[\/FILE\])\r?\n```/g;

const COMMAND_TYPE_MAP: Record<string, FileOperationType> = {
	CREATE_FILE: "create",
	EDIT_FILE: "edit",
	APPEND_FILE: "append",
};

/** Unwrap file operation commands from code fences */
function stripCodeFenceWraps(text: string): string {
	return text.replace(CODE_FENCE_WRAP_PATTERN, "$1");
}

export function parseFileOperations(
	responseText: string
): FileOperationRequest[] {
	const operations: FileOperationRequest[] = [];
	const cleaned = stripCodeFenceWraps(responseText);

	FILE_OP_PATTERN.lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = FILE_OP_PATTERN.exec(cleaned)) !== null) {
		const [, commandType, rawPath, content] = match;
		const targetPath = rawPath.trim();

		if (!validatePath(targetPath)) {
			console.warn(
				`[ForgeAI] Skipped invalid path in file operation: "${targetPath}"`
			);
			continue;
		}

		operations.push({
			type: COMMAND_TYPE_MAP[commandType],
			targetPath,
			content: content.replace(/\r?\n$/, ""),
			reason: "",
			status: "pending",
		});
	}

	// Deduplicate: when AI retries in same response, keep only the last operation per file
	if (operations.length > 1) {
		const lastIndexByPath = new Map<string, number>();
		for (let i = 0; i < operations.length; i++) {
			lastIndexByPath.set(operations[i].targetPath, i);
		}
		return operations.filter((_, i) => lastIndexByPath.get(operations[i].targetPath) === i);
	}

	return operations;
}

export function validatePath(path: string): boolean {
	if (!path || path.trim().length === 0) return false;
	if (path.includes("..")) return false;
	if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) return false;
	if (path.includes("\0")) return false;

	const segments = path.split("/");
	if (segments.some((s) => s.startsWith("."))) return false;

	return true;
}

export function stripFileOperationCommands(responseText: string): string {
	const cleaned = stripCodeFenceWraps(responseText);
	return cleaned
		.replace(FILE_OP_PATTERN, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
