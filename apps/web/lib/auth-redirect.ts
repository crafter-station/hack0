/** Where sign-in and sign-up go when the URL names no destination. */
const AUTH_FALLBACK = "/";

type Param = string | string[] | undefined;

/**
 * The `redirect_url` of a sign-in or sign-up URL as a path on this site, or null when it is absent or points elsewhere.
 * `host` is the request's Host header, which is what an absolute `redirect_url` is compared against.
 */
export function redirectPath(param: Param, host: string | null): string | null {
  const value = Array.isArray(param) ? param[0] : param;
  if (!value) return null;
  if (value.startsWith("/")) return /^\/[/\\]/.test(value) ? null : value;
  if (!host || !URL.canParse(value)) return null;
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.host !== host) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Redirect props for `<SignIn />`. A destination in the URL is passed as the forced one, here and for the sign-up it links to,
 * so it wins over any redirect configured in the environment and survives a switch between signing in and signing up.
 */
export function signInRedirects(path: string | null) {
  return {
    fallbackRedirectUrl: AUTH_FALLBACK,
    signUpFallbackRedirectUrl: AUTH_FALLBACK,
    ...(path ? { forceRedirectUrl: path, signUpForceRedirectUrl: path } : {}),
  };
}

/** The same for `<SignUp />` and the sign-in it links to. */
export function signUpRedirects(path: string | null) {
  return {
    fallbackRedirectUrl: AUTH_FALLBACK,
    signInFallbackRedirectUrl: AUTH_FALLBACK,
    ...(path ? { forceRedirectUrl: path, signInForceRedirectUrl: path } : {}),
  };
}
