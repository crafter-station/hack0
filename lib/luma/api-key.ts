import crypto from "node:crypto";

type LumaSelfResponse = {
	user?: {
		id?: string;
		api_id?: string;
		name?: string | null;
		email?: string | null;
		avatar_url?: string | null;
	};
};

type LumaCalendarResponse = {
	calendar?: {
		id?: string;
		api_id?: string;
		name?: string | null;
		slug?: string | null;
		url?: string | null;
		website?: string | null;
		avatar_url?: string | null;
		cover_image_url?: string | null;
	};
};

type LumaListEventsResponse = {
	entries?: unknown[];
};

export type ValidatedLumaConnection = {
	user: {
		id: string | null;
		name: string | null;
		email: string | null;
	};
	calendar: {
		apiId: string | null;
		name: string | null;
		slug: string | null;
		url: string | null;
	};
	eventsVisible: number;
};

function encryptionKey() {
	const secret =
		process.env.LUMA_CONNECTION_ENCRYPTION_KEY || process.env.CLERK_SECRET_KEY;
	if (!secret) {
		throw new Error(
			"LUMA_CONNECTION_ENCRYPTION_KEY or CLERK_SECRET_KEY is required",
		);
	}
	return crypto.createHash("sha256").update(secret).digest();
}

export function encryptLumaApiKey(apiKey: string) {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
	const ciphertext = Buffer.concat([
		cipher.update(apiKey, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	return {
		ciphertext: ciphertext.toString("base64"),
		iv: iv.toString("base64"),
		authTag: authTag.toString("base64"),
	};
}

export function decryptLumaApiKey({
	ciphertext,
	iv,
	authTag,
}: {
	ciphertext: string;
	iv: string;
	authTag: string;
}) {
	const decipher = crypto.createDecipheriv(
		"aes-256-gcm",
		encryptionKey(),
		Buffer.from(iv, "base64"),
	);
	decipher.setAuthTag(Buffer.from(authTag, "base64"));
	return Buffer.concat([
		decipher.update(Buffer.from(ciphertext, "base64")),
		decipher.final(),
	]).toString("utf8");
}

async function lumaGet<T>(path: string, apiKey: string) {
	const response = await fetch(`https://public-api.luma.com${path}`, {
		headers: {
			accept: "application/json",
			"x-luma-api-key": apiKey,
		},
	});

	if (!response.ok) {
		if (response.status === 401 || response.status === 403) {
			throw new Error(
				"API key de Luma inválida o sin permisos para este calendario",
			);
		}
		throw new Error(`Luma API returned ${response.status}`);
	}

	return (await response.json()) as T;
}

export async function validateLumaApiKey(
	apiKey: string,
): Promise<ValidatedLumaConnection> {
	const trimmedKey = apiKey.trim();
	if (!trimmedKey) {
		throw new Error("Ingresa una API key de Luma");
	}

	const [self, calendar, eventList] = await Promise.all([
		lumaGet<LumaSelfResponse>("/v1/user/get-self", trimmedKey),
		lumaGet<LumaCalendarResponse>("/v1/calendar/get", trimmedKey),
		lumaGet<LumaListEventsResponse>(
			"/v1/calendar/list-events?pagination_limit=1&platforms=luma&platforms=external",
			trimmedKey,
		),
	]);

	const user = self.user;
	const calendarData = calendar.calendar;

	if (!user) {
		throw new Error("Luma no devolvió información del usuario");
	}

	if (!calendarData) {
		throw new Error("La API key no está vinculada a un calendario de Luma");
	}

	return {
		user: {
			id: user.id || user.api_id || null,
			name: user.name || null,
			email: user.email || null,
		},
		calendar: {
			apiId: calendarData.api_id || calendarData.id || null,
			name: calendarData.name || null,
			slug: calendarData.slug || null,
			url:
				calendarData.url ||
				(calendarData.slug ? `https://luma.com/${calendarData.slug}` : null),
		},
		eventsVisible: eventList.entries?.length || 0,
	};
}

export function lumaApiKeyPrefix(apiKey: string) {
	const trimmed = apiKey.trim();
	if (trimmed.length <= 10) return trimmed;
	return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}
