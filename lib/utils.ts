import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function sanitizeImageUrl(
	url: string | null | undefined,
): string | undefined {
	if (!url) return undefined;
	if (url.startsWith("//")) return `https:${url}`;
	return url;
}
