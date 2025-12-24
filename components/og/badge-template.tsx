/** @jsxImportSource react */

interface BadgeOGTemplateProps {
	builderId: number;
	portraitUrl?: string;
	backgroundUrl?: string;
	manifestoPhrase: string;
	verticalLabel: string;
	builderName?: string;
}

export function BadgeOGTemplate({
	builderId,
	portraitUrl,
	backgroundUrl,
	manifestoPhrase,
	verticalLabel,
	builderName,
}: BadgeOGTemplateProps) {
	const formattedId = `#${builderId.toString().padStart(4, "0")}`;

	return (
		<div
			style={{
				width: "1200px",
				height: "1200px",
				display: "flex",
				position: "relative",
				backgroundColor: "#0a0a0f",
				overflow: "hidden",
			}}
		>
			{backgroundUrl && (
				<img
					src={backgroundUrl}
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						objectFit: "cover",
					}}
				/>
			)}

			<div
				style={{
					position: "absolute",
					inset: "0",
					background:
						"linear-gradient(to bottom, rgba(10, 10, 15, 0.85) 0%, rgba(10, 10, 15, 0.2) 20%, transparent 40%, transparent 55%, rgba(10, 10, 15, 0.4) 70%, rgba(10, 10, 15, 0.95) 100%)",
				}}
			/>

			<svg
				width="64"
				height="64"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.5)"
				strokeWidth="2"
				style={{ position: "absolute", top: "40px", left: "40px" }}
			>
				<path d="M2 10 L2 2 L10 2" />
			</svg>
			<svg
				width="64"
				height="64"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.5)"
				strokeWidth="2"
				style={{ position: "absolute", top: "40px", right: "40px" }}
			>
				<path d="M22 2 L30 2 L30 10" />
			</svg>
			<svg
				width="64"
				height="64"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.5)"
				strokeWidth="2"
				style={{ position: "absolute", bottom: "40px", left: "40px" }}
			>
				<path d="M2 22 L2 30 L10 30" />
			</svg>
			<svg
				width="64"
				height="64"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.5)"
				strokeWidth="2"
				style={{ position: "absolute", bottom: "40px", right: "40px" }}
			>
				<path d="M22 30 L30 30 L30 22" />
			</svg>

			<div
				style={{
					position: "absolute",
					left: "30px",
					top: "50%",
					transform: "translateY(-50%) rotate(180deg)",
					color: "rgba(250, 250, 250, 0.8)",
					fontSize: "16px",
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
					flexDirection: "column",
					width: "100%",
					padding: "50px 70px",
					position: "relative",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						marginBottom: "20px",
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						<div
							style={{
								fontSize: "36px",
								fontWeight: "700",
								color: "#fafafa",
								letterSpacing: "-0.01em",
							}}
						>
							HACK0.DEV
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
									backgroundColor: "rgba(251, 191, 36, 0.7)",
								}}
							/>
							<div
								style={{
									fontSize: "16px",
									color: "rgba(250, 250, 250, 0.7)",
									fontFamily: "monospace",
								}}
							>
								2025
							</div>
							<div
								style={{
									height: "2px",
									width: "40px",
									backgroundColor: "rgba(251, 191, 36, 0.7)",
								}}
							/>
						</div>
					</div>
					<div
						style={{
							fontSize: "36px",
							fontWeight: "700",
							color: "#fbbf24",
							fontFamily: "monospace",
						}}
					>
						{formattedId}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{portraitUrl ? (
						<img
							src={portraitUrl}
							style={{
								width: "500px",
								height: "500px",
								objectFit: "contain",
							}}
						/>
					) : (
						<div
							style={{
								width: "500px",
								height: "500px",
								borderRadius: "24px",
								backgroundColor: "rgba(250, 250, 250, 0.05)",
								border: "3px solid rgba(250, 250, 250, 0.1)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "120px",
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
						alignItems: "center",
						gap: "16px",
						marginTop: "auto",
					}}
				>
					<div
						style={{
							fontSize: "32px",
							fontWeight: "500",
							color: "#fafafa",
							lineHeight: "1.3",
							textAlign: "center",
							maxWidth: "900px",
						}}
					>
						"{manifestoPhrase}"
					</div>

					{builderName && (
						<div
							style={{
								fontSize: "18px",
								color: "rgba(250, 250, 250, 0.8)",
								fontFamily: "monospace",
								letterSpacing: "0.2em",
								textTransform: "uppercase",
							}}
						>
							{builderName}
						</div>
					)}

					<div
						style={{
							fontSize: "28px",
							color: "#fbbf24",
							marginTop: "8px",
						}}
					>
						❄️ Feliz Navidad 2025 ❄️
					</div>
				</div>
			</div>
		</div>
	);
}
