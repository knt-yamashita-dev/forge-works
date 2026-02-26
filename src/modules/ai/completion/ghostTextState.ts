import { StateEffect, StateField } from "@codemirror/state";

export interface GhostTextState {
	/** Full completion text. null = no suggestion active. */
	completionText: string | null;
	/** Document position where the ghost text is anchored. */
	anchorPos: number;
	/** Characters already accepted via partial-accept. */
	acceptedChars: number;
	/** Whether the completion is still streaming. */
	isStreaming: boolean;
}

const EMPTY: GhostTextState = {
	completionText: null,
	anchorPos: 0,
	acceptedChars: 0,
	isStreaming: false,
};

// --- StateEffects ---

export const setGhostText = StateEffect.define<{
	text: string;
	pos: number;
	isStreaming?: boolean;
}>();

export const appendGhostText = StateEffect.define<string>();

export const finishStreaming = StateEffect.define<null>();

export const clearGhostText = StateEffect.define<null>();

export const advanceAccepted = StateEffect.define<number>();

// --- StateField ---

function hasGhostEffect(
	effects: readonly StateEffect<unknown>[]
): boolean {
	for (const e of effects) {
		if (
			e.is(setGhostText) ||
			e.is(appendGhostText) ||
			e.is(finishStreaming) ||
			e.is(clearGhostText) ||
			e.is(advanceAccepted)
		) {
			return true;
		}
	}
	return false;
}

export const ghostTextField = StateField.define<GhostTextState>({
	create() {
		return EMPTY;
	},

	update(state, tr) {
		// Process effects first
		for (const effect of tr.effects) {
			if (effect.is(setGhostText)) {
				return {
					completionText: effect.value.text,
					anchorPos: effect.value.pos,
					acceptedChars: 0,
					isStreaming: effect.value.isStreaming ?? false,
				};
			}
			if (effect.is(appendGhostText)) {
				if (state.completionText === null) continue;
				return {
					...state,
					completionText: state.completionText + effect.value,
				};
			}
			if (effect.is(finishStreaming)) {
				return { ...state, isStreaming: false };
			}
			if (effect.is(clearGhostText)) {
				return EMPTY;
			}
			if (effect.is(advanceAccepted)) {
				return {
					...state,
					acceptedChars: state.acceptedChars + effect.value,
				};
			}
		}

		// If document changed or selection moved without our effects, clear.
		if (
			(tr.docChanged || tr.selection) &&
			!hasGhostEffect(tr.effects) &&
			state.completionText !== null
		) {
			return EMPTY;
		}

		return state;
	},
});
