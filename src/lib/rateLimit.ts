type Bucket = {
	hits: number[]; // epoch ms timestamps
};

const store = new Map<string, Bucket>();

export function getClientIp(headers: Headers): string {
	const xff = headers.get("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	const realIp = headers.get("x-real-ip");
	if (realIp) return realIp;
	// Fallback for local/dev
	return "127.0.0.1";
}

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
	const now = Date.now();
	const windowStart = now - windowMs;

	let bucket = store.get(key);
	if (!bucket) {
		bucket = { hits: [] };
		store.set(key, bucket);
	}

	// Drop old hits
	bucket.hits = bucket.hits.filter(ts => ts > windowStart);

	if (bucket.hits.length >= limit) {
		return { allowed: false, remaining: 0 };
	}

	bucket.hits.push(now);
	return { allowed: true, remaining: Math.max(0, limit - bucket.hits.length) };
}
