export const GIFT_CARD_STYLES = [
	"cozy_christmas",
	"minimal_festive",
	"cute_christmas",
	"soft_pixel",
] as const;

export type GiftCardStyle = (typeof GIFT_CARD_STYLES)[number];

const PIXEL_ART_PROMPT = `Create a minimal festive pixel art character illustration based on the provided photo.
Clean pixel art style with simplified shapes.
Person with Santa hat or Christmas accessory.
Muted Christmas palette with gentle warmth: deep greens, soft reds, cream.
Calm friendly expression, refined pixel art.
Modern pixel art aesthetic, holiday themed.
IMPORTANT: Plain solid light gray or white background for easy cutout.
Only the character, no background elements.`;

export const STYLE_PROMPTS: Record<GiftCardStyle, string> = {
	cozy_christmas: PIXEL_ART_PROMPT,
	minimal_festive: PIXEL_ART_PROMPT,
	cute_christmas: PIXEL_ART_PROMPT,
	soft_pixel: PIXEL_ART_PROMPT,
};

export const STYLE_LABELS: Record<GiftCardStyle, string> = {
	cozy_christmas: "Navidad Acogedora",
	minimal_festive: "Festivo Minimal",
	cute_christmas: "Navidad Tierna",
	soft_pixel: "Pixel Art Suave",
};

export const MESSAGE_TONES = [
	"warm_wholesome",
	"playful_builder",
	"minimal_elegant",
	"cheerful_generic",
] as const;

export type MessageTone = (typeof MESSAGE_TONES)[number];

export function getRandomStyle(): GiftCardStyle {
	return GIFT_CARD_STYLES[Math.floor(Math.random() * GIFT_CARD_STYLES.length)];
}

export function getRandomTone(): MessageTone {
	return MESSAGE_TONES[Math.floor(Math.random() * MESSAGE_TONES.length)];
}

export const BACKGROUND_MOODS = [
	"night_cozy",
	"warm_paper",
	"pine_gold",
	"ember_glow",
] as const;

export type BackgroundMood = (typeof BACKGROUND_MOODS)[number];

export const BACKGROUND_PROMPTS: Record<BackgroundMood, string> = {
	night_cozy: `Dark Christmas night background.
Very dark navy blue base with scattered soft golden bokeh lights.
Subtle snowflakes. Mostly dark with gentle warm accents.
Keep large dark areas for text readability.
Elegant, minimal Christmas mood.
No characters, no objects, no text.`,

	warm_paper: `Dark Christmas background with subtle warm tones.
Very dark base with soft amber bokeh scattered sparsely.
Gentle golden sparkles, mostly in corners.
Keep center and edges dark for text readability.
Elegant minimal Christmas aesthetic.
No characters, no objects, no text.`,

	pine_gold: `Dark forest Christmas background.
Very dark green/black base with subtle pine silhouettes.
Sparse golden bokeh lights scattered gently.
Keep most of the image dark for text readability.
Elegant minimal forest Christmas feel.
No characters, no objects, no text.`,

	ember_glow: `Dark cozy Christmas background.
Very dark base with soft warm amber glow in corners.
Subtle golden bokeh scattered sparsely.
Keep center dark for text readability.
Elegant minimal fireplace Christmas mood.
No characters, no objects, no text.`,
};

export function getRandomBackgroundMood(): BackgroundMood {
	return BACKGROUND_MOODS[Math.floor(Math.random() * BACKGROUND_MOODS.length)];
}
