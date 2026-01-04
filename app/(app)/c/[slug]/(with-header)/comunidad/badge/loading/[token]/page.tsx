import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeLoading } from "@/components/org/badges";
import { Button } from "@/components/ui/button";

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
		<div className="flex flex-col items-center py-8 gap-4">
			<div className="w-full flex justify-start">
				<Button asChild variant="ghost" size="sm" className="gap-2">
					<Link href={`/c/${slug}/comunidad`}>
						<ArrowLeft className="h-4 w-4" />
						Comunidad
					</Link>
				</Button>
			</div>
			<BadgeLoading token={token} communitySlug={slug} />
		</div>
	);
}
