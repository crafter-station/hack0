/** @jsxImportSource react */
import { ImageResponse } from "@takumi-rs/image-response";

export const runtime = "nodejs";

const brand = {
	black: "#050605",
	paper: "#F3F1E8",
	green: "#22FF66",
	forest: "#063B26",
	grid: "#7FBF9A",
	muted: "#A1A1AA",
};

function BlockZero({ size = 120 }: { size?: number }) {
	return (
		<svg width={size} height={size * 1.5} viewBox="20.3 23.1 34.1 51.2">
			<polygon
				fill={brand.green}
				points="28.1 23.1 20.4 31.1 20.4 32.4 45.5 32.3 45.5 48.2 54.4 48.2 54.4 23.1"
			/>
			<polygon
				fill={brand.paper}
				points="28.9 32.3 20.4 32.4 20.3 74.3 47.2 74.3 54.4 67.6 54.4 52.8 45.4 52.8 45.4 65.4 28.9 65.4"
			/>
		</svg>
	);
}

export async function GET() {
	return new ImageResponse(
		<div
			style={{
				width: "1200px",
				height: "630px",
				display: "flex",
				position: "relative",
				backgroundColor: brand.black,
				color: brand.paper,
				overflow: "hidden",
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: "0",
					backgroundImage:
						"linear-gradient(rgba(127, 191, 154, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127, 191, 154, 0.08) 1px, transparent 1px)",
					backgroundSize: "48px 48px",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: "56px",
					left: "64px",
					width: "150px",
					height: "48px",
					backgroundColor: brand.green,
				}}
			/>
			<div
				style={{
					position: "absolute",
					right: "70px",
					bottom: "-42px",
					opacity: 0.18,
					transform: "scale(3.4)",
				}}
			>
				<BlockZero size={110} />
			</div>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "64px",
					position: "relative",
					width: "100%",
					height: "100%",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "18px",
							fontSize: "40px",
							fontWeight: 800,
							letterSpacing: "-0.02em",
						}}
					>
						<span>hack</span>
						<BlockZero size={36} />
						<span style={{ color: brand.grid, fontFamily: "monospace" }}>
							.dev
						</span>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "10px",
							color: brand.green,
							fontFamily: "monospace",
							fontSize: "18px",
						}}
					>
						<span>active-cell</span>
						<span
							style={{ width: "14px", height: "14px", background: brand.green }}
						/>
					</div>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
					<div
						style={{
							fontSize: "78px",
							fontWeight: 800,
							lineHeight: 0.96,
							letterSpacing: "-0.03em",
							maxWidth: "920px",
						}}
					>
						LATAM Agentic Builder Index
					</div>
					<div
						style={{
							fontSize: "30px",
							color: brand.grid,
							maxWidth: "760px",
							lineHeight: 1.25,
						}}
					>
						Eventos, hackathons, comunidades y oportunidades para builders.
					</div>
				</div>

				<div
					style={{
						display: "flex",
						gap: "18px",
						fontFamily: "monospace",
						fontSize: "18px",
						color: brand.muted,
					}}
				>
					<span style={{ color: brand.green }}>live index</span>
					<span>/</span>
					<span>event grid</span>
					<span>/</span>
					<span>builder map</span>
				</div>
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
			format: "png",
		},
	);
}
