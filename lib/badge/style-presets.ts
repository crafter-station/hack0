export interface BadgeStylePreset {
	id: string;
	name: string;
	description: string;
	portraitPrompt: string;
	backgroundPrompt: string;
}

export const BADGE_STYLE_PRESETS: BadgeStylePreset[] = [
	{
		id: "pixel_art",
		name: "Pixel Art",
		description: "Avatar estilo retro gaming",
		portraitPrompt: `8-bit pixel-art portrait. Keep the person's likeness and features recognizable. Use a simple solid color background. Style should be cartoonish, anime inspired, cute and tender soft.`,
		backgroundPrompt: `Dark pixel art tech background. Deep purple and navy gradient. Pixel grid pattern. Retro terminal/computer aesthetic with scanlines. Tech hacker vibe. No characters.`,
	},
	{
		id: "cyberpunk",
		name: "Cyberpunk",
		description: "Futurista con neones",
		portraitPrompt: `Flat illustration cyberpunk portrait. Stylized cartoon with neon cyan and magenta colors. Simple cel-shaded style. Bold graphic design aesthetic. Neon glow effects on flat colors. Keep the person's likeness recognizable. Not photorealistic, illustrated look.`,
		backgroundPrompt: `Flat illustrated cyberpunk background. Simple geometric neon shapes. Cyan and magenta color blocks. Minimalist sci-fi aesthetic. Clean graphic design style. No photorealism. No characters.`,
	},
	{
		id: "anime",
		name: "Anime",
		description: "Estilo manga japonés",
		portraitPrompt: `Anime style portrait. Clean cel-shaded illustration. Big expressive eyes. Smooth skin with soft shading. Keep the person's likeness and features recognizable. Use a simple solid color background. Style should be like modern anime, beautiful and polished.`,
		backgroundPrompt: `Anime style background. Soft pastel gradient sky with subtle clouds. Cherry blossom petals floating. Dreamy and ethereal atmosphere. Warm golden hour lighting. No characters.`,
	},
	{
		id: "sticker",
		name: "Sticker",
		description: "Estilo sticker kawaii",
		portraitPrompt: `Cute sticker illustration style portrait, chest-up view. Keep the person's likeness recognizable. Thick black outlines around everything. Bright cheerful colors. Slightly chibi proportions with bigger head. Kawaii cute aesthetic. Simple cel-shaded with minimal shading. Like a vinyl sticker or emoji. White background.`,
		backgroundPrompt: `Colorful pastel gradient background. Soft pink to light blue gradient. Cute and playful aesthetic. Maybe small sparkles or stars. No characters.`,
	},
	{
		id: "ghibli",
		name: "Ghibli",
		description: "Estilo Studio Ghibli",
		portraitPrompt: `Studio Ghibli style portrait. Hand-drawn animation look. Soft warm colors. Gentle watercolor-like shading. Miyazaki anime aesthetic. Dreamy and whimsical. Simple but expressive features. Keep the person's likeness recognizable. Cozy and nostalgic feel.`,
		backgroundPrompt: `Studio Ghibli style background. Soft hand-painted clouds and sky. Warm golden hour lighting. Dreamy pastoral landscape. Watercolor texture. Peaceful and magical atmosphere. No characters.`,
	},
	{
		id: "custom",
		name: "Personalizado",
		description: "Crea tu propio estilo",
		portraitPrompt: "",
		backgroundPrompt: "",
	},
] as const;

export const CUSTOM_STYLE_ID = "custom";

export const DEFAULT_STYLE_ID = "pixel_art";

export function getStylePreset(styleId: string): BadgeStylePreset | undefined {
	return BADGE_STYLE_PRESETS.find((preset) => preset.id === styleId);
}

export function getStylePrompts(styleId: string): {
	portraitPrompt: string;
	backgroundPrompt: string;
} {
	const preset = getStylePreset(styleId);
	if (preset) {
		return {
			portraitPrompt: preset.portraitPrompt,
			backgroundPrompt: preset.backgroundPrompt,
		};
	}
	const defaultPreset = BADGE_STYLE_PRESETS.find(
		(p) => p.id === DEFAULT_STYLE_ID,
	);
	return {
		portraitPrompt: defaultPreset?.portraitPrompt ?? "",
		backgroundPrompt: defaultPreset?.backgroundPrompt ?? "",
	};
}
