export default function CommunityLoading() {
	return (
		<div className="space-y-4">
			<div className="h-5 bg-muted rounded w-32 animate-pulse" />
			<div className="rounded-lg border border-border overflow-hidden">
				<div className="divide-y divide-border">
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_180px_120px_100px_130px] gap-4 items-center px-5 py-4 animate-pulse"
						>
							<div className="space-y-2">
								<div className="h-4 bg-muted rounded w-3/4" />
								<div className="h-3 bg-muted rounded w-1/2" />
							</div>
							<div className="hidden lg:block h-4 bg-muted rounded w-28" />
							<div className="hidden lg:block h-4 bg-muted rounded w-20" />
							<div className="hidden lg:block h-4 bg-muted rounded w-16 ml-auto" />
							<div className="h-7 bg-muted rounded-full w-24 ml-auto" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
