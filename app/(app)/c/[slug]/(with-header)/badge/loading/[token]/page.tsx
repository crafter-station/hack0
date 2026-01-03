import type { Metadata } from "next";
import { BadgeLoading } from "@/components/org/badges";

interface LoadingPageProps {
	params: Promise<{ slug: string; token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: "Generando tu badge...",
		description: "Tu badge se está generando con IA",
	};
}

export default async function LoadingPage({ params }: LoadingPageProps) {
	const { slug, token } = await params;

	return (
		<div className="flex items-center justify-center py-8">
			<BadgeLoading token={token} communitySlug={slug} />
		</div>
	);
}
