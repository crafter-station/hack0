"use client";

import { Code, Eye } from "lucide-react";
import * as React from "react";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { MarkdownToolbar } from "@/components/ui/markdown-toolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { insertMarkdownAtCursor } from "@/lib/markdown-utils";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	showToolbar?: boolean;
	showPreview?: boolean;
	autoFocus?: boolean;
}

export function MarkdownEditor({
	value,
	onChange,
	placeholder = "Write your markdown here...",
	className,
	disabled = false,
	showToolbar = true,
	showPreview = true,
	autoFocus = false,
}: MarkdownEditorProps) {
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const [activeTab, setActiveTab] = React.useState<"write" | "preview">(
		"write",
	);

	// Auto-scroll to top when switching tabs
	React.useEffect(() => {
		if (textareaRef.current && activeTab === "write") {
			textareaRef.current.scrollTop = 0;
		}
	}, [activeTab]);

	// Handle keyboard shortcuts
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		const isMod = e.metaKey || e.ctrlKey;

		if (isMod && e.key === "b") {
			e.preventDefault();
			insertMarkdownAtCursor(textareaRef.current!, "**", "**", "bold text");
		} else if (isMod && e.key === "i") {
			e.preventDefault();
			insertMarkdownAtCursor(textareaRef.current!, "*", "*", "italic text");
		} else if (isMod && e.key === "k") {
			e.preventDefault();
			insertMarkdownAtCursor(textareaRef.current!, "`", "`", "code");
		} else if (e.key === "Tab") {
			e.preventDefault();
			insertMarkdownAtCursor(textareaRef.current!, "  ", "", "");
		}
	};

	return (
		<Tabs
			value={activeTab}
			onValueChange={(value) => setActiveTab(value as "write" | "preview")}
			className={cn("markdown-editor flex flex-col h-full", className)}
		>
			{/* Sticky Header Container */}
			<div className="sticky top-0 z-10 bg-background shrink-0">
				{/* Tab Buttons */}
				<TabsList className="w-full -mx-2 md:mx-0 rounded-none border-b">
					<TabsTrigger value="write" className="flex-1 gap-2">
						<Code className="h-4 w-4" />
						Escribir
					</TabsTrigger>
					{showPreview && (
						<TabsTrigger value="preview" className="flex-1 gap-2">
							<Eye className="h-4 w-4" />
							Vista previa
						</TabsTrigger>
					)}
				</TabsList>

				{/* Toolbar - Below tabs, full width with always-visible thin scroll */}
				{activeTab === "write" && showToolbar && (
					<div className="w-full border-b border-border py-2 -mx-2 md:mx-0 px-2 md:px-0 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
						<MarkdownToolbar textareaRef={textareaRef} />
					</div>
				)}
			</div>

			{/* Write Tab Content - with scroll */}
			<TabsContent
				value="write"
				className="flex-1 overflow-auto mt-3 data-[state=inactive]:hidden"
			>
				<Textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					disabled={disabled}
					autoFocus={autoFocus}
					className="w-full h-96 font-mono text-sm resize-none"
				/>
			</TabsContent>

			{/* Preview Tab Content - with scroll */}
			{showPreview && (
				<TabsContent
					value="preview"
					className="flex-1 mt-3 data-[state=inactive]:hidden"
				>
					<div className="border border-border rounded-lg bg-muted/30 p-4 h-96 overflow-auto">
						<MarkdownPreview content={value} />
					</div>
				</TabsContent>
			)}
		</Tabs>
	);
}
