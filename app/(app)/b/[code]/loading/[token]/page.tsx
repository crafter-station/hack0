import { and, eq, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeLoadingViral } from "@/components/org/badges/badge-loading-viral";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

interface LoadingPageProps {
	params: Promise<{ code: string; token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: "Generando tu badge...",
		description: "Tu badge se está generando con IA",
	};
}

export default async function LoadingPage({ params }: LoadingPageProps) {
	const { code, token } = await params;

	const community = await db.query.organizations.findFirst({
		where: and(
			isNotNull(organizations.shortCode),
			eq(organizations.shortCode, code),
		),
	});

	if (!community) {
		notFound();
	}

	return (
		<div className="flex items-center justify-center min-h-screen">
			<BadgeLoadingViral
				token={token}
				shortCode={code}
				communityName={community.displayName || community.name}
				communityLogo={community.logoUrl}
			/>
		</div>
	);
}
