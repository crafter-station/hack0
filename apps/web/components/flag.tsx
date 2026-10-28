import { countryName } from "@/lib/search";

/** Official country flag (flag-icons SVG) with an accessible name. */
export function Flag({ code }: { code: string | null | undefined }) {
  if (!code || !/^[a-z]{2}$/i.test(code)) return null;
  return <span className={`fi fi-${code.toLowerCase()} flag`} role="img" aria-label={countryName(code)} />;
}
