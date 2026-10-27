import { Resend } from "resend";

const FROM = process.env.HACK0_MAIL_FROM ?? "hack0 <workshops@hack0.dev>";

export async function sendKey(email: string, key: string, workshop: string | null): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Local development has no Resend key; print the key so the flow can be tested.
    if (process.env.NODE_ENV !== "production") console.info(`[hack0] key for ${email}: ${key}`);
    return false;
  }
  const intro = workshop ? `Ya tienes acceso a ${workshop}.` : "Aquí está tu nueva clave de hack0. La anterior dejó de funcionar.";
  const text = [
    intro,
    "",
    `Tu clave: ${key}`,
    "",
    "Instala los skills en tu proyecto:",
    "",
    `  npx @crafter/hack0 login ${key}`,
    workshop ? `  npx @crafter/hack0 add ${workshop}` : "  npx @crafter/hack0 list",
    "",
    "Guarda este correo. Si pierdes la clave, corre: npx @crafter/hack0 auth recover <tu email>",
  ].join("\n");
  const { error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: email,
    subject: workshop ? `Tu acceso a ${workshop}` : "Tu nueva clave de hack0",
    text,
  });
  return !error;
}

export async function sendAccessAdded(email: string, workshop: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const { error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: email,
    subject: `Tu acceso a ${workshop}`,
    text: `Sumamos ${workshop} a tu clave de hack0.\n\n  npx @crafter/hack0 add ${workshop}\n`,
  });
  return !error;
}
