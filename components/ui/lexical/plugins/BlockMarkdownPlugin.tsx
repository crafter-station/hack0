"use client";

import { $createListItemNode, $createListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createHeadingNode,
	$createQuoteNode,
	type HeadingTagType,
} from "@lexical/rich-text";
import {
	$createParagraphNode,
	$getSelection,
	$isParagraphNode,
	$isRangeSelection,
	COMMAND_PRIORITY_HIGH,
	KEY_BACKSPACE_COMMAND,
	KEY_ENTER_COMMAND,
	KEY_SPACE_COMMAND,
	TextNode,
} from "lexical";
import { useEffect } from "react";
import {
	$createHorizontalRuleNode,
	$isHorizontalRuleNode,
} from "../nodes/HorizontalRuleNode";

/**
 * BlockMarkdownPlugin
 *
 * Handles block formatting (headings, lists, quotes, horizontal rules).
 * Converts markdown markers to appropriate Lexical nodes.
 *
 * Patterns supported:
 * - # + SPACE → h1
 * - ## + SPACE → h2
 * - ### + SPACE → h3
 * - #### + SPACE → h4
 * - ##### + SPACE → h5
 * - > + SPACE → blockquote
 * - - or * + SPACE → bullet list
 * - 1. + SPACE → numbered list
 * - --- + ENTER → horizontal rule (3 or more dashes only)
 * - BACKSPACE on empty line after HR → delete the horizontal rule
 */
export function BlockMarkdownPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		// Handle Enter key for horizontal rule
		const removeEnterCommand = editor.registerCommand(
			KEY_ENTER_COMMAND,
			() => {
				let handled = false;
				editor.update(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return;

					const anchorNode = selection.anchor.getNode();
					let textContent = "";
					if (anchorNode instanceof TextNode) {
						textContent = anchorNode.getTextContent();
					}

					// Check for horizontal rule: --- (3 or more dashes, nothing else)
					if (/^-{3,}$/.test(textContent.trim())) {
						const parent = anchorNode.getParent();
						if ($isParagraphNode(parent)) {
							// Remove the text node
							anchorNode.remove();

							// Create horizontal rule
							const hr = $createHorizontalRuleNode();
							parent.replace(hr);

							// Create new paragraph after the HR
							const newParagraph = $createParagraphNode();
							hr.insertAfter(newParagraph);
							newParagraph.select();
							handled = true;
						}
					}
				});
				return handled;
			},
			COMMAND_PRIORITY_HIGH,
		);

		// Handle Backspace key to delete horizontal rule
		const removeBackspaceCommand = editor.registerCommand(
			KEY_BACKSPACE_COMMAND,
			() => {
				let handled = false;
				editor.update(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return;

					// Check if cursor is at the start of an empty paragraph
					const anchorNode = selection.anchor.getNode();
					const anchorOffset = selection.anchor.offset;

					// Only proceed if cursor is at position 0
					if (anchorOffset !== 0) return;

					const parent = anchorNode.getParent();
					if (!$isParagraphNode(parent)) return;

					// Check if paragraph is empty
					const textContent = parent.getTextContent();
					if (textContent.trim() !== "") return;

					// Get the previous sibling
					const previousSibling = parent.getPreviousSibling();

					// If previous sibling is a horizontal rule, delete it
					if (previousSibling && $isHorizontalRuleNode(previousSibling)) {
						previousSibling.remove();
						handled = true;
					}
				});
				return handled;
			},
			COMMAND_PRIORITY_HIGH,
		);

		const removeCommand = editor.registerCommand(
			KEY_SPACE_COMMAND,
			() => {
				let handled = false;
				editor.update(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return;

					const anchorNode = selection.anchor.getNode();

					// Get the text content BEFORE the space (current state)
					let textContent = "";
					if (anchorNode instanceof TextNode) {
						textContent = anchorNode.getTextContent();
					}

					// Check for heading patterns: #, ##, ###, ####, #####
					const headingMatch = textContent.match(/^(#{1,5})$/);
					if (headingMatch) {
						const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5;
						const tag: HeadingTagType = `h${level}` as HeadingTagType;

						const parent = anchorNode.getParent();
						if ($isParagraphNode(parent)) {
							// Remove the # markers and the text node completely
							anchorNode.remove();

							// Convert to heading
							const heading = $createHeadingNode(tag);
							parent.replace(heading);
							heading.select();
							handled = true;
							return;
						}
					}

					// Check for blockquote pattern: >
					if (textContent === ">") {
						const parent = anchorNode.getParent();
						if ($isParagraphNode(parent) && anchorNode instanceof TextNode) {
							// Remove the > marker
							anchorNode.remove();

							// Convert to quote
							const quote = $createQuoteNode();
							parent.replace(quote);
							quote.select();
							handled = true;
							return;
						}
					}

					// Check for list patterns: -, *
					const bulletMatch = textContent.match(/^[-*]$/);
					if (bulletMatch) {
						const parent = anchorNode.getParent();
						if ($isParagraphNode(parent) && anchorNode instanceof TextNode) {
							// Remove the marker
							anchorNode.remove();

							// Create list
							const list = $createListNode("bullet");
							const listItem = $createListItemNode();
							parent.replace(list);
							list.append(listItem);
							listItem.select();
							handled = true;
							return;
						}
					}

					// Check for numbered list: 1., 2., etc.
					const orderedMatch = textContent.match(/^(\d+)\.$/);
					if (orderedMatch) {
						const parent = anchorNode.getParent();
						if ($isParagraphNode(parent) && anchorNode instanceof TextNode) {
							// Remove the marker
							anchorNode.remove();

							// Create numbered list
							const list = $createListNode("number");
							const listItem = $createListItemNode();
							parent.replace(list);
							list.append(listItem);
							listItem.select();
							handled = true;
							return;
						}
					}
				});
				return handled;
			},
			COMMAND_PRIORITY_HIGH,
		);

		return () => {
			removeEnterCommand();
			removeBackspaceCommand();
			removeCommand();
		};
	}, [editor]);

	return null;
}
