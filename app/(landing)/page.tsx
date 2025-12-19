import { CTASection } from "@/components/landing/cta-section";
import { EventsPreviewSection } from "@/components/landing/events-preview-section";
import { FAQSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getEvents, getPlatformStats } from "@/lib/actions/events";

export default async function HomePage() {
	const [stats, eventsResult] = await Promise.all([
		getPlatformStats(),
		getEvents({ limit: 8, status: ["ongoing", "open", "upcoming"] }),
	]);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<HeroSection stats={stats} />

			<EventsPreviewSection events={eventsResult.events} />

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
