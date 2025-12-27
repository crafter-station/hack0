import { type RefObject, useEffect, useState } from "react";

interface FloatingToolbarPosition {
	x: number;
	y: number;
}

interface UseFloatingToolbarReturn {
	hasSelection: boolean;
	position: FloatingToolbarPosition;
	selectedText: string;
}

/**
 * Get the bounding rectangle of the current text selection
 */
function getSelectionBounds(): DOMRect | null {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return null;
	}

	const range = selection.getRangeAt(0);
	return range.getBoundingClientRect();
}

/**
 * Detect if the current device is touch-enabled
 */
function isTouchDevice(): boolean {
	return (
		"ontouchstart" in window ||
		navigator.maxTouchPoints > 0 ||
		// @ts-expect-error
		navigator.msMaxTouchPoints > 0
	);
}

/**
 * Hook to manage floating toolbar positioning based on text selection
 * Handles both mouse and touch selection with appropriate delays
 */
export function useFloatingToolbar(
	editorRef: RefObject<HTMLDivElement>,
): UseFloatingToolbarReturn {
	const [hasSelection, setHasSelection] = useState(false);
	const [position, setPosition] = useState<FloatingToolbarPosition>({
		x: 0,
		y: 0,
	});
	const [selectedText, setSelectedText] = useState("");

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		const handleSelectionChange = () => {
			// Clear any pending timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			const selection = window.getSelection();
			if (!selection || selection.isCollapsed) {
				setHasSelection(false);
				setSelectedText("");
				return;
			}

			// Check if selection is within our editor
			const range = selection.getRangeAt(0);
			const container = range.commonAncestorContainer;
			const isInEditor =
				editorRef.current?.contains(
					container.nodeType === Node.TEXT_NODE
						? container.parentElement
						: (container as HTMLElement),
				) || false;

			if (!isInEditor) {
				setHasSelection(false);
				setSelectedText("");
				return;
			}

			const updateToolbar = () => {
				const bounds = getSelectionBounds();
				if (!bounds) {
					setHasSelection(false);
					setSelectedText("");
					return;
				}

				// Position toolbar above the selection
				// Offset by 48px to avoid overlapping with touch selection handles
				const offset = isTouchDevice() ? 48 : 40;
				setPosition({
					x: bounds.left + bounds.width / 2,
					y: bounds.top + window.scrollY - offset,
				});

				setSelectedText(selection.toString());
				setHasSelection(true);
			};

			// Add delay for touch devices to avoid conflict with selection handles
			const delay = isTouchDevice() ? 300 : 50;
			timeoutId = setTimeout(updateToolbar, delay);
		};

		// Listen to selection changes
		document.addEventListener("selectionchange", handleSelectionChange);

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, [editorRef]);

	return { hasSelection, position, selectedText };
}
