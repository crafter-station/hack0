"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { render } from "@react-email/render";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { eventHostOrganizations, events, organizations } from "@/lib/db/schema";
import { EMAIL_FROM, resend } from "@/lib/email/resend";
import { CohostInviteEmail } from "@/lib/email/templates/cohost-invite";

export interface InviteCohostInput {
	eventId: string;
	emailOrSlug: string;
}

async function getOrCreatePersonalOrgByEmail(email: string) {
	const clerk = await clerkClient();

	let clerkUserId: string | null = null;

	try {
		const users = await clerk.users.getUserList({ emailAddress: [email] });

		if (users.data.length > 0) {
			clerkUserId = users.data[0].id;
		}
	} catch (error) {
		console.error("Error fetching user from Clerk:", error);
	}

	if (clerkUserId) {
		const existingOrg = await db.query.organizations.findFirst({
			where: and(
				eq(organizations.ownerUserId, clerkUserId),
				eq(organizations.isPersonalOrg, true),
			),
		});

		if (existingOrg) {
			return { org: existingOrg, userId: clerkUserId, isNewUser: false };
		}

		try {
			const { getUserInfo, getPersonalOrgSlug } = await import(
				"@/lib/clerk-utils"
			);
			const userInfo = await getUserInfo(clerkUserId);
			let slug = await getPersonalOrgSlug(clerkUserId);

			const slugTaken = await db.query.organizations.findFirst({
				where: eq(organizations.slug, slug),
			});

			if (slugTaken) {
				let counter = 1;
				let finalSlug = slug;
				while (true) {
					finalSlug = `${slug}${counter}`;
					const taken = await db.query.organizations.findFirst({
						where: eq(organizations.slug, finalSlug),
					});
					if (!taken) {
						slug = finalSlug;
						break;
					}
					counter++;
				}
			}

			const [org] = await db
				.insert(organizations)
				.values({
					slug,
					name: userInfo.fullName,
					displayName: null,
					type: "community",
					ownerUserId: clerkUserId,
					isPersonalOrg: true,
					isPublic: false,
					logoUrl: userInfo.imageUrl,
				})
				.returning();

			revalidatePath(`/c/${org.slug}`);

			return { org, userId: clerkUserId, isNewUser: false };
		} catch (error) {
			console.error("Error creating personal org:", error);
			throw error;
		}
	}

	return { org: null, userId: null, isNewUser: true };
}

export async function inviteCohost(input: InviteCohostInput) {
	const { userId } = await auth();
	const user = await currentUser();

	if (!userId || !user) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const event = await db.query.events.findFirst({
		where: eq(events.id, input.eventId),
		with: {
			organization: true,
		},
	});

	if (!event) {
		return { success: false, error: "Evento no encontrado" };
	}

	if (event.organization?.ownerUserId !== userId) {
		return {
			success: false,
			error: "Solo el organizador principal puede invitar co-hosts",
		};
	}

	const isEmail = input.emailOrSlug.includes("@");
	let targetOrg;
	let targetUserId: string | null = null;
	let isNewUser = false;

	if (isEmail) {
		const result = await getOrCreatePersonalOrgByEmail(input.emailOrSlug);
		if (!result.org) {
			return {
				success: false,
				error:
					"El usuario aún no tiene cuenta en hack0.dev. Se enviará una invitación cuando se registre.",
				isNewUser: true,
			};
		}
		targetOrg = result.org;
		targetUserId = result.userId;
		isNewUser = result.isNewUser;
	} else {
		targetOrg = await db.query.organizations.findFirst({
			where: eq(organizations.slug, input.emailOrSlug),
		});

		if (!targetOrg) {
			return { success: false, error: "Organización no encontrada" };
		}
		targetUserId = targetOrg.ownerUserId;
	}

	const existingInvite = await db.query.eventHostOrganizations.findFirst({
		where: and(
			eq(eventHostOrganizations.eventId, input.eventId),
			eq(eventHostOrganizations.organizationId, targetOrg.id),
		),
	});

	if (existingInvite) {
		if (existingInvite.status === "approved") {
			return { success: false, error: "Esta organización ya es co-host" };
		}
		if (existingInvite.status === "pending") {
			return { success: false, error: "Ya existe una invitación pendiente" };
		}
	}

	const inviteToken = nanoid(32);

	const [invite] = await db
		.insert(eventHostOrganizations)
		.values({
			eventId: input.eventId,
			organizationId: targetOrg.id,
			isPrimary: false,
			status: "pending",
			invitedBy: userId,
			inviteToken,
		})
		.returning();

	const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.shortCode}/cohost-invite/${inviteToken}`;
	const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.shortCode}`;

	if (isEmail && targetUserId) {
		try {
			const emailHtml = await render(
				CohostInviteEmail({
					inviterName: user.fullName || user.username || "Un organizador",
					inviterOrg: event.organization?.name || "Un evento",
					eventName: event.name,
					eventUrl,
					acceptUrl,
					recipientEmail: input.emailOrSlug,
				}),
			);

			await resend.emails.send({
				from: EMAIL_FROM,
				to: input.emailOrSlug,
				subject: `Invitación para co-organizar ${event.name}`,
				html: emailHtml,
			});
		} catch (error) {
			console.error("Error sending email:", error);
		}
	}

	revalidatePath(`/e/${event.shortCode}`);
	revalidatePath(`/e/${event.shortCode}/manage`);

	return {
		success: true,
		invite,
		message: isNewUser
			? "Invitación creada. Se enviará el email cuando el usuario se registre."
			: "Invitación enviada exitosamente",
	};
}

