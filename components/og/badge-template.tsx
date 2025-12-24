/** @jsxImportSource react */
import type { CSSProperties } from "react";

interface BadgeOGTemplateProps {
	builderId: number;
	portraitUrl?: string;
	manifestoPhrase: string;
	verticalLabel: string;
	builderName?: string;
}

export function BadgeOGTemplate({
	builderId,
	portraitUrl,
	manifestoPhrase,
	verticalLabel,
	builderName,
}: BadgeOGTemplateProps) {
	const formattedId = `#${builderId.toString().padStart(4, "0")}`;

	const gridPattern: CSSProperties = {
		backgroundImage: `
			linear-gradient(rgba(250, 250, 250, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(250, 250, 250, 0.03) 1px, transparent 1px)
		`,
		backgroundSize: "32px 32px",
		position: "absolute",
		inset: "0",
	};

	return (
		<div
			style={{
				width: "1200px",
				height: "630px",
				display: "flex",
				position: "relative",
				backgroundColor: "#0a0a0f",
				overflow: "hidden",
			}}
		>
			<div style={gridPattern} />

			<div
				style={{
					position: "absolute",
					inset: "0",
					background:
						"radial-gradient(ellipse at center, transparent 0%, #0a0a0f 70%)",
				}}
			/>

			<svg
				width="48"
				height="48"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.2)"
				strokeWidth="2"
				style={{ position: "absolute", top: "40px", left: "40px" }}
			>
				<path d="M2 10 L2 2 L10 2" />
			</svg>
			<svg
				width="48"
				height="48"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.2)"
				strokeWidth="2"
				style={{ position: "absolute", top: "40px", right: "40px" }}
			>
				<path d="M22 2 L30 2 L30 10" />
			</svg>
			<svg
				width="48"
				height="48"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.2)"
				strokeWidth="2"
				style={{ position: "absolute", bottom: "40px", left: "40px" }}
			>
				<path d="M2 22 L2 30 L10 30" />
			</svg>
			<svg
				width="48"
				height="48"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.2)"
				strokeWidth="2"
				style={{ position: "absolute", bottom: "40px", right: "40px" }}
			>
				<path d="M22 30 L30 30 L30 22" />
			</svg>

			<div
				style={{
					position: "absolute",
					left: "20px",
					top: "50%",
					transform: "translateY(-50%) rotate(180deg)",
					color: "rgba(250, 250, 250, 0.15)",
					fontSize: "14px",
					fontWeight: "700",
					letterSpacing: "0.4em",
					fontFamily: "monospace",
					writingMode: "vertical-rl",
				}}
			>
				{verticalLabel}
			</div>

			<div
				style={{
					display: "flex",
					width: "100%",
					padding: "60px 80px",
					position: "relative",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "340px",
						flexShrink: 0,
					}}
				>
					{portraitUrl ? (
						<div
							style={{
								position: "relative",
								display: "flex",
							}}
						>
							<div
								style={{
									position: "absolute",
									inset: "-8px",
									background:
										"linear-gradient(135deg, rgba(16, 185, 129, 0.3), transparent, rgba(245, 158, 11, 0.3))",
									borderRadius: "24px",
									filter: "blur(20px)",
								}}
							/>
							<img
								src={portraitUrl}
								style={{
									width: "280px",
									height: "280px",
									borderRadius: "20px",
									objectFit: "cover",
									border: "3px solid rgba(250, 250, 250, 0.1)",
								}}
							/>
						</div>
					) : (
						<div
							style={{
								width: "280px",
								height: "280px",
								borderRadius: "20px",
								backgroundColor: "rgba(250, 250, 250, 0.05)",
								border: "3px solid rgba(250, 250, 250, 0.1)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "80px",
								color: "rgba(250, 250, 250, 0.3)",
							}}
						>
							🎄
						</div>
					)}
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						flex: 1,
						paddingLeft: "60px",
						gap: "24px",
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						<div
							style={{
								display: "flex",
								alignItems: "baseline",
								gap: "16px",
							}}
						>
							<div
								style={{
									fontSize: "42px",
									fontWeight: "700",
									color: "#fafafa",
									letterSpacing: "-0.02em",
								}}
							>
								BUILDER LATAM
							</div>
							<div
								style={{
									fontSize: "36px",
									fontWeight: "700",
									color: "#10b981",
									fontFamily: "monospace",
								}}
							>
								{formattedId}
							</div>
						</div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "12px",
							}}
						>
							<div
								style={{
									height: "2px",
									width: "40px",
									backgroundColor: "rgba(16, 185, 129, 0.5)",
								}}
							/>
							<div
								style={{
									fontSize: "18px",
									color: "rgba(250, 250, 250, 0.4)",
									fontFamily: "monospace",
								}}
							>
								2025
							</div>
							<div
								style={{
									height: "2px",
									width: "40px",
									backgroundColor: "rgba(16, 185, 129, 0.5)",
								}}
							/>
						</div>
					</div>

					<div
						style={{
							fontSize: "32px",
							fontWeight: "500",
							color: "#fafafa",
							lineHeight: "1.3",
							maxWidth: "580px",
						}}
					>
						"{manifestoPhrase}"
					</div>

					{builderName && (
						<div
							style={{
								fontSize: "16px",
								color: "rgba(250, 250, 250, 0.5)",
								fontFamily: "monospace",
								letterSpacing: "0.15em",
								textTransform: "uppercase",
							}}
						>
							{builderName}
						</div>
					)}

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "16px",
							marginTop: "auto",
						}}
					>
						<div
							style={{
								height: "1px",
								width: "32px",
								backgroundColor: "rgba(250, 250, 250, 0.2)",
							}}
						/>
						<div
							style={{
								fontSize: "14px",
								color: "rgba(250, 250, 250, 0.3)",
								fontFamily: "monospace",
								letterSpacing: "0.1em",
							}}
						>
							hack0.dev
						</div>
						<div
							style={{
								height: "1px",
								width: "32px",
								backgroundColor: "rgba(250, 250, 250, 0.2)",
							}}
						/>
						<div
							style={{
								fontSize: "14px",
								color: "rgba(245, 158, 11, 0.6)",
							}}
						>
							🎄 Feliz Navidad 2025
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
