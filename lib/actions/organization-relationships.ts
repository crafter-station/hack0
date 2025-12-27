"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type NewOrganizationRelationship,
	type OrganizationRelationship,
	organizationRelationships,
	organizations,
	RELATIONSHIP_TYPE_LABELS,
	type RelationshipType,
} from "@/lib/db/schema";

export interface GraphNode {
	id: string;
	slug: string;
	name: string;
	type: string | null;
	logoUrl: string | null;
	department: string | null;
	memberCount: number;
	isVerified: boolean | null;
	websiteUrl: string | null;
}

export interface GraphEdge {
	id: string;
	source: string;
	target: string;
	type: RelationshipType;
	strength: number;
	label: string;
	isVerified: boolean;
	isBidirectional: boolean;
	sourceType: string;
	confidence: number;
}

export interface GraphStats {
	totalNodes: number;
	totalEdges: number;
	pendingVerification: number;
	orgsWithoutConnections: number;
	topConnected: Array<{ id: string; name: string; connections: number }>;
	byType: Record<string, number>;
}

export interface EcosystemGraphData {
	nodes: GraphNode[];
	edges: GraphEdge[];
	stats: GraphStats;
}

export async function getEcosystemGraph(filters?: {
	orgType?: string;
	department?: string;
	onlyVerified?: boolean;
	includePrivate?: boolean;
}): Promise<EcosystemGraphData> {
	const allOrgs = await db.query.organizations.findMany({
		where: and(
			filters?.includePrivate ? undefined : eq(organizations.isPublic, true),
			filters?.orgType
				? eq(organizations.type, filters.orgType as never)
				: undefined,
			filters?.department
				? eq(organizations.department, filters.department)
				: undefined,
		),
		columns: {
			id: true,
			slug: true,
			name: true,
			displayName: true,
			type: true,
			logoUrl: true,
			department: true,
			isVerified: true,
			websiteUrl: true,
		},
	});

	const memberCounts = await db
		.select({
			communityId: sql<string>`community_id`,
			count: sql<number>`count(*)::int`,
		})
		.from(sql`community_members`)
		.groupBy(sql`community_id`);

	const memberCountMap = new Map(
		memberCounts.map((m) => [m.communityId, m.count]),
	);

	const nodes: GraphNode[] = allOrgs.map((org) => ({
		id: org.id,
		slug: org.slug,
		name: org.displayName || org.name,
		type: org.type,
		logoUrl: org.logoUrl,
		department: org.department,
		memberCount: memberCountMap.get(org.id) || 0,
		isVerified: org.isVerified,
		websiteUrl: org.websiteUrl,
	}));

	const orgIds = nodes.map((n) => n.id);

	const relationships =
		orgIds.length > 0
			? await db.query.organizationRelationships.findMany({
					where: and(
						or(
							inArray(organizationRelationships.sourceOrgId, orgIds),
							inArray(organizationRelationships.targetOrgId, orgIds),
						),
						filters?.onlyVerified
							? eq(organizationRelationships.isVerified, true)
							: undefined,
					),
				})
			: [];

	const edges: GraphEdge[] = relationships
		.filter(
			(rel) =>
				orgIds.includes(rel.sourceOrgId) && orgIds.includes(rel.targetOrgId),
		)
		.map((rel) => ({
			id: rel.id,
			source: rel.sourceOrgId,
			target: rel.targetOrgId,
			type: rel.relationshipType as RelationshipType,
			strength: rel.strength || 5,
			label:
				RELATIONSHIP_TYPE_LABELS[rel.relationshipType] || rel.relationshipType,
			isVerified: rel.isVerified || false,
			isBidirectional: rel.isBidirectional || false,
			sourceType: rel.source || "manual",
			confidence: rel.confidence || 100,
		}));

	const connectionCounts = new Map<string, number>();
	for (const edge of edges) {
		connectionCounts.set(
			edge.source,
			(connectionCounts.get(edge.source) || 0) + 1,
		);
		connectionCounts.set(
			edge.target,
			(connectionCounts.get(edge.target) || 0) + 1,
		);
	}

	const connectedOrgIds = new Set([
		...edges.map((e) => e.source),
		...edges.map((e) => e.target),
	]);

	const topConnected = [...connectionCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([id, connections]) => {
			const node = nodes.find((n) => n.id === id);
			return { id, name: node?.name || "Unknown", connections };
		});

	const byType: Record<string, number> = {};
	for (const edge of edges) {
		byType[edge.type] = (byType[edge.type] || 0) + 1;
	}

	const stats: GraphStats = {
		totalNodes: nodes.length,
		totalEdges: edges.length,
		pendingVerification: edges.filter((e) => !e.isVerified).length,
		orgsWithoutConnections: nodes.length - connectedOrgIds.size,
		topConnected,
		byType,
	};

	return { nodes, edges, stats };
}

