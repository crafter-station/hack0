"use client";

import {
	DecoratorNode,
	type DOMConversionMap,
	type DOMExportOutput,
	type LexicalNode,
	type SerializedLexicalNode,
	type Spread,
} from "lexical";

export type SerializedHorizontalRuleNode = Spread<
	{
		type: "horizontal-rule";
		version: 1;
	},
	SerializedLexicalNode
>;

/**
 * HorizontalRuleNode
 *
 * Custom Lexical node for horizontal rules (---)
 * Renders as a visual divider line
 */
export class HorizontalRuleNode extends DecoratorNode<null> {
	static getType(): string {
		return "horizontal-rule";
	}

	static clone(node: HorizontalRuleNode): HorizontalRuleNode {
		return new HorizontalRuleNode(node.__key);
	}

	static importJSON(): HorizontalRuleNode {
		return $createHorizontalRuleNode();
	}

	exportJSON(): SerializedHorizontalRuleNode {
		return {
			type: "horizontal-rule",
			version: 1,
		};
	}

	createDOM(): HTMLElement {
		const hr = document.createElement("hr");
		hr.className = "lexical-hr";
		hr.style.cssText =
			"border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; width: 100%;";
		return hr;
	}

	updateDOM(): boolean {
		return false;
	}

	decorate(): null {
		return null;
	}

	exportDOM(): DOMExportOutput {
		return { element: document.createElement("hr") };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			hr: () => ({
				conversion: () => ({ node: $createHorizontalRuleNode() }),
				priority: 0,
			}),
		};
	}

	isInline(): boolean {
		return false;
	}

	// Allow the node to be deleted with backspace
	isIsolated(): boolean {
		return false;
	}

	// Make it keyboard selectable for easier deletion
	isKeyboardSelectable(): boolean {
		return true;
	}
}

/**
 * Create a new HorizontalRuleNode
 */
export function $createHorizontalRuleNode(): HorizontalRuleNode {
	return new HorizontalRuleNode();
}

/**
 * Type guard to check if a node is a HorizontalRuleNode
 */
export function $isHorizontalRuleNode(
	node: LexicalNode | null | undefined,
): node is HorizontalRuleNode {
	return node instanceof HorizontalRuleNode;
}
