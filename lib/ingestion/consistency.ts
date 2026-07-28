import { inferLatamLocationFromText } from "@/lib/geo/latam-location";

export type ConsistencySeverity = "warning" | "review" | "reject";
export type ConsistencyIssueCode =
	| "missing_start_date"
	| "end_before_start"
	| "registration_after_end"
	| "missing_in_person_location"
	| "country_name_mismatch";

export interface ConsistencyEvent {
	name: string;
	startDate?: Date | null;
	endDate?: Date | null;
	registrationDeadline?: Date | null;
	format?: string | null;
	country?: string | null;
	city?: string | null;
}

export interface ConsistencyIssue {
	code: ConsistencyIssueCode;
	severity: ConsistencySeverity;
	message: string;
}

export interface ConsistencyResult {
	status: "valid" | "review" | "reject";
	issues: ConsistencyIssue[];
}

export function checkEventConsistency(
	event: ConsistencyEvent,
): ConsistencyResult {
	const issues: ConsistencyIssue[] = [];

	if (!event.startDate) {
		issues.push({
			code: "missing_start_date",
			severity: "review",
			message: "A start date is required before automatic insertion",
		});
	}

	if (
		event.startDate &&
		event.endDate &&
		event.endDate.getTime() < event.startDate.getTime()
	) {
		issues.push({
			code: "end_before_start",
			severity: "reject",
			message: "End date occurs before start date",
		});
	}

	if (
		event.registrationDeadline &&
		event.endDate &&
		event.registrationDeadline.getTime() > event.endDate.getTime()
	) {
		issues.push({
			code: "registration_after_end",
			severity: "review",
			message: "Registration deadline occurs after the event ends",
		});
	}

	if (
		(event.format === "in-person" || event.format === "hybrid") &&
		!event.country &&
		!event.city
	) {
		issues.push({
			code: "missing_in_person_location",
			severity: "warning",
			message: "In-person event has no country or city",
		});
	}

	const countryFromName = inferLatamLocationFromText(event.name)?.country;
	if (
		event.country &&
		countryFromName &&
		event.country.toUpperCase() !== countryFromName
	) {
		issues.push({
			code: "country_name_mismatch",
			severity: "review",
			message: `Name suggests ${countryFromName}, but country is ${event.country.toUpperCase()}`,
		});
	}

	const status = issues.some((issue) => issue.severity === "reject")
		? "reject"
		: issues.some((issue) => issue.severity === "review")
			? "review"
			: "valid";

	return { status, issues };
}