export async function getOrganizationGraph(
	orgId: string,
): Promise<EcosystemGraphData> {
	const centerOrg = await db.query.organizations.findFirst({
		where: eq(organizations.id, orgId),
		columns: {
			id: true,
			slug: true,
			name: true,
			displayName: true,
			type: true,
			logoUrl: true,
			department: true,
			isVerified: true,
			websiteUrl: true,
		},
	});

	if (!centerOrg) {
		return { nodes: [], edges: [], stats: getEmptyStats() };
	}

	const relationships = await db.query.organizationRelationships.findMany({
		where: or(
			eq(organizationRelationships.sourceOrgId, orgId),
			eq(organizationRelationships.targetOrgId, orgId),
		),
	});

	const relatedOrgIds = new Set<string>();
	for (const rel of relationships) {
		if (rel.sourceOrgId !== orgId) relatedOrgIds.add(rel.sourceOrgId);
		if (rel.targetOrgId !== orgId) relatedOrgIds.add(rel.targetOrgId);
	}

	const relatedOrgs =
		relatedOrgIds.size > 0
			? await db.query.organizations.findMany({
					where: inArray(organizations.id, [...relatedOrgIds]),
					columns: {
						id: true,
						slug: true,
						name: true,
						displayName: true,
						type: true,
						logoUrl: true,
						department: true,
						isVerified: true,
						websiteUrl: true,
					},
				})
			: [];

	const nodes: GraphNode[] = [
		{
			id: centerOrg.id,
			slug: centerOrg.slug,
			name: centerOrg.displayName || centerOrg.name,
			type: centerOrg.type,
			logoUrl: centerOrg.logoUrl,
			department: centerOrg.department,
			memberCount: 0,
			isVerified: centerOrg.isVerified,
			websiteUrl: centerOrg.websiteUrl,
		},
		...relatedOrgs.map((org) => ({
			id: org.id,
			slug: org.slug,
			name: org.displayName || org.name,
			type: org.type,
			logoUrl: org.logoUrl,
			department: org.department,
			memberCount: 0,
			isVerified: org.isVerified,
			websiteUrl: org.websiteUrl,
		})),
	];

	const edges: GraphEdge[] = relationships.map((rel) => ({
		id: rel.id,
		source: rel.sourceOrgId,
		target: rel.targetOrgId,
		type: rel.relationshipType as RelationshipType,
		strength: rel.strength || 5,
		label:
			RELATIONSHIP_TYPE_LABELS[rel.relationshipType] || rel.relationshipType,
		isVerified: rel.isVerified || false,
		isBidirectional: rel.isBidirectional || false,
		sourceType: rel.source || "manual",
		confidence: rel.confidence || 100,
	}));

	const byType: Record<string, number> = {};
	for (const edge of edges) {
		byType[edge.type] = (byType[edge.type] || 0) + 1;
	}

	return {
		nodes,
		edges,
		stats: {
			totalNodes: nodes.length,
			totalEdges: edges.length,
			pendingVerification: edges.filter((e) => !e.isVerified).length,
			orgsWithoutConnections: 0,
			topConnected: [],
			byType,
		},
	};
}

function getEmptyStats(): GraphStats {
	return {
		totalNodes: 0,
		totalEdges: 0,
		pendingVerification: 0,
		orgsWithoutConnections: 0,
		topConnected: [],
		byType: {},
	};
}

export async function createRelationship(
	data: Omit<NewOrganizationRelationship, "id" | "createdAt" | "updatedAt">,
): Promise<{
	success: boolean;
	relationship?: OrganizationRelationship;
	error?: string;
}> {
	try {
		const [relationship] = await db
			.insert(organizationRelationships)
			.values(data)
			.returning();
		return { success: true, relationship };
	} catch (error) {
		console.error("Error creating relationship:", error);
		return { success: false, error: "Failed to create relationship" };
	}
}

export async function updateRelationship(
	id: string,
	data: Partial<OrganizationRelationship>,
): Promise<{ success: boolean; error?: string }> {
	try {
		await db
			.update(organizationRelationships)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(organizationRelationships.id, id));
		return { success: true };
	} catch (error) {
		console.error("Error updating relationship:", error);
		return { success: false, error: "Failed to update relationship" };
	}
}

export async function deleteRelationship(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await db
			.delete(organizationRelationships)
			.where(eq(organizationRelationships.id, id));
		return { success: true };
	} catch (error) {
		console.error("Error deleting relationship:", error);
		return { success: false, error: "Failed to delete relationship" };
	}
}

export async function verifyRelationship(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Not authenticated" };
	}

	try {
		await db
			.update(organizationRelationships)
			.set({
				isVerified: true,
				verifiedBy: userId,
				verifiedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(organizationRelationships.id, id));
		return { success: true };
	} catch (error) {
		console.error("Error verifying relationship:", error);
		return { success: false, error: "Failed to verify relationship" };
	}
}

export async function getPendingRelationships(): Promise<
	OrganizationRelationship[]
> {
	return db.query.organizationRelationships.findMany({
		where: and(
			eq(organizationRelationships.isVerified, false),
			eq(organizationRelationships.source, "scraped"),
		),
		orderBy: (rel, { desc }) => [desc(rel.createdAt)],
	});
}
