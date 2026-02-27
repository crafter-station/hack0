import { Suspense } from "react";
import { CTASection } from "@/components/landing/cta-section";
import {
	EventsPreviewSection,
	EventsPreviewSkeleton,
} from "@/components/landing/events-preview-section";
import { FAQSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
	getCountriesWithEvents,
	getDepartmentsWithEvents,
	getEventLocations,
	getEvents,
	getPlatformStats,
} from "@/lib/actions/events";

async function EventsPreview() {
	const eventsResult = await getEvents({
		limit: 8,
		status: ["ongoing", "open", "upcoming"],
	});
	return <EventsPreviewSection events={eventsResult.events} />;
}

export default async function HomePage() {
	const [stats, departmentsWithEvents, countriesWithEvents, eventLocations] =
		await Promise.all([
			getPlatformStats(),
			getDepartmentsWithEvents(),
			getCountriesWithEvents(),
			getEventLocations(),
		]);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<HeroSection
				stats={stats}
				departmentsWithEvents={departmentsWithEvents}
				countriesWithEvents={countriesWithEvents}
				eventLocations={eventLocations}
			/>

			<Suspense fallback={<EventsPreviewSkeleton />}>
				<EventsPreview />
			</Suspense>

			{/*<MissionSection />*/}

			{/*<PillarsSection />*/}

			{/*<EventFormatsSection />*/}

			{/*<ValuesSection />*/}

			{/*<ToolsSection />*/}

			<FAQSection />

			<CTASection />

			<SiteFooter />
		</div>
	);
}
