"use client";

import { useEffect, useState } from "react";

interface Snowflake {
	id: number;
	left: number;
	animationDuration: number;
	animationDelay: number;
	startY: number;
	size: number;
	opacity: number;
	char: string;
}

const SNOW_CHARS = ["*", "✦", "·", "•", "+", "×"];

export function Snowfall() {
	const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

	useEffect(() => {
		const flakes: Snowflake[] = Array.from({ length: 40 }, (_, i) => {
			const duration = 12 + Math.random() * 18;
			return {
				id: i,
				left: Math.random() * 100,
				animationDuration: duration,
				animationDelay: -Math.random() * duration,
				startY: Math.random() * 100,
				size: 8 + Math.random() * 8,
				opacity: 0.15 + Math.random() * 0.3,
				char: SNOW_CHARS[Math.floor(Math.random() * SNOW_CHARS.length)],
			};
		});
		setSnowflakes(flakes);
	}, []);

	return (
		<div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
			{snowflakes.map((flake) => (
				<div
					key={flake.id}
					className="absolute font-mono animate-snowfall"
					style={{
						left: `${flake.left}%`,
						fontSize: `${flake.size}px`,
						opacity: flake.opacity,
						animationDuration: `${flake.animationDuration}s`,
						animationDelay: `${flake.animationDelay}s`,
						color: "#fafafa",
					}}
				>
					{flake.char}
				</div>
			))}
			<style jsx>{`
				@keyframes snowfall {
					0% {
						transform: translateY(-20px) rotate(0deg);
					}
					100% {
						transform: translateY(100vh) rotate(360deg);
					}
				}
				.animate-snowfall {
					animation: snowfall linear infinite;
				}
			`}</style>
		</div>
	);
}
