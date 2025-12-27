import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { GalleryCard } from "@/components/gift/gallery-card";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";

export const metadata: Metadata = {
	title: "Galería Navideña 2025",
	description:
		"Explora las tarjetas navideñas generadas por la comunidad tech de LATAM",
};

export const revalidate = 60;

async function getGalleryCards() {
	const cards = await db
		.select()
		.from(giftCards)
		.where(eq(giftCards.status, "completed"))
		.orderBy(desc(giftCards.createdAt))
		.limit(100);

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(giftCards)
		.where(eq(giftCards.status, "completed"));

	return {
		cards,
		totalCount: Number(countResult[0]?.count || 0),
	};
}

export default async function GalleryPage() {
	const { cards, totalCount } = await getGalleryCards();

	return (
		<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
			<div className="mb-8 text-center">
				<h1 className="text-2xl font-semibold tracking-tight mb-2">
					Galería Navideña 2025
				</h1>
				<p className="text-sm text-muted-foreground">
					{totalCount} tarjetas generadas por la comunidad
				</p>
			</div>

			{cards.length === 0 ? (
				<div className="py-16 text-center">
					<p className="text-4xl mb-4">🎄</p>
					<p className="text-muted-foreground mb-4">
						Aún no hay tarjetas en la galería
					</p>
					<Link
						href="/gift"
						className="inline-flex h-9 items-center justify-center border border-white/20 bg-white/5 px-4 text-sm font-medium transition-colors hover:bg-white/10"
					>
						Crear mi tarjeta
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
					{cards.map((card) => (
						<GalleryCard key={card.id} card={card} />
					))}
				</div>
			)}

			<div className="mt-12 text-center">
				<Link
					href="/gift"
					className="inline-flex h-10 items-center justify-center border border-white/20 bg-white/5 px-6 text-sm font-medium transition-colors hover:bg-white/10"
				>
					Crear mi tarjeta 🎁
				</Link>
			</div>
		</div>
	);
}
