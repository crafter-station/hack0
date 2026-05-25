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

interface WelcomeEmailProps {
	confirmUrl: string;
}

export function WelcomeEmail({ confirmUrl }: WelcomeEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Confirma tu suscripción a hack0.dev</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>hack0.dev</Heading>
					<Text style={heroText}>¡Gracias por suscribirte!</Text>

					<Text style={paragraph}>
						Estás a un paso de recibir notificaciones sobre nuevos hackathons y
						eventos tech en LATAM.
					</Text>

					<Text style={paragraph}>
						Haz clic en el botón de abajo para confirmar tu suscripción:
					</Text>

					<Link href={confirmUrl} style={button}>
						Confirmar suscripción
					</Link>

					<Text style={note}>
						Si no solicitaste esta suscripción, puedes ignorar este email.
					</Text>

					<Hr style={hr} />

					<Text style={footer}>
						hack0.dev - Centralizando eventos tech para LATAM
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: "#050605",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
	backgroundColor: "#050605",
	margin: "0 auto",
	padding: "40px 20px",
	maxWidth: "560px",
};

const h1 = {
	color: "#F3F1E8",
	fontSize: "24px",
	fontWeight: "600",
	letterSpacing: "-0.025em",
	margin: "0 0 24px",
};

const heroText = {
	color: "#F3F1E8",
	fontSize: "20px",
	fontWeight: "500",
	margin: "0 0 16px",
};

const paragraph = {
	color: "#A1A1AA",
	fontSize: "14px",
	lineHeight: "1.6",
	margin: "0 0 16px",
};

const button = {
	backgroundColor: "#22FF66",
	borderRadius: "0",
	color: "#050605",
	display: "inline-block",
	fontSize: "14px",
	fontWeight: "500",
	margin: "16px 0 24px",
	padding: "12px 24px",
	textDecoration: "none",
};

const note = {
	color: "#7FBF9A",
	fontSize: "12px",
	margin: "0 0 24px",
};

const hr = {
	borderColor: "#1b2a1f",
	margin: "24px 0",
};

const footer = {
	color: "#7FBF9A",
	fontSize: "12px",
};

export default WelcomeEmail;