export async function acceptCohostInvite(inviteToken: string) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const invite = await db.query.eventHostOrganizations.findFirst({
		where: eq(eventHostOrganizations.inviteToken, inviteToken),
		with: {
			event: true,
			organization: true,
		},
	});

	if (!invite) {
		return { success: false, error: "Invitación no encontrada" };
	}

	if (invite.status !== "pending") {
		return { success: false, error: "Esta invitación ya fue procesada" };
	}

	if (invite.organization.ownerUserId !== userId) {
		return {
			success: false,
			error:
				"Solo el propietario de la organización puede aceptar esta invitación",
		};
	}

	await db
		.update(eventHostOrganizations)
		.set({
			status: "approved",
			acceptedAt: new Date(),
		})
		.where(eq(eventHostOrganizations.id, invite.id));

	const eventOrg = await db.query.organizations.findFirst({
		where: eq(organizations.id, invite.event.organizationId),
	});

	if (eventOrg) {
		revalidatePath(`/e/${invite.event.shortCode}`);
		revalidatePath(`/e/${invite.event.shortCode}/manage`);
	}

	return {
		success: true,
		message: `Ahora eres co-organizador de ${invite.event.name}`,
		eventSlug: invite.event.slug,
		eventShortCode: invite.event.shortCode,
	};
}

export async function rejectCohostInvite(inviteToken: string) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const invite = await db.query.eventHostOrganizations.findFirst({
		where: eq(eventHostOrganizations.inviteToken, inviteToken),
		with: {
			event: true,
			organization: true,
		},
	});

	if (!invite) {
		return { success: false, error: "Invitación no encontrada" };
	}

	if (invite.status !== "pending") {
		return { success: false, error: "Esta invitación ya fue procesada" };
	}

	if (invite.organization.ownerUserId !== userId) {
		return {
			success: false,
			error:
				"Solo el propietario de la organización puede rechazar esta invitación",
		};
	}

	await db
		.update(eventHostOrganizations)
		.set({
			status: "rejected",
		})
		.where(eq(eventHostOrganizations.id, invite.id));

	const eventOrg = await db.query.organizations.findFirst({
		where: eq(organizations.id, invite.event.organizationId),
	});

	if (eventOrg) {
		revalidatePath(`/e/${invite.event.shortCode}`);
	}

	return {
		success: true,
		message: "Invitación rechazada",
	};
}

export async function getEventCohost(eventId: string) {
	const cohosts = await db.query.eventHostOrganizations.findMany({
		where: eq(eventHostOrganizations.eventId, eventId),
		with: {
			organization: true,
		},
	});

	return cohosts;
}

export async function removeCohostInvite(inviteId: string) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const invite = await db.query.eventHostOrganizations.findFirst({
		where: eq(eventHostOrganizations.id, inviteId),
		with: {
			event: {
				with: {
					organization: true,
				},
			},
		},
	});

	if (!invite) {
		return { success: false, error: "Invitación no encontrada" };
	}

	if (invite.event.organization?.ownerUserId !== userId) {
		return {
			success: false,
			error: "Solo el organizador principal puede eliminar invitaciones",
		};
	}

	await db
		.delete(eventHostOrganizations)
		.where(eq(eventHostOrganizations.id, inviteId));

	if (invite.event.organization) {
		revalidatePath(`/e/${invite.event.shortCode}`);
		revalidatePath(`/e/${invite.event.shortCode}/manage`);
	}

	return { success: true, message: "Invitación eliminada" };
}
