import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { communityBadges, organizations } from "@/lib/db/schema";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ token: string }> }
) {
	const { token } = await params;

	const [result] = await db
		.select({
			status: communityBadges.status,
			generatedImageUrl: communityBadges.generatedImageUrl,
			generatedBackgroundUrl: communityBadges.generatedBackgroundUrl,
			memberName: communityBadges.memberName,
			memberRole: communityBadges.memberRole,
			badgeNumber: communityBadges.badgeNumber,
			errorMessage: communityBadges.errorMessage,
			communityName: organizations.displayName,
			communitySlug: organizations.slug,
			communityLogo: organizations.logoUrl,
		})
		.from(communityBadges)
		.innerJoin(organizations, eq(communityBadges.communityId, organizations.id))
		.where(eq(communityBadges.shareToken, token))
		.limit(1);

	if (!result) {
		return Response.json({ error: "Badge not found" }, { status: 404 });
	}

	return Response.json(result);
}
