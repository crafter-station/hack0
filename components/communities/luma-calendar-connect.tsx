"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	AlertCircle,
	AlertTriangle,
	Calendar,
	Check,
	CheckCircle2,
	Clock,
	ExternalLink,
	Loader2,
	Power,
	PowerOff,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LumaIcon } from "@/components/icons/luma";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	connectLumaCalendar,
	disconnectLumaCalendar,
	retryLumaCalendarVerification,
	syncLumaCalendar,
	toggleLumaCalendarActive,
} from "@/lib/actions/luma-calendars";
import type { LumaCalendar } from "@/lib/db/schema";
import type { lumaVerifyCalendarTask } from "@/trigger/luma-calendar-verify";

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
	attempts?: number;
	status?: string;
}

function VerificationProgress({
	runId,
	accessToken,
	onSuccess,
	onError,
	onPending,
}: {
	runId: string;
	accessToken: string;
	onSuccess: () => void;
	onError: (error: string) => void;
	onPending: () => void;
}) {
	const { run, error: realtimeError } = useRealtimeRun<
		typeof lumaVerifyCalendarTask
	>(runId, {
		accessToken,
		enabled: true,
	});

	const metadata = (run?.metadata || {}) as SyncMetadata;
	const step = metadata.step;

	useEffect(() => {
		if (realtimeError) {
			onError(realtimeError.message);
		}
	}, [realtimeError, onError]);

	useEffect(() => {
		if (step === "completed") {
			onSuccess();
		} else if (step === "pending" || step === "failed") {
			onPending();
		}
	}, [step, onSuccess, onPending]);

	useEffect(() => {
		if (metadata.error && step !== "pending") {
			onError(metadata.error);
		}
	}, [metadata.error, step, onError]);

	const isVerifying =
		step === "verifying_access" || step === "fetching_calendar";
	const isRegistering = step === "registering_webhook";
	const isSyncing = step === "triggering_sync" || step === "syncing_events";
	const isCompleted = step === "completed";
	const isPending = step === "pending";

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
				{!isCompleted && !isPending && (
					<>
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<div className="flex-1">
							{isVerifying && (
								<p className="text-sm">Verificando acceso al calendario...</p>
							)}
							{isRegistering && (
								<p className="text-sm">Configurando webhooks...</p>
							)}
							{isSyncing && (
								<div>
									<p className="text-sm">Sincronizando eventos...</p>
									{metadata.progress && (
										<p className="text-xs text-muted-foreground">
											{metadata.progress}
										</p>
									)}
								</div>
							)}
						</div>
					</>
				)}
				{isPending && (
					<>
						<div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
							<AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
						</div>
						<div className="flex-1">
							<p className="text-sm text-amber-600 dark:text-amber-400">
								Esperando acceso
							</p>
							<p className="text-xs text-muted-foreground">
								Por favor agrega a railly@crafterstation.com como admin
							</p>
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
								{metadata.eventsFound || 0} eventos encontrados
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

		if (!calendarSlug.trim()) {
			setError("Ingresa el slug del calendario");
			return;
		}

		startTransition(async () => {
			const result = await connectLumaCalendar(
				organizationId,
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
		setCalendarSlug("");
		setSyncState(null);
	};

	const handlePending = () => {
		router.refresh();
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
					<VerificationProgress
						runId={syncState.runId}
						accessToken={syncState.accessToken}
						onSuccess={handleSuccess}
						onError={handleError}
						onPending={handlePending}
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
			<CardContent className="space-y-4">
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
					<p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
						Paso 1: Agrega a nuestro equipo como admin
					</p>
					<p className="text-[11px] text-blue-600 dark:text-blue-400 mb-2">
						Ve a tu calendario en Luma y agrega a{" "}
						<code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded font-mono">
							railly@crafterstation.com
						</code>{" "}
						como administrador.
					</p>
					<a
						href="https://lu.ma/calendar"
						target="_blank"
						rel="noopener noreferrer"
						className="text-[11px] text-blue-700 dark:text-blue-300 hover:underline inline-flex items-center gap-1"
					>
						Ir a Luma Calendar
						<ExternalLink className="h-2.5 w-2.5" />
					</a>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="calendarSlug" className="text-xs">
							Paso 2: Slug del calendario
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
							El slug de tu calendario (ej: lu.ma/calendar/
							<strong>mi-comunidad</strong>)
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
								Verificando...
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

function getVerificationStatusBadge(status: string | null) {
	switch (status) {
		case "verified":
			return (
				<span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
					<CheckCircle2 className="h-2.5 w-2.5" />
					Verificado
				</span>
			);
		case "pending":
			return (
				<span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
					<AlertTriangle className="h-2.5 w-2.5" />
					Pendiente
				</span>
			);
		case "failed":
			return (
				<span className="inline-flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
					<AlertCircle className="h-2.5 w-2.5" />
					Fallido
				</span>
			);
		default:
			return null;
	}
}

export function LumaCalendarsList({
	calendars,
}: {
	calendars: LumaCalendar[];
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [syncingId, setSyncingId] = useState<string | null>(null);
	const [verifyingId, setVerifyingId] = useState<string | null>(null);

	const handleSync = (calendarId: string) => {
		setSyncingId(calendarId);
		startTransition(async () => {
			await syncLumaCalendar(calendarId, false);
			router.refresh();
			setSyncingId(null);
		});
	};

	const handleRetryVerification = (calendarId: string) => {
		setVerifyingId(calendarId);
		startTransition(async () => {
			await retryLumaCalendarVerification(calendarId);
			router.refresh();
			setVerifyingId(null);
		});
	};

	const handleToggle = (calendarId: string, isActive: boolean) => {
		startTransition(async () => {
			await toggleLumaCalendarActive(calendarId, isActive);
			router.refresh();
		});
	};

	const handleDisconnect = (calendarId: string) => {
		if (
			!confirm(
				"¿Desconectar este calendario? Los eventos sincronizados se mantendrán.",
			)
		) {
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
				{calendars.map((calendar) => {
					const isVerified = calendar.verificationStatus === "verified";
					const isPendingVerification =
						calendar.verificationStatus === "pending";
					const isFailed = calendar.verificationStatus === "failed";

					return (
						<div
							key={calendar.id}
							className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
						>
							<div className="flex items-center gap-3">
								<div
									className={`h-8 w-8 rounded-full flex items-center justify-center ${
										isVerified && calendar.isActive
											? "bg-emerald-100 dark:bg-emerald-900/30"
											: isPendingVerification
												? "bg-amber-100 dark:bg-amber-900/30"
												: isFailed
													? "bg-red-100 dark:bg-red-900/30"
													: "bg-muted"
									}`}
								>
									<LumaIcon
										className={`h-4 w-4 ${
											isVerified && calendar.isActive
												? "text-emerald-600 dark:text-emerald-400"
												: isPendingVerification
													? "text-amber-600 dark:text-amber-400"
													: isFailed
														? "text-red-600 dark:text-red-400"
														: "text-muted-foreground"
										}`}
									/>
								</div>
								<div>
									<p className="text-sm font-medium">
										{calendar.lumaCalendarSlug}
									</p>
									<div className="flex items-center gap-2 text-[10px] text-muted-foreground">
										{getVerificationStatusBadge(calendar.verificationStatus)}
										{isVerified && calendar.lastSyncAt && (
											<span className="flex items-center gap-1">
												<Clock className="h-2.5 w-2.5" />
												{formatDistanceToNow(calendar.lastSyncAt, {
													addSuffix: true,
													locale: es,
												})}
											</span>
										)}
										{isVerified && !calendar.isActive && (
											<span className="text-amber-600 dark:text-amber-400">
												Pausado
											</span>
										)}
									</div>
									{isPendingVerification && (
										<p className="text-[10px] text-muted-foreground mt-1">
											Agrega a railly@crafterstation.com como admin
										</p>
									)}
								</div>
							</div>

							<div className="flex items-center gap-1">
								{(isPendingVerification || isFailed) && (
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										disabled={isPending}
										onClick={() => handleRetryVerification(calendar.id)}
										title="Reintentar verificación"
									>
										{verifyingId === calendar.id ? (
											<Loader2 className="h-3 w-3 animate-spin" />
										) : (
											<RefreshCw className="h-3 w-3 text-amber-600 dark:text-amber-400" />
										)}
									</Button>
								)}
								{isVerified && (
									<>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											disabled={isPending}
											onClick={() => handleSync(calendar.id)}
											title="Sincronizar ahora"
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
											onClick={() =>
												handleToggle(calendar.id, !calendar.isActive)
											}
											title={calendar.isActive ? "Pausar" : "Activar"}
										>
											{calendar.isActive ? (
												<Power className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
											) : (
												<PowerOff className="h-3 w-3 text-muted-foreground" />
											)}
										</Button>
									</>
								)}
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
									disabled={isPending}
									onClick={() => handleDisconnect(calendar.id)}
									title="Desconectar"
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
