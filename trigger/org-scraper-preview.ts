import { task, metadata } from "@trigger.dev/sdk/v3";
import FirecrawlApp from "@mendable/firecrawl-js";
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

export const orgScraperPreviewTask = task({
  id: "org-scraper-preview",
  maxDuration: 120,
  run: async (payload: { websiteUrl: string; userId: string }) => {
    const { websiteUrl } = payload;

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
      let errorMessage = "Error al extraer datos del sitio web. Verifica que la URL sea correcta y esté accesible.";

      if (error.message?.includes("not currently supported")) {
        errorMessage = "Este sitio no está soportado por Firecrawl. Intenta con el sitio web oficial de tu comunidad (evita redes sociales como Instagram, Facebook, Twitter).";
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "Límite de scraping alcanzado. Intenta de nuevo en unos minutos.";
      }

      await metadata.set("lastError", errorMessage);
      await metadata.set("status", "error");
      await metadata.set("error", errorMessage);

      throw error;
    }

    console.log("Firecrawl result:", {
      success: result.success,
      hasJson: !!result.json,
      json: result.json,
      metadata: result.metadata,
    });

    console.log("Starting data extraction...");

    if (!result.json) {
      const errorMessage = "No se pudo extraer información del sitio web. Intenta con una URL diferente o completa los campos manualmente.";
      await metadata.set("lastError", errorMessage);
      await metadata.set("status", "error");
      await metadata.set("error", errorMessage);
      await metadata.set("firecrawlDebug", {
        success: result.success,
        hasJson: !!result.json,
        resultKeys: Object.keys(result),
      });

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

    console.log("Logo URL:", logoUrl, "isValid:", isValidUrl(logoUrl || ""));

    if (logoUrl && isValidUrl(logoUrl)) {
      console.log("Uploading logo to UploadThing...");
      await metadata.set("status", "uploading_logo");

      try {
        const utapi = new UTApi();
        console.log("Starting upload from URL:", logoUrl);
        const uploadResult = await utapi.uploadFilesFromUrl(logoUrl);
        console.log("Upload result:", uploadResult);

        if (uploadResult.data?.url) {
          finalLogoUrl = uploadResult.data.url;
          await metadata.set("logoUrl", finalLogoUrl);
          console.log("Logo uploaded successfully:", finalLogoUrl);
        }
      } catch (err) {
        console.error("Failed to upload logo to UploadThing:", err);
      }
    } else {
      console.log("Skipping logo upload (invalid or missing URL)");
    }

    await metadata.set("status", "completed");

    return {
      success: true,
      extractedData: scrapedData,
      logoUrl: finalLogoUrl,
    };
  },
});
