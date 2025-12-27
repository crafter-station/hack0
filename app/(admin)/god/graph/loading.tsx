export default function GraphLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<div className="h-7 w-64 bg-muted animate-pulse rounded" />
					<div className="h-4 w-96 bg-muted animate-pulse rounded" />
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				<div className="lg:col-span-3">
					<div className="h-[600px] border border-border rounded-lg bg-muted/20 animate-pulse" />
				</div>
				<div className="space-y-4">
					<div className="h-32 bg-muted animate-pulse rounded-lg" />
					<div className="h-48 bg-muted animate-pulse rounded-lg" />
					<div className="h-64 bg-muted animate-pulse rounded-lg" />
				</div>
			</div>
		</div>
	);
}
