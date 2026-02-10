import { CTASection } from "@/components/landing/cta-section";
import { EventFormatsSection } from "@/components/landing/event-formats-section";
import { EventsPreviewSection } from "@/components/landing/events-preview-section";
import { FAQSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero-section";
import { MissionSection } from "@/components/landing/mission-section";
import { PillarsSection } from "@/components/landing/pillars-section";
import { ToolsSection } from "@/components/landing/tools-section";
import { ValuesSection } from "@/components/landing/values-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
	getCountriesWithEvents,
	getDepartmentsWithEvents,
	getEvents,
	getPlatformStats,
} from "@/lib/actions/events";

export default async function HomePage() {
	const [stats, eventsResult, departmentsWithEvents, countriesWithEvents] =
		await Promise.all([
			getPlatformStats(),
			getEvents({ limit: 8, status: ["ongoing", "open", "upcoming"] }),
			getDepartmentsWithEvents(),
			getCountriesWithEvents(),
		]);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<HeroSection
				stats={stats}
				departmentsWithEvents={departmentsWithEvents}
				countriesWithEvents={countriesWithEvents}
			/>

			<EventsPreviewSection events={eventsResult.events} />

			<MissionSection />

			<PillarsSection />

			<EventFormatsSection />

			<ValuesSection />

			<ToolsSection />

			<FAQSection />

			<CTASection />

			<SiteFooter />
		</div>
	);
}
