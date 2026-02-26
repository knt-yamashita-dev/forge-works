import { GoogleGenAI } from "@google/genai";
import type { ChatMessage, SearchSource } from "../types/chat";

export class GeminiService {
	private ai: GoogleGenAI;
	private model: string;
	private systemPrompt: string;
	private vaultPrompt = "";
	private webSearchEnabled = false;

	constructor(apiKey: string, model: string, systemPrompt: string) {
		this.ai = new GoogleGenAI({ apiKey });
		this.model = model;
		this.systemPrompt = systemPrompt;
	}

	updateConfig(apiKey: string, model: string, systemPrompt: string): void {
		this.ai = new GoogleGenAI({ apiKey });
		this.model = model;
		this.systemPrompt = systemPrompt;
	}

	setVaultPrompt(prompt: string): void {
		this.vaultPrompt = prompt;
	}

	setWebSearchEnabled(enabled: boolean): void {
		this.webSearchEnabled = enabled;
	}

	async *streamResponse(
		userMessage: string,
		history: ChatMessage[],
		knowledgeContext?: string,
		onSearchSources?: (sources: SearchSource[]) => void,
		signal?: AbortSignal
	): AsyncGenerator<string> {
		const contents = this.buildContents(
			userMessage,
			history,
			knowledgeContext
		);
		const parts = [];
		if (this.vaultPrompt) parts.push(this.vaultPrompt);
		parts.push(this.systemPrompt);
		parts.push(this.getFileOperationInstructions());
		const systemInstruction = parts.join("\n\n");

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const config: any = { systemInstruction };
		if (this.webSearchEnabled) {
			config.tools = [{ googleSearch: {} }];
		}

		const response = await this.ai.models.generateContentStream({
			model: this.model,
			contents,
			config,
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let groundingMetadata: any = null;
		for await (const chunk of response) {
			if (signal?.aborted) break;
			if (chunk.text) {
				yield chunk.text;
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const meta = (chunk as any).candidates?.[0]?.groundingMetadata;
			if (meta) {
				groundingMetadata = meta;
			}
		}

		// Extract search sources from grounding metadata
		if (onSearchSources && groundingMetadata) {
			const sources: SearchSource[] = (
				groundingMetadata.groundingChunks ?? []
			)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.filter((c: any) => c.web?.uri && c.web?.title)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.map((c: any) => ({
					title: c.web.title,
					uri: c.web.uri,
				}));
			if (sources.length > 0) {
				onSearchSources(sources);
			}
		}
	}

	async transformChat(
		messages: ChatMessage[],
		instruction: string
	): Promise<string> {
		const chatText = messages
			.filter((m) => !m.isStreaming)
			.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
			.join("\n\n");

		const prompt = `${instruction}\n\n---\n${chatText}`;

		const response = await this.ai.models.generateContent({
			model: this.model,
			contents: prompt,
		});

		return response.text ?? "";
	}

	async getCompletion(
		contextBefore: string,
		contextAfter: string
	): Promise<string[]> {
		const systemInstruction =
			"You are an inline text completion assistant inside Obsidian. " +
			"Given the surrounding context of a Markdown document, provide a single " +
			"natural continuation of the text at the cursor position. " +
			"The continuation can span 1 to 5 lines if appropriate (e.g. completing a paragraph, " +
			"list items, or a multi-line block). " +
			"Return ONLY the completion text. " +
			"Do not include explanations, numbering, or markdown formatting wrappers. " +
			"If no meaningful completion is possible, return an empty response.";

		const prompt =
			`Text before cursor:\n\`\`\`\n${contextBefore}\n\`\`\`\n\n` +
			`Text after cursor:\n\`\`\`\n${contextAfter}\n\`\`\`\n\n` +
			"Provide a single inline completion:";

		const response = await this.ai.models.generateContent({
			model: this.model,
			contents: prompt,
			config: {
				systemInstruction,
			},
		});

		const text = response.text ?? "";
		if (!text.trim()) return [];

		// Return the entire response as a single completion (may be multi-line)
		return [text.replace(/\n+$/, "")];
	}

	async *streamCompletion(
		contextBefore: string,
		contextAfter: string,
		signal?: AbortSignal
	): AsyncGenerator<string, void, undefined> {
		const systemInstruction =
			"You are an inline text completion assistant inside Obsidian. " +
			"Given the surrounding context of a Markdown document, provide a single " +
			"natural continuation of the text at the cursor position. " +
			"The continuation may span multiple lines if appropriate. " +
			"Return ONLY the completion text with no explanations or formatting.";

		const prompt =
			`Text before cursor:\n\`\`\`\n${contextBefore}\n\`\`\`\n\n` +
			`Text after cursor:\n\`\`\`\n${contextAfter}\n\`\`\`\n\n` +
			"Provide a single inline completion:";

		const response = await this.ai.models.generateContentStream({
			model: this.model,
			contents: prompt,
			config: { systemInstruction },
		});

		for await (const chunk of response) {
			if (signal?.aborted) break;
			if (chunk.text) {
				yield chunk.text;
			}
		}
	}

	private getFileOperationInstructions(): string {
		return [
			"IMPORTANT: You do NOT have direct access to the file system. To create, edit, or append to a file, you MUST use the structured command format below. The system will parse your response and execute the operation only if the format is correct. Without the correct format, NO file operation will happen.",
			"",
			"Format (you MUST follow this exactly):",
			"",
			"[CREATE_FILE:path/to/file.md]",
			"File content here",
			"[/FILE]",
			"",
			"[EDIT_FILE:path/to/existing.md]",
			"Replacement content here",
			"[/FILE]",
			"",
			"[APPEND_FILE:path/to/existing.md]",
			"Content to append",
			"[/FILE]",
			"",
			"Rules:",
			"- You MUST use the exact markers [CREATE_FILE:path], [EDIT_FILE:path], or [APPEND_FILE:path] to start, and [/FILE] to end the content block",
			"- There MUST be a newline immediately after the closing ] of the command marker before the file content begins",
			"- The content between the command marker and [/FILE] is the file content — do NOT wrap it in code fences (``` ``` ```)",
			"- YAML frontmatter (---) in file content is perfectly fine — just include it as-is without worrying about formatting",
			"- NEVER say 'I have created the file' or 'Done' without including the command block — the file will NOT be created without it",
			"- Always explain what you are about to do before the command block",
			"- Use relative paths within the Vault (no ../ or absolute paths)",
			"- For EDIT_FILE, provide the complete new content of the file",
			"- For APPEND_FILE, provide only the content to be added",
			"- You can include multiple operations targeting DIFFERENT files in a single response",
			"- CRITICAL: Output each file operation EXACTLY ONCE per file. Do NOT retry, apologize, or attempt the same operation again within a single response. If you are unsure about formatting, just output your best attempt once — the system will handle it",
			"- If you do not know the exact file path, ask the user instead of guessing",
		].join("\n");
	}

	private buildContents(
		userMessage: string,
		history: ChatMessage[],
		knowledgeContext?: string
	): Array<{ role: string; parts: Array<{ text: string }> }> {
		const contents = history.map((msg) => ({
			role: msg.role === "assistant" ? "model" : "user",
			parts: [{ text: msg.content }],
		}));

		const messageWithContext = knowledgeContext
			? `${knowledgeContext}\n\n---\n\n${userMessage}`
			: userMessage;

		contents.push({
			role: "user",
			parts: [{ text: messageWithContext }],
		});

		return contents;
	}
}
