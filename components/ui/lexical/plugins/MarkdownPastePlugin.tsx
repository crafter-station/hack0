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
 * Helper function to append nodes or array of nodes
 */
function appendNodes(parent: any, nodes: any) {
	if (Array.isArray(nodes)) {
		nodes.forEach((node) => parent.append(node));
	} else {
		parent.append(nodes);
	}
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
		appendNodes(heading, parseInlineMarkdown(line.slice(6)));
		return heading;
	}
	if (line.startsWith("#### ")) {
		const heading = $createHeadingNode("h4");
		appendNodes(heading, parseInlineMarkdown(line.slice(5)));
		return heading;
	}
	if (line.startsWith("### ")) {
		const heading = $createHeadingNode("h3");
		appendNodes(heading, parseInlineMarkdown(line.slice(4)));
		return heading;
	}
	if (line.startsWith("## ")) {
		const heading = $createHeadingNode("h2");
		appendNodes(heading, parseInlineMarkdown(line.slice(3)));
		return heading;
	}
	if (line.startsWith("# ")) {
		const heading = $createHeadingNode("h1");
		appendNodes(heading, parseInlineMarkdown(line.slice(2)));
		return heading;
	}

	// Blockquote
	if (line.startsWith("> ")) {
		const quote = $createQuoteNode();
		appendNodes(quote, parseInlineMarkdown(line.slice(2)));
		return quote;
	}

	// Bullet list
	if (line.startsWith("- ") || line.startsWith("* ")) {
		const list = $createListNode("bullet");
		const listItem = $createListItemNode();
		appendNodes(listItem, parseInlineMarkdown(line.slice(2)));
		list.append(listItem);
		return list;
	}

	// Numbered list
	const numberedMatch = line.match(/^(\d+)\.\s(.+)$/);
	if (numberedMatch) {
		const list = $createListNode("number");
		const listItem = $createListItemNode();
		appendNodes(listItem, parseInlineMarkdown(numberedMatch[2]));
		list.append(listItem);
		return list;
	}

	// Regular paragraph with inline formatting
	const paragraph = $createParagraphNode();
	appendNodes(paragraph, parseInlineMarkdown(line));
	return paragraph;
}

/**
 * Parse inline markdown formatting and create formatted text nodes
 */
function parseInlineMarkdown(text: string) {
	const nodes = [];
	let currentIndex = 0;

	// Regex to match inline markdown: **bold**, *italic*, __bold__, _italic_, `code`, ~~strikethrough~~
	const inlineRegex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|`(.*?)`|(~~)(.*?)\6/g;
	let match;

	while ((match = inlineRegex.exec(text)) !== null) {
		// Add text before the match
		if (match.index > currentIndex) {
			nodes.push($createTextNode(text.slice(currentIndex, match.index)));
		}

		// Create formatted text node
		const textNode = $createTextNode(
			match[2] || match[4] || match[5] || match[7] || "",
		);

		// Apply formatting based on what was matched
		if (match[1] === "**" || match[1] === "__") {
			// Bold
			textNode.setFormat("bold");
		} else if (match[3] === "*" || match[3] === "_") {
			// Italic
			textNode.setFormat("italic");
		} else if (match[5]) {
			// Code
			textNode.setFormat("code");
		} else if (match[6] === "~~") {
			// Strikethrough
			textNode.setFormat("strikethrough");
		}

		nodes.push(textNode);
		currentIndex = match.index + match[0].length;
	}

	// Add remaining text after the last match
	if (currentIndex < text.length) {
		nodes.push($createTextNode(text.slice(currentIndex)));
	}

	// If no inline formatting was found, return a single text node
	if (nodes.length === 0) {
		return $createTextNode(text);
	}

	// Return all nodes (Lexical will handle multiple nodes)
	return nodes;
}
