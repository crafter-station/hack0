"use client";

import Link from "next/link";
import "./gift-box.css";

export default function GiftBox() {
	return (
		<Link
			href="/gift/upload"
			className="cursor-pointer hover:opacity-90 transition-opacity w-full h-full block"
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
		</Link>
	);
}
