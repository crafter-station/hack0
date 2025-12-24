import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export async function GET() {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const personalOrg = await db.query.organizations.findFirst({
		where: eq(organizations.ownerUserId, userId),
		columns: { slug: true, isPersonalOrg: true },
	});

	if (personalOrg?.isPersonalOrg) {
		redirect(`/c/${personalOrg.slug}/achievements`);
	}

	redirect("/");
}
