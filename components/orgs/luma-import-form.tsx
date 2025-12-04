"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startLumaImport } from "@/lib/actions/import";
import {
  Loader2,
  Calendar,
  MapPin,
  User,
  Check,
  AlertCircle,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";

type Step =
  | "idle"
  | "submitting"
  | "extracting"
  | "uploading_image"
  | "completed"
  | "publishing"
  | "published"
  | "error";

interface ExtractedData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  venue?: string;
  format?: string;
  bannerUrl?: string;
  organizerName?: string;
  websiteUrl?: string;
  registrationUrl?: string;
  eventType?: string;
  country?: string;
  step?: string;
  error?: string;
  eventId?: string;
  eventSlug?: string;
  isVerified?: boolean;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function ImportProgress({
  runId,
  accessToken,
  onSuccess,
  onError,
}: {
  runId: string;
  accessToken: string;
  onSuccess: (slug: string, isVerified: boolean) => void;
  onError: (error: string) => void;
}) {
  const { run, error: realtimeError } = useRealtimeRun<ExtractedData>(runId, {
    accessToken,
    enabled: true,
  });

  const metadata = (run?.metadata || {}) as ExtractedData;
  const status = run?.status;
  const step = metadata.step as Step | undefined;

  useEffect(() => {
    if (realtimeError) {
      onError(realtimeError.message);
    }
  }, [realtimeError, onError]);

  useEffect(() => {
    if (step === "published" && metadata.eventSlug) {
      onSuccess(metadata.eventSlug, metadata.isVerified ?? false);
    }
  }, [step, metadata.eventSlug, metadata.isVerified, onSuccess]);

  useEffect(() => {
    if (step === "error" && metadata.error) {
      onError(metadata.error);
    }
  }, [step, metadata.error, onError]);

  const isExtracting = step === "extracting" || status === "QUEUED" || status === "EXECUTING";
  const isUploadingImage = step === "uploading_image";
  const isPublishing = step === "publishing";
  const isPublished = step === "published";
  const hasName = !!metadata.name;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
        {isExtracting && !hasName && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <div>
              <p className="font-medium">Extrayendo datos...</p>
              <p className="text-sm text-muted-foreground">
                Analizando la página del evento
              </p>
            </div>
          </>
        )}
        {isExtracting && hasName && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <div>
              <p className="font-medium">Procesando...</p>
              <p className="text-sm text-muted-foreground">
                Completando información
              </p>
            </div>
          </>
        )}
        {isUploadingImage && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <div>
              <p className="font-medium">Subiendo imagen...</p>
              <p className="text-sm text-muted-foreground">
                Guardando el banner del evento
              </p>
            </div>
          </>
        )}
        {isPublishing && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <div>
              <p className="font-medium">Publicando evento...</p>
              <p className="text-sm text-muted-foreground">
                Creando el evento en la plataforma
              </p>
            </div>
          </>
        )}
        {isPublished && metadata.isVerified && (
          <>
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                ¡Evento publicado!
              </p>
              <p className="text-sm text-muted-foreground">
                Ya está visible en la plataforma
              </p>
            </div>
          </>
        )}
        {isPublished && !metadata.isVerified && (
          <>
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                ¡Evento creado!
              </p>
              <p className="text-sm text-muted-foreground">
                Pendiente de revisión
              </p>
            </div>
          </>
        )}
      </div>

      {hasName && (
        <div className="rounded-lg border border-border overflow-hidden">
          {metadata.bannerUrl && (
            <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted">
              <img
                src={metadata.bannerUrl}
                alt={metadata.name}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          {!metadata.bannerUrl && isUploadingImage && (
            <div className="aspect-[3/1] w-full bg-muted flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando imagen...</span>
              </div>
            </div>
          )}

          <div className="p-5 space-y-3">
            <h3 className="font-semibold text-lg">{metadata.name}</h3>

            {metadata.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {metadata.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
              {metadata.startDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(metadata.startDate)}</span>
                  {metadata.endDate && metadata.endDate !== metadata.startDate && (
                    <span>– {formatDate(metadata.endDate)}</span>
                  )}
                </div>
              )}

              {(metadata.city || metadata.venue) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {metadata.venue && `${metadata.venue}, `}
                    {metadata.city}
                  </span>
                </div>
              )}

              {metadata.organizerName && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{metadata.organizerName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isPublished && (
        <p className="text-sm text-muted-foreground text-center">
          Puedes volver al dashboard. El evento se creará automáticamente.
        </p>
      )}

      {isPublished && metadata.eventSlug && metadata.isVerified && (
        <Button
          onClick={() => onSuccess(metadata.eventSlug!, true)}
          className="w-full"
          size="lg"
        >
          Ver evento
        </Button>
      )}

      {isPublished && metadata.eventSlug && !metadata.isVerified && (
        <div className="space-y-4">
          <Button
            onClick={() => onSuccess(metadata.eventSlug!, false)}
            className="w-full"
            size="lg"
            variant="outline"
          >
            Ir al dashboard
          </Button>
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-center">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              ¿Quieres publicar eventos al instante?
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Verifica tu organización escribiendo a{" "}
              <a
                href="mailto:railly@crafterstation.com"
                className="font-medium underline underline-offset-2"
              >
                railly@crafterstation.com
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function LumaImportForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [importState, setImportState] = useState<{
    runId: string;
    accessToken: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Ingresa una URL");
      return;
    }

    startTransition(async () => {
      const result = await startLumaImport(url, true);

      if (!result.success) {
        setError(result.error || "Error al iniciar la importación");
        return;
      }

      if (result.runId && result.publicAccessToken) {
        setImportState({
          runId: result.runId,
          accessToken: result.publicAccessToken,
        });
      }
    });
  };

  const handleSuccess = (slug: string, isVerified: boolean) => {
    if (isVerified) {
      router.push(`/${slug}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setImportState(null);
  };

  const handleReset = () => {
    setUrl("");
    setError(null);
    setImportState(null);
  };

  if (importState) {
    return (
      <div className="space-y-6">
        <ImportProgress
          runId={importState.runId}
          accessToken={importState.accessToken}
          onSuccess={handleSuccess}
          onError={handleError}
        />
        <Button
          variant="ghost"
          onClick={handleReset}
          className="w-full"
        >
          Importar otro evento
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-border bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Importación automática</p>
            <p className="text-sm text-muted-foreground">
              Pega el link y extraemos toda la información
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Link del evento</Label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="url"
              type="url"
              placeholder="https://lu.ma/mi-evento"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isPending}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Soportamos eventos de Luma (lu.ma, luma.com)
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full" size="lg">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Iniciando importación...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Importar evento
          </>
        )}
      </Button>
    </form>
  );
}
