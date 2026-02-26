"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { canManageEventById } from "@/lib/actions/permissions";
import { db } from "@/lib/db";
import type { JudgingCriterion, TemplateField } from "@/lib/db/schema";
import {
	judgeAssignments,
	judgeScores,
	submissions,
	submissionTeamMembers,
	submissionTemplates,
} from "@/lib/db/schema";
import { generateSlug } from "@/lib/slug-utils";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

// ============================================
// TEMPLATE MANAGEMENT (Organizer-only)
// ============================================

export async function createSubmissionTemplate(
	eventId: string,
	data: {
		name: string;
		description?: string;
		fields?: TemplateField[];
		judgingCriteria?: JudgingCriterion[];
		submissionDeadline?: Date;
		editDeadline?: Date;
		allowLateSubmissions?: boolean;
		allowSoloSubmissions?: boolean;
		minTeamSize?: number;
		maxTeamSize?: number;
	},
): Promise<{ success: boolean; error?: string; data?: { id: string } }> {
	const canManage = await canManageEventById(eventId);
	if (!canManage) {
		return {
			success: false,
			error: "No tienes permisos para gestionar este evento",
		};
	}

	try {
		const existing = await db.query.submissionTemplates.findFirst({
			where: eq(submissionTemplates.eventId, eventId),
		});

		if (existing) {
			return {
				success: false,
				error: "Ya existe un template de entregas para este evento",
			};
		}

		const [template] = await db
			.insert(submissionTemplates)
			.values({
				eventId,
				name: data.name,
				description: data.description,
				fields: data.fields ?? [],
				judgingCriteria: data.judgingCriteria ?? [],
				submissionDeadline: data.submissionDeadline,
				editDeadline: data.editDeadline,
				allowLateSubmissions: data.allowLateSubmissions ?? false,
				allowSoloSubmissions: data.allowSoloSubmissions ?? true,
				minTeamSize: data.minTeamSize ?? 1,
				maxTeamSize: data.maxTeamSize ?? 5,
			})
			.returning({ id: submissionTemplates.id });

		return { success: true, data: { id: template.id } };
	} catch (error) {
		console.error("Error creating submission template:", error);
		return { success: false, error: "Error al crear el template" };
	}
}

export async function updateSubmissionTemplate(
	templateId: string,
	data: {
		name?: string;
		description?: string;
		fields?: TemplateField[];
		judgingCriteria?: JudgingCriterion[];
		submissionDeadline?: Date | null;
		editDeadline?: Date | null;
		allowLateSubmissions?: boolean;
		allowSoloSubmissions?: boolean;
		minTeamSize?: number;
		maxTeamSize?: number;
		isActive?: boolean;
	},
): Promise<{ success: boolean; error?: string }> {
	try {
		const template = await db.query.submissionTemplates.findFirst({
			where: eq(submissionTemplates.id, templateId),
		});

		if (!template) {
			return { success: false, error: "Template no encontrado" };
		}

		const canManage = await canManageEventById(template.eventId);
		if (!canManage) {
			return {
				success: false,
				error: "No tienes permisos para gestionar este evento",
			};
		}

		await db
			.update(submissionTemplates)
			.set({
				...(data.name !== undefined && { name: data.name }),
				...(data.description !== undefined && {
					description: data.description,
				}),
				...(data.fields !== undefined && { fields: data.fields }),
				...(data.judgingCriteria !== undefined && {
					judgingCriteria: data.judgingCriteria,
				}),
				...(data.submissionDeadline !== undefined && {
					submissionDeadline: data.submissionDeadline,
				}),
				...(data.editDeadline !== undefined && {
					editDeadline: data.editDeadline,
				}),
				...(data.allowLateSubmissions !== undefined && {
					allowLateSubmissions: data.allowLateSubmissions,
				}),
				...(data.allowSoloSubmissions !== undefined && {
					allowSoloSubmissions: data.allowSoloSubmissions,
				}),
				...(data.minTeamSize !== undefined && {
					minTeamSize: data.minTeamSize,
				}),
				...(data.maxTeamSize !== undefined && {
					maxTeamSize: data.maxTeamSize,
				}),
				...(data.isActive !== undefined && { isActive: data.isActive }),
				updatedAt: new Date(),
			})
			.where(eq(submissionTemplates.id, templateId));

		return { success: true };
	} catch (error) {
		console.error("Error updating submission template:", error);
		return { success: false, error: "Error al actualizar el template" };
	}
}

