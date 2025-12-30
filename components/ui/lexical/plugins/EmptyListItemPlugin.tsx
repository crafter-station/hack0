"use client";

import { $isListItemNode, $isListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_HIGH,
	KEY_ENTER_COMMAND,
} from "lexical";
import { useEffect } from "react";

/**
 * EmptyListItemPlugin
 *
 * Exits list when Enter is pressed on an empty list item.
 * Converts empty list item to paragraph (Notion-style behavior).
 */
export function EmptyListItemPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const removeCommand = editor.registerCommand(
			KEY_ENTER_COMMAND,
			() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return false;

				const anchorNode = selection.anchor.getNode();
				const parent = anchorNode.getParent();

				// Check if we're in a list item
				if ($isListItemNode(parent)) {
					const text = parent.getTextContent().trim();

					// If empty, exit the list
					if (text === "") {
						const listParent = parent.getParent();

						if ($isListNode(listParent)) {
							// Create new paragraph to replace the list item
							const paragraph = $createParagraphNode();

							// Get the list's parent to insert the paragraph
							const listGrandParent = listParent.getParent();

							if (listGrandParent) {
								// If this is the only item in the list, replace the entire list
								if (listParent.getChildrenSize() === 1) {
									listParent.replace(paragraph);
								} else {
									// Otherwise, just remove this item and insert paragraph after list
									parent.remove();
									listParent.insertAfter(paragraph);
								}

								paragraph.select();
								return true;
							}
						}
					}
				}

				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);

		return () => {
			removeCommand();
		};
	}, [editor]);

	return null;
}
