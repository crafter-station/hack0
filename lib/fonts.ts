import type { FontInfo } from "@/types/fonts";

export const FONT_CATEGORIES = {
	"sans-serif": {
		label: "Sans Serif",
		fallback: "ui-sans-serif, system-ui, sans-serif",
	},
	serif: {
		label: "Serif",
		fallback: "ui-serif, Georgia, serif",
	},
	monospace: {
		label: "Monospace",
		fallback:
			"ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New', monospace",
	},
	display: {
		label: "Display",
		fallback: "ui-serif, Georgia, serif",
	},
	handwriting: {
		label: "Handwriting",
		fallback: "cursive",
	},
} as const;

export const SYSTEM_FONTS = [
	"ui-sans-serif",
	"ui-serif",
	"ui-monospace",
	"system-ui",
	"sans-serif",
	"serif",
	"monospace",
	"cursive",
	"fantasy",
];

export const FALLBACK_FONTS: FontInfo[] = [
	{
		family: "Geist Mono",
		category: "monospace",
		variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
		variable: true,
	},
	{
		family: "Geist",
		category: "sans-serif",
		variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
		variable: true,
	},
	{
		family: "Inter",
		category: "sans-serif",
		variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
		variable: true,
	},
	{
		family: "Roboto",
		category: "sans-serif",
		variants: ["100", "300", "400", "500", "700", "900"],
		variable: false,
	},
	{
		family: "Open Sans",
		category: "sans-serif",
		variants: ["300", "400", "500", "600", "700", "800"],
		variable: true,
	},
	{
		family: "Poppins",
		category: "sans-serif",
		variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
		variable: false,
	},
	{
		family: "Montserrat",
		category: "sans-serif",
		variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
		variable: true,
	},
	{
		family: "JetBrains Mono",
		category: "monospace",
		variants: ["100", "200", "300", "400", "500", "600", "700", "800"],
		variable: true,
	},
	{
		family: "Fira Code",
		category: "monospace",
		variants: ["300", "400", "500", "600", "700"],
		variable: true,
	},
	{
		family: "Playfair Display",
		category: "serif",
		variants: ["400", "500", "600", "700", "800", "900"],
		variable: true,
	},
	{
		family: "Merriweather",
		category: "serif",
		variants: ["300", "400", "700", "900"],
		variable: false,
	},
];

export function buildFontCssUrl(
	family: string,
	weights: string[] = ["400"],
): string {
	const encodedFamily = encodeURIComponent(family);
	const weightsParam = weights.join(";");
	return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightsParam}&display=swap`;
}

export function loadGoogleFont(
	family: string,
	weights: string[] = ["400", "700"],
): void {
	if (typeof document === "undefined") return;

	const href = buildFontCssUrl(family, weights);
	const existing = document.querySelector(`link[href="${href}"]`);
	if (existing) return;

	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = href;
	document.head.appendChild(link);
}

export function buildFontFamily(
	family: string,
	category: "sans-serif" | "serif" | "monospace" | "display" | "handwriting",
): string {
	const fallbacks: Record<string, string> = {
		"sans-serif": "sans-serif",
		serif: "serif",
		monospace: "monospace",
		display: "sans-serif",
		handwriting: "sans-serif",
	};

	const needsQuotes = /[\s,]/.test(family);
	const quotedFamily = needsQuotes ? `"${family}"` : family;

	return `${quotedFamily}, ${fallbacks[category] || fallbacks["sans-serif"]}`;
}

export function getDefaultWeights(variants: string[]): string[] {
	const weights = variants
		.filter((v) => /^\d+$/.test(v))
		.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

	if (weights.length === 0) return ["400"];

	const result = [];
	if (weights.includes("400")) result.push("400");
	else result.push(weights[0]);

	if (weights.includes("700") && !result.includes("700")) {
		result.push("700");
	}

	return result;
}

export function waitForFont(
	family: string,
	weight: string = "400",
	timeout: number = 3000,
): Promise<void> {
	return new Promise((resolve, reject) => {
		if (typeof document === "undefined") {
			resolve();
			return;
		}

		const testString = "abcdefghijklmnopqrstuvwxyz0123456789";
		const fallbackFont = "monospace";
		const testFont = `${weight} 16px "${family}", ${fallbackFont}`;

		const container = document.createElement("div");
		container.style.position = "absolute";
		container.style.left = "-9999px";
		container.style.top = "-9999px";
		container.style.visibility = "hidden";

		const fallbackSpan = document.createElement("span");
		fallbackSpan.style.font = `${weight} 16px ${fallbackFont}`;
		fallbackSpan.textContent = testString;

		const testSpan = document.createElement("span");
		testSpan.style.font = testFont;
		testSpan.textContent = testString;

		container.appendChild(fallbackSpan);
		container.appendChild(testSpan);
		document.body.appendChild(container);

		const fallbackWidth = fallbackSpan.offsetWidth;

		let attempts = 0;
		const maxAttempts = timeout / 50;

		const checkFont = () => {
			attempts++;
			const testWidth = testSpan.offsetWidth;

			if (testWidth !== fallbackWidth) {
				document.body.removeChild(container);
				resolve();
			} else if (attempts >= maxAttempts) {
				document.body.removeChild(container);
				reject(new Error(`Font ${family} failed to load within ${timeout}ms`));
			} else {
				setTimeout(checkFont, 50);
			}
		};

		checkFont();
	});
}
