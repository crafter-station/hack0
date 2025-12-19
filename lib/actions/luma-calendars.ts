"use server";

import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	lumaCalendars,
	lumaEventMappings,
	organizations,
} from "@/lib/db/schema";
import { getGlobalLumaClient } from "@/lib/luma";
import type { lumaCalendarSyncTask } from "@/trigger/luma-calendar-sync";
import type {
	lumaManualVerifyTask,
	lumaVerifyCalendarTask,
} from "@/trigger/luma-calendar-verify";
import { getUserCommunityRole } from "./community-members";

interface ConnectCalendarResult {
	success: boolean;
	error?: string;
	calendarId?: string;
	runId?: string;
	publicAccessToken?: string;
	verificationStatus?: "pending" | "verified" | "failed";
}

export async function connectLumaCalendar(
	organizationId: string,
	lumaCalendarSlug: string,
): Promise<ConnectCalendarResult> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const userRole = await getUserCommunityRole(organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return {
			success: false,
			error: "No tienes permisos para conectar calendarios",
		};
	}

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	if (!org) {
		return { success: false, error: "Comunidad no encontrada" };
	}

	const existingCalendar = await db.query.lumaCalendars.findFirst({
		where: and(
			eq(lumaCalendars.organizationId, organizationId),
			eq(lumaCalendars.lumaCalendarSlug, lumaCalendarSlug),
		),
	});

	if (existingCalendar) {
		if (existingCalendar.verificationStatus === "pending") {
			const handle = await tasks.trigger<typeof lumaVerifyCalendarTask>(
				"luma-verify-calendar",
				{ calendarId: existingCalendar.id },
			);

			return {
				success: true,
				calendarId: existingCalendar.id,
				runId: handle.id,
				publicAccessToken: handle.publicAccessToken,
				verificationStatus: "pending",
			};
		}

		return { success: false, error: "Este calendario ya está conectado" };
	}

	const [calendar] = await db
		.insert(lumaCalendars)
		.values({
			organizationId,
			lumaCalendarSlug,
			verificationStatus: "pending",
			verificationAttempts: 0,
			isActive: true,
			syncFrequency: "daily",
		})
		.returning();

	const handle = await tasks.trigger<typeof lumaVerifyCalendarTask>(
		"luma-verify-calendar",
		{ calendarId: calendar.id },
	);

	return {
		success: true,
		calendarId: calendar.id,
		runId: handle.id,
		publicAccessToken: handle.publicAccessToken,
		verificationStatus: "pending",
	};
}

export async function retryLumaCalendarVerification(
	calendarId: string,
): Promise<{
	success: boolean;
	error?: string;
	runId?: string;
	publicAccessToken?: string;
}> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const calendar = await db.query.lumaCalendars.findFirst({
		where: eq(lumaCalendars.id, calendarId),
	});

	if (!calendar) {
		return { success: false, error: "Calendario no encontrado" };
	}

	const userRole = await getUserCommunityRole(calendar.organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return { success: false, error: "No tienes permisos" };
	}

	const handle = await tasks.trigger<typeof lumaManualVerifyTask>(
		"luma-manual-verify",
		{ calendarId },
	);

	return {
		success: true,
		runId: handle.id,
		publicAccessToken: handle.publicAccessToken,
	};
}

export async function syncLumaCalendar(
	calendarId: string,
	forceFullSync = false,
): Promise<{
	success: boolean;
	error?: string;
	runId?: string;
	publicAccessToken?: string;
}> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const calendar = await db.query.lumaCalendars.findFirst({
		where: eq(lumaCalendars.id, calendarId),
	});

	if (!calendar) {
		return { success: false, error: "Calendario no encontrado" };
	}

	if (calendar.verificationStatus !== "verified") {
		return { success: false, error: "El calendario no está verificado" };
	}

	const userRole = await getUserCommunityRole(calendar.organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return { success: false, error: "No tienes permisos para sincronizar" };
	}

	const handle = await tasks.trigger<typeof lumaCalendarSyncTask>(
		"luma-calendar-sync",
		{
			calendarId,
			forceFullSync,
		},
	);

	return {
		success: true,
		runId: handle.id,
		publicAccessToken: handle.publicAccessToken,
	};
}

export async function disconnectLumaCalendar(
	calendarId: string,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const calendar = await db.query.lumaCalendars.findFirst({
		where: eq(lumaCalendars.id, calendarId),
	});

	if (!calendar) {
		return { success: false, error: "Calendario no encontrado" };
	}

	const userRole = await getUserCommunityRole(calendar.organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return { success: false, error: "No tienes permisos para desconectar" };
	}

	if (calendar.webhookId) {
		try {
			const client = getGlobalLumaClient();
			await client.deleteWebhook(calendar.webhookId);
		} catch (error) {
			console.error("Failed to delete webhook:", error);
		}
	}

	await db
		.delete(lumaEventMappings)
		.where(eq(lumaEventMappings.lumaCalendarId, calendarId));
	await db.delete(lumaCalendars).where(eq(lumaCalendars.id, calendarId));

	return { success: true };
}

export async function toggleLumaCalendarActive(
	calendarId: string,
	isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const calendar = await db.query.lumaCalendars.findFirst({
		where: eq(lumaCalendars.id, calendarId),
	});

	if (!calendar) {
		return { success: false, error: "Calendario no encontrado" };
	}

	const userRole = await getUserCommunityRole(calendar.organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return { success: false, error: "No tienes permisos" };
	}

	await db
		.update(lumaCalendars)
		.set({ isActive })
		.where(eq(lumaCalendars.id, calendarId));

	return { success: true };
}

export async function getOrgLumaCalendars(organizationId: string) {
	const { userId } = await auth();

	if (!userId) {
		return [];
	}

	const userRole = await getUserCommunityRole(organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return [];
	}

	return db.query.lumaCalendars.findMany({
		where: eq(lumaCalendars.organizationId, organizationId),
		orderBy: desc(lumaCalendars.createdAt),
	});
}

export async function getLumaCalendarStats(calendarId: string) {
	const { userId } = await auth();

	if (!userId) {
		return null;
	}

	const calendar = await db.query.lumaCalendars.findFirst({
		where: eq(lumaCalendars.id, calendarId),
	});

	if (!calendar) {
		return null;
	}

	const userRole = await getUserCommunityRole(calendar.organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return null;
	}

	const mappings = await db.query.lumaEventMappings.findMany({
		where: eq(lumaEventMappings.lumaCalendarId, calendarId),
	});

	return {
		calendar,
		eventCount: mappings.length,
		lastSyncAt: calendar.lastSyncAt,
		verificationStatus: calendar.verificationStatus,
	};
}
