"use client";

import { Bold, Code, Italic, Link, Strikethrough } from "lucide-react";
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
		onFormatApplied?.(format);
	};

	return (
		<div
			className={cn(
				absolute ? "absolute" : "fixed",
				"z-50",
				"bg-background/95 backdrop-blur-sm",
				"border border-border rounded-lg shadow-lg",
				"px-2 py-1.5",
				"flex items-center gap-0.5",
			)}
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`,
				transform: "translateX(-50%)",
			}}
		>
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
				onClick={() => handleFormat("strikethrough")}
				icon={<Strikethrough className="h-4 w-4" />}
				label="Tachado"
			/>
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
			onClick={onClick}
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
