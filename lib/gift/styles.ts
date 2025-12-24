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
	night_cozy: `Pixel art Christmas night sky background.
Retro 16-bit style, clean pixel aesthetic.
Dark navy blue sky with pixel star pattern.
Large glowing pixel moon in TOP corner.
Santa sleigh silhouette in corner of sky.
IMPORTANT: Keep center very dark and empty.
Details and decorations only on edges and corners.
Vignette effect - darker center, elements on borders.
No text, simple pixel art style.`,

	warm_paper: `Pixel art cozy Christmas scene.
Retro 16-bit game aesthetic, clean pixels.
Dark brick wall as main background.
Christmas stockings hanging at BOTTOM edge only.
Warm amber glow from corners.
IMPORTANT: Keep center very dark and empty.
All decorative elements pushed to edges and corners.
Vignette effect for center focus area.
No text, simple pixel art style.`,

	pine_gold: `Pixel art snowy window scene.
Retro 16-bit style, clean pixel aesthetic.
Window frame elements only on EDGES of image.
Snowy pine trees visible only at corners.
Dark night sky fills the center.
IMPORTANT: Keep center very dark and minimal.
Decorations and details only on borders.
Large empty dark area in middle.
No text, simple pixel art style.`,

	ember_glow: `Pixel art Christmas background.
Retro 16-bit game aesthetic, clean pixels.
Christmas tree branches only at CORNERS.
Ornaments and lights only on edges.
Dark brick wall in center area.
IMPORTANT: Keep center very dark and empty.
Push all colorful elements to borders.
Vignette effect - empty middle, details on edges.
No text, simple pixel art style.`,
};

export function getRandomBackgroundMood(): BackgroundMood {
	return BACKGROUND_MOODS[Math.floor(Math.random() * BACKGROUND_MOODS.length)];
}

export const COVER_BACKGROUND_PROMPTS: Record<BackgroundMood, string> = {
	night_cozy: `Pixel art magical Christmas night scene.
Retro 16-bit style, vibrant and festive.
Dark navy blue sky with bright pixel stars.
Large glowing yellow moon with Santa sleigh crossing.
Snowy rooftops and chimneys at bottom.
Twinkling Christmas lights everywhere.
Colorful and magical holiday atmosphere.
No text, pixel art style.`,

	warm_paper: `Pixel art cozy Christmas fireplace scene.
Retro 16-bit game aesthetic, warm and inviting.
Stone fireplace with crackling orange fire.
Colorful Christmas stockings hanging in a row.
Decorated mantle with garland and lights.
Warm amber glow fills the scene.
Festive and cozy holiday feeling.
No text, pixel art style.`,

	pine_gold: `Pixel art snowy Christmas window scene.
Retro 16-bit style, magical and bright.
Beautiful arched wooden window frame.
View of snowy pine forest outside.
Falling snowflakes and twinkling stars.
Frost patterns on window edges.
Warm candlelight reflecting on glass.
No text, pixel art style.`,

	ember_glow: `Pixel art decorated Christmas tree scene.
Retro 16-bit game aesthetic, colorful and festive.
Full Christmas tree with ornaments and lights.
Red, gold, and silver pixel decorations.
Glowing star on top of tree.
Wrapped presents at the base.
Warm magical Christmas atmosphere.
No text, pixel art style.`,
};
