"use client";

import {
	$createListItemNode,
	$createListNode,
	$isListItemNode,
	$isListNode,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createHeadingNode,
	$createQuoteNode,
	$isHeadingNode,
	$isQuoteNode,
} from "@lexical/rich-text";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isParagraphNode,
	$isTextNode,
	type DecoratorNode,
	type ElementNode,
	type TextNode,
} from "lexical";
import { useEffect, useRef } from "react";
import {
	$createHorizontalRuleNode,
	$isHorizontalRuleNode,
} from "../nodes/HorizontalRuleNode";

interface MarkdownSyncPluginProps {
	value: string;
	onChange: (markdown: string) => void;
	forceUpdate?: number; // Timestamp to force re-import
}

/**
 * MarkdownSyncPlugin
 *
 * CRITICAL ARCHITECTURE:
 * - Import markdown ONLY ONCE on mount (Lexical is NOT a controlled input)
 * - Export markdown on every change
 * - NEVER re-import while user is typing (would wipe out formatting)
 * - EXCEPT when forceUpdate prop changes (e.g., from AI improvement)
 *
 * Why this matters:
 * - Lexical owns its internal state (formatted TextNodes)
 * - External `value` is for initialization only
 * - Re-importing on every `value` change would destroy live formatting
 * - forceUpdate allows external updates (like AI) without breaking typing
 */
export function MarkdownSyncPlugin({
	value,
	onChange,
	forceUpdate,
}: MarkdownSyncPluginProps) {
	const [editor] = useLexicalComposerContext();
	const hasImportedRef = useRef(false);
	const lastForceUpdateRef = useRef<number | undefined>(forceUpdate);

	// IMPORT: Only once on mount OR when forceUpdate changes
	useEffect(() => {
		// Skip if no value
		if (!value) return;

		// Import on first mount
		const isFirstMount = !hasImportedRef.current;
		// Import when forceUpdate timestamp changes
		const forceUpdateChanged =
			forceUpdate !== undefined && forceUpdate !== lastForceUpdateRef.current;

		if (!isFirstMount && !forceUpdateChanged) return;

		hasImportedRef.current = true;
		lastForceUpdateRef.current = forceUpdate;

		editor.update(() => {
			const root = $getRoot();
			root.clear();

			const lines = value.split("\n");

			for (const line of lines) {
				const node = parseLine(line);
				root.append(node);
			}
		});
	}, [value, forceUpdate, editor]); // Re-import when forceUpdate changes

	// EXPORT: On every editor change
	useEffect(() => {
		const removeUpdateListener = editor.registerUpdateListener(
			({ editorState }) => {
				editorState.read(() => {
					const markdown = exportToMarkdown();
					onChange(markdown);
				});
			},
		);

		return removeUpdateListener;
	}, [editor, onChange]);

	return null;
}

/**
 * Parse a single line of markdown into a Lexical node
 */
function parseLine(line: string): ElementNode | DecoratorNode<null> {
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
		parseInlineMarkdown(line.slice(6)).forEach((node) => heading.append(node));
		return heading;
	}
	if (line.startsWith("#### ")) {
		const heading = $createHeadingNode("h4");
		parseInlineMarkdown(line.slice(5)).forEach((node) => heading.append(node));
		return heading;
	}
	if (line.startsWith("### ")) {
		const heading = $createHeadingNode("h3");
		parseInlineMarkdown(line.slice(4)).forEach((node) => heading.append(node));
		return heading;
	}
	if (line.startsWith("## ")) {
		const heading = $createHeadingNode("h2");
		parseInlineMarkdown(line.slice(3)).forEach((node) => heading.append(node));
		return heading;
	}
	if (line.startsWith("# ")) {
		const heading = $createHeadingNode("h1");
		parseInlineMarkdown(line.slice(2)).forEach((node) => heading.append(node));
		return heading;
	}

	// Blockquote
	if (line.startsWith("> ")) {
		const quote = $createQuoteNode();
		parseInlineMarkdown(line.slice(2)).forEach((node) => quote.append(node));
		return quote;
	}

	// Bullet list
	if (line.startsWith("- ") || line.startsWith("* ")) {
		const list = $createListNode("bullet");
		const listItem = $createListItemNode();
		parseInlineMarkdown(line.slice(2)).forEach((node) => listItem.append(node));
		list.append(listItem);
		return list;
	}

	// Numbered list
	const numberedMatch = line.match(/^(\d+)\.\s(.+)$/);
	if (numberedMatch) {
		const list = $createListNode("number");
		const listItem = $createListItemNode();
		parseInlineMarkdown(numberedMatch[2]).forEach((node) =>
			listItem.append(node),
		);
		list.append(listItem);
		return list;
	}

	// Regular paragraph
	const paragraph = $createParagraphNode();
	const nodes = parseInlineMarkdown(line);
	nodes.forEach((node) => paragraph.append(node));
	return paragraph;
}

