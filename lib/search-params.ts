import {
  parseAsString,
  parseAsBoolean,
  parseAsInteger,
  parseAsArrayOf,
  parseAsStringLiteral,
  createLoader,
} from "nuqs/server";
import type { EventCategory } from "./event-categories";

const categoryValues = ["all", "competitions", "learning", "community"] as const;

// Define all search param parsers
export const searchParamsParsers = {
  category: parseAsStringLiteral(categoryValues).withDefault("all" as EventCategory),
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
};

// Create server-side loader
export const loadSearchParams = createLoader(searchParamsParsers);

// Type for the parsed search params
export type ParsedSearchParams = Awaited<ReturnType<typeof loadSearchParams>>;
