import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
	disconnectLumaEmail,
	initiateEmailVerification,
} from "@/lib/luma/email-verification";

const connectSchema = z.object({
	lumaEmail: z.string().email("El email no es válido"),
});

export async function POST(request: NextRequest) {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const parsed = connectSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0].message },
				{ status: 400 },
			);
		}

		const result = await initiateEmailVerification(
			userId,
			parsed.data.lumaEmail,
		);

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 500 });
		}

		return NextResponse.json({
			success: true,
			message: "Email de verificación enviado",
		});
	} catch (error) {
		console.error("Error initiating Luma email verification:", error);
		return NextResponse.json(
			{ error: "Error al procesar la solicitud" },
			{ status: 500 },
		);
	}
}

export async function DELETE() {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 });
	}

	try {
		const result = await disconnectLumaEmail(userId);

		if (!result.success) {
			return NextResponse.json(
				{ error: "Error al desconectar" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Cuenta de Luma desconectada",
		});
	} catch (error) {
		console.error("Error disconnecting Luma email:", error);
		return NextResponse.json(
			{ error: "Error al procesar la solicitud" },
			{ status: 500 },
		);
	}
}
