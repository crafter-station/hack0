"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  connectLumaCalendar,
  syncLumaCalendar,
  disconnectLumaCalendar,
  toggleLumaCalendarActive,
} from "@/lib/actions/luma-calendars";
import {
  Loader2,
  Calendar,
  Check,
  AlertCircle,
  RefreshCw,
  Trash2,
  Power,
  PowerOff,
  ExternalLink,
  Clock,
} from "lucide-react";
import { LumaIcon } from "@/components/icons/luma";
import type { LumaCalendar } from "@/lib/db/schema";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface SyncMetadata {
  step?: string;
  calendarSlug?: string;
  eventsFound?: number;
  eventsCreated?: number;
  eventsUpdated?: number;
  eventsSkipped?: number;
  progress?: string;
  currentEvent?: string;
  error?: string;
}

function SyncProgress({
  runId,
  accessToken,
  onSuccess,
  onError,
}: {
  runId: string;
  accessToken: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const { run, error: realtimeError } = useRealtimeRun<SyncMetadata>(runId, {
    accessToken,
    enabled: true,
  });

  const metadata = (run?.metadata || {}) as SyncMetadata;
  const status = run?.status;
  const step = metadata.step;

  useEffect(() => {
    if (realtimeError) {
      onError(realtimeError.message);
    }
  }, [realtimeError, onError]);

  useEffect(() => {
    if (step === "completed") {
      onSuccess();
    }
  }, [step, onSuccess]);

  useEffect(() => {
    if (metadata.error) {
      onError(metadata.error);
    }
  }, [metadata.error, onError]);

  const isConnecting = step === "validating_api_key" || step === "creating_calendar_record";
  const isSyncing = step === "syncing_events" || step === "fetching_events";
  const isCompleted = step === "completed";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
        {!isCompleted && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <div className="flex-1">
              {isConnecting && (
                <p className="text-sm">Conectando calendario...</p>
              )}
              {isSyncing && (
                <div>
                  <p className="text-sm">Sincronizando eventos...</p>
                  {metadata.progress && (
                    <p className="text-xs text-muted-foreground">
                      {metadata.progress}
                    </p>
                  )}
                  {metadata.currentEvent && (
                    <p className="text-xs text-muted-foreground truncate">
                      {metadata.currentEvent}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {isCompleted && (
          <>
            <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                ¡Calendario conectado!
              </p>
              <p className="text-xs text-muted-foreground">
                {metadata.eventsCreated || 0} eventos importados
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function LumaCalendarConnect({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [calendarSlug, setCalendarSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<{
    runId: string;
    accessToken: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!apiKey.trim() || !calendarSlug.trim()) {
      setError("Completa todos los campos");
      return;
    }

    startTransition(async () => {
      const result = await connectLumaCalendar(
        organizationId,
        apiKey.trim(),
        calendarSlug.trim(),
      );

      if (!result.success) {
        setError(result.error || "Error al conectar");
        return;
      }

      if (result.runId && result.publicAccessToken) {
        setSyncState({
          runId: result.runId,
          accessToken: result.publicAccessToken,
        });
      }
    });
  };

  const handleSuccess = () => {
    router.refresh();
    setApiKey("");
    setCalendarSlug("");
    setSyncState(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSyncState(null);
  };

  if (syncState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LumaIcon className="h-4 w-4" />
            Conectando Luma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SyncProgress
            runId={syncState.runId}
            accessToken={syncState.accessToken}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LumaIcon className="h-4 w-4" />
          Conectar Calendario de Luma
        </CardTitle>
        <CardDescription className="text-xs">
          Sincroniza automáticamente tus eventos de Luma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calendarSlug" className="text-xs">
              Slug del calendario
            </Label>
            <Input
              id="calendarSlug"
              placeholder="mi-comunidad"
              value={calendarSlug}
              onChange={(e) => setCalendarSlug(e.target.value)}
              disabled={isPending}
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              El slug de tu calendario en lu.ma/calendar/mi-comunidad
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-xs">
              API Key de Luma
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="luma_api_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isPending}
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Obtén tu API key en{" "}
              <a
                href="https://lu.ma/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                lu.ma/settings/api
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-8 text-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3" />
                Conectar calendario
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function LumaCalendarsList({
  calendars,
  organizationId,
}: {
  calendars: LumaCalendar[];
  organizationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = (calendarId: string) => {
    setSyncingId(calendarId);
    startTransition(async () => {
      await syncLumaCalendar(calendarId, false);
      router.refresh();
      setSyncingId(null);
    });
  };

  const handleToggle = (calendarId: string, isActive: boolean) => {
    startTransition(async () => {
      await toggleLumaCalendarActive(calendarId, isActive);
      router.refresh();
    });
  };

  const handleDisconnect = (calendarId: string) => {
    if (!confirm("¿Desconectar este calendario? Los eventos sincronizados se mantendrán.")) {
      return;
    }
    startTransition(async () => {
      await disconnectLumaCalendar(calendarId);
      router.refresh();
    });
  };

  if (calendars.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calendarios conectados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {calendars.map((calendar) => (
          <div
            key={calendar.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  calendar.isActive
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-muted"
                }`}
              >
                <LumaIcon
                  className={`h-4 w-4 ${
                    calendar.isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {calendar.lumaCalendarSlug}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {calendar.lastSyncAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      Sincronizado{" "}
                      {formatDistanceToNow(calendar.lastSyncAt, {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  )}
                  {!calendar.isActive && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Pausado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={isPending}
                onClick={() => handleSync(calendar.id)}
              >
                {syncingId === calendar.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={isPending}
                onClick={() => handleToggle(calendar.id, !calendar.isActive)}
              >
                {calendar.isActive ? (
                  <Power className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <PowerOff className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                disabled={isPending}
                onClick={() => handleDisconnect(calendar.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
