/** Provider CDNs the image optimizer may fetch; anything else is served as-is rather than proxied. */
export const IMAGE_HOSTS = ["images.lumacdn.com", "secure.meetupstatic.com", "img.evbuc.com", "cdn.evbuc.com"];

export function optimizable(src: string) {
  try {
    return IMAGE_HOSTS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}
