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
}

/**
 * MarkdownSyncPlugin
 *
 * CRITICAL ARCHITECTURE:
 * - Import markdown ONLY ONCE on mount (Lexical is NOT a controlled input)
 * - Export markdown on every change
 * - NEVER re-import while user is typing (would wipe out formatting)
 *
 * Why this matters:
 * - Lexical owns its internal state (formatted TextNodes)
 * - External `value` is for initialization only
 * - Re-importing on every `value` change would destroy live formatting
 */
export function MarkdownSyncPlugin({
	value,
	onChange,
}: MarkdownSyncPluginProps) {
	const [editor] = useLexicalComposerContext();
	const hasImportedRef = useRef(false);

	// IMPORT: Only once on mount
	useEffect(() => {
		// Guard: Only import if we haven't imported yet
		if (hasImportedRef.current) return;
		if (!value) return;

		hasImportedRef.current = true;

		editor.update(() => {
			const root = $getRoot();
			root.clear();

			const lines = value.split("\n");

			for (const line of lines) {
				const node = parseLine(line);
				root.append(node);
			}
		});
	}, []); // Only on mount - ignores `value` changes!

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

	// Regular paragraph
	const paragraph = $createParagraphNode();
	paragraph.append(parseInlineMarkdown(line));
	return paragraph;
}

/**
 * Parse inline markdown into TextNode
 *
 * Note: InlineMarkdownDecoratorPlugin will handle the actual formatting.
 * We just need to preserve the raw markdown text here.
 */
function parseInlineMarkdown(text: string): TextNode {
	return $createTextNode(text);
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
