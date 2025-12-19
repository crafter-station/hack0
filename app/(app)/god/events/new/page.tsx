import { Crown } from "lucide-react";
import { redirect } from "next/navigation";
import { GodModeEventForm } from "@/components/god-mode/god-mode-event-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { godModeGetAllOrganizations } from "@/lib/actions/god-mode";
import { getGodModeUser } from "@/lib/god-mode";

export const metadata = {
	title: "Create Event (God Mode) | hack0.dev",
	description: "Create an event for any organization",
};

export default async function GodModeCreateEventPage() {
	const godUser = await getGodModeUser();

	if (!godUser) {
		redirect("/");
	}

	const organizations = await godModeGetAllOrganizations();

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<main className="flex-1">
				<div className="mx-auto max-w-3xl px-4 lg:px-8 py-12">
					<div className="mb-8">
						<div className="flex items-center gap-2 mb-2">
							<Crown className="h-6 w-6 text-amber-600" />
							<h1 className="text-3xl font-bold tracking-tight">
								Create Event
							</h1>
						</div>
						<p className="text-muted-foreground">
							God mode: Create events for any organization, auto-approved
						</p>
					</div>

					<GodModeEventForm organizations={organizations} />
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
