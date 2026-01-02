/** @jsxImportSource react */

interface CommunityBadgeOGTemplateProps {
	badgeNumber: number;
	portraitUrl?: string;
	backgroundUrl?: string;
	memberName?: string;
	memberRole: string;
	communityName: string;
	communityLogo?: string;
	primaryColor?: string;
	secondaryColor?: string;
}

const ROLE_LABELS: Record<string, string> = {
	owner: "Fundador",
	admin: "Admin",
	member: "Miembro",
	follower: "Seguidor",
};

export function CommunityBadgeOGTemplate({
	badgeNumber,
	portraitUrl,
	backgroundUrl,
	memberName,
	memberRole,
	communityName,
	communityLogo,
	primaryColor = "#3b82f6",
	secondaryColor = "#1d4ed8",
}: CommunityBadgeOGTemplateProps) {
	const formattedId = `#${badgeNumber.toString().padStart(4, "0")}`;
	const roleLabel = ROLE_LABELS[memberRole] || memberRole;

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
						"linear-gradient(to bottom, rgba(10, 10, 15, 0.9) 0%, rgba(10, 10, 15, 0.3) 20%, transparent 40%, transparent 60%, rgba(10, 10, 15, 0.6) 80%, rgba(10, 10, 15, 0.95) 100%)",
				}}
			/>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					width: "100%",
					padding: "50px",
					position: "relative",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "30px",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
						{communityLogo && (
							<img
								src={communityLogo}
								style={{
									width: "80px",
									height: "80px",
									borderRadius: "16px",
									objectFit: "cover",
									border: "3px solid rgba(255, 255, 255, 0.2)",
								}}
							/>
						)}
						<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
							<div
								style={{
									fontSize: "48px",
									fontWeight: "700",
									color: "#fafafa",
									letterSpacing: "-0.02em",
								}}
							>
								{communityName}
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
										padding: "6px 16px",
										borderRadius: "999px",
										fontSize: "20px",
										fontWeight: "600",
										color: "#fff",
										background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
									}}
								>
									{roleLabel}
								</div>
							</div>
						</div>
					</div>
					<div
						style={{
							fontSize: "56px",
							fontWeight: "700",
							color: primaryColor,
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
						<div
							style={{
								position: "relative",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								style={{
									position: "absolute",
									width: "700px",
									height: "700px",
									borderRadius: "50%",
									background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`,
									filter: "blur(60px)",
								}}
							/>
							<img
								src={portraitUrl}
								style={{
									width: "600px",
									height: "600px",
									objectFit: "contain",
									position: "relative",
								}}
							/>
						</div>
					) : (
						<div
							style={{
								width: "600px",
								height: "600px",
								borderRadius: "50%",
								backgroundColor: "rgba(250, 250, 250, 0.05)",
								border: `4px solid ${primaryColor}`,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "150px",
								color: "rgba(250, 250, 250, 0.3)",
							}}
						>
							🏅
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
					{memberName && (
						<div
							style={{
								fontSize: "56px",
								fontWeight: "700",
								color: "#fafafa",
								textAlign: "center",
							}}
						>
							{memberName}
						</div>
					)}

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "16px",
						}}
					>
						<div
							style={{
								width: "40px",
								height: "3px",
								backgroundColor: "rgba(255, 255, 255, 0.3)",
							}}
						/>
						<div
							style={{
								fontSize: "24px",
								color: "rgba(250, 250, 250, 0.6)",
								fontFamily: "monospace",
							}}
						>
							hack0.dev
						</div>
						<div
							style={{
								width: "40px",
								height: "3px",
								backgroundColor: "rgba(255, 255, 255, 0.3)",
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
