import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Users, LayoutDashboard, Settings, BarChart3, UserPlus, Shield, Crown } from "lucide-react";
import { db } from "@/lib/db";
import { organizations, organizationMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { auth, clerkClient } from "@clerk/nextjs/server";

interface MembersPageProps {
	params: Promise<{ slug: string }>;
}

async function CommunityHero({ slug, isOwner }: { slug: string; isOwner: boolean }) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) return null;

	return (
		<div className="relative border-b">
			<div
				className="absolute inset-0 opacity-[0.02]"
				style={{
					backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
					backgroundSize: "48px 48px",
				}}
			/>

			<div className="relative mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
				<div className="flex items-start justify-between gap-6 mb-6">
					<div className="flex items-start gap-6">
						<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted border-2 border-border shrink-0">
							<Users className="h-10 w-10 text-muted-foreground" />
						</div>

						<div className="flex-1 space-y-3">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<Link href="/">
										<Button variant="ghost" size="sm" className="gap-2">
											<ArrowLeft className="h-4 w-4" />
											Volver
										</Button>
									</Link>
								</div>
								<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
									{community.displayName || community.name}
								</h1>
								{community.description && (
									<p className="text-lg text-muted-foreground mt-2 max-w-2xl">
										{community.description}
									</p>
								)}
							</div>
						</div>
					</div>

					{isOwner && (
						<Link href={`/c/${slug}/events/new`}>
							<Button className="gap-2">
								<UserPlus className="h-4 w-4" />
								Nuevo evento
							</Button>
						</Link>
					)}
				</div>

				<nav className="flex items-center gap-1 border-b border-border -mb-px">
					<Link
						href={`/c/${slug}`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
					>
						<Calendar className="h-4 w-4" />
						Eventos
					</Link>
					<Link
						href={`/c/${slug}/members`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-foreground text-foreground"
					>
						<Users className="h-4 w-4" />
						Miembros
					</Link>
					{isOwner && (
						<>
							<Link
								href={`/c/${slug}/analytics`}
								className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
							>
								<BarChart3 className="h-4 w-4" />
								Analytics
							</Link>
							<Link
								href={`/c/${slug}/settings`}
								className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
							>
								<Settings className="h-4 w-4" />
								Configuración
							</Link>
						</>
					)}
				</nav>
			</div>
		</div>
	);
}

async function MembersList({ slug }: { slug: string }) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		with: {
			members: true,
		},
	});

	if (!community) return null;

	const clerk = await clerkClient();
	const memberUserIds = [community.ownerUserId, ...community.members.map(m => m.userId)];

	const users = await Promise.all(
		memberUserIds.map(async (userId) => {
			try {
				return await clerk.users.getUser(userId);
			} catch {
				return null;
			}
		})
	);

	const validUsers = users.filter((user): user is NonNullable<typeof user> => user !== null);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{validUsers.length} miembro{validUsers.length !== 1 ? "s" : ""}
				</p>
			</div>

			<div className="rounded-lg border border-border overflow-hidden">
				<div className="divide-y divide-border">
					{validUsers.map((user) => {
						const isOwner = user.id === community.ownerUserId;
						const member = community.members.find(m => m.userId === user.id);

						return (
							<div key={user.id} className="px-5 py-4 flex items-center justify-between gap-4">
								<div className="flex items-center gap-3 min-w-0 flex-1">
									<div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
										{user.imageUrl ? (
											<img src={user.imageUrl} alt={user.firstName || "User"} className="h-full w-full object-cover" />
										) : (
											<span className="text-sm font-medium text-muted-foreground">
												{(user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || "?").toUpperCase()}
											</span>
										)}
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<p className="font-medium truncate">
												{user.firstName && user.lastName
													? `${user.firstName} ${user.lastName}`
													: user.firstName || user.emailAddresses[0]?.emailAddress || "Unknown"}
											</p>
											{isOwner && (
												<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500 shrink-0">
													<Crown className="h-3 w-3" />
													Owner
												</span>
											)}
											{member?.role === "admin" && !isOwner && (
												<span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500 shrink-0">
													<Shield className="h-3 w-3" />
													Admin
												</span>
											)}
										</div>
										<p className="text-sm text-muted-foreground truncate">
											{user.emailAddresses[0]?.emailAddress}
										</p>
									</div>
								</div>
								<div className="text-sm text-muted-foreground">
									{member?.role || "member"}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function MembersSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-5 bg-muted rounded w-32 animate-pulse" />
			<div className="rounded-lg border border-border overflow-hidden">
				<div className="divide-y divide-border">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
							<div className="h-10 w-10 rounded-full bg-muted" />
							<div className="space-y-2 flex-1">
								<div className="h-4 bg-muted rounded w-48" />
								<div className="h-3 bg-muted rounded w-64" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export async function generateMetadata({
	params,
}: MembersPageProps): Promise<Metadata> {
	const { slug } = await params;
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		return {
			title: "Comunidad no encontrada",
		};
	}

	return {
		title: `Miembros - ${community.displayName || community.name}`,
		description: `Miembros de ${community.displayName || community.name}`,
	};
}

export default async function MembersPage({ params }: MembersPageProps) {
	const { slug } = await params;
	const { userId } = await auth();

	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		notFound();
	}

	const isOwner = userId === community.ownerUserId;

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<Suspense fallback={null}>
				<CommunityHero slug={slug} isOwner={isOwner} />
			</Suspense>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				<Suspense fallback={<MembersSkeleton />}>
					<MembersList slug={slug} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}