export async function getSubmissionTemplate(eventId: string) {
	return db.query.submissionTemplates.findFirst({
		where: eq(submissionTemplates.eventId, eventId),
	});
}

// ============================================
// SUBMISSIONS (Participant)
// ============================================

export async function createSubmission(
	eventId: string,
	projectName: string,
): Promise<{
	success: boolean;
	error?: string;
	data?: { id: string; slug: string };
}> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	try {
		const template = await db.query.submissionTemplates.findFirst({
			where: and(
				eq(submissionTemplates.eventId, eventId),
				eq(submissionTemplates.isActive, true),
			),
		});

		if (!template) {
			return {
				success: false,
				error: "Las entregas no están habilitadas para este evento",
			};
		}

		// Check deadline
		if (
			template.submissionDeadline &&
			new Date() > template.submissionDeadline &&
			!template.allowLateSubmissions
		) {
			return { success: false, error: "El plazo de entregas ha finalizado" };
		}

		// Check if user already has a submission for this event
		const existingSubmission = await db.query.submissions.findFirst({
			where: and(
				eq(submissions.eventId, eventId),
				eq(submissions.leadUserId, userId),
			),
		});

		if (existingSubmission) {
			return {
				success: false,
				error: "Ya tienes una entrega para este evento",
			};
		}

		// Also check if user is a team member in another submission
		const existingMembership = await db
			.select({ id: submissionTeamMembers.id })
			.from(submissionTeamMembers)
			.innerJoin(
				submissions,
				eq(submissionTeamMembers.submissionId, submissions.id),
			)
			.where(
				and(
					eq(submissions.eventId, eventId),
					eq(submissionTeamMembers.userId, userId),
					eq(submissionTeamMembers.status, "accepted"),
				),
			)
			.limit(1);

		if (existingMembership.length > 0) {
			return {
				success: false,
				error: "Ya eres miembro de un equipo en este evento",
			};
		}

		const baseSlug = generateSlug(projectName);
		// Ensure unique slug within event
		let projectSlug = baseSlug;
		let counter = 2;
		let isUnique = false;
		while (!isUnique) {
			const existing = await db.query.submissions.findFirst({
				where: and(
					eq(submissions.eventId, eventId),
					eq(submissions.projectSlug, projectSlug),
				),
			});
			if (!existing) {
				isUnique = true;
			} else {
				projectSlug = `${baseSlug}-${counter}`;
				counter++;
			}
		}

		const [submission] = await db
			.insert(submissions)
			.values({
				eventId,
				templateId: template.id,
				projectName,
				projectSlug,
				leadUserId: userId,
				status: "draft",
			})
			.returning({ id: submissions.id, slug: submissions.projectSlug });

		// Auto-add lead as team member
		await db.insert(submissionTeamMembers).values({
			submissionId: submission.id,
			userId,
			role: "lead",
			status: "accepted",
			joinedAt: new Date(),
		});

		return {
			success: true,
			data: { id: submission.id, slug: submission.slug },
		};
	} catch (error) {
		console.error("Error creating submission:", error);
		return { success: false, error: "Error al crear la entrega" };
	}
}

