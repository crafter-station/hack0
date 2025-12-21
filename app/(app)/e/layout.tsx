import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

interface EventLayoutProps {
	children: React.ReactNode;
}

export default function EventLayout({ children }: EventLayoutProps) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />
			{children}
			<SiteFooter />
		</div>
	);
}
