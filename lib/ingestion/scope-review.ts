export const EVENT_SCOPE_REVIEW_REASONS = [
	"missing_location_and_language",
	"weak_latam_evidence",
	"online_missing_language",
] as const;

export type EventScopeReviewReason =
	(typeof EVENT_SCOPE_REVIEW_REASONS)[number];

export const EVENT_SCOPE_REVIEW_LABELS: Record<EventScopeReviewReason, string> =
	{
		missing_location_and_language: "Falta ubicación o idioma",
		weak_latam_evidence: "Confirmar alcance LATAM",
		online_missing_language: "Confirmar idioma del evento online",
	};

export function scopeReviewReasonFromRaw(
	raw: unknown,
): EventScopeReviewReason | null {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
	const reason = (raw as Record<string, unknown>).scopeReviewReason;
	return typeof reason === "string" &&
		EVENT_SCOPE_REVIEW_REASONS.includes(reason as EventScopeReviewReason)
		? (reason as EventScopeReviewReason)
		: null;
}
