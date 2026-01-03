export const DEFAULT_BADGE_STYLE_PROMPT = `8-bit pixel-art portrait. Keep the person's likeness and features recognizable. Use a simple solid color background. Style should be cartoonish, anime inspired, cute and tender soft.`;

export const DEFAULT_BADGE_BACKGROUND_PROMPT = `Abstract tech-inspired background pattern.
Modern gradient with geometric shapes.
Dark navy or deep purple base with accent colors.
Subtle grid or circuit board pattern in corners.
IMPORTANT: Keep center area darker and less busy for portrait overlay.
Vignette effect - details on edges, cleaner center.
No text, clean vector-like aesthetic.`;

export const ROLE_LABELS: Record<string, string> = {
	owner: "Fundador",
	admin: "Admin",
	member: "Miembro",
	follower: "Seguidor",
};

export const ROLE_BADGE_COLORS: Record<
	string,
	{ primary: string; secondary: string }
> = {
	owner: { primary: "#FFD700", secondary: "#FFA500" },
	admin: { primary: "#9B59B6", secondary: "#8E44AD" },
	member: { primary: "#3498DB", secondary: "#2980B9" },
	follower: { primary: "#95A5A6", secondary: "#7F8C8D" },
};
