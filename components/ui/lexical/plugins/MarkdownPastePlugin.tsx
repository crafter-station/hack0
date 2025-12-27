"use client";

import { $createListItemNode, $createListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
	$createParagraphNode,
	$createTextNode,
	$getSelection,
	$insertNodes,
	$isRangeSelection,
	COMMAND_PRIORITY_HIGH,
	PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { $createHorizontalRuleNode } from "../nodes/HorizontalRuleNode";

/**
 * MarkdownPastePlugin
 *
 * Handles paste events and converts markdown text to formatted Lexical nodes.
 * Preserves markdown formatting when pasting from external sources.
 */
export function MarkdownPastePlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const removePasteCommand = editor.registerCommand(
			PASTE_COMMAND,
			(event: ClipboardEvent) => {
				const clipboardData = event.clipboardData;
				if (!clipboardData) return false;

				// Get plain text from clipboard
				const text = clipboardData.getData("text/plain");
				if (!text) return false;

				// Check if it looks like markdown (has markdown markers)
				const hasMarkdown =
					/^(#{1,3}\s|>\s|[-*]\s|\d+\.\s|---|```)/.test(text) ||
					/(\*\*|__|~~|`).+?\1/.test(text);

				if (!hasMarkdown) {
					// Let default paste behavior handle plain text
					return false;
				}

				// Parse and insert markdown
				event.preventDefault();

				editor.update(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return;

					// Parse markdown text into nodes
					const lines = text.split("\n");
					const nodes = [];

					for (let i = 0; i < lines.length; i++) {
						const line = lines[i];
						const node = parseMarkdownLine(line);
						nodes.push(node);
					}

					// Insert parsed nodes at cursor
					if (nodes.length > 0) {
						$insertNodes(nodes);
					}
				});

				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);

		return () => {
			removePasteCommand();
		};
	}, [editor]);

	return null;
}

/**
 * Parse a single line of markdown into a Lexical node
 */
function parseMarkdownLine(line: string) {
	// Empty line
	if (!line.trim()) {
		return $createParagraphNode();
	}

	// Horizontal rule
	if (line.trim() === "---") {
		return $createHorizontalRuleNode();
	}

	// Headings (check longer patterns first)
	if (line.startsWith("##### ")) {
		const heading = $createHeadingNode("h5");
		heading.append(parseInlineMarkdown(line.slice(6)));
		return heading;
	}
	if (line.startsWith("#### ")) {
		const heading = $createHeadingNode("h4");
		heading.append(parseInlineMarkdown(line.slice(5)));
		return heading;
	}
	if (line.startsWith("### ")) {
		const heading = $createHeadingNode("h3");
		heading.append(parseInlineMarkdown(line.slice(4)));
		return heading;
	}
	if (line.startsWith("## ")) {
		const heading = $createHeadingNode("h2");
		heading.append(parseInlineMarkdown(line.slice(3)));
		return heading;
	}
	if (line.startsWith("# ")) {
		const heading = $createHeadingNode("h1");
		heading.append(parseInlineMarkdown(line.slice(2)));
		return heading;
	}

	// Blockquote
	if (line.startsWith("> ")) {
		const quote = $createQuoteNode();
		quote.append(parseInlineMarkdown(line.slice(2)));
		return quote;
	}

	// Bullet list
	if (line.startsWith("- ") || line.startsWith("* ")) {
		const list = $createListNode("bullet");
		const listItem = $createListItemNode();
		listItem.append(parseInlineMarkdown(line.slice(2)));
		list.append(listItem);
		return list;
	}

	// Numbered list
	const numberedMatch = line.match(/^(\d+)\.\s(.+)$/);
	if (numberedMatch) {
		const list = $createListNode("number");
		const listItem = $createListItemNode();
		listItem.append(parseInlineMarkdown(numberedMatch[2]));
		list.append(listItem);
		return list;
	}

	// Regular paragraph with inline formatting
	const paragraph = $createParagraphNode();
	paragraph.append(parseInlineMarkdown(line));
	return paragraph;
}

/**
 * Parse inline markdown formatting and create formatted text nodes
 */
function parseInlineMarkdown(text: string) {
	// For now, create text nodes with inline patterns
	// The InlineMarkdownDecoratorPlugin will handle the formatting
	return $createTextNode(text);
}
