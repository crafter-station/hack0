import { and, eq, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

interface BadgePreviewPageProps {
	params: Promise<{ code: string }>;
}

async function getOrganizationByShortCode(code: string) {
	return db.query.organizations.findFirst({
		where: and(
			isNotNull(organizations.shortCode),
			eq(organizations.shortCode, code),
		),
	});
}

export async function generateMetadata({
	params,
}: BadgePreviewPageProps): Promise<Metadata> {
	const { code } = await params;
	const community = await getOrganizationByShortCode(code);

	if (!community) {
		return { title: "Badge no encontrado" };
	}

	return {
		title: `Badge Preview - ${community.displayName || community.name}`,
		description: `Vista previa del badge de ${community.displayName || community.name}`,
	};
}

export default async function BadgePreviewPage({
	params,
}: BadgePreviewPageProps) {
	const { code } = await params;

	const community = await getOrganizationByShortCode(code);

	if (!community) {
		notFound();
	}

	// Badge config - in production this would come from the database
	const config = {
		logo: community.logoUrl || "",
		title: community.displayName || community.name,
		primaryColor: "#ffffff",
		secondaryColor: "#333333",
		accentColor: "#666666",
		backgroundColor: "#0a0a0a",
		textColor: "#ffffff",
		styles: ["Vercelf", "Comfy", "Santa", "Wham!"],
	};

	return (
		<main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
			<div className="w-full max-w-2xl space-y-8">
				{/* Large Preview */}
				<div
					className="rounded-2xl p-12 flex flex-col items-center shadow-2xl"
					style={{ backgroundColor: config.backgroundColor }}
				>
					{config.logo && (
						<img
							src={config.logo}
							alt="Logo"
							className="w-16 h-16 object-contain mb-6"
						/>
					)}

					<h2
						className="text-4xl mb-6 text-center font-serif italic"
						style={{ color: config.textColor }}
					>
						{config.title}
					</h2>

					<div className="flex items-center gap-2 mb-10 flex-wrap justify-center">
						{config.styles.map((style, index) => (
							<span
								key={style}
								className="px-4 py-2 rounded-full text-sm font-medium"
								style={{
									backgroundColor:
										index === 0 ? config.primaryColor : "transparent",
									color:
										index === 0 ? config.backgroundColor : config.accentColor,
									border:
										index === 0 ? "none" : `1px solid ${config.accentColor}`,
								}}
							>
								{style}
							</span>
						))}
						<span
							className="text-sm ml-2 font-serif italic"
							style={{ color: config.accentColor }}
						>
							yourself.
						</span>
					</div>

					<div
						className="w-40 h-40 border-2 border-dashed rounded-2xl mb-8"
						style={{ borderColor: config.accentColor }}
					/>

					<div className="flex flex-col gap-3 w-full max-w-[240px]">
						<button
							type="button"
							className="w-full py-2.5 px-4 rounded-full text-sm font-medium"
							style={{
								backgroundColor: config.primaryColor,
								color: config.backgroundColor,
							}}
						>
							Enable Camera
						</button>
						<button
							type="button"
							className="w-full py-2.5 px-4 rounded-full text-sm font-medium border"
							style={{
								backgroundColor: "transparent",
								color: config.textColor,
								borderColor: config.accentColor,
							}}
						>
							Upload Image
						</button>
					</div>

					<footer
						className="mt-12 text-xs"
						style={{ color: config.accentColor }}
					>
						Built with v0, AI SDK & Vercel AI Gateway.
					</footer>
				</div>

				{/* Actions */}
				<div className="flex justify-center gap-3">
					<Button asChild variant="outline">
						<Link href={`/c/${community.slug}`}>Ver comunidad</Link>
					</Button>
					<Button asChild>
						<Link href={`/c/${community.slug}/badge`}>Generar mi badge</Link>
					</Button>
				</div>
			</div>
		</main>
	);
}
