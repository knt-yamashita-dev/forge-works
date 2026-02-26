import {
	ViewPlugin,
	Decoration,
	type DecorationSet,
	type ViewUpdate,
	type EditorView,
} from "@codemirror/view";
import type { Extension, Range } from "@codemirror/state";

const dimmedLineDeco = Decoration.line({
	class: "forge-utils-focus-dimmed",
});
const activeLineDeco = Decoration.line({
	class: "forge-utils-focus-active",
});

interface BlockRange {
	startLine: number;
	endLine: number;
}

/**
 * Find the section containing the given position.
 * A section spans from a heading (or document start) to the next heading (or document end).
 */
function findCurrentBlock(view: EditorView, pos: number): BlockRange {
	const doc = view.state.doc;
	const cursorLine = doc.lineAt(pos).number;
	const totalLines = doc.lines;

	// Search upward for section start (nearest heading or document start)
	let startLine = 1;
	for (let i = cursorLine; i >= 1; i--) {
		if (doc.line(i).text.startsWith("#")) {
			startLine = i;
			break;
		}
	}

	// Search downward for section end (next heading or document end)
	let endLine = totalLines;
	for (let i = cursorLine + 1; i <= totalLines; i++) {
		if (doc.line(i).text.startsWith("#")) {
			endLine = i - 1;
			break;
		}
	}

	return { startLine, endLine };
}

class FocusModePlugin {
	decorations: DecorationSet = Decoration.none;
	private currentBlock: BlockRange = { startLine: -1, endLine: -1 };

	constructor(private view: EditorView) {
		this.buildDecorations();
	}

	update(update: ViewUpdate): void {
		if (!update.docChanged && !update.selectionSet) return;

		const pos = update.state.selection.main.head;
		const newBlock = findCurrentBlock(update.view, pos);

		// Skip if cursor is still in the same block and document is unchanged
		if (
			!update.docChanged &&
			newBlock.startLine === this.currentBlock.startLine &&
			newBlock.endLine === this.currentBlock.endLine
		) {
			return;
		}

		this.currentBlock = newBlock;
		this.buildDecorations();
	}

	private buildDecorations(): void {
		const doc = this.view.state.doc;
		const pos = this.view.state.selection.main.head;
		const block = findCurrentBlock(this.view, pos);
		this.currentBlock = block;

		const decos: Range<Decoration>[] = [];
		const totalLines = doc.lines;

		for (let i = 1; i <= totalLines; i++) {
			const line = doc.line(i);
			if (i >= block.startLine && i <= block.endLine) {
				decos.push(activeLineDeco.range(line.from));
			} else {
				decos.push(dimmedLineDeco.range(line.from));
			}
		}

		this.decorations = Decoration.set(decos);
	}
}

/**
 * Create the Focus Mode CodeMirror 6 extension.
 * Dims all lines outside the current paragraph block.
 */
export function createFocusModeExtension(): Extension {
	return ViewPlugin.fromClass(FocusModePlugin, {
		decorations: (v) => v.decorations,
	});
}
