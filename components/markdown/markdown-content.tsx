import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

interface MarkdownContentProps {
	content: string;
	className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
	return (
		<div
			className={cn(
				"prose prose-slate dark:prose-invert max-w-none",
				// Headings
				"prose-headings:text-foreground prose-headings:font-bold",
				"prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4 prose-h1:first:mt-0",
				"prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3",
				"prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2",
				// Paragraphs and text
				"prose-p:text-foreground prose-p:leading-relaxed",
				"prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
				"prose-strong:font-semibold prose-strong:text-foreground",
				// Lists
				"prose-ul:list-disc prose-ul:ml-6 prose-ul:space-y-1",
				"prose-ol:list-decimal prose-ol:ml-6 prose-ol:space-y-1",
				"prose-li:text-foreground",
				// Code
				"prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5",
				"prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:border",
				"prose-code:border-border prose-code:before:content-none prose-code:after:content-none",
				// Code blocks
				"prose-pre:my-4 prose-pre:rounded-lg prose-pre:border prose-pre:border-border",
				"prose-pre:bg-muted prose-pre:overflow-x-auto prose-pre:p-4",
				// Tables
				"prose-table:border prose-table:border-border prose-table:border-collapse prose-table:text-sm",
				"prose-thead:bg-muted prose-thead:text-foreground",
				"prose-tbody:text-foreground",
				"prose-tr:border-b prose-tr:border-border last:prose-tr:border-b-0",
				"prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:align-top",
				"prose-td:px-3 prose-td:py-2 prose-td:align-top",
				// Blockquotes
				"prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4",
				"prose-blockquote:italic prose-blockquote:text-muted-foreground",
				className,
			)}
		>
			<Markdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeRaw]}
				components={{
					h1: ({ children }) => (
						<h2 className="text-2xl font-bold text-foreground mt-8 mb-4 first:mt-0">
							{children}
						</h2>
					),
					h2: ({ children }) => (
						<h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
							{children}
						</h3>
					),
					h3: ({ children }) => (
						<h4 className="text-lg font-medium text-foreground mt-4 mb-2">
							{children}
						</h4>
					),
					p: ({ children }) => (
						<p className="text-foreground leading-relaxed mb-4">{children}</p>
					),
					ul: ({ children }) => (
						<ul className="list-disc ml-6 space-y-1 text-foreground my-4">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal ml-6 space-y-1 text-foreground my-4">
							{children}
						</ol>
					),
					li: ({ children }) => <li className="text-foreground">{children}</li>,
					strong: ({ children }) => (
						<strong className="font-semibold text-foreground">
							{children}
						</strong>
					),
					em: ({ children }) => <em className="italic">{children}</em>,
					a: ({ href, children }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:underline"
						>
							{children}
						</a>
					),
					blockquote: ({ children }) => (
						<blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground my-4">
							{children}
						</blockquote>
					),
					code: ({ children, className }) => {
						const match = /language-(\w+)/.exec(className || "");
						const isInline = !match;

						if (isInline) {
							return (
								<code className="bg-muted text-foreground px-1.5 py-0.5 rounded font-mono text-sm border border-border">
									{children}
								</code>
							);
						}

						// Block code - use Shiki for syntax highlighting
						return (
							<CodeBlock language={match[1]}>
								{String(children).replace(/\n$/, "")}
							</CodeBlock>
						);
					},
					pre: ({ children }) => <>{children}</>,
					table: ({ children }) => (
						<div className="overflow-x-auto my-4">
							<table className="min-w-full border border-border border-collapse text-sm">
								{children}
							</table>
						</div>
					),
					thead: ({ children }) => (
						<thead className="bg-muted text-foreground">{children}</thead>
					),
					tbody: ({ children }) => (
						<tbody className="text-foreground">{children}</tbody>
					),
					tr: ({ children }) => (
						<tr className="border-b border-border last:border-b-0">
							{children}
						</tr>
					),
					th: ({ children }) => (
						<th className="px-3 py-2 text-left font-semibold align-top">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="px-3 py-2 align-top">{children}</td>
					),
					hr: () => <hr className="my-8 border-border" />,
				}}
			>
				{content}
			</Markdown>
		</div>
	);
}
