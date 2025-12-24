"use client";

import {
	Bold,
	CheckSquare,
	Code,
	Code2,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link,
	List,
	ListOrdered,
	Quote,
	Strikethrough,
} from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	insertCodeBlock,
	insertLinePrefix,
	insertLink,
	insertMarkdownAtCursor,
} from "@/lib/markdown-utils";
import { cn } from "@/lib/utils";

interface MarkdownToolbarProps {
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	onAction?: () => void;
	className?: string;
}

interface ToolbarButtonProps {
	icon: React.ElementType;
	label: string;
	onClick: () => void;
	shortcut?: string;
}

function ToolbarButton({
	icon: Icon,
	label,
	onClick,
	shortcut,
}: ToolbarButtonProps) {
	return (
		<TooltipProvider delayDuration={300}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onClick}
						className="h-8 w-8 p-0"
					>
						<Icon className="h-4 w-4" />
						<span className="sr-only">{label}</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p className="text-xs">
						{label}
						{shortcut && (
							<span className="ml-2 text-muted-foreground">{shortcut}</span>
						)}
					</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function MarkdownToolbar({
	textareaRef,
	onAction,
	className,
}: MarkdownToolbarProps) {
	const handleAction = (action: () => void) => {
		if (textareaRef.current) {
			action();
			onAction?.();
		}
	};

	// Text formatting
	const handleBold = () =>
		handleAction(() =>
			insertMarkdownAtCursor(textareaRef.current!, "**", "**", "bold text"),
		);
	const handleItalic = () =>
		handleAction(() =>
			insertMarkdownAtCursor(textareaRef.current!, "*", "*", "italic text"),
		);
	const handleStrikethrough = () =>
		handleAction(() =>
			insertMarkdownAtCursor(textareaRef.current!, "~~", "~~", "strikethrough"),
		);

	// Headings
	const handleH1 = () =>
		handleAction(() => insertLinePrefix(textareaRef.current!, "# "));
	const handleH2 = () =>
		handleAction(() => insertLinePrefix(textareaRef.current!, "## "));
	const handleH3 = () =>
		handleAction(() => insertLinePrefix(textareaRef.current!, "### "));

	// Lists
	const handleUnorderedList = () =>
		handleAction(() => insertLinePrefix(textareaRef.current!, "- "));
	const handleOrderedList = () =>
		handleAction(() => insertLinePrefix(textareaRef.current!, "1. "));
	const handleTaskList = () =>
		handleAction(() => insertLinePrefix(textareaRef.current!, "- [ ] "));

	// Code
	const handleInlineCode = () =>
		handleAction(() =>
			insertMarkdownAtCursor(textareaRef.current!, "`", "`", "code"),
		);
	const handleCodeBlock = () =>
		handleAction(() => insertCodeBlock(textareaRef.current!));

	// Other
	const handleLink = () => handleAction(() => insertLink(textareaRef.current!));
	const handleQuote = () =>
		handleAction(() => insertLinePrefix(textareaRef.current!, "> "));

	return (
		<div
			className={cn(
				"bg-background/95 backdrop-blur border border-border rounded-lg px-2 py-1.5",
				"flex items-center gap-0.5 overflow-x-auto",
				"[scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]",
				className,
			)}
		>
			{/* Text formatting */}
			<ToolbarButton
				icon={Bold}
				label="Negrita"
				onClick={handleBold}
				shortcut="⌘B"
			/>
			<ToolbarButton
				icon={Italic}
				label="Cursiva"
				onClick={handleItalic}
				shortcut="⌘I"
			/>
			<ToolbarButton
				icon={Strikethrough}
				label="Tachado"
				onClick={handleStrikethrough}
			/>

			<Separator orientation="vertical" className="h-6 mx-1" />

			{/* Headings */}
			<ToolbarButton icon={Heading1} label="Título 1" onClick={handleH1} />
			<ToolbarButton icon={Heading2} label="Título 2" onClick={handleH2} />
			<ToolbarButton icon={Heading3} label="Título 3" onClick={handleH3} />

			<Separator orientation="vertical" className="h-6 mx-1" />

			{/* Lists */}
			<ToolbarButton
				icon={List}
				label="Lista con viñetas"
				onClick={handleUnorderedList}
			/>
			<ToolbarButton
				icon={ListOrdered}
				label="Lista numerada"
				onClick={handleOrderedList}
			/>
			<ToolbarButton
				icon={CheckSquare}
				label="Lista de tareas"
				onClick={handleTaskList}
			/>

			<Separator orientation="vertical" className="h-6 mx-1" />

			{/* Code */}
			<ToolbarButton
				icon={Code}
				label="Código en línea"
				onClick={handleInlineCode}
				shortcut="⌘K"
			/>
			<ToolbarButton
				icon={Code2}
				label="Bloque de código"
				onClick={handleCodeBlock}
			/>

			<Separator orientation="vertical" className="h-6 mx-1" />

			{/* Other */}
			<ToolbarButton icon={Link} label="Enlace" onClick={handleLink} />
			<ToolbarButton icon={Quote} label="Cita" onClick={handleQuote} />
		</div>
	);
}
