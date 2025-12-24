"use client";

import { useState, useRef } from "react";
import { Playfair_Display } from "next/font/google";
import "./gift-box.css";

const playfair = Playfair_Display({
	subsets: ["latin"],
	style: ["italic"],
});

const styles = ["Crafter", "Santa", "Pixel", "Gamer!"];

export default function GiftBox() {
	const [showForm, setShowForm] = useState(false);
	const [selectedStyle, setSelectedStyle] = useState("Crafter");
	const [image, setImage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setImage(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	if (showForm) {
		return (
			<div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center px-4 py-12 w-full">
				<h1
					className={`${playfair.className} text-4xl md:text-5xl text-white mb-8`}
				>
					crafter yourself.
				</h1>

				<div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
					{styles.map((style) => (
						<button
							key={style}
							onClick={() => setSelectedStyle(style)}
							className={`px-3 py-1.5 text-xs font-medium transition-colors ${
								selectedStyle === style
									? "bg-foreground text-background"
									: "border border-foreground/50 text-foreground bg-transparent hover:bg-foreground hover:text-background"
							}`}
						>
							{style}
						</button>
					))}
					<span className={`${playfair.className} text-muted-foreground ml-2 text-sm`}>
						yourself.
					</span>
				</div>

				<div className="w-64 h-64 md:w-72 md:h-72 border border-border/50 flex items-center justify-center mb-8 overflow-hidden cursor-pointer hover:bg-muted/20 transition-colors"
					onClick={() => fileInputRef.current?.click()}>
					{image ? (
						<img
							src={image}
							alt="Uploaded"
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="text-muted-foreground text-sm text-center px-4">
							Click to upload or drag and drop
						</div>
					)}
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleUpload}
						className="hidden"
					/>
				</div>

				<div className="flex flex-col gap-3 w-full max-w-xs">
					<button className="w-full h-7 px-3 bg-foreground text-background font-medium text-xs hover:bg-foreground/90 transition-colors">
						Enable Camera
					</button>
					<button
						onClick={() => setShowForm(false)}
						className="w-full h-7 px-3 border border-foreground/50 text-foreground bg-transparent font-medium text-xs hover:bg-foreground hover:text-background transition-colors"
					>
						Back
					</button>
				</div>

				<footer className="mt-auto pt-16 text-muted-foreground text-xs">
					Built with v0.
				</footer>
			</div>
		);
	}

	return (
		<button
			onClick={() => setShowForm(true)}
			className="cursor-pointer hover:opacity-90 transition-opacity w-full h-full"
		>
			<div id="container">
				<div id="lid">
					<div className="front face">
						<div className="ribbon"></div>
					</div>
					<div className="back face">
						<div className="ribbon"></div>
					</div>
					<div className="left face">
						<div className="ribbon"></div>
					</div>
					<div className="right face">
						<div className="ribbon"></div>
					</div>
					<div className="top face">
						<div className="ribbon"></div>
						<div className="ribbon"></div>
					</div>
				</div>
				<div id="box">
					<div className="front face">
						<div className="ribbon"></div>
					</div>
					<div className="back face">
						<div className="ribbon"></div>
					</div>
					<div className="left face">
						<div className="ribbon"></div>
					</div>
					<div className="right face">
						<div className="ribbon"></div>
					</div>
					<div className="bottom face">
						<div className="ribbon"></div>
						<div className="ribbon"></div>
					</div>
				</div>
			</div>
		</button>
	);
}
