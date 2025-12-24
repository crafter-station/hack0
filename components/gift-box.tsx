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

				<div className="flex items-center gap-2 mb-10 flex-wrap justify-center">
					{styles.map((style) => (
						<button
							key={style}
							onClick={() => setSelectedStyle(style)}
							className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
								selectedStyle === style
									? "bg-white text-black"
									: "bg-transparent text-gray-400 border border-gray-600 hover:border-gray-400"
							}`}
						>
							{style}
						</button>
					))}
					<span className={`${playfair.className} text-gray-400 ml-2`}>
						yourself.
					</span>
				</div>

				<div className="w-64 h-64 md:w-72 md:h-72 border-2 border-dashed border-gray-600 rounded-3xl flex items-center justify-center mb-8 overflow-hidden">
					{image ? (
						<img
							src={image}
							alt="Uploaded"
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="text-gray-600" />
					)}
				</div>

				<div className="flex flex-col gap-3 w-full max-w-xs">
					<button className="w-full py-3 px-6 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors">
						Enable Camera
					</button>
					<button
						onClick={() => fileInputRef.current?.click()}
						className="w-full py-3 px-6 bg-transparent text-white border border-gray-600 rounded-full font-medium hover:border-gray-400 transition-colors"
					>
						Upload Image
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleUpload}
						className="hidden"
					/>

				</div>

				<footer className="mt-auto pt-16 text-gray-500 text-sm">
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
