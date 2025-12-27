"use client";

import { useEffect } from "react";

export function DarkColorScheme() {
	useEffect(() => {
		const html = document.documentElement;
		const prevColorScheme = html.style.colorScheme;
		const prevBg = html.style.backgroundColor;

		html.style.colorScheme = "dark";
		html.style.backgroundColor = "hsl(240 10% 3.9%)";

		return () => {
			html.style.colorScheme = prevColorScheme;
			html.style.backgroundColor = prevBg;
		};
	}, []);

	return null;
}
