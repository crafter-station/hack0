import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Text,
} from "@react-email/components";

interface CommunityInviteEmailProps {
	inviterName: string;
	communityName: string;
	communityLogoUrl?: string | null;
	roleGranted: string;
	acceptUrl: string;
	recipientEmail: string;
}

const ROLE_LABELS: Record<string, string> = {
	admin: "Administrador",
	member: "Miembro",
	follower: "Seguidor",
};

export function CommunityInviteEmail({
	inviterName,
	communityName,
	roleGranted,
	acceptUrl,
	recipientEmail,
}: CommunityInviteEmailProps) {
	const roleLabel = ROLE_LABELS[roleGranted] || roleGranted;

	return (
		<Html>
			<Head />
			<Preview>
				{inviterName} te invitó a unirte a {communityName}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>hack0.dev</Heading>
					<Text style={heroText}>¡Tienes una invitación a una comunidad!</Text>

					<Text style={paragraph}>
						<strong style={{ color: "#fafafa" }}>{inviterName}</strong> te
						invitó a unirte a la comunidad:
					</Text>

					<Container style={communityCard}>
						<Text style={communityNameStyle}>{communityName}</Text>
						<Text style={roleText}>Rol: {roleLabel}</Text>
					</Container>

					<Text style={paragraph}>Como {roleLabel.toLowerCase()}, podrás:</Text>

					<Container style={benefitsList}>
						{roleGranted === "admin" && (
							<>
								<Text style={benefitItem}>
									✓ Administrar miembros y eventos
								</Text>
								<Text style={benefitItem}>✓ Crear y editar eventos</Text>
								<Text style={benefitItem}>✓ Acceder a las analíticas</Text>
							</>
						)}
						{roleGranted === "member" && (
							<>
								<Text style={benefitItem}>✓ Generar tu badge de miembro</Text>
								<Text style={benefitItem}>
									✓ Participar en eventos exclusivos
								</Text>
								<Text style={benefitItem}>✓ Conectar con otros miembros</Text>
							</>
						)}
						{roleGranted === "follower" && (
							<>
								<Text style={benefitItem}>
									✓ Seguir las novedades de la comunidad
								</Text>
								<Text style={benefitItem}>
									✓ Recibir notificaciones de eventos
								</Text>
							</>
						)}
					</Container>

					<Link href={acceptUrl} style={button}>
						Aceptar invitación
					</Link>

					<Text style={note}>
						Esta invitación fue enviada a <strong>{recipientEmail}</strong>.
						<br />
						Si no esperabas esta invitación, puedes ignorar este email.
					</Text>

					<Hr style={hr} />

					<Text style={footer}>
						hack0.dev - Centralizando eventos tech para Perú
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: "#0a0a0a",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
	backgroundColor: "#0a0a0a",
	margin: "0 auto",
	padding: "40px 20px",
	maxWidth: "560px",
};

const h1 = {
	color: "#fafafa",
	fontSize: "24px",
	fontWeight: "600",
	letterSpacing: "-0.025em",
	margin: "0 0 24px",
};

const heroText = {
	color: "#fafafa",
	fontSize: "20px",
	fontWeight: "500",
	margin: "0 0 16px",
};

const paragraph = {
	color: "#a1a1a1",
	fontSize: "14px",
	lineHeight: "1.6",
	margin: "0 0 16px",
};

const communityCard = {
	backgroundColor: "#171717",
	border: "1px solid #262626",
	borderRadius: "8px",
	padding: "20px",
	margin: "16px 0 24px",
};

const communityNameStyle = {
	color: "#fafafa",
	fontSize: "18px",
	fontWeight: "600",
	margin: "0 0 8px",
};

const roleText = {
	color: "#10b981",
	fontSize: "14px",
	margin: "0",
};

const benefitsList = {
	margin: "12px 0 24px",
	padding: "0",
};

const benefitItem = {
	color: "#a1a1a1",
	fontSize: "14px",
	lineHeight: "1.8",
	margin: "0",
};

const button = {
	backgroundColor: "#fafafa",
	borderRadius: "6px",
	color: "#0a0a0a",
	display: "inline-block",
	fontSize: "14px",
	fontWeight: "500",
	margin: "16px 0 24px",
	padding: "12px 24px",
	textDecoration: "none",
};

const note = {
	color: "#666666",
	fontSize: "12px",
	margin: "0 0 24px",
	lineHeight: "1.6",
};

const hr = {
	borderColor: "#262626",
	margin: "24px 0",
};

const footer = {
	color: "#666666",
	fontSize: "12px",
};

export default CommunityInviteEmail;
