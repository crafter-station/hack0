import { type CountryCode, LATAM_COUNTRIES } from "@/lib/db/schema/constants";

export type LatamCountryCode = Exclude<CountryCode, "GLOBAL">;

export type LatamCountryOption = {
	code: LatamCountryCode;
	name: string;
	flag: string;
};

function countryCodeToFlag(code: string) {
	if (code.length !== 2) return "🌎";
	const codePoints = code
		.toUpperCase()
		.split("")
		.map((char) => 127397 + char.charCodeAt(0));
	return String.fromCodePoint(...codePoints);
}

export const LATAM_COUNTRY_OPTIONS = LATAM_COUNTRIES.filter(
	(country) => country.code !== "GLOBAL",
).map((country) => ({
	code: country.code as LatamCountryCode,
	name: country.name,
	flag: countryCodeToFlag(country.code),
})) satisfies LatamCountryOption[];

const COUNTRY_BY_CODE = new Map(
	LATAM_COUNTRY_OPTIONS.map((country) => [country.code, country]),
);

export function getLatamCountryOption(code: string | null | undefined) {
	if (!code) return null;
	return COUNTRY_BY_CODE.get(code.toUpperCase() as LatamCountryCode) || null;
}

export function getLatamCountryName(code: string | null | undefined) {
	return getLatamCountryOption(code)?.name || code || "LATAM";
}

export function getLatamCountryFlag(code: string | null | undefined) {
	return getLatamCountryOption(code)?.flag || "🌎";
}
