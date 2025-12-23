"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { communityMembers, eventOrganizers, events } from "@/lib/db/schema";
import { isGodMode } from "@/lib/god-mode";

// ============================================
// PERMISSION SYSTEM
// ============================================
// Priority order:
// 1. God mode (admin emails) - can do everything
// 2. Community owner/admin - can manage all events in their community
// 3. Event organizers (lead/organizer) - can manage their specific events
// 4. Event volunteers - can only view analytics for their events

export async function canManageEventById(eventId: string): Promise<boolean> {
	// 1. Check if god mode
	const godMode = await isGodMode();
	if (godMode) return true;

	const { userId } = await auth();
	if (!userId) return false;

	const event = await db.query.events.findFirst({
		where: eq(events.id, eventId),
	});

	if (!event || !event.organizationId) {
		return false;
	}

	// 2. Check if community owner/admin (bypass)
	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, event.organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	if (
		membership &&
		(membership.role === "owner" || membership.role === "admin")
	) {
		return true;
	}

	// 3. Check if event organizer (lead or organizer role)
	const organizer = await db.query.eventOrganizers.findFirst({
		where: and(
			eq(eventOrganizers.eventId, eventId),
			eq(eventOrganizers.userId, userId),
		),
	});

	if (!organizer) return false;

	return organizer.role === "lead" || organizer.role === "organizer";
}

export async function canManageEventBySlug(slug: string): Promise<boolean> {
	// 1. Check if god mode
	const godMode = await isGodMode();
	if (godMode) return true;

	const { userId } = await auth();
	if (!userId) return false;

	const event = await db.query.events.findFirst({
		where: eq(events.slug, slug),
	});

	if (!event || !event.organizationId) {
		return false;
	}

	// 2. Check if community owner/admin (bypass)
	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, event.organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	if (
		membership &&
		(membership.role === "owner" || membership.role === "admin")
	) {
		return true;
	}

	// 3. Check if event organizer (lead or organizer role)
	const organizer = await db.query.eventOrganizers.findFirst({
		where: and(
			eq(eventOrganizers.eventId, event.id),
			eq(eventOrganizers.userId, userId),
		),
	});

	if (!organizer) return false;

	return organizer.role === "lead" || organizer.role === "organizer";
}

export async function canManageEventByShortCode(code: string): Promise<boolean> {
	const godMode = await isGodMode();
	if (godMode) return true;

	const { userId } = await auth();
	if (!userId) return false;

	const event = await db.query.events.findFirst({
		where: eq(events.shortCode, code),
	});

	if (!event || !event.organizationId) {
		return false;
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, event.organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	if (
		membership &&
		(membership.role === "owner" || membership.role === "admin")
	) {
		return true;
	}

	const organizer = await db.query.eventOrganizers.findFirst({
		where: and(
			eq(eventOrganizers.eventId, event.id),
			eq(eventOrganizers.userId, userId),
		),
	});

	if (!organizer) return false;

	return organizer.role === "lead" || organizer.role === "organizer";
}

// ============================================
// VIEW ANALYTICS PERMISSION
// ============================================

export async function canViewEventAnalytics(eventId: string): Promise<boolean> {
	// 1. Check if god mode
	const godMode = await isGodMode();
	if (godMode) return true;

	const { userId } = await auth();
	if (!userId) return false;

	const event = await db.query.events.findFirst({
		where: eq(events.id, eventId),
	});

	if (!event || !event.organizationId) {
		return false;
	}

	// 2. Check if community owner/admin/member (bypass)
	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, event.organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	if (
		membership &&
		(membership.role === "owner" ||
			membership.role === "admin" ||
			membership.role === "member")
	) {
		return true;
	}

	// 3. Check if event organizer (any role, including volunteer)
	const organizer = await db.query.eventOrganizers.findFirst({
		where: and(
			eq(eventOrganizers.eventId, eventId),
			eq(eventOrganizers.userId, userId),
		),
	});

	return !!organizer; // volunteers can view analytics
}

// ============================================
// GET USER ROLE IN EVENT
// ============================================

export async function getUserEventRole(
	eventId: string,
	userId: string,
): Promise<{
	isCommunityOwner: boolean;
	isCommunityAdmin: boolean;
	eventOrganizerRole: "lead" | "organizer" | "volunteer" | null;
}> {
	const event = await db.query.events.findFirst({
		where: eq(events.id, eventId),
	});

	if (!event || !event.organizationId) {
		return {
			isCommunityOwner: false,
			isCommunityAdmin: false,
			eventOrganizerRole: null,
		};
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, event.organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	const organizer = await db.query.eventOrganizers.findFirst({
		where: and(
			eq(eventOrganizers.eventId, eventId),
			eq(eventOrganizers.userId, userId),
		),
	});

	return {
		isCommunityOwner: membership?.role === "owner",
		isCommunityAdmin: membership?.role === "admin",
		eventOrganizerRole: organizer?.role || null,
	};
}
