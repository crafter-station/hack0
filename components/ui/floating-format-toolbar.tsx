"use client";

import {
	Bold,
	Code,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingFormatToolbarProps {
	position: { x: number; y: number };
	selectedText: string;
	onFormatApplied?: (format: string) => void;
	absolute?: boolean;
}

export function FloatingFormatToolbar({
	position,
	selectedText,
	onFormatApplied,
	absolute = false,
}: FloatingFormatToolbarProps) {
	const handleFormat = (format: string) => {
		// Prevent default to avoid losing focus
		onFormatApplied?.(format);
	};

	return (
		<div
			className={cn(
				"bg-background/95 backdrop-blur-sm",
				"border border-border rounded-lg shadow-lg",
				"px-2 py-1.5",
				"flex items-center gap-0.5",
			)}
			style={
				absolute
					? undefined
					: {
							left: `${position.x}px`,
							top: `${position.y}px`,
							transform: "translateX(-50%)",
						}
			}
			onMouseDown={(e) => {
				// Prevent losing focus when clicking toolbar
				e.preventDefault();
				e.stopPropagation();
			}}
			onClick={(e) => {
				// Prevent event bubbling
				e.stopPropagation();
			}}
		>
			<ToolbarButton
				onClick={() => handleFormat("heading1")}
				icon={<Heading1 className="h-4 w-4" />}
				label="Título 1"
			/>
			<ToolbarButton
				onClick={() => handleFormat("heading2")}
				icon={<Heading2 className="h-4 w-4" />}
				label="Título 2"
			/>
			<ToolbarButton
				onClick={() => handleFormat("heading3")}
				icon={<Heading3 className="h-4 w-4" />}
				label="Título 3"
			/>
			<div className="w-px h-6 bg-border mx-1" />
			<ToolbarButton
				onClick={() => handleFormat("bold")}
				icon={<Bold className="h-4 w-4" />}
				label="Negrita"
				shortcut="⌘B"
			/>
			<ToolbarButton
				onClick={() => handleFormat("italic")}
				icon={<Italic className="h-4 w-4" />}
				label="Cursiva"
				shortcut="⌘I"
			/>
			<ToolbarButton
				onClick={() => handleFormat("code")}
				icon={<Code className="h-4 w-4" />}
				label="Código"
				shortcut="⌘K"
			/>
			<div className="w-px h-6 bg-border mx-1" />
			<ToolbarButton
				onClick={() => handleFormat("link")}
				icon={<Link className="h-4 w-4" />}
				label="Enlace"
			/>
		</div>
	);
}

interface ToolbarButtonProps {
	onClick: () => void;
	icon: React.ReactNode;
	label: string;
	shortcut?: string;
}

function ToolbarButton({ onClick, icon, label, shortcut }: ToolbarButtonProps) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onMouseDown={(e) => {
				e.preventDefault(); // Prevent losing focus
				onClick();
			}}
			className={cn(
				"h-8 w-8 p-0",
				"hover:bg-muted",
				"transition-colors",
				// Touch-friendly tap target (44x44px min)
				"touch-manipulation",
			)}
			title={shortcut ? `${label} (${shortcut})` : label}
		>
			{icon}
		</Button>
	);
}
