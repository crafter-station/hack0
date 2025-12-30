"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
	children: string;
	language?: string;
}

export function CodeBlock({ children, language = "text" }: CodeBlockProps) {
	const [html, setHtml] = useState<string>("");

	useEffect(() => {
		async function highlight() {
			try {
				const highlighted = await codeToHtml(String(children), {
					lang: language,
					theme: "github-dark-dimmed",
				});
				setHtml(highlighted);
			} catch (error) {
				console.error("Error highlighting code:", error);
				// Fallback to plain code
				setHtml(`<pre><code>${children}</code></pre>`);
			}
		}
		highlight();
	}, [children, language]);

	if (!html) {
		// Loading state - show unstyled code
		return (
			<pre className="my-4 rounded-lg border border-border bg-muted overflow-x-auto p-4">
				<code className="font-mono text-sm">{children}</code>
			</pre>
		);
	}

	return (
		<div
			className="my-4 [&>pre]:rounded-lg [&>pre]:border [&>pre]:border-border [&>pre]:!bg-muted [&>pre]:overflow-x-auto [&>pre]:p-4"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki generates safe HTML
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
