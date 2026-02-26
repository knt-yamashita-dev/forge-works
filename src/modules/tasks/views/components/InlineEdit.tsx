import * as React from "react";

interface InlineEditProps {
	value: string;
	className?: string;
	onSave: (newValue: string) => void;
	placeholder?: string;
	inputType?: "text" | "date";
}

/**
 * Renders read-only text that becomes editable on click.
 * - Enter or blur: saves the value
 * - Escape: cancels editing, reverts to original
 * - All events call stopPropagation to avoid triggering card click/drag
 */
export function InlineEdit({
	value,
	className,
	onSave,
	placeholder,
	inputType = "text",
}: InlineEditProps): React.ReactElement {
	const [editing, setEditing] = React.useState(false);
	const [draft, setDraft] = React.useState(value);
	const inputRef = React.useRef<HTMLInputElement>(null);

	// Sync draft when value changes externally
	React.useEffect(() => {
		if (!editing) {
			setDraft(value);
		}
	}, [value, editing]);

	// Auto-focus when entering edit mode
	React.useEffect(() => {
		if (editing && inputRef.current) {
			inputRef.current.focus();
			if (inputType === "text") {
				inputRef.current.select();
			}
		}
	}, [editing, inputType]);

	const handleStartEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		setDraft(value);
		setEditing(true);
	};

	const handleSave = () => {
		setEditing(false);
		const trimmed = draft.trim();
		if (trimmed && trimmed !== value) {
			onSave(trimmed);
		}
	};

	const handleCancel = () => {
		setEditing(false);
		setDraft(value);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		e.stopPropagation();
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			e.preventDefault();
			handleCancel();
		}
	};

	if (editing) {
		return (
			<input
				ref={inputRef}
				className={`vt-inline-edit-input ${className || ""}`}
				type={inputType}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={handleKeyDown}
				onClick={(e) => e.stopPropagation()}
				onBlur={handleSave}
				placeholder={placeholder}
			/>
		);
	}

	return (
		<span
			className={`vt-inline-editable ${className || ""}`}
			onClick={handleStartEdit}
			title="Click to edit"
		>
			{value || placeholder || "\u2014"}
		</span>
	);
}
