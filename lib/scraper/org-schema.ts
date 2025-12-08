import { OrganizerType } from "@/lib/db/schema";

export interface OrgExtractedData {
  name: string;
  description?: string;
  type?: OrganizerType;
  websiteUrl?: string;
  logoUrl?: string;
  email?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    github?: string;
  };
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function inferOrgType(
  name: string,
  description: string = "",
  websiteUrl: string = ""
): OrganizerType {
  const text = `${name} ${description} ${websiteUrl}`.toLowerCase();

  if (
    text.includes("universidad") ||
    text.includes("university") ||
    text.includes("college") ||
    text.includes("edu") ||
    text.includes("académic") ||
    text.includes("academic")
  ) {
    return "university";
  }

  if (
    text.includes("gobierno") ||
    text.includes("government") ||
    text.includes("ministerio") ||
    text.includes("ministry") ||
    text.includes("municipalidad") ||
    text.includes("concytec") ||
    text.includes(".gob.")
  ) {
    return "government";
  }

  if (
    text.includes("ngo") ||
    text.includes("ong") ||
    text.includes("fundación") ||
    text.includes("foundation") ||
    text.includes("nonprofit") ||
    text.includes("non-profit") ||
    text.includes("sin fines de lucro")
  ) {
    return "ngo";
  }

  if (
    text.includes("comunidad") ||
    text.includes("community") ||
    text.includes("meetup") ||
    text.includes("gdg") ||
    text.includes("wtm") ||
    text.includes("devfest") ||
    text.includes("user group") ||
    text.includes("chapter")
  ) {
    return "community";
  }

  if (
    text.includes("empresa") ||
    text.includes("company") ||
    text.includes("corp") ||
    text.includes("inc") ||
    text.includes("ltd") ||
    text.includes("s.a.") ||
    text.includes("startup") ||
    text.includes("tech")
  ) {
    return "company";
  }

  return "community";
}

export function extractLogoFromMetadata(metadata: {
  ogImage?: string;
  favicon?: string;
}): string | undefined {
  return metadata.ogImage || metadata.favicon;
}

export function cleanDescription(description: string): string {
  return description
    .trim()
    .replace(/\n{3,}/g, "\n\n")
    .substring(0, 500);
}

export function extractSocialLinks(text: string): OrgExtractedData["socialLinks"] {
  const links: OrgExtractedData["socialLinks"] = {};

  const twitterMatch = text.match(
    /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i
  );
  if (twitterMatch) {
    links.twitter = `https://twitter.com/${twitterMatch[1]}`;
  }

  const linkedinMatch = text.match(/linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) {
    links.linkedin = `https://linkedin.com/company/${linkedinMatch[1]}`;
  }

  const instagramMatch = text.match(/instagram\.com\/([a-zA-Z0-9_\.]+)/i);
  if (instagramMatch) {
    links.instagram = `https://instagram.com/${instagramMatch[1]}`;
  }

  const facebookMatch = text.match(/facebook\.com\/([a-zA-Z0-9_\.]+)/i);
  if (facebookMatch) {
    links.facebook = `https://facebook.com/${facebookMatch[1]}`;
  }

  const githubMatch = text.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
  if (githubMatch) {
    links.github = `https://github.com/${githubMatch[1]}`;
  }

  return Object.keys(links).length > 0 ? links : undefined;
}
