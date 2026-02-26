import { EditorView, ViewUpdate } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { formatDate } from "../utils/dateFormatter";

const TRIGGER = "@now";

/**
 * Create a CodeMirror extension that replaces "@now" with the current
 * timestamp as soon as the keyword is typed.
 *
 * @param getFormat - Callback that returns the current date format string
 *                    (read from plugin settings at call time).
 */
export function createTimestampReplacer(
	getFormat: () => string
): Extension {
	return EditorView.updateListener.of((update: ViewUpdate) => {
		if (!update.docChanged) return;

		// Collect replacements first, then dispatch once.
		const replacements: { from: number; to: number; insert: string }[] = [];

		update.changes.iterChanges(
			(
				_fromA: number,
				_toA: number,
				fromB: number,
				toB: number
			) => {
				// Only care about insertions (not deletions)
				if (fromB >= toB) return;

				// Look back from the end of the inserted range to find "@now"
				const start = Math.max(0, toB - TRIGGER.length);
				const slice = update.state.doc.sliceString(start, toB);

				if (slice === TRIGGER) {
					replacements.push({
						from: start,
						to: toB,
						insert: `@${formatDate(getFormat())}`,
					});
				}
			}
		);

		if (replacements.length > 0) {
			// Dispatch as a separate transaction so it doesn't conflict
			// with the current update.
			const view = update.view;
			// Use requestAnimationFrame to avoid dispatching during an update
			requestAnimationFrame(() => {
				view.dispatch({ changes: replacements });
			});
		}
	});
}
