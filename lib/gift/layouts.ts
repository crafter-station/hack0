export const GIFT_CARD_LAYOUTS = [
	"warm_cream",
	"forest_green",
	"night_blue",
	"soft_red",
	"pure_white",
] as const;

export type GiftCardLayoutId = (typeof GIFT_CARD_LAYOUTS)[number];

export interface LayoutConfig {
	id: GiftCardLayoutId;
	name: string;
	backgroundColor: string;
	textColor: string;
	mutedColor: string;
	accentColor: string;
}

export const LAYOUT_CONFIGS: Record<GiftCardLayoutId, LayoutConfig> = {
	warm_cream: {
		id: "warm_cream",
		name: "Crema Cálido",
		backgroundColor: "#faf7f2",
		textColor: "#1c1917",
		mutedColor: "#78716c",
		accentColor: "#d6d3d1",
	},
	forest_green: {
		id: "forest_green",
		name: "Verde Bosque",
		backgroundColor: "#f0f5f1",
		textColor: "#14532d",
		mutedColor: "#4d7c5f",
		accentColor: "#d1e7d7",
	},
	night_blue: {
		id: "night_blue",
		name: "Azul Noche",
		backgroundColor: "#1a1f2e",
		textColor: "#f1f5f9",
		mutedColor: "#94a3b8",
		accentColor: "#334155",
	},
	soft_red: {
		id: "soft_red",
		name: "Rojo Suave",
		backgroundColor: "#fef7f7",
		textColor: "#7f1d1d",
		mutedColor: "#b45454",
		accentColor: "#fecaca",
	},
	pure_white: {
		id: "pure_white",
		name: "Blanco Puro",
		backgroundColor: "#ffffff",
		textColor: "#0f0f0f",
		mutedColor: "#737373",
		accentColor: "#e5e5e5",
	},
};

export function getRandomLayout(): GiftCardLayoutId {
	return GIFT_CARD_LAYOUTS[
		Math.floor(Math.random() * GIFT_CARD_LAYOUTS.length)
	];
}

export function getLayoutConfig(layoutId: GiftCardLayoutId): LayoutConfig {
	return LAYOUT_CONFIGS[layoutId] || LAYOUT_CONFIGS.warm_cream;
}
