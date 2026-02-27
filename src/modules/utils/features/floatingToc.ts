import {
	ViewPlugin,
	EditorView,
	type ViewUpdate,
} from "@codemirror/view";
import type { Extension } from "@codemirror/state";

interface HeadingEntry {
	level: number;
	text: string;
	lineFrom: number; // document offset (from)
}

/**
 * Extract headings from the document.
 */
function extractHeadings(view: EditorView): HeadingEntry[] {
	const doc = view.state.doc;
	const headings: HeadingEntry[] = [];
	for (let i = 1; i <= doc.lines; i++) {
		const line = doc.line(i);
		const match = line.text.match(/^(#{1,6})\s+(.+)/);
		if (match) {
			headings.push({
				level: match[1].length,
				text: match[2].trim(),
				lineFrom: line.from,
			});
		}
	}
	return headings;
}

/**
 * Determine which heading is "active" based on scroll position.
 * Returns the index of the last heading whose top is at or above the viewport top.
 */
function findActiveHeading(
	view: EditorView,
	headings: HeadingEntry[]
): number {
	if (headings.length === 0) return -1;

	const scrollTop = view.scrollDOM.scrollTop;

	let active = 0;
	for (let i = 0; i < headings.length; i++) {
		const top = view.lineBlockAt(headings[i].lineFrom).top;
		if (top <= scrollTop + 10) {
			active = i;
		} else {
			break;
		}
	}
	return active;
}

class FloatingTocPlugin {
	private container: HTMLElement;
	private headings: HeadingEntry[] = [];
	private activeIndex = -1;
	private fadeTimer: ReturnType<typeof setTimeout> | null = null;
	private isHovered = false;
	private isVisible = false;
	private getFadeDelay: () => number;

	constructor(private view: EditorView, getFadeDelay: () => number) {
		this.getFadeDelay = getFadeDelay;

		// Build the TOC container
		this.container = document.createElement("div");
		this.container.className = "forge-utils-floating-toc";
		view.dom.appendChild(this.container);

		// Hover handlers to keep TOC visible while interacting
		this.container.addEventListener("mouseenter", this.onMouseEnter);
		this.container.addEventListener("mouseleave", this.onMouseLeave);

		// Listen to scroll on the CM scroll DOM
		view.scrollDOM.addEventListener("scroll", this.onScroll);

		// Initial build
		this.rebuildHeadings();
	}

	update(update: ViewUpdate): void {
		if (update.docChanged) {
			this.rebuildHeadings();
		}
		if (update.geometryChanged || update.viewportChanged) {
			this.updateActiveHeading();
		}
	}

	destroy(): void {
		this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
		this.container.removeEventListener("mouseenter", this.onMouseEnter);
		this.container.removeEventListener("mouseleave", this.onMouseLeave);
		if (this.fadeTimer) clearTimeout(this.fadeTimer);
		this.container.remove();
	}

	private rebuildHeadings(): void {
		this.headings = extractHeadings(this.view);

		// Clear and rebuild DOM
		this.container.empty();
		if (this.headings.length === 0) {
			this.container.classList.remove("visible");
			return;
		}

		const minLevel = Math.min(...this.headings.map((h) => h.level));

		for (let i = 0; i < this.headings.length; i++) {
			const h = this.headings[i];
			const item = document.createElement("div");
			item.className = "forge-utils-floating-toc-item";
			item.dataset.index = String(i);

			// Indent based on heading level relative to minimum
			const indent = h.level - minLevel;
			item.style.paddingLeft = `${8 + indent * 12}px`;

			item.textContent = h.text;
			item.addEventListener("click", () => this.jumpTo(i));
			this.container.appendChild(item);
		}

		this.updateActiveHeading();
	}

	private updateActiveHeading(): void {
		const newActive = findActiveHeading(this.view, this.headings);
		if (newActive === this.activeIndex) return;
		this.activeIndex = newActive;

		const items = this.container.querySelectorAll(
			".forge-utils-floating-toc-item"
		);
		items.forEach((el, i) => {
			el.classList.toggle("active", i === this.activeIndex);
		});
	}

	private jumpTo(index: number): void {
		const heading = this.headings[index];
		if (!heading) return;

		this.view.dispatch({
			effects: EditorView.scrollIntoView(heading.lineFrom, { y: "start" }),
		});
	}

	private show(): void {
		if (this.headings.length === 0) return;
		this.isVisible = true;
		this.container.classList.add("visible");
		this.scheduleFade();
	}

	private scheduleFade(): void {
		if (this.fadeTimer) clearTimeout(this.fadeTimer);
		if (this.isHovered) return;

		this.fadeTimer = setTimeout(() => {
			this.isVisible = false;
			this.container.classList.remove("visible");
		}, this.getFadeDelay() * 1000);
	}

	private onScroll = (): void => {
		this.updateActiveHeading();
		this.show();
	};

	private onMouseEnter = (): void => {
		this.isHovered = true;
		if (this.fadeTimer) clearTimeout(this.fadeTimer);
		// Keep visible while hovered
		if (this.headings.length > 0) {
			this.isVisible = true;
			this.container.classList.add("visible");
		}
	};

	private onMouseLeave = (): void => {
		this.isHovered = false;
		if (this.isVisible) {
			this.scheduleFade();
		}
	};
}

/**
 * Create the Floating TOC CodeMirror 6 extension.
 * Shows a floating table of contents on scroll.
 */
export function createFloatingTocExtension(
	getFadeDelay: () => number
): Extension {
	return ViewPlugin.define(
		(view) => new FloatingTocPlugin(view, getFadeDelay),
	);
}
