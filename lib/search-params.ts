import {
  parseAsString,
  parseAsBoolean,
  parseAsInteger,
  parseAsArrayOf,
  createLoader,
} from "nuqs/server";

// Define all search param parsers
export const searchParamsParsers = {
  search: parseAsString.withDefault(""),
  eventType: parseAsArrayOf(parseAsString).withDefault([]),
  organizerType: parseAsArrayOf(parseAsString).withDefault([]),
  skillLevel: parseAsArrayOf(parseAsString).withDefault([]),
  format: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  domain: parseAsArrayOf(parseAsString).withDefault([]),
  country: parseAsArrayOf(parseAsString).withDefault([]),
  juniorFriendly: parseAsBoolean.withDefault(false),
  page: parseAsInteger.withDefault(1),
};

// Create server-side loader
export const loadSearchParams = createLoader(searchParamsParsers);

// Type for the parsed search params
export type ParsedSearchParams = Awaited<ReturnType<typeof loadSearchParams>>;
