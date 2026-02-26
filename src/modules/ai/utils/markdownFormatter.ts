import type { ChatMessage } from "../types/chat";

export function formatChatAsMarkdown(messages: ChatMessage[]): string {
	const date = new Date().toISOString().slice(0, 10);
	const lines: string[] = [];

	lines.push(`# Chat Log (${date})`);
	lines.push("");

	for (const msg of messages) {
		if (msg.isStreaming) continue;
		const role = msg.role === "user" ? "You" : "AI";
		const time = new Date(msg.timestamp).toLocaleTimeString();
		lines.push(`### ${role} (${time})`);
		lines.push("");
		lines.push(msg.content);
		lines.push("");

		if (msg.searchSources && msg.searchSources.length > 0) {
			lines.push("**Sources:**");
			for (const source of msg.searchSources) {
				lines.push(`- [${source.title}](${source.uri})`);
			}
			lines.push("");
		}
	}

	return lines.join("\n");
}

export function generateFileName(messages: ChatMessage[]): string {
	const date = new Date().toISOString().slice(0, 10);
	const firstUserMsg = messages.find((m) => m.role === "user");
	const snippet = firstUserMsg
		? firstUserMsg.content.slice(0, 30).replace(/[\\/:*?"<>|]/g, "")
		: "chat";
	return `${date} ${snippet}`.trim();
}