/**
 * Parse inline markdown into TextNode(s) with formatting
 *
 * Supports: **bold**, *italic*, ~~strikethrough~~, `code`
 * Handles mixed formatting like "text **bold** and *italic* here"
 */
function parseInlineMarkdown(text: string): TextNode[] {
	const nodes: TextNode[] = [];

	// Regex to match inline markdown patterns
	// Matches: **bold**, *italic*, ~~strike~~, `code`
	const inlinePattern =
		/(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`)/g;

	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = inlinePattern.exec(text)) !== null) {
		// Add plain text before the match
		if (match.index > lastIndex) {
			const plainText = text.slice(lastIndex, match.index);
			nodes.push($createTextNode(plainText));
		}

		// Parse the matched formatted text
		const formatted = match[0];
		let content = formatted;
		const formats: Array<"bold" | "italic" | "strikethrough" | "code"> = [];

		// Check for code first (no nesting)
		if (formatted.startsWith("`") && formatted.endsWith("`")) {
			content = formatted.slice(1, -1);
			formats.push("code");
		}
		// Bold (**text**)
		else if (formatted.startsWith("**") && formatted.endsWith("**")) {
			content = formatted.slice(2, -2);
			formats.push("bold");
		}
		// Italic (*text*)
		else if (formatted.startsWith("*") && formatted.endsWith("*")) {
			content = formatted.slice(1, -1);
			formats.push("italic");
		}
		// Strikethrough (~~text~~)
		else if (formatted.startsWith("~~") && formatted.endsWith("~~")) {
			content = formatted.slice(2, -2);
			formats.push("strikethrough");
		}

		// Create node with formats
		const node = $createTextNode(content);
		formats.forEach((format) => node.toggleFormat(format));
		nodes.push(node);

		lastIndex = match.index + formatted.length;
	}

	// Add remaining plain text
	if (lastIndex < text.length) {
		nodes.push($createTextNode(text.slice(lastIndex)));
	}

	// If no formatting found, return single plain text node
	if (nodes.length === 0) {
		nodes.push($createTextNode(text));
	}

	return nodes;
}

/**
 * Export Lexical AST to markdown string
 */
function exportToMarkdown(): string {
	const root = $getRoot();
	const lines: string[] = [];

	root.getChildren().forEach((node) => {
		if ($isHorizontalRuleNode(node)) {
			lines.push("---");
		} else if ($isHeadingNode(node)) {
			const tag = node.getTag();
			const level =
				tag === "h1"
					? "#"
					: tag === "h2"
						? "##"
						: tag === "h3"
							? "###"
							: tag === "h4"
								? "####"
								: tag === "h5"
									? "#####"
									: "#";
			lines.push(`${level} ${serializeInlineFormats(node)}`);
		} else if ($isQuoteNode(node)) {
			lines.push(`> ${serializeInlineFormats(node)}`);
		} else if ($isListNode(node)) {
			const listType = node.getListType();
			node.getChildren().forEach((item, index) => {
				if ($isListItemNode(item)) {
					const prefix = listType === "bullet" ? "- " : `${index + 1}. `;
					lines.push(`${prefix}${serializeInlineFormats(item)}`);
				}
			});
		} else if ($isParagraphNode(node)) {
			const content = serializeInlineFormats(node);
			lines.push(content || ""); // Empty line for empty paragraphs
		}
	});

	return lines.join("\n");
}

/**
 * Serialize inline formats back to markdown
 */
function serializeInlineFormats(node: ElementNode): string {
	let result = "";

	node.getChildren().forEach((child) => {
		if ($isTextNode(child)) {
			let text = child.getTextContent();

			// Reconstruct markdown syntax from format flags
			if (child.hasFormat("code")) {
				text = `\`${text}\``;
			} else {
				if (child.hasFormat("bold")) text = `**${text}**`;
				if (child.hasFormat("italic")) text = `*${text}*`;
				if (child.hasFormat("strikethrough")) text = `~~${text}~~`;
			}

			result += text;
		}
	});

	return result;
}
