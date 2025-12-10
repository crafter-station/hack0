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
import * as React from "react";

interface CohostInviteEmailProps {
	inviterName: string;
	inviterOrg: string;
	eventName: string;
	eventUrl: string;
	acceptUrl: string;
	recipientEmail: string;
}

export function CohostInviteEmail({
	inviterName,
	inviterOrg,
	eventName,
	eventUrl,
	acceptUrl,
	recipientEmail,
}: CohostInviteEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>
				{inviterName} te invitó a co-organizar {eventName}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>hack0.dev</Heading>
					<Text style={heroText}>
						¡Tienes una invitación para co-organizar un evento!
					</Text>

					<Text style={paragraph}>
						<strong style={{ color: "#fafafa" }}>{inviterName}</strong> de{" "}
						<strong style={{ color: "#fafafa" }}>{inviterOrg}</strong> te invitó
						a ser co-organizador de:
					</Text>

					<Container style={eventCard}>
						<Text style={eventName}>{eventName}</Text>
						<Link href={eventUrl} style={eventLink}>
							Ver detalles del evento →
						</Link>
					</Container>

					<Text style={paragraph}>
						Como co-organizador, podrás:
					</Text>

					<Container style={benefitsList}>
						<Text style={benefitItem}>✓ Editar la información del evento</Text>
						<Text style={benefitItem}>
							✓ Agregar miembros de tu organización al equipo
						</Text>
						<Text style={benefitItem}>✓ Acceder a las analíticas del evento</Text>
						<Text style={benefitItem}>
							✓ Aparecer como co-organizador oficial
						</Text>
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

const eventCard = {
	backgroundColor: "#171717",
	border: "1px solid #262626",
	borderRadius: "8px",
	padding: "20px",
	margin: "16px 0 24px",
};

const eventName = {
	color: "#fafafa",
	fontSize: "16px",
	fontWeight: "600",
	margin: "0 0 12px",
};

const eventLink = {
	color: "#10b981",
	fontSize: "14px",
	textDecoration: "none",
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

export default CohostInviteEmail;
