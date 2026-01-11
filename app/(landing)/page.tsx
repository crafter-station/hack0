import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CampaignForm } from "@/components/org";

export default async function HomePage() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<CampaignForm
				communityId="1"
				communitySlug="1"
				community={{
					id: "00000000-0000-0000-0000-000000000001",
					slug: "test-community",
					name: "Test Community",
					displayName: "Test Community",
					description: "A test community for development",
					type: "community",
					email: "test@example.com",
					country: "PE",
					department: "Lima",
					city: "Lima",
					websiteUrl: "https://example.com",
					logoUrl: "/placeholder-logo.png",
					coverUrl: null,
					twitterUrl: null,
					linkedinUrl: null,
					instagramUrl: null,
					facebookUrl: null,
					githubUrl: null,
					ownerUserId: "user_123",
					isPublic: true,
					isPersonalOrg: false,
					isVerified: false,
					tags: null,
					badgeEnabled: true,
					badgeStylePrompt: null,
					badgeBackgroundPrompt: null,
					badgeAccentColor: null,
					badgeAiStyle: null,
					badgeCustomTestPortraitUrl: null,
					badgeCustomTestBackgroundUrl: null,
					badgeCustomTestReferenceUrl: null,
					badgeCustomBackgroundImageUrl: null,
					badgeStyleTestImages: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					shortCode: null,
				}}
			/>

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
