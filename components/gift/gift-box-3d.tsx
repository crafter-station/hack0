"use client";

import "./gift-box-3d.css";

interface GiftBox3DProps {
	size?: "sm" | "md" | "lg";
}

export function GiftBox3D({ size = "md" }: GiftBox3DProps) {
	const sizeClass = {
		sm: "gift-box-sm",
		md: "gift-box-md",
		lg: "gift-box-lg",
	}[size];

	return (
		<div className={`gift-container ${sizeClass}`}>
			<div className="gift-lid">
				<div className="gift-face front">
					<div className="gift-ribbon" />
				</div>
				<div className="gift-face back">
					<div className="gift-ribbon" />
				</div>
				<div className="gift-face left">
					<div className="gift-ribbon" />
				</div>
				<div className="gift-face right">
					<div className="gift-ribbon" />
				</div>
				<div className="gift-face top">
					<div className="gift-ribbon" />
					<div className="gift-ribbon" />
				</div>
			</div>
			<div className="gift-box">
				<div className="gift-face front">
					<div className="gift-ribbon" />
				</div>
				<div className="gift-face back">
					<div className="gift-ribbon" />
				</div>
				<div className="gift-face left">
					<div className="gift-ribbon" />
				</div>
				<div className="gift-face right">
					<div className="gift-ribbon" />
				</div>
				<div className="gift-face bottom">
					<div className="gift-ribbon" />
					<div className="gift-ribbon" />
				</div>
			</div>
		</div>
	);
}
