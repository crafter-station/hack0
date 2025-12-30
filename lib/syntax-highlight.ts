import { codeToHtml } from "shiki";

export async function highlightCode(
	code: string,
	lang: string,
): Promise<string> {
	try {
		const html = await codeToHtml(code, {
			lang: lang || "text",
			theme: "github-dark-dimmed",
		});
		return html;
	} catch (error) {
		console.error("Error highlighting code:", error);
		// Fallback to plain code if highlighting fails
		return `<pre><code>${code}</code></pre>`;
	}
}
