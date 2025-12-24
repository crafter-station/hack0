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
						"linear-gradient(to bottom, rgba(10, 10, 15, 0.85) 0%, rgba(10, 10, 15, 0.2) 15%, transparent 35%, transparent 60%, rgba(10, 10, 15, 0.5) 75%, rgba(10, 10, 15, 0.95) 100%)",
				}}
			/>

			<svg
				width="80"
				height="80"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.5)"
				strokeWidth="2"
				style={{ position: "absolute", top: "40px", left: "40px" }}
			>
				<path d="M2 10 L2 2 L10 2" />
			</svg>
			<svg
				width="80"
				height="80"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.5)"
				strokeWidth="2"
				style={{ position: "absolute", top: "40px", right: "40px" }}
			>
				<path d="M22 2 L30 2 L30 10" />
			</svg>
			<svg
				width="80"
				height="80"
				viewBox="0 0 32 32"
				fill="none"
				stroke="rgba(250, 250, 250, 0.5)"
				strokeWidth="2"
				style={{ position: "absolute", bottom: "40px", left: "40px" }}
			>
				<path d="M2 22 L2 30 L10 30" />
			</svg>
			<svg
				width="80"
				height="80"
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
					left: "35px",
					top: "0",
					bottom: "0",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: "8px",
					color: "rgba(250, 250, 250, 0.6)",
					fontSize: "18px",
					fontWeight: "700",
					letterSpacing: "0.3em",
					fontFamily: "monospace",
				}}
			>
				{verticalLabel.split("").map((char, i) => (
					<span key={i}>{char}</span>
				))}
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					width: "100%",
					padding: "50px 80px",
					position: "relative",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						marginBottom: "10px",
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						<div
							style={{
								fontSize: "56px",
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
								gap: "16px",
							}}
						>
							<div
								style={{
									height: "3px",
									width: "50px",
									backgroundColor: "rgba(251, 191, 36, 0.7)",
								}}
							/>
							<div
								style={{
									fontSize: "24px",
									color: "rgba(250, 250, 250, 0.7)",
									fontFamily: "monospace",
								}}
							>
								2025
							</div>
							<div
								style={{
									height: "3px",
									width: "50px",
									backgroundColor: "rgba(251, 191, 36, 0.7)",
								}}
							/>
						</div>
					</div>
					<div
						style={{
							fontSize: "56px",
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
								width: "650px",
								height: "650px",
								objectFit: "contain",
							}}
						/>
					) : (
						<div
							style={{
								width: "650px",
								height: "650px",
								borderRadius: "24px",
								backgroundColor: "rgba(250, 250, 250, 0.05)",
								border: "3px solid rgba(250, 250, 250, 0.1)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "150px",
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
						gap: "12px",
						marginTop: "auto",
					}}
				>
					<div
						style={{
							fontSize: "42px",
							fontWeight: "500",
							color: "#fafafa",
							lineHeight: "1.3",
							textAlign: "center",
							maxWidth: "1000px",
						}}
					>
						"{manifestoPhrase}"
					</div>

					{builderName && (
						<div
							style={{
								fontSize: "24px",
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
							display: "flex",
							alignItems: "center",
							gap: "16px",
							marginTop: "4px",
						}}
					>
						<div
							style={{
								width: "40px",
								height: "3px",
								backgroundColor: "#fbbf24",
							}}
						/>
						<div
							style={{
								fontSize: "36px",
								color: "#fbbf24",
							}}
						>
							Feliz Navidad 2025
						</div>
						<div
							style={{
								width: "40px",
								height: "3px",
								backgroundColor: "#fbbf24",
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
