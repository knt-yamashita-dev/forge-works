import {
	ViewPlugin,
	Decoration,
	type DecorationSet,
	type ViewUpdate,
	type EditorView,
} from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import {
	ghostTextField,
	setGhostText,
	appendGhostText,
	finishStreaming,
	clearGhostText,
	type GhostTextState,
} from "./ghostTextState";
import { GhostTextWidget } from "./ghostTextWidget";
import { ghostTextKeymapExtension } from "./ghostTextKeymap";
import type { CompletionProvider } from "./completionProvider";

interface GhostTextConfig {
	enabled: boolean;
	debounceMs: number;
	streaming: boolean;
}

class GhostTextPluginValue {
	decorations: DecorationSet = Decoration.none;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private abortController: AbortController | null = null;
	private isComposing = false;
	private config: GhostTextConfig;
	private provider: CompletionProvider;

	// Prediction cache: stores the last ghost text for prefix matching
	private cachedCompletion: string | null = null;
	private cachedAnchorPos = 0;

	constructor(
		private view: EditorView,
		provider: CompletionProvider,
		config: GhostTextConfig
	) {
		this.provider = provider;
		this.config = { ...config };

		this.view.dom.addEventListener(
			"compositionstart",
			this.onCompositionStart
		);
		this.view.dom.addEventListener(
			"compositionend",
			this.onCompositionEnd
		);

		this.buildDecorations();
	}

	update(update: ViewUpdate): void {
		if (update.docChanged) {
			// Read ghost state BEFORE the docChanged cleared it
			const prevGhost = update.startState.field(ghostTextField);

			this.cancelRequest();

			// Try prediction cache: if user typed text matching the
			// beginning of the previous ghost text, reuse the remainder
			if (
				!this.isComposing &&
				this.config.enabled &&
				this.checkPredictionCache(update, prevGhost)
			) {
				// Cache hit — ghost text restored via microtask
			} else if (!this.isComposing && this.config.enabled) {
				this.scheduleRequest();
			}
		} else if (update.selectionSet) {
			this.cancelRequest();
			this.clearCache();
			const ghost = update.state.field(ghostTextField);
			if (ghost.completionText !== null) {
				this.view.dispatch({
					effects: clearGhostText.of(null),
				});
			}
		}

		this.buildDecorations();
	}

	destroy(): void {
		this.cancelDebounce();
		this.cancelRequest();
		this.view.dom.removeEventListener(
			"compositionstart",
			this.onCompositionStart
		);
		this.view.dom.removeEventListener(
			"compositionend",
			this.onCompositionEnd
		);
	}

	setConfig(config: Partial<GhostTextConfig>): void {
		Object.assign(this.config, config);
		if (!this.config.enabled) {
			this.cancelDebounce();
			this.cancelRequest();
			const ghost = this.view.state.field(ghostTextField);
			if (ghost.completionText !== null) {
				this.view.dispatch({
					effects: clearGhostText.of(null),
				});
			}
		}
	}

	setProvider(provider: CompletionProvider): void {
		this.provider = provider;
	}

	// --- Decorations ---

	private buildDecorations(): void {
		const state = this.view.state.field(ghostTextField);

		if (state.completionText === null) {
			this.decorations = Decoration.none;
			return;
		}

		const remaining = state.completionText.slice(state.acceptedChars);
		if (!remaining) {
			this.decorations = Decoration.none;
			return;
		}

		const pos = state.anchorPos + state.acceptedChars;
		if (pos < 0 || pos > this.view.state.doc.length) {
			this.decorations = Decoration.none;
			return;
		}

		const widget = new GhostTextWidget(remaining, state.isStreaming);
		this.decorations = Decoration.set([
			Decoration.widget({ widget, side: 1 }).range(pos),
		]);
	}

	// --- Debounce & Request ---

