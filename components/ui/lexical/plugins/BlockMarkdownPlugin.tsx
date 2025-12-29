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
		// Handle Backspace to convert HR back to --- when in empty paragraph after it
		const removeBackspaceCommand = editor.registerCommand(
			KEY_BACKSPACE_COMMAND,
			(event) => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return false;
				if (!selection.isCollapsed()) return false;

				const anchor = selection.anchor;
				if (anchor.offset !== 0) return false;

				const anchorNode = anchor.getNode();
				let parent = anchorNode.getParent();

				// If we're in a text node, get its parent
				if (!$isParagraphNode(parent)) {
					const grandParent = parent?.getParent();
					if (!grandParent) return false;
					parent = grandParent;
				}

				if (!$isParagraphNode(parent)) return false;
				if (parent.getTextContent() !== "") return false;

				const previousSibling = parent.getPreviousSibling();

				// If previous sibling is HR, convert it back to text
				if ($isHorizontalRuleNode(previousSibling)) {
					event?.preventDefault();

					// Simply convert HR to text paragraph and let Lexical handle the rest
					const textNode = new TextNode("---");
					const newParagraph = $createParagraphNode();
					newParagraph.append(textNode);

					previousSibling.replace(newParagraph);
					parent.remove();

					// Select at the end of the text
					newParagraph.selectEnd();

					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);

		// Handle Enter key for horizontal rule
		const removeEnterCommand = editor.registerCommand(
			KEY_ENTER_COMMAND,
			(event) => {
				let shouldHandle = false;

				editor.getEditorState().read(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return;

					const anchorNode = selection.anchor.getNode();
					const parent = anchorNode.getParent();

					// Check if we're in a paragraph
					if (!$isParagraphNode(parent)) return;

					// Get all text content from the paragraph
					const paragraphText = parent.getTextContent().trim();

					// Check for horizontal rule: --- (3 or more dashes, nothing else)
					if (/^-{3,}$/.test(paragraphText)) {
						shouldHandle = true;
					}
				});

				if (shouldHandle) {
					event?.preventDefault();
					editor.update(() => {
						const selection = $getSelection();
						if (!$isRangeSelection(selection)) return;

						const anchorNode = selection.anchor.getNode();
						const parent = anchorNode.getParent();

						if (!$isParagraphNode(parent)) return;

						// Clear the paragraph content
						parent.clear();

						// Create horizontal rule
						const hr = $createHorizontalRuleNode();
						parent.replace(hr);

						// Create new paragraph after the HR
						const newParagraph = $createParagraphNode();
						hr.insertAfter(newParagraph);
						newParagraph.select();
					});
					return true;
				}

				return false;
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
