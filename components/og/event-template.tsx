/** @jsxImportSource react */
import type { CSSProperties } from "react";

interface EventOGTemplateProps {
	eventName: string;
	organizerName: string;
	organizerAvatar?: string;
	eventImage?: string;
	date: string;
	location: string;
	prizePool?: string;
	eventType: string;
	skillLevel?: string;
	status?: "open" | "upcoming" | "ongoing" | "ended";
	isJuniorFriendly?: boolean;
}

const brand = {
	black: "#050605",
	paper: "#F3F1E8",
	green: "#35C982",
	forest: "#0B2B1F",
	grid: "#83A990",
	muted: "#A1A1AA",
	amber: "#FFB020",
};

function BlockZero({ size = 34 }: { size?: number }) {
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

export function EventOGTemplate({
	eventName,
	organizerName,
	organizerAvatar,
	eventImage,
	date,
	location,
	prizePool,
	eventType,
	skillLevel,
	status = "upcoming",
}: EventOGTemplateProps) {
	const statusColors: Record<
		string,
		{ bg: string; text: string; dot: string }
	> = {
		ongoing: {
			bg: "rgba(53, 201, 130, 0.14)",
			text: brand.green,
			dot: brand.green,
		},
		open: {
			bg: "rgba(53, 201, 130, 0.14)",
			text: brand.green,
			dot: brand.green,
		},
		upcoming: {
			bg: "rgba(127, 191, 154, 0.14)",
			text: brand.grid,
			dot: brand.grid,
		},
		ended: {
			bg: "rgba(161, 161, 170, 0.12)",
			text: brand.muted,
			dot: brand.muted,
		},
	};

	const statusLabels: Record<string, string> = {
		ongoing: "En curso",
		open: "Abierto",
		upcoming: "Próximamente",
		ended: "Finalizado",
	};

	const currentStatus = statusColors[status];
	const statusLabel = statusLabels[status];

	const gradientOverlay: CSSProperties = {
		background:
			"linear-gradient(135deg, rgba(53, 201, 130, 0.1) 0%, rgba(11, 43, 31, 0.18) 42%, rgba(5, 6, 5, 0) 100%)",
		position: "absolute",
		inset: "0",
	};

	const noisePattern: CSSProperties = {
		backgroundImage:
			"linear-gradient(rgba(127, 191, 154, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127, 191, 154, 0.08) 1px, transparent 1px)",
		backgroundSize: "48px 48px",
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
				backgroundColor: brand.black,
				overflow: "hidden",
			}}
		>
			{/* Background gradient */}
			<div style={gradientOverlay} />

			{/* Noise texture */}
			<div style={noisePattern} />

			{/* Event image background (if available) */}
			{eventImage && (
				<div
					style={{
						position: "absolute",
						inset: "0",
						display: "flex",
					}}
				>
					<img
						src={eventImage}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
							opacity: 0.25,
						}}
					/>
					<div
						style={{
							position: "absolute",
							inset: "0",
							background:
								"linear-gradient(to right, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.7))",
						}}
					/>
				</div>
			)}

			{/* Content */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "60px",
					position: "relative",
					width: "100%",
				}}
			>
				{/* Header - Logo + Status */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "14px",
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "10px",
								fontSize: "32px",
								fontWeight: "800",
								color: brand.paper,
								letterSpacing: "-0.02em",
							}}
						>
							<span>hack</span>
							<BlockZero size={26} />
							<span style={{ color: brand.grid, fontFamily: "monospace" }}>
								.dev
							</span>
						</div>
					</div>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							backgroundColor: currentStatus.bg,
							color: currentStatus.text,
							padding: "10px 20px",
							borderRadius: "0",
							fontSize: "18px",
							fontWeight: "600",
							fontFamily: "monospace",
						}}
					>
						<div
							style={{
								width: "10px",
								height: "10px",
								backgroundColor: currentStatus.dot,
							}}
						/>
						{statusLabel}
					</div>
				</div>

				{/* Event Info */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "24px",
						maxWidth: "900px",
					}}
				>
					{/* Badges */}
					<div
						style={{
							display: "flex",
							gap: "12px",
							alignItems: "center",
							flexWrap: "wrap",
						}}
					>
						<div
							style={{
								backgroundColor: "rgba(250, 250, 250, 0.1)",
								color: brand.grid,
								padding: "8px 16px",
								borderRadius: "0",
								fontSize: "16px",
								fontWeight: "500",
								fontFamily: "monospace",
							}}
						>
							{eventType}
						</div>
						{(skillLevel === "beginner" || skillLevel === "all") && (
							<div
								style={{
									backgroundColor: "rgba(255, 176, 32, 0.15)",
									color: brand.amber,
									padding: "8px 16px",
									borderRadius: "0",
									fontSize: "16px",
									fontWeight: "500",
									display: "flex",
									alignItems: "center",
									gap: "6px",
								}}
							>
								✨ Junior Friendly
							</div>
						)}
					</div>

					{/* Event name */}
					<div
						style={{
							fontSize: "64px",
							fontWeight: "700",
							color: brand.paper,
							lineHeight: "1.1",
							letterSpacing: "-0.02em",
							maxHeight: "140px",
							overflow: "hidden",
						}}
					>
						{eventName}
					</div>

					{/* Meta info */}
					<div
						style={{
							display: "flex",
							gap: "32px",
							fontSize: "22px",
							color: brand.grid,
							flexWrap: "wrap",
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
							📅 {date}
						</div>
						<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
							📍 {location}
						</div>
						{prizePool && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									color: brand.amber,
									fontWeight: "600",
								}}
							>
								🏆 {prizePool}
							</div>
						)}
					</div>
				</div>

				{/* Footer - Organizer */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "16px",
						borderTop: "1px solid rgba(127, 191, 154, 0.22)",
						paddingTop: "24px",
					}}
				>
					{organizerAvatar ? (
						<img
							src={organizerAvatar}
							style={{
								width: "48px",
								height: "48px",
								borderRadius: "0",
								border: "2px solid rgba(127, 191, 154, 0.35)",
							}}
						/>
					) : (
						<div
							style={{
								width: "48px",
								height: "48px",
								borderRadius: "0",
								backgroundColor: brand.forest,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "20px",
								fontWeight: "600",
								color: brand.grid,
								lineHeight: "48px",
								textAlign: "center",
							}}
						>
							{organizerName.charAt(0).toUpperCase()}
						</div>
					)}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "4px",
						}}
					>
						<div
							style={{
								fontSize: "14px",
								color: brand.grid,
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							Organizado por
						</div>
						<div
							style={{
								fontSize: "20px",
								fontWeight: "600",
								color: brand.paper,
							}}
						>
							{organizerName}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
