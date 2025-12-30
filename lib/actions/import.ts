"use server";

import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, importJobs, organizations } from "@/lib/db/schema";
import {
	inferCountryFromCity,
	inferEventType,
	isLumaUrl,
	normalizeLumaUrl,
} from "@/lib/scraper/luma-schema";
import { ensureUniqueShortCode } from "@/lib/slug-utils";
import type { eventImportTask } from "@/trigger/event-import";
import { getUserCommunityRole } from "./community-members";

interface StartImportResult {
	success: boolean;
	error?: string;
	jobId?: string;
	runId?: string;
	publicAccessToken?: string;
}

export async function startLumaImport(
	url: string,
	autoPublish: boolean = false,
	organizationId?: string,
): Promise<StartImportResult> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	if (!organizationId) {
		const org = await db.query.organizations.findFirst({
			where: eq(organizations.ownerUserId, userId),
		});

		if (!org) {
			return { success: false, error: "No tienes una comunidad" };
		}

		organizationId = org.id;
	}

	const userRole = await getUserCommunityRole(organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return {
			success: false,
			error: "No tienes permisos para crear eventos en esta comunidad",
		};
	}

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	if (!org) {
		return { success: false, error: "Comunidad no encontrada" };
	}

	if (!isLumaUrl(url)) {
		return {
			success: false,
			error: "URL inválida. Solo soportamos eventos de Luma (lu.ma o luma.com)",
		};
	}

	const normalizedUrl = normalizeLumaUrl(url);

	const existingJob = await db.query.importJobs.findFirst({
		where: eq(importJobs.sourceUrl, normalizedUrl),
	});

	if (
		existingJob &&
		existingJob.status === "completed" &&
		existingJob.eventId
	) {
		return {
			success: false,
			error: "Este evento ya fue importado",
		};
	}

	const [job] = await db
		.insert(importJobs)
		.values({
			organizationId: org.id,
			sourceUrl: normalizedUrl,
			sourceType: "luma",
			status: "pending",
		})
		.returning();

	const handle = await tasks.trigger<typeof eventImportTask>("event-import", {
		jobId: job.id,
		lumaUrl: normalizedUrl,
		organizationId: org.id,
		isVerified: org.isVerified ?? false,
		autoPublish,
	});

	await db
		.update(importJobs)
		.set({ triggerRunId: handle.id })
		.where(eq(importJobs.id, job.id));

	return {
		success: true,
		jobId: job.id,
		runId: handle.id,
		publicAccessToken: handle.publicAccessToken,
	};
}

interface ExtractedEventData {
	name: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	city?: string;
	venue?: string;
	format?: "virtual" | "in-person" | "hybrid";
	eventImageUrl?: string;
	organizerName?: string;
	websiteUrl: string;
	registrationUrl?: string;
	eventType?: string;
	country?: string;
}

function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 100);
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const existing = await db.query.events.findFirst({
			where: eq(events.slug, slug),
		});

		if (!existing) break;

		slug = `${baseSlug}-${counter}`;
		counter++;
	}

	return slug;
}

export async function createEventFromExtracted(
	jobId: string,
	data: ExtractedEventData,
): Promise<{
	success: boolean;
	error?: string;
	eventId?: string;
	eventSlug?: string;
}> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const job = await db.query.importJobs.findFirst({
		where: eq(importJobs.id, jobId),
	});

	if (!job) {
		return { success: false, error: "Job no encontrado" };
	}

	const userRole = await getUserCommunityRole(job.organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return { success: false, error: "No tienes permisos para este job" };
	}

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, job.organizationId),
	});

	if (!org) {
		return { success: false, error: "Organización no encontrada" };
	}

	if (job.eventId) {
		return { success: false, error: "Este job ya tiene un evento asociado" };
	}

	const eventType =
		data.eventType || inferEventType(data.name, data.description);
	const country = data.country || inferCountryFromCity(data.city);

	const slug = await generateUniqueSlug(generateSlug(data.name));
	const shortCode = await ensureUniqueShortCode();

	const [newEvent] = await db
		.insert(events)
		.values({
			slug,
			shortCode,
			name: data.name,
			description: data.description || null,
			eventType: eventType as
				| "hackathon"
				| "conference"
				| "seminar"
				| "research_fair"
				| "workshop"
				| "bootcamp"
				| "summer_school"
				| "course"
				| "certification"
				| "meetup"
				| "networking"
				| "olympiad"
				| "competition"
				| "robotics"
				| "accelerator"
				| "incubator"
				| "fellowship"
				| "call_for_papers",
			startDate: data.startDate ? new Date(data.startDate) : null,
			endDate: data.endDate ? new Date(data.endDate) : null,
			format: data.format || "in-person",
			country,
			city: data.city || null,
			venue: data.venue || null,
			websiteUrl: data.websiteUrl,
			registrationUrl: data.registrationUrl || data.websiteUrl,
			eventImageUrl: data.eventImageUrl || null,
			organizationId: org.id,
			isApproved: org.isVerified ?? false,
			approvalStatus: org.isVerified ? "approved" : "pending",
			status: "upcoming",
		})
		.returning();

	await db
		.update(importJobs)
		.set({ eventId: newEvent.id })
		.where(eq(importJobs.id, jobId));

	return {
		success: true,
		eventId: newEvent.id,
		eventSlug: newEvent.slug,
	};
}

export async function getImportJob(jobId: string) {
	const { userId } = await auth();

	if (!userId) {
		return null;
	}

	const job = await db.query.importJobs.findFirst({
		where: eq(importJobs.id, jobId),
	});

	if (!job) {
		return null;
	}

	const userRole = await getUserCommunityRole(job.organizationId);

	if (userRole !== "owner" && userRole !== "admin") {
		return null;
	}

	return job;
}

export async function getOrgImportJobs(
	limit: number = 10,
	organizationId?: string,
) {
	const { userId } = await auth();

	if (!userId) {
		return [];
	}

	let orgId = organizationId;

	if (!orgId) {
		const org = await db.query.organizations.findFirst({
			where: eq(organizations.ownerUserId, userId),
		});

		if (!org) {
			return [];
		}
		orgId = org.id;
	}

	const userRole = await getUserCommunityRole(orgId);

	if (userRole !== "owner" && userRole !== "admin") {
		return [];
	}

	return db.query.importJobs.findMany({
		where: eq(importJobs.organizationId, orgId),
		orderBy: desc(importJobs.createdAt),
		limit,
	});
}
