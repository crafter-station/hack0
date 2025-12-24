export const GIFT_CARD_STYLES = [
	"cozy_christmas",
	"minimal_festive",
	"cute_christmas",
	"soft_pixel",
] as const;

export type GiftCardStyle = (typeof GIFT_CARD_STYLES)[number];

export const STYLE_PROMPTS: Record<GiftCardStyle, string> = {
	cozy_christmas: `Create a cozy Christmas character illustration based on the provided photo.
Soft rounded shapes and gentle proportions.
Warm festive color palette with muted reds, greens, and cream tones.
Subtle shading and soft lighting.
Friendly calm expression.
Illustration feels intimate, warm, and gift-like.
Designed to feel like an illustration inside a Christmas greeting card.`,

	minimal_festive: `Create a minimal festive character illustration based on the provided photo.
Simplified shapes, reduced detail.
Muted Christmas palette with gentle warmth.
Calm friendly expression.
Feels refined, quiet, and thoughtful.`,

	cute_christmas: `Create a cute Christmas character illustration with restrained proportions based on the provided photo.
Rounded features and friendly expression.
Warm festive palette.
Soft shading and simple forms.
Cute, cozy, and respectful of the surrounding space.`,

	soft_pixel: `Create a soft playful Christmas pixel art style character based on the provided photo.
High-resolution pixel art with smooth clusters.
Warm holiday colors and low contrast.
Slightly playful proportions, friendly expression.
Clean and cozy, designed to feel comfortable inside a greeting card.`,
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
	night_cozy: `Abstract Christmas background.
Deep winter night tones with dark blues and purples.
Subtle golden speckles scattered like distant stars.
Soft vignette around edges.
Warm and intimate mood.
No characters, no objects, no scenes, no text.
Low contrast, atmospheric, calm.
Designed to sit behind a greeting card.`,

	warm_paper: `Abstract Christmas background.
Creamy warm tones with soft beiges and ivory.
Paper-like texture with gentle grain.
Soft shadows and warm highlights.
Calm and elegant mood.
No characters, no objects, no scenes, no text.
Low contrast, atmospheric.
Designed to sit behind a greeting card.`,

	pine_gold: `Abstract Christmas background.
Dark green pine tones with forest hues.
Soft gold accents and warm highlights.
Low saturation, muted colors.
Classic Christmas feel.
No characters, no objects, no scenes, no text.
Low contrast, atmospheric.
Designed to sit behind a greeting card.`,

	ember_glow: `Abstract Christmas background.
Dark background with warm amber and orange glow.
Soft gradients from dark to warm.
Cozy fireplace mood.
Intimate and warm atmosphere.
No characters, no objects, no scenes, no text.
Low contrast, atmospheric.
Designed to sit behind a greeting card.`,
};

export function getRandomBackgroundMood(): BackgroundMood {
	return BACKGROUND_MOODS[Math.floor(Math.random() * BACKGROUND_MOODS.length)];
}
