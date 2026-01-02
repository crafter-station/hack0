import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis() {
	if (redis) return redis;

	if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
		return null;
	}

	redis = new Redis({
		url: process.env.UPSTASH_REDIS_REST_URL,
		token: process.env.UPSTASH_REDIS_REST_TOKEN,
	});

	return redis;
}

export const rateLimiters = {
	subscribe: () => {
		const r = getRedis();
		if (!r) return null;
		return new Ratelimit({
			redis: r,
			limiter: Ratelimit.slidingWindow(3, "1 h"),
			prefix: "ratelimit:subscribe",
		});
	},

	giftGenerate: () => {
		const r = getRedis();
		if (!r) return null;
		return new Ratelimit({
			redis: r,
			limiter: Ratelimit.slidingWindow(5, "1 h"),
			prefix: "ratelimit:gift-generate",
		});
	},

	giftUpload: () => {
		const r = getRedis();
		if (!r) return null;
		return new Ratelimit({
			redis: r,
			limiter: Ratelimit.slidingWindow(10, "1 h"),
			prefix: "ratelimit:gift-upload",
		});
	},

	badgeGenerate: () => {
		const r = getRedis();
		if (!r) return null;
		return new Ratelimit({
			redis: r,
			limiter: Ratelimit.slidingWindow(1, "1 h"),
			prefix: "ratelimit:badge-generate",
		});
	},

	api: () => {
		const r = getRedis();
		if (!r) return null;
		return new Ratelimit({
			redis: r,
			limiter: Ratelimit.slidingWindow(100, "1 m"),
			prefix: "ratelimit:api",
		});
	},
};

export async function checkRateLimit(
	limiter: Ratelimit | null,
	identifier: string
): Promise<{ success: boolean; reset?: number; remaining?: number }> {
	if (!limiter) {
		return { success: true };
	}

	const result = await limiter.limit(identifier);
	return {
		success: result.success,
		reset: result.reset,
		remaining: result.remaining,
	};
}

export function getClientIP(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	const realIp = request.headers.get("x-real-ip");
	if (realIp) {
		return realIp;
	}
	return "unknown";
}
