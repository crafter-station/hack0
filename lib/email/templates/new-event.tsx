import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface NewEventEmailProps {
	eventName: string;
	eventDescription?: string;
	eventDate?: string;
	eventFormat: string;
	eventUrl: string;
	organizerName?: string;
	prizePool?: number;
	unsubscribeUrl: string;
}

export function NewEventEmail({
	eventName,
	eventDescription,
	eventDate,
	eventFormat,
	eventUrl,
	organizerName,
	prizePool,
	unsubscribeUrl,
}: NewEventEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Nuevo evento: {eventName}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>hack0.dev</Heading>
					<Text style={heroText}>Nuevo evento publicado</Text>

					<Section style={eventCard}>
						<Heading as="h2" style={eventTitle}>
							{eventName}
						</Heading>

						{organizerName && (
							<Text style={eventMeta}>Organizado por {organizerName}</Text>
						)}

						<Section style={eventDetails}>
							{eventDate && (
								<Text style={eventDetail}>
									<strong>Fecha:</strong> {eventDate}
								</Text>
							)}
							<Text style={eventDetail}>
								<strong>Formato:</strong> {eventFormat}
							</Text>
							{prizePool && prizePool > 0 && (
								<Text style={eventDetail}>
									<strong>Premio:</strong> ${prizePool.toLocaleString()} USD
								</Text>
							)}
						</Section>

						{eventDescription && (
							<Text style={description}>{eventDescription}</Text>
						)}

						<Link href={eventUrl} style={button}>
							Ver evento
						</Link>
					</Section>

					<Hr style={hr} />

					<Text style={footer}>
						Recibiste este email porque estás suscrito a hack0.dev.
						<br />
						<Link href={unsubscribeUrl} style={footerLink}>
							Cancelar suscripción
						</Link>
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

// Styles
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
	color: "#a1a1a1",
	fontSize: "14px",
	margin: "0 0 24px",
};

const eventCard = {
	backgroundColor: "#171717",
	borderRadius: "8px",
	border: "1px solid #262626",
	padding: "24px",
	marginBottom: "24px",
};

const eventTitle = {
	color: "#fafafa",
	fontSize: "20px",
	fontWeight: "600",
	margin: "0 0 8px",
};

const eventMeta = {
	color: "#a1a1a1",
	fontSize: "14px",
	margin: "0 0 16px",
};

const eventDetails = {
	marginBottom: "16px",
};

const eventDetail = {
	color: "#a1a1a1",
	fontSize: "14px",
	margin: "4px 0",
};

const description = {
	color: "#d4d4d4",
	fontSize: "14px",
	lineHeight: "1.6",
	margin: "0 0 20px",
};

const button = {
	backgroundColor: "#fafafa",
	borderRadius: "6px",
	color: "#0a0a0a",
	display: "inline-block",
	fontSize: "14px",
	fontWeight: "500",
	padding: "10px 20px",
	textDecoration: "none",
};

const hr = {
	borderColor: "#262626",
	margin: "24px 0",
};

const footer = {
	color: "#666666",
	fontSize: "12px",
	lineHeight: "1.6",
};

const footerLink = {
	color: "#a1a1a1",
	textDecoration: "underline",
};

export default NewEventEmail;
