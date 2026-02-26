import { relations } from "drizzle-orm";
import { achievements, userAchievements } from "./achievements";
import { badgeCampaigns, communityBadges } from "./badges";
import { attendanceClaims, winnerClaims } from "./claims";
import {
	communityInvites,
	communityMembers,
	communityRoleRequests,
} from "./community";
import {
	eventHostOrganizations,
	eventHosts,
	eventOrganizers,
	eventSponsors,
	hostClaims,
} from "./event-staff";
import { events } from "./events";
import { giftCards } from "./gifts";
import { organizationRelationships, organizations } from "./organizations";
import {
	judgeAssignments,
	judgeScores,
	submissions,
	submissionTeamMembers,
	submissionTemplates,
} from "./submissions";
import { users } from "./users";

// ============================================
// RELATIONS
// ============================================

export const eventsRelations = relations(events, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [events.organizationId],
		references: [organizations.id],
	}),
	sponsors: many(eventSponsors),
	organizers: many(eventOrganizers),
	hostOrganizations: many(eventHostOrganizations),
	attendanceClaims: many(attendanceClaims),
	hosts: many(eventHosts),
	submissionTemplate: many(submissionTemplates),
	submissions: many(submissions),
	judgeAssignments: many(judgeAssignments),
}));

export const eventHostsRelations = relations(eventHosts, ({ one, many }) => ({
	event: one(events, {
		fields: [eventHosts.eventId],
		references: [events.id],
	}),
	representingOrg: one(organizations, {
		fields: [eventHosts.representingOrgId],
		references: [organizations.id],
	}),
	claims: many(hostClaims),
}));

export const hostClaimsRelations = relations(hostClaims, ({ one }) => ({
	eventHost: one(eventHosts, {
		fields: [hostClaims.eventHostId],
		references: [eventHosts.id],
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	achievements: many(userAchievements),
	giftCards: many(giftCards),
	winnerClaims: many(winnerClaims),
	memberships: many(communityMembers),
	attendanceClaims: many(attendanceClaims),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
	events: many(events),
	members: many(communityMembers),
	invites: many(communityInvites),
	sponsorships: many(eventSponsors),
	hostingEvents: many(eventHostOrganizations),
	outgoingRelationships: many(organizationRelationships, {
		relationName: "sourceOrg",
	}),
	incomingRelationships: many(organizationRelationships, {
		relationName: "targetOrg",
	}),
}));

export const organizationRelationshipsRelations = relations(
	organizationRelationships,
	({ one }) => ({
		sourceOrg: one(organizations, {
			fields: [organizationRelationships.sourceOrgId],
			references: [organizations.id],
			relationName: "sourceOrg",
		}),
		targetOrg: one(organizations, {
			fields: [organizationRelationships.targetOrgId],
			references: [organizations.id],
			relationName: "targetOrg",
		}),
	}),
);

export const communityMembersRelations = relations(
	communityMembers,
	({ one }) => ({
		community: one(organizations, {
			fields: [communityMembers.communityId],
			references: [organizations.id],
		}),
	}),
);

export const communityInvitesRelations = relations(
	communityInvites,
	({ one }) => ({
		community: one(organizations, {
			fields: [communityInvites.communityId],
			references: [organizations.id],
		}),
	}),
);

export const communityRoleRequestsRelations = relations(
	communityRoleRequests,
	({ one }) => ({
		community: one(organizations, {
			fields: [communityRoleRequests.communityId],
			references: [organizations.id],
		}),
	}),
);

export const eventSponsorsRelations = relations(eventSponsors, ({ one }) => ({
	event: one(events, {
		fields: [eventSponsors.eventId],
		references: [events.id],
	}),
	organization: one(organizations, {
		fields: [eventSponsors.organizationId],
		references: [organizations.id],
	}),
}));

export const eventOrganizersRelations = relations(
	eventOrganizers,
	({ one }) => ({
		event: one(events, {
			fields: [eventOrganizers.eventId],
			references: [events.id],
		}),
		representingOrg: one(organizations, {
			fields: [eventOrganizers.representingOrgId],
			references: [organizations.id],
		}),
	}),
);

export const eventHostOrganizationsRelations = relations(
	eventHostOrganizations,
	({ one }) => ({
		event: one(events, {
			fields: [eventHostOrganizations.eventId],
			references: [events.id],
		}),
		organization: one(organizations, {
			fields: [eventHostOrganizations.organizationId],
			references: [organizations.id],
		}),
	}),
);

export const attendanceClaimsRelations = relations(
	attendanceClaims,
	({ one }) => ({
		event: one(events, {
			fields: [attendanceClaims.eventId],
			references: [events.id],
		}),
	}),
);

export const userAchievementsRelations = relations(
	userAchievements,
	({ one }) => ({
		achievement: one(achievements, {
			fields: [userAchievements.achievementId],
			references: [achievements.id],
		}),
	}),
);

export const badgeCampaignsRelations = relations(
	badgeCampaigns,
	({ one, many }) => ({
		community: one(organizations, {
			fields: [badgeCampaigns.communityId],
			references: [organizations.id],
		}),
		event: one(events, {
			fields: [badgeCampaigns.eventId],
			references: [events.id],
		}),
		badges: many(communityBadges),
	}),
);

export const communityBadgesRelations = relations(
	communityBadges,
	({ one }) => ({
		community: one(organizations, {
			fields: [communityBadges.communityId],
			references: [organizations.id],
		}),
		campaign: one(badgeCampaigns, {
			fields: [communityBadges.campaignId],
			references: [badgeCampaigns.id],
		}),
	}),
);

// ============================================
// SUBMISSION SYSTEM RELATIONS
// ============================================

export const submissionTemplatesRelations = relations(
	submissionTemplates,
	({ one }) => ({
		event: one(events, {
			fields: [submissionTemplates.eventId],
			references: [events.id],
		}),
	}),
);

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
	event: one(events, {
		fields: [submissions.eventId],
		references: [events.id],
	}),
	template: one(submissionTemplates, {
		fields: [submissions.templateId],
		references: [submissionTemplates.id],
	}),
	teamMembers: many(submissionTeamMembers),
	judgeScores: many(judgeScores),
}));

export const submissionTeamMembersRelations = relations(
	submissionTeamMembers,
	({ one }) => ({
		submission: one(submissions, {
			fields: [submissionTeamMembers.submissionId],
			references: [submissions.id],
		}),
	}),
);

export const judgeAssignmentsRelations = relations(
	judgeAssignments,
	({ one }) => ({
		event: one(events, {
			fields: [judgeAssignments.eventId],
			references: [events.id],
		}),
		submission: one(submissions, {
			fields: [judgeAssignments.submissionId],
			references: [submissions.id],
		}),
	}),
);

export const judgeScoresRelations = relations(judgeScores, ({ one }) => ({
	submission: one(submissions, {
		fields: [judgeScores.submissionId],
		references: [submissions.id],
	}),
}));
