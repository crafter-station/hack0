import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_API_KEY });

const SAMPLE_PHOTO_URL =
	"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=512&h=512&fit=crop&crop=face";

const STYLES = [
	{
		id: "pixel_art",
		name: "Pixel Art",
		portraitPrompt: `8-bit pixel-art portrait, chest-up view. Keep the person's likeness and features recognizable. Use a simple solid color background. Style should be cartoonish, anime inspired, cute and tender soft. Maintain the original pose and expression.`,
		backgroundPrompt: `Dark pixel art tech background. Deep purple and navy gradient. Pixel grid pattern. Retro terminal/computer aesthetic with scanlines. Tech hacker vibe. No characters.`,
	},
	{
		id: "cyberpunk",
		name: "Cyberpunk",
		portraitPrompt: `Cyberpunk stylized portrait, chest-up view. Keep the person's likeness and features recognizable. Neon cyan and magenta edge lighting. Use a simple solid color background. Style should be cartoonish, anime inspired, cute and tender soft. Maintain the original pose and expression.`,
		backgroundPrompt: `Dark cyberpunk background. Black base with neon cyan and magenta geometric grid lines. Circuit board patterns. Holographic HUD elements. Digital matrix rain. High-tech aesthetic. No characters.`,
	},
];

async function downloadImage(url: string): Promise<Buffer> {
	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

async function generateStylePreview(style: (typeof STYLES)[0]) {
	console.log(`\nGenerating preview for: ${style.name}`);

	try {
		console.log("  - Generating portrait with qwen-image-edit...");
		const portraitResult = await fal.subscribe("fal-ai/qwen-image-edit", {
			input: {
				prompt: style.portraitPrompt,
				image_url: SAMPLE_PHOTO_URL,
			},
		});

		const rawPortraitUrl = (
			portraitResult.data as { images: Array<{ url: string }> }
		).images[0].url;

		console.log("  - Removing background with bria...");
		const rmbgResult = await fal.subscribe("fal-ai/bria/background/remove", {
			input: {
				image_url: rawPortraitUrl,
			},
		});

		const portraitUrl = (rmbgResult.data as { image: { url: string } }).image
			.url;

		console.log("  - Generating background with flux...");
		const backgroundResult = await fal.subscribe("fal-ai/flux/schnell", {
			input: {
				prompt: style.backgroundPrompt,
				image_size: {
					width: 512,
					height: 512,
				},
				num_images: 1,
				enable_safety_checker: false,
			},
		});

		const backgroundUrl = (
			backgroundResult.data as { images: Array<{ url: string }> }
		).images[0].url;

		console.log("  - Downloading images...");
		const [portraitBuffer, backgroundBuffer] = await Promise.all([
			downloadImage(portraitUrl),
			downloadImage(backgroundUrl),
		]);

		const outputDir = join(process.cwd(), "public", "badges", "styles");

		await mkdir(outputDir, { recursive: true });

		await writeFile(
			join(outputDir, `${style.id}-portrait.png`),
			portraitBuffer,
		);
		await writeFile(
			join(outputDir, `${style.id}-background.png`),
			backgroundBuffer,
		);

		console.log(`  ✓ Generated ${style.id} preview images`);

		return {
			styleId: style.id,
			portraitUrl: `/badges/styles/${style.id}-portrait.png`,
			backgroundUrl: `/badges/styles/${style.id}-background.png`,
		};
	} catch (error) {
		console.error(`  ✗ Error generating ${style.name}:`, error);
		throw error;
	}
}

async function main() {
	console.log("=== Generating Style Preview Images ===");
	console.log("Using fal.ai API with:");
	console.log("  - qwen-image-edit for portrait generation");
	console.log("  - bria/background/remove for background removal");
	console.log("  - flux/schnell for backgrounds");

	const results = [];

	for (const style of STYLES) {
		const result = await generateStylePreview(style);
		results.push(result);
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	console.log("\n=== Generation Complete ===");
	console.log("Generated files:");
	for (const result of results) {
		console.log(`  - ${result.portraitUrl}`);
		console.log(`  - ${result.backgroundUrl}`);
	}
}

main().catch(console.error);
