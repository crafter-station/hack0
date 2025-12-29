"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createTextNode,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	type TextFormatType,
	type TextNode,
} from "lexical";
import { useEffect } from "react";

/**
 * InlineMarkdownDecoratorPlugin
 *
 * CRITICAL: This plugin MUST mutate TextNodes using setFormat() for Lexical to render formatting.
 * Simply storing metadata or using CSS is NOT enough.
 *
 * How it works:
 * 1. Listen to editor updates
 * 2. Parse text for markdown patterns (**, *, ~~, `)
 * 3. Split TextNode into segments with proper format flags
 * 4. Lexical's theme CSS classes are applied automatically
 */
export function InlineMarkdownDecoratorPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		// Process initial content on mount
		const processAllNodes = () => {
			editor.update(() => {
				const root = editor.getEditorState()._nodeMap;
				const textNodes: TextNode[] = [];

				root.forEach((node) => {
					if ($isTextNode(node)) {
						textNodes.push(node);
					}
				});

				textNodes.forEach((node) => {
					processTextNode(node);
				});
			});
		};

		// Process on mount
		processAllNodes();

		// Listen to ALL editor updates (not just node transforms)
		const removeUpdateListener = editor.registerUpdateListener(
			({ editorState }) => {
				editorState.read(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return;

					// Get the current paragraph being edited
					const anchorNode = selection.anchor.getNode();
					const parent = anchorNode.getParent();

					if (!parent) return;

					// Process all text nodes in this paragraph
					editor.update(() => {
						const textNodes: TextNode[] = [];
						parent.getChildren().forEach((child) => {
							if ($isTextNode(child)) {
								textNodes.push(child);
							}
						});

						// Process each text node
						textNodes.forEach((node) => {
							processTextNode(node);
						});
					});
				});
			},
		);

		return removeUpdateListener;
	}, [editor]);

	return null;
}

/**
 * Process a single text node for inline markdown patterns
 */
function processTextNode(node: TextNode) {
	const text = node.getTextContent();

	// Skip if already formatted or empty
	if (!text || text.trim() === "") return;

	// Skip if node already has formatting (to avoid double processing)
	if (node.getFormat() !== 0) return;

	// Check for bold pattern: **text**
	const boldMatch = text.match(/\*\*(.+?)\*\*/);
	if (boldMatch) {
		applyInlineFormat(node, boldMatch, "bold");
		return;
	}

	// Check for italic pattern: *text* (not **)
	const italicMatch = text.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
	if (italicMatch) {
		applyInlineFormat(node, italicMatch, "italic");
		return;
	}

	// Check for strikethrough: ~~text~~
	const strikeMatch = text.match(/~~(.+?)~~/);
	if (strikeMatch) {
		applyInlineFormat(node, strikeMatch, "strikethrough");
		return;
	}

	// Check for code: `text`
	const codeMatch = text.match(/`([^`]+)`/);
	if (codeMatch) {
		applyInlineFormat(node, codeMatch, "code");
		return;
	}
}

/**
 * Apply inline format by splitting the node into 3 parts:
 * 1. Text before match
 * 2. Formatted text (with symbols removed)
 * 3. Text after match
 */
function applyInlineFormat(
	node: TextNode,
	match: RegExpMatchArray,
	format: TextFormatType,
) {
	const fullText = node.getTextContent();
	const matchStart = match.index!;
	const matchEnd = matchStart + match[0].length;
	const content = match[1]; // Text without symbols

	// Split into segments
	const before = fullText.substring(0, matchStart);
	const after = fullText.substring(matchEnd);

	// Build new node structure
	const nodes: TextNode[] = [];

	if (before) {
		nodes.push($createTextNode(before));
	}

	// Create formatted node WITHOUT symbols
	const formattedNode = $createTextNode(content);
	formattedNode.setFormat(format); // CRITICAL: This makes Lexical render the format
	nodes.push(formattedNode);

	if (after) {
		nodes.push($createTextNode(after));
	}

	// Replace original node with new nodes
	if (nodes.length > 0) {
		node.replace(nodes[0]);
		for (let i = 1; i < nodes.length; i++) {
			nodes[i - 1].insertAfter(nodes[i]);
		}
	}
}
