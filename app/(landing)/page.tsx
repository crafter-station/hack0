import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { OrgEventFormMinimal } from "@/components/org/creation/org-event-form-minimal";

export default async function HomePage() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />
			<div className="container mx-auto px-4 py-8">
				<OrgEventFormMinimal
					communityId="00000000-0000-0000-0000-000000000001"
					communityName="Test Community"
					communitySlug="test-community"
					communityLogo="/placeholder-logo.png"
					currentOrg={{
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
					availableOrganizations={[
						{
							organization: {
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
							},
							role: "owner",
						},
						{
							organization: {
								id: "00000000-0000-0000-0000-000000000002",
								slug: "another-community",
								name: "Another Community",
								displayName: "Another Community",
								description: "Another test community",
								type: "community",
								email: "another@example.com",
								country: "PE",
								department: "Arequipa",
								city: "Arequipa",
								websiteUrl: "https://another.com",
								logoUrl: "/placeholder-logo.png",
								coverUrl: null,
								twitterUrl: null,
								linkedinUrl: null,
								instagramUrl: null,
								facebookUrl: null,
								githubUrl: null,
								ownerUserId: "user_456",
								isPublic: true,
								isPersonalOrg: false,
								isVerified: false,
								tags: null,
								badgeEnabled: false,
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
							},
							role: "admin",
						},
					]}
					mode="create"
				/>
			</div>

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
