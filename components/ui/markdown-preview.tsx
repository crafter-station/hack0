"use client";

import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Import highlight.js theme for syntax highlighting
// Using a minimal theme that works with both light and dark modes
import "highlight.js/styles/atom-one-dark.css";

interface MarkdownPreviewProps {
	content: string;
	className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
	if (!content) {
		return (
			<div className={cn("text-sm text-muted-foreground", className)}>
				La vista previa aparecerá aquí...
			</div>
		);
	}

	return (
		<div
			className={cn(
				"prose prose-sm max-w-none text-foreground",
				"prose-headings:text-foreground",
				"prose-p:text-foreground prose-p:leading-relaxed",
				"prose-a:text-foreground prose-a:underline prose-a:decoration-muted-foreground/50 hover:prose-a:decoration-muted-foreground",
				"prose-strong:text-foreground prose-strong:font-semibold",
				"prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
				"prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4",
				"prose-ul:text-foreground prose-ul:list-disc prose-ul:space-y-1",
				"prose-ol:text-foreground prose-ol:list-decimal prose-ol:space-y-1",
				"prose-li:text-foreground",
				"prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground/20 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
				"prose-table:text-foreground prose-table:border-collapse",
				"prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold",
				"prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2",
				className,
			)}
		>
			<Markdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeHighlight]}
				components={{
					table: ({ children }) => (
						<div className="overflow-x-auto my-4">
							<table className="w-full border-collapse border border-border">
								{children}
							</table>
						</div>
					),
					thead: ({ children }) => (
						<thead className="bg-muted">{children}</thead>
					),
					tbody: ({ children }) => <tbody>{children}</tbody>,
					tr: ({ children }) => (
						<tr className="border-b border-border">{children}</tr>
					),
					th: ({ children }) => (
						<th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="border border-border px-3 py-2 text-foreground">
							{children}
						</td>
					),
					h1: ({ children }) => (
						<h1 className="text-2xl font-semibold text-foreground mt-6 mb-3">
							{children}
						</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-xl font-semibold text-foreground mt-5 mb-2.5">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
							{children}
						</h3>
					),
					h4: ({ children }) => (
						<h4 className="text-base font-medium text-foreground mt-3 mb-1.5">
							{children}
						</h4>
					),
					p: ({ children }) => (
						<p className="text-foreground leading-relaxed mb-3">{children}</p>
					),
					ul: ({ children }) => (
						<ul className="list-disc list-inside space-y-1 text-foreground ml-1 mb-3">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal list-inside space-y-1 text-foreground ml-1 mb-3">
							{children}
						</ol>
					),
					li: ({ children }) => <li className="text-foreground">{children}</li>,
					strong: ({ children }) => (
						<strong className="font-semibold text-foreground">
							{children}
						</strong>
					),
					a: ({ href, children }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground underline decoration-muted-foreground/50 hover:decoration-muted-foreground transition-colors"
						>
							{children}
						</a>
					),
					blockquote: ({ children }) => (
						<blockquote className="border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground my-3">
							{children}
						</blockquote>
					),
					code: ({ children, className }) => {
						const isInline = !className;
						if (isInline) {
							return (
								<code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono">
									{children}
								</code>
							);
						}
						// For code blocks, let rehype-highlight handle the styling
						return <code className={className}>{children}</code>;
					},
					pre: ({ children }) => (
						<pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-3">
							{children}
						</pre>
					),
				}}
			>
				{content}
			</Markdown>
		</div>
	);
}
