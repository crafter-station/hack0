import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

interface CommunityLayoutProps {
	children: React.ReactNode;
	params: Promise<{ slug: string }>;
}

export default async function CommunityLayout({
	children,
	params,
}: CommunityLayoutProps) {
	const { slug } = await params;

	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />
			{children}
			<SiteFooter />
		</div>
	);
}
