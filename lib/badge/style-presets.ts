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
		description: "Retro gaming avatar",
		portraitPrompt: `Transform this person into a pixel art video game character. 16-bit retro style like Final Fantasy or Chrono Trigger sprites. Stylized pixelated features. CRITICAL: Frame the portrait with LOTS OF EMPTY SPACE ABOVE THE HEAD - at least 20% of the image should be empty space above the top of the head. Shoulders and upper chest visible. Plain solid white background. Gaming aesthetic.`,
		backgroundPrompt: `Dark pixel art tech background. Deep purple and navy gradient. Pixel grid pattern. Retro terminal/computer aesthetic with scanlines. Tech hacker vibe. No characters.`,
	},
	{
		id: "cyberpunk",
		name: "Cyberpunk",
		description: "Neon tech futuristic",
		portraitPrompt: `Transform this person into a stylized cyberpunk digital art portrait. Neon cyan and magenta edge lighting on face. Artistic stylization - NOT photorealistic. CRITICAL: Frame with LOTS OF EMPTY SPACE ABOVE THE HEAD - at least 20% of image should be empty above the head top. Include shoulders and upper chest. Plain solid white background. Tech noir aesthetic.`,
		backgroundPrompt: `Dark cyberpunk background. Black base with neon cyan and magenta geometric grid lines. Circuit board patterns. Holographic HUD elements. Digital matrix rain. High-tech aesthetic. No characters.`,
	},
	{
		id: "custom",
		name: "Custom",
		description: "Create your own style",
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
