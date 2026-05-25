"use client";

import { Check, ExternalLink, Loader2, PlugZap, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LumaIcon } from "@/components/icons/luma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	connectOrganizationLuma,
	disconnectOrganizationLuma,
	type LumaConnectionStatus,
} from "@/lib/actions/luma-connections";

type LumaConnectCardProps = {
	organizationId: string;
	connection: LumaConnectionStatus;
};

export function LumaConnectCard({
	organizationId,
	connection,
}: LumaConnectCardProps) {
	const router = useRouter();
	const [apiKey, setApiKey] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setSuccess(null);

		startTransition(async () => {
			const result = await connectOrganizationLuma({
				organizationId,
				apiKey,
			});

			if (!result.success) {
				setError(result.error || "No se pudo conectar Luma");
				return;
			}

			setApiKey("");
			setSuccess(
				result.calendarName
					? `Calendario conectado: ${result.calendarName}`
					: "Luma conectado",
			);
			router.refresh();
		});
	};

	const handleDisconnect = () => {
		setError(null);
		setSuccess(null);

		startTransition(async () => {
			const result = await disconnectOrganizationLuma(organizationId);

			if (!result.success) {
				setError(result.error || "No se pudo desconectar Luma");
				return;
			}

			setSuccess("Luma desconectado");
			router.refresh();
		});
	};

	return (
		<section className="border bg-card p-4 sm:p-5">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center border bg-background">
						<LumaIcon className="size-4" />
					</div>
					<div>
						<h2 className="font-semibold">Conectar Luma Calendar</h2>
						<p className="mt-1 text-sm leading-6 text-muted-foreground">
							Luma no expone OAuth público. Conecta una API key de calendario
							para validar la cuenta y preparar sync directo.
						</p>
					</div>
				</div>
				{connection.isConnected && (
					<div className="inline-flex items-center gap-1.5 text-sm text-blue-500">
						<Check className="size-4" />
						Conectado
					</div>
				)}
			</div>

			{connection.isConnected && (
				<div className="mt-4 grid gap-2 border bg-background p-3 text-sm sm:grid-cols-2">
					<div>
						<div className="text-xs text-muted-foreground">Calendario</div>
						<div className="font-medium">
							{connection.calendarName || "Calendario de Luma"}
						</div>
					</div>
					<div>
						<div className="text-xs text-muted-foreground">Cuenta</div>
						<div className="font-medium">
							{connection.lumaUserEmail ||
								connection.lumaUserName ||
								"Cuenta validada"}
						</div>
					</div>
					<div>
						<div className="text-xs text-muted-foreground">API key</div>
						<div className="font-mono text-xs">{connection.apiKeyPrefix}</div>
					</div>
					<div>
						<div className="text-xs text-muted-foreground">Verificado</div>
						<div>
							{connection.lastVerifiedAt
								? new Date(connection.lastVerifiedAt).toLocaleString("es-PE")
								: "Ahora"}
						</div>
					</div>
					{connection.calendarUrl && (
						<a
							href={connection.calendarUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:col-span-2"
						>
							Abrir calendario en Luma
							<ExternalLink className="size-3" />
						</a>
					)}
				</div>
			)}

			<form onSubmit={handleSubmit} className="mt-4 space-y-3">
				<div className="space-y-2">
					<Label htmlFor="luma-api-key">API key de Luma</Label>
					<Input
						id="luma-api-key"
						type="password"
						value={apiKey}
						onChange={(event) => setApiKey(event.target.value)}
						placeholder="luma_api_key..."
						autoComplete="off"
					/>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button type="submit" disabled={isPending || !apiKey.trim()}>
						{isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<PlugZap className="size-4" />
						)}
						{connection.isConnected ? "Actualizar conexión" : "Conectar Luma"}
					</Button>
					{connection.isConnected && (
						<Button
							type="button"
							variant="outline"
							onClick={handleDisconnect}
							disabled={isPending}
						>
							<Trash2 className="size-4" />
							Desconectar
						</Button>
					)}
				</div>
			</form>

			{error && (
				<p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
			)}
			{success && (
				<p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
					{success}
				</p>
			)}
		</section>
	);
}
