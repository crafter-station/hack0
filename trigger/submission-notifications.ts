import { metadata, task } from "@trigger.dev/sdk/v3";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions, submissionTemplates } from "@/lib/db/schema";
import { EMAIL_FROM, resend } from "@/lib/email/resend";

// ============================================
// SUBMISSION RECEIVED - Notify organizer
// ============================================

export const submissionReceivedTask = task({
	id: "submission-received",
	maxDuration: 30,
	run: async (payload: {
		submissionId: string;
		eventId: string;
		projectName: string;
		organizerEmail?: string;
	}) => {
		metadata.set("step", "sending_notification");
		metadata.set("submissionId", payload.submissionId);

		if (!payload.organizerEmail) {
			metadata.set("step", "skipped_no_email");
			return { sent: false, reason: "no_organizer_email" };
		}

		await resend.emails.send({
			from: EMAIL_FROM,
			to: payload.organizerEmail,
			subject: `Nueva entrega: ${payload.projectName}`,
			html: `
				<h2>Nueva entrega recibida</h2>
				<p>El proyecto <strong>${payload.projectName}</strong> fue enviado a tu evento.</p>
				<p>Revisa las entregas en el panel de gestión de tu evento.</p>
			`,
		});

		metadata.set("step", "completed");
		return { sent: true };
	},
});

// ============================================
// JUDGE ASSIGNED - Notify judge
// ============================================

export const judgeAssignedTask = task({
	id: "judge-assigned",
	maxDuration: 30,
	run: async (payload: {
		eventId: string;
		judgeEmail: string;
		eventName: string;
		eventCode: string;
	}) => {
		metadata.set("step", "sending_notification");

		await resend.emails.send({
			from: EMAIL_FROM,
			to: payload.judgeEmail,
			subject: `Fuiste asignado como juez: ${payload.eventName}`,
			html: `
				<h2>Asignación como juez</h2>
				<p>Fuiste asignado como juez para <strong>${payload.eventName}</strong>.</p>
				<p>Cuando las entregas estén listas, podrás evaluarlas desde el panel del evento.</p>
			`,
		});

		metadata.set("step", "completed");
		return { sent: true };
	},
});

// ============================================
// TEAM INVITE - Send team invite email
// ============================================

export const teamInviteTask = task({
	id: "team-invite",
	maxDuration: 30,
	run: async (payload: {
		inviteeEmail: string;
		inviterName: string;
		projectName: string;
		eventName: string;
		inviteUrl: string;
	}) => {
		metadata.set("step", "sending_invite");

		await resend.emails.send({
			from: EMAIL_FROM,
			to: payload.inviteeEmail,
			subject: `${payload.inviterName} te invita a unirte a "${payload.projectName}"`,
			html: `
				<h2>Invitación de equipo</h2>
				<p><strong>${payload.inviterName}</strong> te invita a unirte al equipo <strong>${payload.projectName}</strong> para el evento <strong>${payload.eventName}</strong>.</p>
				<p><a href="${payload.inviteUrl}" style="display:inline-block;padding:12px 24px;background:#171717;color:#fff;text-decoration:none;border-radius:6px;">Aceptar invitación</a></p>
				<p style="color:#666;font-size:12px;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
			`,
		});

		metadata.set("step", "completed");
		return { sent: true };
	},
});

// ============================================
// CALCULATE RANKINGS - Async ranking computation
// ============================================

export const calculateRankingsTask = task({
	id: "calculate-rankings",
	maxDuration: 120,
	run: async (payload: { eventId: string }) => {
		metadata.set("step", "loading_data");

		const template = await db.query.submissionTemplates.findFirst({
			where: eq(submissionTemplates.eventId, payload.eventId),
		});

		if (!template) {
			metadata.set("step", "error_no_template");
			return { success: false, error: "no_template" };
		}

		const criteria = template.judgingCriteria ?? [];
		const eventSubmissions = await db.query.submissions.findMany({
			where: and(
				eq(submissions.eventId, payload.eventId),
				sql`${submissions.status} != 'draft'`,
			),
			with: { judgeScores: true },
		});

		metadata.set("step", "calculating");
		metadata.set("totalSubmissions", eventSubmissions.length);

		const scored: { id: string; weightedTotal: number; judgeCount: number }[] =
			[];

		for (const sub of eventSubmissions) {
			if (sub.judgeScores.length === 0) continue;

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

			scored.push({ id: sub.id, weightedTotal: avgScore, judgeCount });
		}

		scored.sort((a, b) => b.weightedTotal - a.weightedTotal);

		metadata.set("step", "updating_ranks");

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

		metadata.set("step", "completed");
		return { success: true, rankedCount: scored.length };
	},
});