	private scheduleRequest(): void {
		this.cancelDebounce();
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			if (this.config.streaming) {
				this.fireStreamingRequest();
			} else {
				this.fireRequest();
			}
		}, this.config.debounceMs);
	}

	private cancelDebounce(): void {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}

	private cancelRequest(): void {
		this.cancelDebounce();
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
	}

	private clearCache(): void {
		this.cachedCompletion = null;
		this.cachedAnchorPos = 0;
	}

	// --- Prediction Cache ---

	private checkPredictionCache(
		update: ViewUpdate,
		prevGhost: GhostTextState
	): boolean {
		// Need a cached completion and the previous ghost must have been active
		if (!this.cachedCompletion || prevGhost.completionText === null) {
			return false;
		}

		// Don't use cache for streaming-in-progress completions
		if (prevGhost.isStreaming) return false;

		// Extract the inserted text from the transaction
		let insertedText = "";
		update.changes.iterChanges(
			(_fromA, _toA, _fromB, _toB, inserted) => {
				insertedText += inserted.toString();
			}
		);

		// Only handle pure insertions (no deletions or replacements)
		if (!insertedText || insertedText.length === 0) return false;

		// Calculate the remaining ghost text that was visible before the edit
		const prevRemaining = this.cachedCompletion.slice(
			prevGhost.acceptedChars
		);
		if (!prevRemaining) return false;

		// Check if the inserted text matches the beginning of the remaining ghost
		if (!prevRemaining.startsWith(insertedText)) return false;

		// Cache hit! Calculate the new remaining text
		const newConsumed = prevGhost.acceptedChars + insertedText.length;
		const newRemaining = this.cachedCompletion.slice(newConsumed);

		if (!newRemaining) {
			// User typed the entire completion — clear cache
			this.cachedCompletion = null;
			return true;
		}

		const newPos = this.cachedAnchorPos + newConsumed;

		// Dispatch the updated ghost text via microtask (cannot dispatch inside update)
		queueMicrotask(() => {
			// Verify editor state hasn't changed
			const currentCursor =
				this.view.state.selection.main.head;
			if (currentCursor !== newPos) return;

			this.view.dispatch({
				effects: setGhostText.of({
					text: newRemaining,
					pos: newPos,
				}),
			});

			// Update cache anchor for next prediction
			this.cachedAnchorPos = newPos;
			this.cachedCompletion = newRemaining;
		});

		return true;
	}

	private async fireRequest(): Promise<void> {
		if (!this.config.enabled) return;

		const state = this.view.state;
		const cursor = state.selection.main.head;

		// Guards
		if (!state.selection.main.empty) return;
		if (this.isInCodeBlock(cursor)) return;
		if (this.isInFrontmatter(cursor)) return;

		const line = state.doc.lineAt(cursor);
		const textBefore = line.text.slice(0, cursor - line.from);
		if (cursor === 0 || textBefore.trim() === "") return;

		const { contextBefore, contextAfter } = this.buildContext(cursor);

		if (this.abortController) {
			this.abortController.abort();
		}
		this.abortController = new AbortController();
		const signal = this.abortController.signal;
		const requestPos = cursor;

		const result = await this.provider.getCompletion({
			contextBefore,
			contextAfter,
			signal,
		});

		if (signal.aborted) return;
		if (!result || !result.text) return;

		// Verify cursor hasn't moved
		const currentCursor = this.view.state.selection.main.head;
		if (currentCursor !== requestPos) return;

		this.cachedCompletion = result.text;
		this.cachedAnchorPos = requestPos;

		this.view.dispatch({
			effects: setGhostText.of({
				text: result.text,
				pos: requestPos,
			}),
		});
	}

	private async fireStreamingRequest(): Promise<void> {
		if (!this.config.enabled) return;

		const state = this.view.state;
		const cursor = state.selection.main.head;

		// Guards (same as fireRequest)
		if (!state.selection.main.empty) return;
		if (this.isInCodeBlock(cursor)) return;
		if (this.isInFrontmatter(cursor)) return;

		const line = state.doc.lineAt(cursor);
		const textBefore = line.text.slice(0, cursor - line.from);
		if (cursor === 0 || textBefore.trim() === "") return;

		const { contextBefore, contextAfter } = this.buildContext(cursor);

		if (this.abortController) {
			this.abortController.abort();
		}
		this.abortController = new AbortController();
		const signal = this.abortController.signal;
		const requestPos = cursor;

		// Initialize ghost text in streaming mode
		this.view.dispatch({
			effects: setGhostText.of({
				text: "",
				pos: requestPos,
				isStreaming: true,
			}),
		});

		try {
			for await (const chunk of this.provider.streamCompletion({
				contextBefore,
				contextAfter,
				signal,
			})) {
				if (signal.aborted) return;

				// Verify cursor hasn't moved
				const currentCursor =
					this.view.state.selection.main.head;
				if (currentCursor !== requestPos) {
					this.view.dispatch({
						effects: clearGhostText.of(null),
					});
					return;
				}

				this.view.dispatch({
					effects: appendGhostText.of(chunk),
				});
			}

			if (signal.aborted) return;

			// Check if any text was received
			const ghost = this.view.state.field(ghostTextField);
			if (ghost.completionText === "") {
				this.view.dispatch({
					effects: clearGhostText.of(null),
				});
				return;
			}

			// Cache the completed streaming text
			this.cachedCompletion = ghost.completionText;
			this.cachedAnchorPos = ghost.anchorPos;

			this.view.dispatch({
				effects: finishStreaming.of(null),
			});
		} catch {
			if (!signal.aborted) {
				this.view.dispatch({
					effects: clearGhostText.of(null),
				});
			}
		}
	}

	// --- Context ---

	private static readonly MAX_CONTEXT_BEFORE = 4000;
	private static readonly MAX_CONTEXT_AFTER = 2000;

	private buildContext(cursor: number): {
		contextBefore: string;
		contextAfter: string;
	} {
		const doc = this.view.state.doc;

		// Take as much text as possible up to character limits
		const beforeStart = Math.max(
			0,
			cursor - GhostTextPluginValue.MAX_CONTEXT_BEFORE
		);
		const contextBefore = doc.sliceString(beforeStart, cursor);

		const afterEnd = Math.min(
			doc.length,
			cursor + GhostTextPluginValue.MAX_CONTEXT_AFTER
		);
		const contextAfter = doc.sliceString(cursor, afterEnd);

		return { contextBefore, contextAfter };
	}

	// --- Detection ---

	private isInCodeBlock(pos: number): boolean {
		const doc = this.view.state.doc;
		const line = doc.lineAt(pos);
		let inBlock = false;

		for (let i = 1; i < line.number; i++) {
			const lineText = doc.line(i).text;
			if (lineText.trimStart().startsWith("```")) {
				inBlock = !inBlock;
			}
		}
		return inBlock;
	}

	private isInFrontmatter(pos: number): boolean {
		const doc = this.view.state.doc;
		if (doc.lines < 1) return false;

		const firstLine = doc.line(1).text;
		if (firstLine.trim() !== "---") return false;

		const currentLine = doc.lineAt(pos);
		for (let i = 2; i <= doc.lines; i++) {
			if (doc.line(i).text.trim() === "---") {
				return currentLine.number <= i;
			}
		}

		return true;
	}

	// --- IME ---

	private onCompositionStart = (): void => {
		this.isComposing = true;
		this.cancelDebounce();
		this.cancelRequest();
	};

	private onCompositionEnd = (): void => {
		this.isComposing = false;
	};
}

/**
 * Creates the full ghost text extension bundle.
 */
export function createGhostTextExtension(
	provider: CompletionProvider,
	config: GhostTextConfig
): {
	extension: Extension;
	updateConfig: (config: Partial<GhostTextConfig>) => void;
	updateProvider: (provider: CompletionProvider) => void;
} {
	let pluginInstance: GhostTextPluginValue | null = null;

	const plugin = ViewPlugin.define(
		(view) => {
			const p = new GhostTextPluginValue(view, provider, config);
			pluginInstance = p;
			return p;
		},
		{
			decorations: (v) => v.decorations,
		}
	);

	return {
		extension: [ghostTextField, plugin, ghostTextKeymapExtension()],
		updateConfig(newConfig) {
			pluginInstance?.setConfig(newConfig);
		},
		updateProvider(newProvider) {
			pluginInstance?.setProvider(newProvider);
		},
	};
}
