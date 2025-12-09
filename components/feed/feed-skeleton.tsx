"use client";

import { motion } from "framer-motion";

function Shimmer() {
	return (
		<div className="absolute inset-0 -translate-x-full">
			<div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
		</div>
	);
}

export function FeedEventSkeleton({ index = 0 }: { index?: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: index * 0.05 }}
			className="rounded-lg border bg-card overflow-hidden"
		>
			<div className="flex gap-4 p-4">
				<div className="relative w-32 h-32 shrink-0 overflow-hidden rounded-md bg-muted">
					<Shimmer />
				</div>

				<div className="flex-1 min-w-0 space-y-2">
					<div className="flex items-center gap-1.5">
						<div className="relative h-4 w-4 rounded bg-muted overflow-hidden">
							<Shimmer />
						</div>
						<div className="relative h-3 w-24 bg-muted rounded overflow-hidden">
							<Shimmer />
						</div>
					</div>

					<div className="space-y-1.5">
						<div className="relative h-4 w-full bg-muted rounded overflow-hidden">
							<Shimmer />
						</div>
						<div className="relative h-4 w-3/4 bg-muted rounded overflow-hidden">
							<Shimmer />
						</div>
					</div>

					<div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
						<div className="relative h-3 w-20 bg-muted rounded overflow-hidden">
							<Shimmer />
						</div>
						<div className="relative h-3 w-16 bg-muted rounded overflow-hidden">
							<Shimmer />
						</div>
						<div className="relative h-3 w-24 bg-muted rounded overflow-hidden">
							<Shimmer />
						</div>
					</div>

					<div className="flex gap-1 pt-1">
						<div className="relative h-5 w-16 bg-muted rounded-md overflow-hidden">
							<Shimmer />
						</div>
						<div className="relative h-5 w-20 bg-muted rounded-md overflow-hidden">
							<Shimmer />
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

export function HeroEventSkeleton() {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4 }}
			className="rounded-xl border-2 bg-card overflow-hidden"
		>
			<div className="relative aspect-[21/9] w-full bg-muted overflow-hidden">
				<Shimmer />
			</div>

			<div className="p-6 space-y-4">
				<div className="flex items-center gap-2">
					<div className="relative h-6 w-6 rounded bg-muted overflow-hidden">
						<Shimmer />
					</div>
					<div className="relative h-4 w-32 bg-muted rounded overflow-hidden">
						<Shimmer />
					</div>
				</div>

				<div className="space-y-2">
					<div className="relative h-7 w-3/4 bg-muted rounded overflow-hidden">
						<Shimmer />
					</div>
					<div className="relative h-7 w-1/2 bg-muted rounded overflow-hidden">
						<Shimmer />
					</div>
				</div>

				<div className="space-y-2">
					<div className="relative h-4 w-full bg-muted rounded overflow-hidden">
						<Shimmer />
					</div>
					<div className="relative h-4 w-2/3 bg-muted rounded overflow-hidden">
						<Shimmer />
					</div>
				</div>

				<div className="flex flex-wrap gap-x-6 gap-y-2">
					<div className="relative h-4 w-28 bg-muted rounded overflow-hidden">
						<Shimmer />
					</div>
					<div className="relative h-4 w-24 bg-muted rounded overflow-hidden">
						<Shimmer />
					</div>
					<div className="relative h-4 w-32 bg-muted rounded overflow-hidden">
						<Shimmer />
					</div>
				</div>

				<div className="flex gap-2">
					<div className="relative h-6 w-24 bg-muted rounded-full overflow-hidden">
						<Shimmer />
					</div>
					<div className="relative h-6 w-28 bg-muted rounded-full overflow-hidden">
						<Shimmer />
					</div>
					<div className="relative h-6 w-32 bg-muted rounded-full overflow-hidden">
						<Shimmer />
					</div>
				</div>
			</div>
		</motion.div>
	);
}

export function HappeningNowSkeleton() {
	return (
		<div>
			<div className="relative h-5 w-40 bg-muted rounded mb-3 overflow-hidden">
				<Shimmer />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				{[0, 1, 2].map((i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: i * 0.1 }}
						className="relative aspect-[16/9] rounded-lg bg-muted overflow-hidden"
					>
						<Shimmer />
					</motion.div>
				))}
			</div>
		</div>
	);
}

export function FeedSkeleton({ count = 5 }: { count?: number }) {
	return (
		<div className="space-y-6">
			<HappeningNowSkeleton />
			<HeroEventSkeleton />
			<div className="space-y-6">
				{Array.from({ length: count }).map((_, i) => (
					<FeedEventSkeleton key={i} index={i} />
				))}
			</div>
		</div>
	);
}
