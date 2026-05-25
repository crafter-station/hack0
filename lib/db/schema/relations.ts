import { relations } from "drizzle-orm";
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
} from "./event-staff";
import { events } from "./events";
import { organizationRelationships, organizations } from "./organizations";
import { users } from "./users";

export const eventsRelations = relations(events, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [events.organizationId],
		references: [organizations.id],
	}),
	sponsors: many(eventSponsors),
	organizers: many(eventOrganizers),
	hostOrganizations: many(eventHostOrganizations),
	hosts: many(eventHosts),
}));

export const eventHostsRelations = relations(eventHosts, ({ one }) => ({
	event: one(events, {
		fields: [eventHosts.eventId],
		references: [events.id],
	}),
	representingOrg: one(organizations, {
		fields: [eventHosts.representingOrgId],
		references: [organizations.id],
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	memberships: many(communityMembers),
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
