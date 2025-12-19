/** @jsxImportSource react */
import { ImageResponse } from "@takumi-rs/image-response";

export const runtime = "nodejs";

export async function GET() {
	return new ImageResponse(
		<div
			style={{
				width: "1200px",
				height: "630px",
				display: "flex",
				position: "relative",
				backgroundColor: "#09090b",
				overflow: "hidden",
			}}
		>
			{/* Gradient background */}
			<div
				style={{
					background:
						"linear-gradient(135deg, rgba(204, 208, 201, 0.1) 0%, rgba(210, 152, 80, 0.1) 33%, rgba(114, 177, 191, 0.1) 66%, rgba(99, 78, 88, 0.1) 100%)",
					position: "absolute",
					inset: "0",
				}}
			/>

			{/* Content */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					padding: "60px",
					position: "relative",
					width: "100%",
					height: "100%",
					textAlign: "center",
				}}
			>
				{/* Logo/Title */}
				<div
					style={{
						fontSize: "80px",
						fontWeight: "700",
						color: "#fafafa",
						letterSpacing: "-0.02em",
						marginBottom: "24px",
					}}
				>
					hack0.dev
				</div>

				{/* Subtitle */}
				<div
					style={{
						fontSize: "36px",
						color: "#a1a1aa",
						marginBottom: "48px",
						maxWidth: "900px",
					}}
				>
					Hackathons y eventos tech en Perú 🇵🇪
				</div>

				{/* Stats */}
				<div
					style={{
						display: "flex",
						gap: "64px",
						fontSize: "24px",
						color: "#71717a",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							alignItems: "center",
						}}
					>
						<div
							style={{
								fontSize: "48px",
								fontWeight: "700",
								color: "#fafafa",
							}}
						>
							Todos
						</div>
						<div
							style={{
								fontSize: "18px",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
							}}
						>
							los eventos
						</div>
					</div>

					<div
						style={{
							width: "2px",
							height: "80px",
							backgroundColor: "rgba(250, 250, 250, 0.1)",
						}}
					/>

					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							alignItems: "center",
						}}
					>
						<div
							style={{
								fontSize: "48px",
								fontWeight: "700",
								color: "#fafafa",
							}}
						>
							En un
						</div>
						<div
							style={{
								fontSize: "18px",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
							}}
						>
							solo lugar
						</div>
					</div>
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
