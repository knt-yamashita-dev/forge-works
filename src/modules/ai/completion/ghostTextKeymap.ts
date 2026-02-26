import { keymap, type EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { ghostTextField, clearGhostText, advanceAccepted } from "./ghostTextState";

/**
 * Accept the full remaining ghost text.
 */
function acceptFull(view: EditorView): boolean {
	const state = view.state.field(ghostTextField);
	if (state.completionText === null) return false;

	const remaining = state.completionText.slice(state.acceptedChars);
	if (!remaining) return false;

	const pos = state.anchorPos + state.acceptedChars;

	view.dispatch({
		changes: { from: pos, insert: remaining },
		selection: { anchor: pos + remaining.length },
		effects: clearGhostText.of(null),
	});

	return true;
}

/**
 * Accept one word from the ghost text.
 */
function acceptWord(view: EditorView): boolean {
	const state = view.state.field(ghostTextField);
	if (state.completionText === null) return false;

	const remaining = state.completionText.slice(state.acceptedChars);
	if (!remaining) return false;

	// Match word + optional trailing whitespace
	const match = remaining.match(/^\S+\s*/);
	if (!match) return false;

	const wordText = match[0];
	const pos = state.anchorPos + state.acceptedChars;

	// If this consumes all remaining text, clear completely
	const isLast = wordText.length >= remaining.length;

	view.dispatch({
		changes: { from: pos, insert: wordText },
		selection: { anchor: pos + wordText.length },
		effects: isLast
			? clearGhostText.of(null)
			: advanceAccepted.of(wordText.length),
	});

	return true;
}

/**
 * Dismiss the current ghost text suggestion.
 */
function dismiss(view: EditorView): boolean {
	const state = view.state.field(ghostTextField);
	if (state.completionText === null) return false;

	view.dispatch({
		effects: clearGhostText.of(null),
	});

	return true;
}

/**
 * Returns the keymap extension at highest precedence.
 * Handlers return false when no ghost text is active, allowing
 * Tab/Escape to function normally.
 */
export function ghostTextKeymapExtension() {
	return Prec.highest(
		keymap.of([
			{ key: "Tab", run: acceptFull },
			{ key: "Escape", run: dismiss },
			{ key: "Mod-ArrowRight", run: acceptWord },
		])
	);
}
