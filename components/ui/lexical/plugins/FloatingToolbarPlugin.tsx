"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	type RangeSelection,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FloatingFormatToolbar } from "@/components/ui/floating-format-toolbar";

const TOOLBAR_HEIGHT = 50;
const TOOLBAR_OFFSET = 10;

export function FloatingToolbarPlugin() {
	const [editor] = useLexicalComposerContext();
	const [showToolbar, setShowToolbar] = useState(false);
	const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
	const [selectedText, setSelectedText] = useState("");
	const savedSelectionRef = useRef<RangeSelection | null>(null);
	const [isMounted, setIsMounted] = useState(false);

	// Ensure we only render on client
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const updateToolbar = useCallback(() => {
		const selection = window.getSelection();

		if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
			setShowToolbar(false);
			return;
		}

		const text = selection.toString().trim();
		if (!text) {
			setShowToolbar(false);
			return;
		}

		// Save the Lexical selection
		editor.getEditorState().read(() => {
			const lexicalSelection = $getSelection();
			if ($isRangeSelection(lexicalSelection)) {
				savedSelectionRef.current = lexicalSelection.clone();
			}
		});

		setSelectedText(text);

		// Get the bounding rectangle of the selection
		const range = selection.getRangeAt(0);
		const rect = range.getBoundingClientRect();

		// Position the toolbar above the selection
		const x = rect.left + rect.width / 2;
		const y = rect.top + window.scrollY - TOOLBAR_HEIGHT - TOOLBAR_OFFSET;

		setToolbarPosition({ x, y });
		setShowToolbar(true);
	}, [editor]);

	useEffect(() => {
		const unregister = editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				setTimeout(updateToolbar, 0);
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);

		return unregister;
	}, [editor, updateToolbar]);

	// Update toolbar on window events
	useEffect(() => {
		const handleUpdate = () => {
			if (showToolbar) {
				updateToolbar();
			}
		};

		window.addEventListener("resize", handleUpdate);
		window.addEventListener("scroll", handleUpdate, true);

		return () => {
			window.removeEventListener("resize", handleUpdate);
			window.removeEventListener("scroll", handleUpdate, true);
		};
	}, [showToolbar, updateToolbar]);

	const handleFormatApplied = useCallback(
		(format: string) => {
			editor.update(() => {
				// Restore the saved selection
				const selection = savedSelectionRef.current;
				if (!selection) return;

				// Mark selection as dirty to apply it
				selection.dirty = true;

				switch (format) {
					case "bold":
						selection.formatText("bold");
						break;
					case "italic":
						selection.formatText("italic");
						break;
					case "code":
						selection.formatText("code");
						break;
					case "heading1":
						$setBlocksType(selection, () => $createHeadingNode("h1"));
						break;
					case "heading2":
						$setBlocksType(selection, () => $createHeadingNode("h2"));
						break;
					case "heading3":
						$setBlocksType(selection, () => $createHeadingNode("h3"));
						break;
					case "link":
						// TODO: Implement link dialog
						console.log("Link formatting not yet implemented");
						break;
				}
			});

			// Refocus editor after a short delay
			setTimeout(() => {
				editor.focus();
			}, 10);
		},
		[editor],
	);

	if (!isMounted || !showToolbar) {
		return null;
	}

	// Render toolbar in a portal with event handling
	const toolbarElement = (
		<div
			data-floating-toolbar="true"
			style={{
				position: "absolute",
				left: `${toolbarPosition.x}px`,
				top: `${toolbarPosition.y}px`,
				transform: "translateX(-50%)",
				zIndex: 99999,
				pointerEvents: "auto",
			}}
			onMouseDown={(e) => {
				// Prevent losing focus and modal closing
				e.preventDefault();
				e.stopPropagation();
			}}
			onClick={(e) => {
				// Prevent modal from closing
				e.stopPropagation();
			}}
			onPointerDown={(e) => {
				// Also prevent pointer events
				e.stopPropagation();
			}}
		>
			<FloatingFormatToolbar
				position={{ x: 0, y: 0 }}
				selectedText={selectedText}
				onFormatApplied={handleFormatApplied}
				absolute={true}
			/>
		</div>
	);

	return createPortal(toolbarElement, document.body);
}
