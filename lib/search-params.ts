import {
	createLoader,
	parseAsArrayOf,
	parseAsBoolean,
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
} from "nuqs/server";
import type { EventCategory } from "./event-categories";

const categoryValues = [
	"all",
	"competitions",
	"learning",
	"community",
] as const;
const viewValues = ["table", "cards", "calendar"] as const;
const entityValues = ["events", "organizations"] as const;

export type EntityType = (typeof entityValues)[number];

// Define all search param parsers
export const searchParamsParsers = {
	entity: parseAsStringLiteral(entityValues).withDefault(
		"events" as EntityType,
	),
	category: parseAsStringLiteral(categoryValues).withDefault(
		"all" as EventCategory,
	),
	search: parseAsString.withDefault(""),
	eventType: parseAsArrayOf(parseAsString).withDefault([]),
	organizerType: parseAsArrayOf(parseAsString).withDefault([]),
	skillLevel: parseAsArrayOf(parseAsString).withDefault([]),
	format: parseAsArrayOf(parseAsString).withDefault([]),
	status: parseAsArrayOf(parseAsString).withDefault([]),
	domain: parseAsArrayOf(parseAsString).withDefault([]),
	country: parseAsArrayOf(parseAsString).withDefault([]),
	department: parseAsArrayOf(parseAsString).withDefault([]),
	juniorFriendly: parseAsBoolean.withDefault(false),
	page: parseAsInteger.withDefault(1),
	view: parseAsStringLiteral(viewValues).withDefault("table"),
};

// Create server-side loader
export const loadSearchParams = createLoader(searchParamsParsers);

// Type for the parsed search params
export type ParsedSearchParams = Awaited<ReturnType<typeof loadSearchParams>>;
