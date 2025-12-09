"use server";

import { requireGodMode } from "@/lib/god-mode";
import { db } from "@/lib/db";
import { events, organizations } from "@/lib/db/schema";
import { createUniqueSlug } from "@/lib/slug-utils";
import { revalidatePath } from "next/cache";

export async function godModeCreateEvent(data: {
	name: string;
	organizationId?: string;
	description?: string;
	eventType?: string;
	startDate?: Date;
	endDate?: Date;
	format?: "virtual" | "in-person" | "hybrid";
	country?: string;
	department?: string;
	city?: string;
	venue?: string;
	websiteUrl?: string;
	registrationUrl?: string;
	eventImageUrl?: string;
	skillLevel?: "beginner" | "intermediate" | "advanced" | "all";
	prizePool?: number;
	prizeCurrency?: "USD" | "PEN";
	isApproved?: boolean;
}) {
	await requireGodMode();

	const slug = await createUniqueSlug(data.name);

	const [event] = await db
		.insert(events)
		.values({
			slug,
			name: data.name,
			description: data.description || null,
			eventType: (data.eventType as any) || "hackathon",
			startDate: data.startDate || null,
			endDate: data.endDate || null,
			format: data.format || "hybrid",
			country: data.country || null,
			department: data.department || null,
			city: data.city || null,
			venue: data.venue || null,
			websiteUrl: data.websiteUrl || null,
			registrationUrl: data.registrationUrl || null,
			eventImageUrl: data.eventImageUrl || null,
			organizationId: data.organizationId || null,
			skillLevel: data.skillLevel || "all",
			prizePool: data.prizePool || null,
			prizeCurrency: data.prizeCurrency || "USD",
			isApproved: data.isApproved ?? true,
			approvalStatus: data.isApproved ?? true ? "approved" : "pending",
			status: "upcoming",
		})
		.returning();

	revalidatePath("/");
	revalidatePath("/feed");
	if (data.organizationId) {
		const org = await db.query.organizations.findFirst({
			where: (orgs, { eq }) => eq(orgs.id, data.organizationId!),
		});
		if (org) {
			revalidatePath(`/c/${org.slug}`);
		}
	}

	return { success: true, event };
}

export async function godModeGetAllOrganizations() {
	await requireGodMode();

	const orgs = await db.query.organizations.findMany({
		orderBy: (organizations, { desc }) => [desc(organizations.createdAt)],
	});

	return orgs;
}
