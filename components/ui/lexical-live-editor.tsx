"use client";

import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { HorizontalRuleNode } from "./lexical/nodes/HorizontalRuleNode";
import { BlockMarkdownPlugin } from "./lexical/plugins/BlockMarkdownPlugin";
import { EmptyListItemPlugin } from "./lexical/plugins/EmptyListItemPlugin";
import { FloatingToolbarPlugin } from "./lexical/plugins/FloatingToolbarPlugin";
import { InlineMarkdownDecoratorPlugin } from "./lexical/plugins/InlineMarkdownDecoratorPlugin";
import { MarkdownPastePlugin } from "./lexical/plugins/MarkdownPastePlugin";
import { MarkdownSyncPlugin } from "./lexical/plugins/MarkdownSyncPlugin";

interface LexicalLiveEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	forceUpdate?: number; // Timestamp to force external update
}

export function LexicalLiveEditor({
	value,
	onChange,
	placeholder = "Escribe algo...",
	className,
	disabled = false,
	autoFocus = false,
	forceUpdate,
}: LexicalLiveEditorProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);

	// Force focus when autoFocus is true
	React.useEffect(() => {
		if (autoFocus && containerRef.current) {
			const contentEditable = containerRef.current.querySelector(
				'[contenteditable="true"]',
			) as HTMLElement;
			if (contentEditable) {
				// Small delay to ensure the modal is fully rendered
				setTimeout(() => {
					contentEditable.focus();
				}, 100);
			}
		}
	}, [autoFocus]);

	// Memoize theme config for performance
	const theme = useMemo(
		() => ({
			heading: {
				h1: "text-3xl font-bold mt-6 mb-4 first:mt-0 text-foreground",
				h2: "text-2xl font-bold mt-5 mb-3 first:mt-0 text-foreground",
				h3: "text-xl font-semibold mt-4 mb-2 first:mt-0 text-foreground",
				h4: "text-lg font-semibold mt-3 mb-2 first:mt-0 text-foreground",
				h5: "text-base font-semibold mt-2 mb-1 first:mt-0 text-foreground",
				h6: "text-sm font-medium mt-2 mb-1 first:mt-0 text-foreground",
			},
			quote: "border-l-4 border-border pl-4 italic text-muted-foreground my-4",
			list: {
				ul: "list-disc ml-6 space-y-1 my-2",
				ol: "list-decimal ml-6 space-y-1 my-2",
				listitem: "ml-0",
				nested: {
					listitem: "list-none",
				},
			},
			text: {
				bold: "font-semibold",
				italic: "italic",
				strikethrough: "line-through text-muted-foreground",
				underline: "underline",
				code: "bg-muted text-foreground px-1.5 py-0.5 rounded font-mono text-sm border border-border",
			},
			paragraph: "mb-2 text-foreground leading-relaxed",
		}),
		[],
	);

	const initialConfig = useMemo(
		() => ({
			namespace: "LexicalLiveEditor",
			onError: (error: Error) => console.error("Lexical error:", error),
			editable: !disabled,
			nodes: [
				HeadingNode,
				QuoteNode,
				ListNode,
				ListItemNode,
				HorizontalRuleNode,
			],
			theme,
		}),
		[disabled, theme],
	);

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative overflow-visible",
				"lexical-editor", // For CSS targeting
				className,
			)}
		>
			<LexicalComposer initialConfig={initialConfig}>
				<RichTextPlugin
					contentEditable={
						<ContentEditable
							className={cn(
								"min-h-[200px] w-full",
								"rounded-lg border border-border bg-background",
								"p-4 text-sm leading-relaxed",
								"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
								"overflow-y-auto",
								disabled && "cursor-not-allowed opacity-50",
							)}
						/>
					}
					placeholder={
						<div className="absolute top-4 left-4 text-muted-foreground pointer-events-none select-none text-sm">
							{placeholder}
						</div>
					}
					ErrorBoundary={() => (
						<div className="text-red-500">Error al cargar el editor</div>
					)}
				/>
				<HistoryPlugin />
				<ListPlugin />
				<MarkdownSyncPlugin value={value} onChange={onChange} forceUpdate={forceUpdate} />
				<MarkdownPastePlugin />
				<InlineMarkdownDecoratorPlugin />
				<BlockMarkdownPlugin />
				<EmptyListItemPlugin />
				<FloatingToolbarPlugin />
			</LexicalComposer>
		</div>
	);
}
