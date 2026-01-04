interface BadgeLayoutProps {
	children: React.ReactNode;
}

export default function BadgeLayout({ children }: BadgeLayoutProps) {
	return (
		<div className="min-h-screen bg-background flex flex-col">{children}</div>
	);
}
