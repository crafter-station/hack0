import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

interface BadgeLayoutProps {
	children: React.ReactNode;
}

export default function BadgeLayout({ children }: BadgeLayoutProps) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />
			{children}
			<SiteFooter />
		</div>
	);
}
