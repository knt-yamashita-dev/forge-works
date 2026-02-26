import { WidgetType, type EditorView } from "@codemirror/view";

/**
 * Renders ghost text inline at the cursor position.
 * Single-line: a simple <span>.
 * Multi-line: first line inline, remaining lines in a block container.
 */
export class GhostTextWidget extends WidgetType {
	constructor(
		readonly text: string,
		readonly isStreaming: boolean
	) {
		super();
	}

	eq(other: GhostTextWidget): boolean {
		return this.text === other.text && this.isStreaming === other.isStreaming;
	}

	toDOM(_view: EditorView): HTMLElement {
		const lines = this.text.split("\n");

		if (lines.length === 1) {
			const span = document.createElement("span");
			span.className = "forge-ghost-text";
			if (this.isStreaming) span.classList.add("forge-ghost-streaming");
			span.textContent = lines[0];
			return span;
		}

		// Multi-line: first line inline, rest in a block element
		const container = document.createElement("span");
		container.className = "forge-ghost-text forge-ghost-multiline";
		if (this.isStreaming)
			container.classList.add("forge-ghost-streaming");

		container.appendChild(document.createTextNode(lines[0]));

		const block = document.createElement("div");
		block.className = "forge-ghost-text-block";
		for (let i = 1; i < lines.length; i++) {
			if (i > 1) block.appendChild(document.createElement("br"));
			block.appendChild(document.createTextNode(lines[i]));
		}
		container.appendChild(block);

		return container;
	}

	ignoreEvent(): boolean {
		return true;
	}
}
