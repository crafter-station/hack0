"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { lumaConnections, organizations } from "@/lib/db/schema";
import {
	encryptLumaApiKey,
	lumaApiKeyPrefix,
	validateLumaApiKey,
} from "@/lib/luma/api-key";
import { canManageOrganization } from "./organizations";

const connectSchema = z.object({
	organizationId: z.string().uuid(),
	apiKey: z.string().min(20, "Ingresa una API key válida"),
});

export type LumaConnectionStatus = {
	isConnected: boolean;
	apiKeyPrefix: string | null;
	lumaUserName: string | null;
	lumaUserEmail: string | null;
	calendarName: string | null;
	calendarSlug: string | null;
	calendarUrl: string | null;
	lastVerifiedAt: Date | null;
	lastSyncedAt: Date | null;
};

export async function getOrganizationLumaConnection(
	organizationId: string,
): Promise<LumaConnectionStatus> {
	const canManage = await canManageOrganization(organizationId);

	if (!canManage) {
		return {
			isConnected: false,
			apiKeyPrefix: null,
			lumaUserName: null,
			lumaUserEmail: null,
			calendarName: null,
			calendarSlug: null,
			calendarUrl: null,
			lastVerifiedAt: null,
			lastSyncedAt: null,
		};
	}

	const connection = await db.query.lumaConnections.findFirst({
		where: eq(lumaConnections.organizationId, organizationId),
	});

	return {
		isConnected: !!connection,
		apiKeyPrefix: connection?.apiKeyPrefix || null,
		lumaUserName: connection?.lumaUserName || null,
		lumaUserEmail: connection?.lumaUserEmail || null,
		calendarName: connection?.calendarName || null,
		calendarSlug: connection?.calendarSlug || null,
		calendarUrl: connection?.calendarUrl || null,
		lastVerifiedAt: connection?.lastVerifiedAt || null,
		lastSyncedAt: connection?.lastSyncedAt || null,
	};
}

export async function connectOrganizationLuma(input: {
	organizationId: string;
	apiKey: string;
}) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const parsed = connectSchema.safeParse(input);
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message || "Datos inválidos",
		};
	}

	const canManage = await canManageOrganization(parsed.data.organizationId);
	if (!canManage) {
		return {
			success: false,
			error: "No tienes permisos para conectar Luma en esta comunidad",
		};
	}

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, parsed.data.organizationId),
	});

	if (!org) {
		return { success: false, error: "Comunidad no encontrada" };
	}

	try {
		const validated = await validateLumaApiKey(parsed.data.apiKey);
		const encrypted = encryptLumaApiKey(parsed.data.apiKey.trim());
		const now = new Date();

		await db
			.insert(lumaConnections)
			.values({
				organizationId: org.id,
				connectedByUserId: userId,
				apiKeyCiphertext: encrypted.ciphertext,
				apiKeyIv: encrypted.iv,
				apiKeyAuthTag: encrypted.authTag,
				apiKeyPrefix: lumaApiKeyPrefix(parsed.data.apiKey),
				lumaUserName: validated.user.name,
				lumaUserEmail: validated.user.email,
				lumaUserApiId: validated.user.id,
				calendarApiId: validated.calendar.apiId,
				calendarName: validated.calendar.name,
				calendarSlug: validated.calendar.slug,
				calendarUrl: validated.calendar.url,
				status: "active",
				lastVerifiedAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: lumaConnections.organizationId,
				set: {
					connectedByUserId: userId,
					apiKeyCiphertext: encrypted.ciphertext,
					apiKeyIv: encrypted.iv,
					apiKeyAuthTag: encrypted.authTag,
					apiKeyPrefix: lumaApiKeyPrefix(parsed.data.apiKey),
					lumaUserName: validated.user.name,
					lumaUserEmail: validated.user.email,
					lumaUserApiId: validated.user.id,
					calendarApiId: validated.calendar.apiId,
					calendarName: validated.calendar.name,
					calendarSlug: validated.calendar.slug,
					calendarUrl: validated.calendar.url,
					status: "active",
					lastVerifiedAt: now,
					updatedAt: now,
				},
			});

		revalidatePath(`/c/${org.slug}/settings`);

		return {
			success: true,
			calendarName: validated.calendar.name,
			lumaUserEmail: validated.user.email,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "No se pudo validar la API key de Luma",
		};
	}
}

export async function disconnectOrganizationLuma(organizationId: string) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const canManage = await canManageOrganization(organizationId);
	if (!canManage) {
		return {
			success: false,
			error: "No tienes permisos para desconectar Luma",
		};
	}

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	if (!org) {
		return { success: false, error: "Comunidad no encontrada" };
	}

	await db
		.delete(lumaConnections)
		.where(eq(lumaConnections.organizationId, organizationId));

	revalidatePath(`/c/${org.slug}/settings`);
	return { success: true };
}