export async function updateSubmission(
	submissionId: string,
	data: {
		projectName?: string;
		shortDescription?: string;
		responses?: Record<string, string | string[] | number | boolean>;
	},
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	try {
		const submission = await db.query.submissions.findFirst({
			where: eq(submissions.id, submissionId),
			with: { template: true },
		});

		if (!submission) {
			return { success: false, error: "Entrega no encontrada" };
		}

		if (submission.leadUserId !== userId) {
			return {
				success: false,
				error: "Solo el líder del equipo puede editar la entrega",
			};
		}

		// Check edit deadline if already submitted
		if (
			submission.status !== "draft" &&
			submission.template.editDeadline &&
			new Date() > submission.template.editDeadline
		) {
			return { success: false, error: "El plazo de edición ha finalizado" };
		}

		await db
			.update(submissions)
			.set({
				...(data.projectName !== undefined && {
					projectName: data.projectName,
				}),
				...(data.shortDescription !== undefined && {
					shortDescription: data.shortDescription,
				}),
				...(data.responses !== undefined && { responses: data.responses }),
				editedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(submissions.id, submissionId));

		return { success: true };
	} catch (error) {
		console.error("Error updating submission:", error);
		return { success: false, error: "Error al actualizar la entrega" };
	}
}

export async function submitSubmission(
	submissionId: string,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	try {
		const submission = await db.query.submissions.findFirst({
			where: eq(submissions.id, submissionId),
			with: { template: true },
		});

		if (!submission) {
			return { success: false, error: "Entrega no encontrada" };
		}

		if (submission.leadUserId !== userId) {
			return {
				success: false,
				error: "Solo el líder del equipo puede enviar la entrega",
			};
		}

		if (submission.status !== "draft") {
			return { success: false, error: "Esta entrega ya fue enviada" };
		}

		// Check deadline
		if (
			submission.template.submissionDeadline &&
			new Date() > submission.template.submissionDeadline &&
			!submission.template.allowLateSubmissions
		) {
			return { success: false, error: "El plazo de entregas ha finalizado" };
		}

		// Validate required fields
		const template = submission.template;
		const responses = (submission.responses ?? {}) as Record<string, unknown>;
		for (const field of template.fields ?? []) {
			if (field.required) {
				const value = responses[field.id];
				if (value === undefined || value === null || value === "") {
					return {
						success: false,
						error: `El campo "${field.label}" es obligatorio`,
					};
				}
			}
		}

		// Validate team size
		const teamMembers = await db.query.submissionTeamMembers.findMany({
			where: and(
				eq(submissionTeamMembers.submissionId, submissionId),
				eq(submissionTeamMembers.status, "accepted"),
			),
		});

		const teamSize = teamMembers.length;
		if (teamSize < (template.minTeamSize ?? 1)) {
			return {
				success: false,
				error: `El equipo necesita al menos ${template.minTeamSize} miembro(s)`,
			};
		}
		if (teamSize > (template.maxTeamSize ?? 5)) {
			return {
				success: false,
				error: `El equipo no puede tener más de ${template.maxTeamSize} miembro(s)`,
			};
		}

		await db
			.update(submissions)
			.set({
				status: "submitted",
				submittedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(submissions.id, submissionId));

		return { success: true };
	} catch (error) {
		console.error("Error submitting submission:", error);
		return { success: false, error: "Error al enviar la entrega" };
	}
}

export async function getMySubmission(eventId: string) {
	const { userId } = await auth();
	if (!userId) return null;

	// Check if user is a lead
	const asLead = await db.query.submissions.findFirst({
		where: and(
			eq(submissions.eventId, eventId),
			eq(submissions.leadUserId, userId),
		),
		with: {
			template: true,
			teamMembers: true,
		},
	});

	if (asLead) return asLead;

	// Check if user is a team member
	const membership = await db
		.select({ submissionId: submissionTeamMembers.submissionId })
		.from(submissionTeamMembers)
		.innerJoin(
			submissions,
			eq(submissionTeamMembers.submissionId, submissions.id),
		)
		.where(
			and(
				eq(submissions.eventId, eventId),
				eq(submissionTeamMembers.userId, userId),
				eq(submissionTeamMembers.status, "accepted"),
			),
		)
		.limit(1);

	if (membership.length > 0) {
		return db.query.submissions.findFirst({
			where: eq(submissions.id, membership[0].submissionId),
			with: {
				template: true,
				teamMembers: true,
			},
		});
	}

	return null;
}

export async function getEventSubmissions(
	eventId: string,
	filters?: { status?: string },
) {
	const conditions = [eq(submissions.eventId, eventId)];

	// Public gallery only shows submitted+ projects
	if (filters?.status) {
		conditions.push(
			eq(
				submissions.status,
				filters.status as
					| "submitted"
					| "under_review"
					| "scored"
					| "winner"
					| "finalist",
			),
		);
	}

	return db.query.submissions.findMany({
		where: and(...conditions),
		with: {
			teamMembers: true,
		},
		orderBy: [desc(submissions.submittedAt)],
	});
}

export async function getSubmissionBySlug(eventId: string, slug: string) {
	return db.query.submissions.findFirst({
		where: and(
			eq(submissions.eventId, eventId),
			eq(submissions.projectSlug, slug),
		),
		with: {
			template: true,
			teamMembers: true,
			judgeScores: true,
		},
	});
}

// ============================================
// TEAM MANAGEMENT
// ============================================

export async function inviteTeamMember(
	submissionId: string,
	inviteeUserId: string,
): Promise<{ success: boolean; error?: string; data?: { token: string } }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	try {
		const submission = await db.query.submissions.findFirst({
			where: eq(submissions.id, submissionId),
			with: { template: true, teamMembers: true },
		});

		if (!submission) {
			return { success: false, error: "Entrega no encontrada" };
		}

		if (submission.leadUserId !== userId) {
			return { success: false, error: "Solo el líder puede invitar miembros" };
		}

		// Check team size limit
		const acceptedMembers = submission.teamMembers.filter(
			(m) => m.status === "accepted" || m.status === "pending",
		);
		if (acceptedMembers.length >= (submission.template.maxTeamSize ?? 5)) {
			return {
				success: false,
				error: "El equipo ha alcanzado el tamaño máximo",
			};
		}

		// Check if user is already in team
		const existingMember = submission.teamMembers.find(
			(m) => m.userId === inviteeUserId,
		);
		if (existingMember) {
			return { success: false, error: "Este usuario ya es parte del equipo" };
		}

		const token = nanoid();

		await db.insert(submissionTeamMembers).values({
			submissionId,
			userId: inviteeUserId,
			role: "developer",
			status: "pending",
			inviteToken: token,
			invitedBy: userId,
		});

		return { success: true, data: { token } };
	} catch (error) {
		console.error("Error inviting team member:", error);
		return { success: false, error: "Error al invitar al miembro" };
	}
}

export async function acceptTeamInvite(
	token: string,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	try {
		const member = await db.query.submissionTeamMembers.findFirst({
			where: eq(submissionTeamMembers.inviteToken, token),
			with: { submission: true },
		});

		if (!member) {
			return { success: false, error: "Invitación no encontrada" };
		}

		if (member.userId !== userId) {
			return { success: false, error: "Esta invitación no es para ti" };
		}

		if (member.status !== "pending") {
			return { success: false, error: "Esta invitación ya fue procesada" };
		}

		// Check if user already has a submission for the same event
		const existingSubmission = await db.query.submissions.findFirst({
			where: and(
				eq(submissions.eventId, member.submission.eventId),
				eq(submissions.leadUserId, userId),
			),
		});

		if (existingSubmission) {
			return {
				success: false,
				error:
					"Ya tienes tu propia entrega en este evento. Debes eliminarla antes de unirte a otro equipo.",
			};
		}

		await db
			.update(submissionTeamMembers)
			.set({
				status: "accepted",
				joinedAt: new Date(),
			})
			.where(eq(submissionTeamMembers.id, member.id));

		return { success: true };
	} catch (error) {
		console.error("Error accepting team invite:", error);
		return { success: false, error: "Error al aceptar la invitación" };
	}
}

export async function declineTeamInvite(
	token: string,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	try {
		const member = await db.query.submissionTeamMembers.findFirst({
			where: eq(submissionTeamMembers.inviteToken, token),
		});

		if (!member) {
			return { success: false, error: "Invitación no encontrada" };
		}

		if (member.userId !== userId) {
			return { success: false, error: "Esta invitación no es para ti" };
		}

		if (member.status !== "pending") {
			return { success: false, error: "Esta invitación ya fue procesada" };
		}

		await db
			.update(submissionTeamMembers)
			.set({ status: "declined" })
			.where(eq(submissionTeamMembers.id, member.id));

		return { success: true };
	} catch (error) {
		console.error("Error declining team invite:", error);
		return { success: false, error: "Error al rechazar la invitación" };
	}
}

export async function removeTeamMember(
	submissionId: string,
	memberUserId: string,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	try {
		const submission = await db.query.submissions.findFirst({
			where: eq(submissions.id, submissionId),
		});

		if (!submission) {
			return { success: false, error: "Entrega no encontrada" };
		}

		if (submission.leadUserId !== userId) {
			return { success: false, error: "Solo el líder puede remover miembros" };
		}

		if (memberUserId === userId) {
			return {
				success: false,
				error: "No puedes removerte a ti mismo como líder",
			};
		}

		await db
			.update(submissionTeamMembers)
			.set({ status: "removed" })
			.where(
				and(
					eq(submissionTeamMembers.submissionId, submissionId),
					eq(submissionTeamMembers.userId, memberUserId),
				),
			);

		return { success: true };
	} catch (error) {
		console.error("Error removing team member:", error);
		return { success: false, error: "Error al remover al miembro" };
	}
}

export async function leaveTeam(
	submissionId: string,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	try {
		const submission = await db.query.submissions.findFirst({
			where: eq(submissions.id, submissionId),
		});

		if (!submission) {
			return { success: false, error: "Entrega no encontrada" };
		}

		if (submission.leadUserId === userId) {
			return {
				success: false,
				error:
					"El líder no puede abandonar el equipo. Transfiere el liderazgo primero.",
			};
		}

		await db
			.update(submissionTeamMembers)
			.set({ status: "removed" })
			.where(
				and(
					eq(submissionTeamMembers.submissionId, submissionId),
					eq(submissionTeamMembers.userId, userId),
				),
			);

		return { success: true };
	} catch (error) {
		console.error("Error leaving team:", error);
		return { success: false, error: "Error al abandonar el equipo" };
	}
}

// ============================================
// JUDGING (Organizer-only)
// ============================================

export async function assignJudge(
	eventId: string,
	judgeUserId: string,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const canManage = await canManageEventById(eventId);
	if (!canManage) {
		return {
			success: false,
			error: "No tienes permisos para gestionar este evento",
		};
	}

	try {
		const existing = await db.query.judgeAssignments.findFirst({
			where: and(
				eq(judgeAssignments.eventId, eventId),
				eq(judgeAssignments.userId, judgeUserId),
			),
		});

		if (existing) {
			return { success: false, error: "Este usuario ya es juez del evento" };
		}

		await db.insert(judgeAssignments).values({
			eventId,
			userId: judgeUserId,
			assignedBy: userId,
		});

		return { success: true };
	} catch (error) {
		console.error("Error assigning judge:", error);
		return { success: false, error: "Error al asignar juez" };
	}
}

export async function removeJudge(
	eventId: string,
	judgeUserId: string,
): Promise<{ success: boolean; error?: string }> {
	const canManage = await canManageEventById(eventId);
	if (!canManage) {
		return {
			success: false,
			error: "No tienes permisos para gestionar este evento",
		};
	}

	try {
		await db
			.delete(judgeAssignments)
			.where(
				and(
					eq(judgeAssignments.eventId, eventId),
					eq(judgeAssignments.userId, judgeUserId),
				),
			);

		return { success: true };
	} catch (error) {
		console.error("Error removing judge:", error);
		return { success: false, error: "Error al remover juez" };
	}
}

export async function getJudgeAssignments(eventId: string) {
	return db.query.judgeAssignments.findMany({
		where: eq(judgeAssignments.eventId, eventId),
	});
}

export async function isJudgeForEvent(eventId: string): Promise<boolean> {
	const { userId } = await auth();
	if (!userId) return false;

	const assignment = await db.query.judgeAssignments.findFirst({
		where: and(
			eq(judgeAssignments.eventId, eventId),
			eq(judgeAssignments.userId, userId),
		),
	});

	return !!assignment;
}

export async function submitJudgeScore(
	submissionId: string,
	scores: { criterionId: string; score: number; comment?: string }[],
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	try {
		const submission = await db.query.submissions.findFirst({
			where: eq(submissions.id, submissionId),
			with: { template: true },
		});

		if (!submission) {
			return { success: false, error: "Entrega no encontrada" };
		}

		// Verify user is a judge for this event
		const assignment = await db.query.judgeAssignments.findFirst({
			where: and(
				eq(judgeAssignments.eventId, submission.eventId),
				eq(judgeAssignments.userId, userId),
			),
		});

		if (!assignment) {
			return { success: false, error: "No eres juez de este evento" };
		}

		// Validate scores against criteria
		const criteria = submission.template.judgingCriteria ?? [];
		for (const scoreEntry of scores) {
			const criterion = criteria.find((c) => c.id === scoreEntry.criterionId);
			if (!criterion) {
				return {
					success: false,
					error: `Criterio "${scoreEntry.criterionId}" no encontrado`,
				};
			}
			if (scoreEntry.score < 0 || scoreEntry.score > criterion.maxScore) {
				return {
					success: false,
					error: `Puntaje para "${criterion.name}" debe ser entre 0 y ${criterion.maxScore}`,
				};
			}
		}

		// Upsert scores
		for (const scoreEntry of scores) {
			const existingScore = await db.query.judgeScores.findFirst({
				where: and(
					eq(judgeScores.submissionId, submissionId),
					eq(judgeScores.judgeUserId, userId),
					eq(judgeScores.criterionId, scoreEntry.criterionId),
				),
			});

			if (existingScore) {
				await db
					.update(judgeScores)
					.set({
						score: scoreEntry.score,
						comment: scoreEntry.comment,
						scoredAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(judgeScores.id, existingScore.id));
			} else {
				await db.insert(judgeScores).values({
					submissionId,
					judgeUserId: userId,
					criterionId: scoreEntry.criterionId,
					score: scoreEntry.score,
					comment: scoreEntry.comment,
				});
			}
		}

		// Update submission status
		if (submission.status === "submitted") {
			await db
				.update(submissions)
				.set({ status: "under_review", updatedAt: new Date() })
				.where(eq(submissions.id, submissionId));
		}

		return { success: true };
	} catch (error) {
		console.error("Error submitting judge score:", error);
		return { success: false, error: "Error al guardar los puntajes" };
	}
}

export async function getJudgeScores(submissionId: string) {
	return db.query.judgeScores.findMany({
		where: eq(judgeScores.submissionId, submissionId),
	});
}

export async function getMyJudgeScores(submissionId: string) {
	const { userId } = await auth();
	if (!userId) return [];

	return db.query.judgeScores.findMany({
		where: and(
			eq(judgeScores.submissionId, submissionId),
			eq(judgeScores.judgeUserId, userId),
		),
	});
}

export async function calculateRankings(
	eventId: string,
): Promise<{ success: boolean; error?: string }> {
	const canManage = await canManageEventById(eventId);
	if (!canManage) {
		return {
			success: false,
			error: "No tienes permisos para gestionar este evento",
		};
	}

	try {
		const template = await db.query.submissionTemplates.findFirst({
			where: eq(submissionTemplates.eventId, eventId),
		});

		if (!template) {
			return { success: false, error: "No hay template de entregas" };
		}

		const criteria = template.judgingCriteria ?? [];
		const eventSubmissions = await db.query.submissions.findMany({
			where: and(
				eq(submissions.eventId, eventId),
				sql`${submissions.status} != 'draft'`,
			),
			with: { judgeScores: true },
		});

		// Calculate weighted scores for each submission
		const scored: { id: string; weightedTotal: number; judgeCount: number }[] =
			[];

		for (const sub of eventSubmissions) {
			if (sub.judgeScores.length === 0) continue;

			// Group scores by judge
			const scoresByJudge = new Map<string, typeof sub.judgeScores>();
			for (const score of sub.judgeScores) {
				if (!scoresByJudge.has(score.judgeUserId)) {
					scoresByJudge.set(score.judgeUserId, []);
				}
				scoresByJudge.get(score.judgeUserId)!.push(score);
			}

			let totalWeightedScore = 0;
			let judgeCount = 0;

			for (const [, judgeScoreList] of scoresByJudge) {
				let judgeWeightedScore = 0;
				let totalWeight = 0;

				for (const criterion of criteria) {
					const scoreEntry = judgeScoreList.find(
						(s) => s.criterionId === criterion.id,
					);
					if (scoreEntry) {
						// Normalize score to 0-1 range, then multiply by weight
						const normalizedScore = scoreEntry.score / criterion.maxScore;
						judgeWeightedScore += normalizedScore * criterion.weight;
						totalWeight += criterion.weight;
					}
				}

				if (totalWeight > 0) {
					totalWeightedScore += judgeWeightedScore / totalWeight;
					judgeCount++;
				}
			}

			const avgScore =
				judgeCount > 0
					? Math.round((totalWeightedScore / judgeCount) * 100)
					: 0;

			scored.push({
				id: sub.id,
				weightedTotal: avgScore,
				judgeCount,
			});
		}

		// Sort by score descending
		scored.sort((a, b) => b.weightedTotal - a.weightedTotal);

		// Update rankings
		for (let i = 0; i < scored.length; i++) {
			await db
				.update(submissions)
				.set({
					totalScore: scored[i].weightedTotal,
					averageScore: scored[i].weightedTotal,
					judgeCount: scored[i].judgeCount,
					rank: i + 1,
					status: "scored",
					updatedAt: new Date(),
				})
				.where(eq(submissions.id, scored[i].id));
		}

		return { success: true };
	} catch (error) {
		console.error("Error calculating rankings:", error);
		return { success: false, error: "Error al calcular rankings" };
	}
}

// ============================================
// ORGANIZER SUBMISSION MANAGEMENT
// ============================================

export async function updateSubmissionStatus(
	submissionId: string,
	status:
		| "submitted"
		| "under_review"
		| "scored"
		| "winner"
		| "finalist"
		| "rejected"
		| "disqualified",
): Promise<{ success: boolean; error?: string }> {
	try {
		const submission = await db.query.submissions.findFirst({
			where: eq(submissions.id, submissionId),
		});

		if (!submission) {
			return { success: false, error: "Entrega no encontrada" };
		}

		const canManage = await canManageEventById(submission.eventId);
		if (!canManage) {
			return { success: false, error: "No tienes permisos" };
		}

		await db
			.update(submissions)
			.set({ status, updatedAt: new Date() })
			.where(eq(submissions.id, submissionId));

		return { success: true };
	} catch (error) {
		console.error("Error updating submission status:", error);
		return { success: false, error: "Error al actualizar estado" };
	}
}
