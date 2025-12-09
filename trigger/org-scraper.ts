import { task, metadata } from "@trigger.dev/sdk/v3";
import FirecrawlApp from "@mendable/firecrawl-js";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { organizations } from "@/lib/db/schema";
import { UTApi } from "uploadthing/server";
import {
  type OrgExtractedData,
  inferOrgType,
  normalizeUrl,
  isValidUrl,
  extractLogoFromMetadata,
  cleanDescription,
  extractSocialLinks,
} from "@/lib/scraper/org-schema";

export const orgScraperTask = task({
  id: "org-scraper",
  maxDuration: 120,
  run: async (payload: { organizationId: string; websiteUrl: string }) => {
    const { organizationId, websiteUrl } = payload;

    await metadata.set("status", "extracting");

    const firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY!,
    });

    const normalizedUrl = normalizeUrl(websiteUrl);

    let result;
    try {
      result = await firecrawl.scrape(normalizedUrl, {
        formats: [
          "markdown",
          {
            type: "json",
            prompt: `Extract organization information from this website. Return a JSON object with:
- name (string, organization name/title)
- description (string, brief description of the organization, what they do, their mission)
- email (string, contact email if available)

Focus on the main organization name, not event names. Look for "About", "Nosotros", "Quiénes somos" sections.`,
          },
        ],
      });
    } catch (error: any) {
      await metadata.set("status", "error");

      if (error.message?.includes("not currently supported")) {
        await metadata.set("error", "Este sitio no está soportado por Firecrawl. Intenta con el sitio web oficial de tu comunidad (evita redes sociales como Instagram, Facebook, Twitter).");
        throw new Error("Sitio no soportado por Firecrawl");
      }

      if (error.message?.includes("rate limit")) {
        await metadata.set("error", "Límite de scraping alcanzado. Intenta de nuevo en unos minutos.");
        throw new Error("Rate limit alcanzado");
      }

      await metadata.set("error", "Error al extraer datos del sitio web. Verifica que la URL sea correcta y esté accesible.");
      throw error;
    }

    if (!result.json) {
      await metadata.set("status", "error");
      await metadata.set("error", "No se pudo extraer información del sitio web. Intenta con una URL diferente o completa los campos manualmente.");
      throw new Error("Failed to extract organization data from website");
    }

    const extracted = result.json as OrgExtractedData;

    // Priorizar og:image sobre el logoUrl extraído por el LLM
    let logoUrl = result.metadata?.ogImage
      ? extractLogoFromMetadata(result.metadata as { ogImage?: string }, normalizedUrl)
      : extracted.logoUrl;

    const fullText = `${extracted.name || ""} ${extracted.description || ""} ${websiteUrl}`;
    const socialLinks = extractSocialLinks(fullText);

    const inferredType = inferOrgType(
      extracted.name || "",
      extracted.description || "",
      websiteUrl
    );

    const scrapedData: OrgExtractedData = {
      name: extracted.name,
      description: extracted.description
        ? cleanDescription(extracted.description)
        : undefined,
      type: extracted.type || inferredType,
      websiteUrl: normalizedUrl,
      logoUrl,
      email: extracted.email,
      socialLinks,
    };

    await metadata.set("extractedData", scrapedData);
    await metadata.set("status", "extracted");

    let finalLogoUrl: string | undefined = logoUrl;

    if (logoUrl && isValidUrl(logoUrl)) {
      await metadata.set("status", "uploading_logo");

      try {
        const utapi = new UTApi();
        const uploadResult = await utapi.uploadFilesFromUrl(logoUrl);

        if (uploadResult.data?.url) {
          finalLogoUrl = uploadResult.data.url;
          await metadata.set("logoUrl", finalLogoUrl);
        }
      } catch (err) {
        console.error("Failed to upload logo to UploadThing:", err);
      }
    }

    await metadata.set("status", "updating_org");

    await db
      .update(organizations)
      .set({
        name: scrapedData.name,
        description: scrapedData.description,
        type: scrapedData.type,
        email: scrapedData.email,
        logoUrl: finalLogoUrl,
        twitterUrl: scrapedData.socialLinks?.twitter,
        linkedinUrl: scrapedData.socialLinks?.linkedin,
        instagramUrl: scrapedData.socialLinks?.instagram,
        facebookUrl: scrapedData.socialLinks?.facebook,
        githubUrl: scrapedData.socialLinks?.github,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId));

    await metadata.set("status", "completed");

    return {
      success: true,
      organizationId,
      extractedData: scrapedData,
      logoUrl: finalLogoUrl,
    };
  },
});
