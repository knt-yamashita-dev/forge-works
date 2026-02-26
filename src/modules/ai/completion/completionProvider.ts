import type { GeminiService } from "../services/geminiService";

export interface CompletionRequest {
	contextBefore: string;
	contextAfter: string;
	signal: AbortSignal;
}

export interface CompletionResult {
	text: string;
}

/**
 * Wraps GeminiService completion calls with AbortController support.
 */
export class CompletionProvider {
	private geminiService: GeminiService | null = null;

	setGeminiService(service: GeminiService | null): void {
		this.geminiService = service;
	}

	async getCompletion(
		req: CompletionRequest
	): Promise<CompletionResult | null> {
		if (!this.geminiService) return null;
		if (req.signal.aborted) return null;

		try {
			const completions = await this.geminiService.getCompletion(
				req.contextBefore,
				req.contextAfter
			);
			if (req.signal.aborted) return null;
			if (completions.length === 0) return null;

			return { text: completions[0] };
		} catch (error) {
			if (req.signal.aborted) return null;
			console.warn("ForgeAI ghost text completion error:", error);
			return null;
		}
	}

	async *streamCompletion(
		req: CompletionRequest
	): AsyncGenerator<string, void, undefined> {
		if (!this.geminiService) return;
		if (req.signal.aborted) return;

		try {
			yield* this.geminiService.streamCompletion(
				req.contextBefore,
				req.contextAfter,
				req.signal
			);
		} catch (error) {
			if (req.signal.aborted) return;
			console.warn("ForgeAI ghost text streaming error:", error);
		}
	}
}
