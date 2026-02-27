import {
	Award,
	BarChart3,
	Calendar,
	ClipboardCheck,
	FileText,
	LayoutDashboard,
	Settings,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ManageContent } from "@/components/manage/manage-content";
import { Button } from "@/components/ui/button";
import {
	getEventImportJobs,
	getEventNotificationLogs,
} from "@/lib/actions/analytics";
import { getEventWinnerClaims } from "@/lib/actions/claims";
import { getEventCohost } from "@/lib/actions/cohost-invites";
import { getEventHostsWithUsers } from "@/lib/actions/event-hosts";
import { getEventByShortCode, getEventSponsors } from "@/lib/actions/events";
import { canManageEventByShortCode } from "@/lib/actions/permissions";
import { getSubmissionTemplate } from "@/lib/actions/submissions";

interface ManageEventPageProps {
	params: Promise<{
		code: string;
	}>;
	searchParams: Promise<{
		tab?: string;
	}>;
}

async function EventManageHero({
	code,
	currentTab,
}: {
	code: string;
	currentTab: string;
}) {
	const result = await getEventByShortCode(code);

	if (!result) return null;

	const event = result;
	const community = result.organization;

	const isHackathon =
		event.eventType === "hackathon" ||
		event.eventType === "competition" ||
		event.eventType === "olympiad";

	const tabs = [
		{ id: "overview", label: "Vista general", icon: LayoutDashboard },
		{ id: "team", label: "Equipo", icon: Users },
		...(isHackathon
			? [
					{ id: "submissions", label: "Entregas", icon: FileText },
					{ id: "winners", label: "Ganadores", icon: Award },
					{ id: "judging", label: "Evaluación", icon: ClipboardCheck },
				]
			: []),
		{ id: "analytics", label: "Analytics", icon: BarChart3 },
		{ id: "edit", label: "Configuración", icon: Settings },
	];

	return (
		<div className="border-b bg-muted/30">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="flex items-center justify-between gap-4 py-4">
					<div className="flex items-center gap-3 min-w-0">
						{event.eventImageUrl ? (
							<div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden border border-border">
								<Image
									src={event.eventImageUrl}
									alt={event.name}
									fill
									className="object-cover"
								/>
							</div>
						) : (
							<div className="h-10 w-10 shrink-0 rounded-md bg-muted border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
								{event.name.charAt(0).toUpperCase()}
							</div>
						)}

						<div className="min-w-0">
							<h1 className="text-lg font-semibold tracking-tight truncate">
								{event.name}
							</h1>
							{community && (
								<p className="text-xs text-muted-foreground truncate">
									{community.displayName || community.name}
								</p>
							)}
						</div>
					</div>

					<Link href={`/e/${code}`} target="_blank">
						<Button variant="outline" size="sm" className="gap-2">
							<Calendar className="h-4 w-4" />
							<span className="hidden sm:inline">Ver página</span>
						</Button>
					</Link>
				</div>

				<nav className="flex items-center gap-1 border-t -mb-px">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = currentTab === tab.id;
						return (
							<Link
								key={tab.id}
								href={`/e/${code}/manage?tab=${tab.id}`}
								className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
									isActive
										? "border-foreground text-foreground"
										: "border-transparent text-muted-foreground hover:text-foreground"
								}`}
							>
								<Icon className="h-4 w-4" />
								{tab.label}
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
}

export default async function ManageEventPage({
	params,
	searchParams,
}: ManageEventPageProps) {
	const { code } = await params;
	const { tab = "overview" } = await searchParams;

	const hasPermission = await canManageEventByShortCode(code);

	if (!hasPermission) {
		redirect(`/e/${code}`);
	}

	const result = await getEventByShortCode(code);

	if (!result) {
		redirect("/");
	}

	const event = result;
	const community = result.organization;

	if (!community) {
		redirect("/");
	}

	const [sponsors, cohosts, eventHosts] = await Promise.all([
		getEventSponsors(event.id),
		getEventCohost(event.id),
		getEventHostsWithUsers(event.id),
	]);

	const isHackathon =
		event.eventType === "hackathon" ||
		event.eventType === "competition" ||
		event.eventType === "olympiad";

	let winnerClaims: Awaited<ReturnType<typeof getEventWinnerClaims>> = [];
	let submissionTemplate: Awaited<
		ReturnType<typeof getSubmissionTemplate>
	> | null = null;
	if (isHackathon) {
		try {
			[winnerClaims, submissionTemplate] = await Promise.all([
				getEventWinnerClaims(event.id),
				getSubmissionTemplate(event.id),
			]);
		} catch {
			winnerClaims = [];
			submissionTemplate = null;
		}
	}

	const [importJobs, notificationLogs] = await Promise.all([
		getEventImportJobs(event.id),
		getEventNotificationLogs(event.id),
	]);

	return (
		<>
			<EventManageHero code={code} currentTab={tab} />

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				<ManageContent
					event={event}
					community={community}
					slug={community.slug}
					eventSlug={event.slug}
					tab={tab}
					sponsors={sponsors}
					cohosts={cohosts}
					eventHosts={eventHosts}
					winnerClaims={winnerClaims}
					submissionTemplate={submissionTemplate ?? null}
					importJobs={importJobs}
					notificationLogs={notificationLogs}
				/>
			</main>
		</>
	);
}
