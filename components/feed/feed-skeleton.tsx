export function FeedEventSkeleton() {
	return (
		<div className="rounded-lg border bg-card">
			<div className="aspect-[2.5/1] w-full bg-muted animate-pulse" />
			<div className="p-5 space-y-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<div className="h-5 w-5 rounded bg-muted animate-pulse" />
						<div className="h-4 w-32 bg-muted animate-pulse rounded" />
					</div>
					<div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
					<div className="space-y-2">
						<div className="h-4 w-full bg-muted animate-pulse rounded" />
						<div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
					</div>
				</div>
				<div className="flex gap-4">
					<div className="h-4 w-24 bg-muted animate-pulse rounded" />
					<div className="h-4 w-20 bg-muted animate-pulse rounded" />
				</div>
				<div className="flex gap-2">
					<div className="h-6 w-24 bg-muted animate-pulse rounded" />
					<div className="h-6 w-32 bg-muted animate-pulse rounded" />
				</div>
			</div>
		</div>
	);
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, i) => (
				<FeedEventSkeleton key={i} />
			))}
		</div>
	);
}
