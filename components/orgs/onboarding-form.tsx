"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { ORGANIZER_TYPE_LABELS, type OrganizerType } from "@/lib/db/schema";
import {
  createOrganization,
  generateSlug,
  isSlugAvailable,
  startOrgScraper,
} from "@/lib/actions/organizations";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, ArrowRight, Check, X, Globe, Sparkles } from "lucide-react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

const ORGANIZER_TYPE_OPTIONS = Object.entries(ORGANIZER_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

export function OnboardingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState("");

  const [runId, setRunId] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scraperError, setScraperError] = useState<string | null>(null);

  const { run, error: runError } = useRealtimeRun(runId || "", {
    enabled: !!runId,
  });

  const scraperStatus = run?.metadata?.status as string | undefined;
  const extractedData = run?.metadata?.extractedData as {
    name?: string;
    description?: string;
    type?: string;
    email?: string;
  } | undefined;
  const extractedLogoUrl = run?.metadata?.logoUrl as string | undefined;

  useEffect(() => {
    if (run?.isCompleted && extractedData) {
      if (extractedData.name && !name) {
        setName(extractedData.name);
      }
      if (extractedData.description && !description) {
        setDescription(extractedData.description);
      }
      if (extractedData.type && !type) {
        setType(extractedData.type);
      }
      if (extractedLogoUrl && !logoUrl) {
        setLogoUrl(extractedLogoUrl);
      }
      setIsScraping(false);
    }
  }, [run?.isCompleted, extractedData, extractedLogoUrl, name, description, type, logoUrl]);

  useEffect(() => {
    if (runError) {
      setScraperError("Error scraping website");
      setIsScraping(false);
    }
  }, [runError]);

  const handleScrapeWebsite = async () => {
    if (!websiteUrl) {
      setScraperError("Por favor ingresa la URL de tu sitio web");
      return;
    }

    setIsScraping(true);
    setScraperError(null);

    try {
      const tempSlug = slug || await generateSlug(websiteUrl);

      const tempOrg = await createOrganization({
        name: name || "Temp Org",
        slug: tempSlug,
        websiteUrl,
      });

      const result = await startOrgScraper(tempOrg.id, websiteUrl);
      setRunId(result.runId);
      setSlug(tempSlug);
    } catch (err) {
      setScraperError(err instanceof Error ? err.message : "Error al scrapear el sitio web");
      setIsScraping(false);
    }
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      generateSlug(name).then(setSlug);
    }
  }, [name, slugManuallyEdited]);

  // Check slug availability
  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    const timeout = setTimeout(async () => {
      setSlugStatus("checking");
      const available = await isSlugAvailable(slug);
      setSlugStatus(available ? "available" : "taken");
    }, 500);

    return () => clearTimeout(timeout);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (run?.isCompleted) {
        router.push(`/c/${slug}`);
      } else {
        await createOrganization({
          name,
          slug,
          description: description || undefined,
          type: (type as OrganizerType) || undefined,
          websiteUrl: websiteUrl || undefined,
          logoUrl: logoUrl || undefined,
        });

        router.push(`/c/${slug}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear la organización"
      );
      setIsSubmitting(false);
    }
  };

  const canScrape = websiteUrl && !isScraping && !run?.isExecuting;

  return (
    <form onSubmit={handleSubmit}>
      {/* Website scraper section */}
      <div className="mb-8 p-6 border rounded-lg bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="font-medium">Auto-rellenar desde sitio web</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Ingresa la URL de tu organización y rellenaremos automáticamente los datos.
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Globe className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="url"
                    placeholder="https://tu-organizacion.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={isScraping || run?.isExecuting}
                  />
                </InputGroup>
              </div>
              <Button
                type="button"
                onClick={handleScrapeWebsite}
                disabled={!canScrape}
                size="sm"
                variant={run?.isCompleted ? "outline" : "default"}
              >
                {isScraping || run?.isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {scraperStatus === "extracting" && "Extrayendo..."}
                    {scraperStatus === "uploading_logo" && "Subiendo logo..."}
                    {scraperStatus === "updating_org" && "Actualizando..."}
                    {!scraperStatus && "Procesando..."}
                  </>
                ) : run?.isCompleted ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-emerald-500" />
                    Completado
                  </>
                ) : (
                  "Auto-rellenar"
                )}
              </Button>
            </div>
            {scraperError && (
              <p className="text-sm text-red-500">{scraperError}</p>
            )}
            {run?.isCompleted && (
              <p className="text-sm text-emerald-600">
                ✓ Datos extraídos exitosamente. Revisa y completa los campos abajo.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid md:grid-cols-[1fr_180px] gap-6">
        {/* Left column - Main info */}
        <FieldGroup>
          {/* Name */}
          <Field>
            <FieldLabel htmlFor="name">Nombre de la organización *</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="name"
                name="name"
                placeholder="ej. GDG Lima, Universidad Nacional de Ingeniería"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </InputGroup>
          </Field>

          {/* Slug */}
          <Field>
            <FieldLabel htmlFor="slug">URL personalizada *</FieldLabel>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <span className="text-muted-foreground">hack0.dev/org/</span>
              </InputGroupAddon>
              <InputGroupInput
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
                placeholder="mi-organizacion"
                required
              />
              <InputGroupAddon align="inline-end">
                {slugStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {slugStatus === "available" && (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
                {slugStatus === "taken" && (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </InputGroupAddon>
            </InputGroup>
            {slugStatus === "taken" && (
              <p className="text-xs text-red-500">Esta URL ya está en uso</p>
            )}
          </Field>

          {/* Type */}
          <Field>
            <FieldLabel htmlFor="type">Tipo *</FieldLabel>
            <Select
              name="type"
              value={type}
              onValueChange={setType}
              required
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZER_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Description */}
          <Field>
            <FieldLabel htmlFor="description">Descripción</FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                id="description"
                name="description"
                placeholder="Breve descripción de tu organización..."
                className="min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </InputGroup>
            <FieldDescription>
              Opcional. Aparecerá en tu perfil público.
            </FieldDescription>
          </Field>
        </FieldGroup>

        {/* Right column - Logo */}
        <Field>
          <FieldLabel>Logo</FieldLabel>
          <ImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            onRemove={() => setLogoUrl("")}
            endpoint="imageUploader"
            aspectRatio="square"
          />
          <FieldDescription className="text-center">
            Cuadrado, max 4MB
          </FieldDescription>
        </Field>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end mt-6 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || slugStatus === "taken" || slugStatus === "checking"}
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              Crear organización
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
