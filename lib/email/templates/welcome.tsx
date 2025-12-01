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
          <Text style={heroText}>
            ¡Gracias por suscribirte!
          </Text>

          <Text style={paragraph}>
            Estás a un paso de recibir notificaciones sobre nuevos hackathons y eventos tech en Perú.
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
            hack0.dev - Centralizando eventos tech para Perú
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
};

const hr = {
  borderColor: "#262626",
  margin: "24px 0",
};

const footer = {
  color: "#666666",
  fontSize: "12px",
};

export default WelcomeEmail;
