export const VERTICAL_LABEL_EXAMPLES = [
	"BUILDER",
	"DOER",
	"SHIPPER",
	"CREATOR",
	"MAKER",
	"HACKER",
	"FOUNDER",
	"DREAMER",
];

export const MANIFESTO_EXAMPLES = [
	"Este año no pedí permiso. Construí.",
	"No esperé la oportunidad. La creé.",
	"El 2025 que imaginé ya tiene código.",
	"Menos slides, más deploy.",
	"Mientras otros planeaban, yo ejecuté.",
	"Mi pitch deck es mi producto.",
	"Ship first, perfect later.",
	"Cada semana, algo nuevo en producción.",
	"El mejor plan es el que ya está live.",
	"Construyo con otros, no contra otros.",
	"LATAM no necesita promesas. Necesita builders.",
	"Desde LATAM, para el mundo. Sin pedir permiso.",
];

export interface ManifestoResult {
	phrase: string;
	verticalLabel: string;
}

export function getManifestoPrompt(builderName: string | undefined): string {
	const phraseExamples = MANIFESTO_EXAMPLES.slice(0, 6)
		.map((e) => `- "${e}"`)
		.join("\n");
	const labelExamples = VERTICAL_LABEL_EXAMPLES.join(", ");

	return `Genera contenido para un badge de builder tech de LATAM.
Nombre del builder: ${builderName || "Builder"}

Necesito DOS cosas:

1. FRASE DE MANIFIESTO:
Estilo: declaración personal poderosa, tipo logro desbloqueado.
Tono: confiado, directo, sin arrogancia. Como algo que pondrías en tu bio de Twitter.
Ejemplos (NO copies, genera variaciones únicas):
${phraseExamples}

Reglas para la frase:
- Máximo 12 palabras
- Primera persona o segunda persona implícita
- Sin hashtags, sin emojis
- En español (puede tener una palabra en inglés si encaja)
- Debe sentirse como un logro, no como un deseo

2. LABEL VERTICAL (una sola palabra en inglés, mayúsculas):
Ejemplos: ${labelExamples}
Genera un sinónimo o variación que represente al builder.
Debe ser una palabra única, poderosa, en inglés.

Responde EXACTAMENTE en este formato JSON:
{"phrase": "tu frase aquí", "verticalLabel": "PALABRA"}`;
}
