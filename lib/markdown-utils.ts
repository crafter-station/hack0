/**
 * Markdown Editor Utilities
 *
 * Helper functions for inserting markdown syntax at cursor position in textarea.
 * Used by the markdown toolbar to manipulate text.
 */

/**
 * Inserts markdown syntax around selected text or at cursor position
 */
export function insertMarkdownAtCursor(
	textarea: HTMLTextAreaElement,
	prefix: string,
	suffix: string = "",
	placeholder: string = "",
): void {
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;
	const selectedText = text.substring(start, end);

	const insertion = selectedText || placeholder;
	const newText =
		text.substring(0, start) +
		prefix +
		insertion +
		suffix +
		text.substring(end);

	// Update textarea value
	textarea.value = newText;

	// Calculate new cursor position
	const newCursorPos = selectedText
		? start + prefix.length + selectedText.length + suffix.length
		: start + prefix.length;

	// Set cursor position and focus
	textarea.setSelectionRange(newCursorPos, newCursorPos);
	textarea.focus();

	// Trigger input event so React state updates
	const event = new Event("input", { bubbles: true });
	textarea.dispatchEvent(event);
}

/**
 * Inserts markdown prefix at the start of current line(s)
 * Used for headings, lists, quotes
 */
export function insertLinePrefix(
	textarea: HTMLTextAreaElement,
	prefix: string,
): void {
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;

	// Find the start of the current line
	let lineStart = start;
	while (lineStart > 0 && text[lineStart - 1] !== "\n") {
		lineStart--;
	}

	// Check if prefix already exists at line start
	const lineContent = text.substring(lineStart);
	const alreadyHasPrefix = lineContent.startsWith(prefix);

	if (alreadyHasPrefix) {
		// Remove the prefix
		const newText =
			text.substring(0, lineStart) + text.substring(lineStart + prefix.length);
		textarea.value = newText;
		textarea.setSelectionRange(start - prefix.length, end - prefix.length);
	} else {
		// Add the prefix
		const newText =
			text.substring(0, lineStart) + prefix + text.substring(lineStart);
		textarea.value = newText;
		textarea.setSelectionRange(start + prefix.length, end + prefix.length);
	}

	textarea.focus();

	// Trigger input event
	const event = new Event("input", { bubbles: true });
	textarea.dispatchEvent(event);
}

/**
 * Inserts a code block with optional language
 */
export function insertCodeBlock(
	textarea: HTMLTextAreaElement,
	language: string = "",
): void {
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;
	const selectedText = text.substring(start, end);

	const codeBlockStart = `\`\`\`${language}\n`;
	const codeBlockEnd = "\n```\n";
	const placeholder = "code";

	const insertion = selectedText || placeholder;
	const newText =
		text.substring(0, start) +
		codeBlockStart +
		insertion +
		codeBlockEnd +
		text.substring(end);

	textarea.value = newText;

	// Position cursor inside the code block
	const newCursorPos = start + codeBlockStart.length + insertion.length;
	textarea.setSelectionRange(newCursorPos, newCursorPos);
	textarea.focus();

	// Trigger input event
	const event = new Event("input", { bubbles: true });
	textarea.dispatchEvent(event);
}

/**
 * Inserts a markdown link
 * If there's selected text, it becomes the link text
 */
export function insertLink(textarea: HTMLTextAreaElement): void {
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;
	const selectedText = text.substring(start, end);

	const linkText = selectedText || "link text";
	const linkUrl = "url";

	const newText =
		text.substring(0, start) +
		`[${linkText}](${linkUrl})` +
		text.substring(end);

	textarea.value = newText;

	// Select "url" part so user can replace it
	const urlStart = start + linkText.length + 3; // After "[text]("
	const urlEnd = urlStart + linkUrl.length;
	textarea.setSelectionRange(urlStart, urlEnd);
	textarea.focus();

	// Trigger input event
	const event = new Event("input", { bubbles: true });
	textarea.dispatchEvent(event);
}
