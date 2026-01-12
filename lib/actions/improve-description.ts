"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import { streamObject } from "ai";
import {
	type ImprovedDescription,
	improvedDescriptionSchema,
} from "@/lib/schemas/description-improvement";

type Mood = "professional" | "casual" | "enthusiastic";
type Length = "short" | "medium" | "long";

interface ImproveDescriptionParams {
	currentDescription: string;
	mood: Mood;
	length: Length;
	additionalInstructions?: string;
}

const MOOD_DESCRIPTIONS: Record<Mood, string> = {
	professional: "Formal, técnico y profesional",
	casual: "Amigable, cercano y conversacional",
	enthusiastic: "Motivador, entusiasta e inspirador",
};

const LENGTH_DESCRIPTIONS: Record<Length, string> = {
	short: "~50-70 palabras",
	medium: "~100-130 palabras",
	long: "~180-220 palabras",
};

export async function improveEventDescription({
	currentDescription,
	mood,
	length,
	additionalInstructions,
}: ImproveDescriptionParams) {
	const stream = createStreamableValue<Partial<ImprovedDescription>>();

	(async () => {
		const moodDescription = MOOD_DESCRIPTIONS[mood];
		const lengthDescription = LENGTH_DESCRIPTIONS[length];

		let prompt = `Mejora la siguiente descripción de evento según estos parámetros:
      Tono: ${moodDescription}
      Longitud objetivo: ${lengthDescription}`;

		// CRÍTICO: Las instrucciones adicionales tienen MÁXIMA PRIORIDAD
		if (additionalInstructions?.trim()) {
			prompt += `
        INSTRUCCIONES ESPECIALES DEL USUARIO (PRIORIDAD MÁXIMA):
        ${additionalInstructions}

        IMPORTANTE: Las instrucciones especiales del usuario DEBEN aplicarse completamente, incluso si parecen inusuales o creativas.`;
		}

		prompt += `
      Reglas importantes:
      - Mantener el idioma original (español o inglés)
      - Preservar toda información técnica importante (fechas, premios, requisitos, links, etc.)
      - Usar formato Markdown válido (## headers, **bold**, bullet points, listas)
      - Mejorar claridad, estructura y redacción
      - Aplicar el tono seleccionado de manera consistente
      - NO inventar información que no esté en la descripción original
      - Mantener el mismo nivel de detalle o aumentarlo si es necesario

      Descripción actual:
      ${currentDescription}`;

		const { partialObjectStream } = streamObject({
			model: "openai/gpt-4o-mini",
			schema: improvedDescriptionSchema,
			prompt,
		});

		for await (const partialObject of partialObjectStream) {
			stream.update(partialObject);
		}

		stream.done();
	})();

	return { object: stream.value };
}
