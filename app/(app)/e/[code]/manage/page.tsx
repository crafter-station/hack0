import {
	BarChart3,
	Calendar,
	LayoutDashboard,
	Settings,
	Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventCover } from "@/components/events/event-cover";
import { ManageContent } from "@/components/manage/manage-content";
import { Button } from "@/components/ui/button";
import { getEventImportJobs } from "@/lib/actions/analytics";
import { getEventCohost } from "@/lib/actions/cohost-invites";
import { getEventHostsWithUsers } from "@/lib/actions/event-hosts";
import { getEventByShortCode, getEventSponsors } from "@/lib/actions/events";
import { canManageEventByShortCode } from "@/lib/actions/permissions";

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
	const tabs = [
		{ id: "overview", label: "Vista general", icon: LayoutDashboard },
		{ id: "team", label: "Equipo", icon: Users },
		{ id: "analytics", label: "Imports", icon: BarChart3 },
		{ id: "edit", label: "Configuración", icon: Settings },
	];

	return (
		<div className="border-b bg-muted/30">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="flex items-center justify-between gap-4 py-4">
					<div className="flex items-center gap-3 min-w-0">
						<EventCover
							event={event}
							className="h-10 w-10 shrink-0 rounded-md border border-border"
							sizes="40px"
							variant="thumb"
						/>

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

	const [sponsors, cohosts, eventHosts, importJobs] = await Promise.all([
		getEventSponsors(event.id),
		getEventCohost(event.id),
		getEventHostsWithUsers(event.id),
		getEventImportJobs(event.id),
	]);

	return (
		<>
			<EventManageHero code={code} currentTab={tab} />

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				<ManageContent
					event={event}
					community={community}
					tab={tab}
					sponsors={sponsors}
					cohosts={cohosts}
					eventHosts={eventHosts}
					importJobs={importJobs}
				/>
			</main>
		</>
	);
}
