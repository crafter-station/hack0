"use client";

import { Check, Pencil, X } from "lucide-react";
import type { Event } from "@/lib/db/schema";
import { getEventTypeLabel } from "@/lib/event-utils";

function countryFlag(iso: string): string {
	if (!iso || iso.length !== 2) return "🌎";
	return iso
		.toUpperCase()
		.split("")
		.map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
		.join("");
}

const SOURCE_COLORS: Record<string, string> = {
	devpost: "bg-red-500/10 text-red-600",
	meetup: "bg-purple-500/10 text-purple-600",
	eventbrite: "bg-orange-500/10 text-orange-600",
	mlh: "bg-blue-500/10 text-blue-600",
	linkedin: "bg-sky-500/10 text-sky-600",
	perplexity: "bg-green-500/10 text-green-600",
	exa: "bg-indigo-500/10 text-indigo-600",
	haiku: "bg-amber-500/10 text-amber-600",
	universities: "bg-cyan-500/10 text-cyan-600",
	social: "bg-gray-500/10 text-gray-600",
	hackathon_com: "bg-violet-500/10 text-violet-600",
};

interface ScraperTableProps {
	events: Event[];
	selected: Set<string>;
	onSelect: (id: string, checked: boolean) => void;
	onSelectAll: (checked: boolean) => void;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
	onEdit: (event: Event) => void;
	onBulkApprove: () => void;
	onBulkReject: () => void;
	loading: string | null;
	bulkLoading: boolean;
}

export function ScraperTable({
	events,
	selected,
	onSelect,
	onSelectAll,
	onApprove,
	onReject,
	onEdit,
	onBulkApprove,
	onBulkReject,
	loading,
	bulkLoading,
}: ScraperTableProps) {
	const allSelected = events.length > 0 && selected.size === events.length;
	const someSelected = selected.size > 0 && selected.size < events.length;

	return (
		<div className="relative rounded-lg border overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="w-8 px-3 py-2.5 text-left">
								<label className="flex h-4 w-4 cursor-pointer items-center justify-center rounded border border-border">
									<input
										type="checkbox"
										checked={allSelected}
										ref={(el) => {
											if (el) el.indeterminate = someSelected;
										}}
										onChange={(e) => onSelectAll(e.target.checked)}
										className="sr-only"
									/>
									{allSelected && <Check className="h-3 w-3" />}
									{someSelected && (
										<span className="h-0.5 w-2.5 bg-foreground rounded-full" />
									)}
								</label>
							</th>
							<th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
								Evento
							</th>
							<th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
								País
							</th>
							<th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
								Fecha
							</th>
							<th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
								Fuente
							</th>
							<th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
								Conf.
							</th>
							<th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody className="divide-y">
						{events.map((event) => {
							const source = event.scrapeSource ?? "social";
							const sourceColor =
								SOURCE_COLORS[source] ?? "bg-gray-500/10 text-gray-600";
							const conf = event.scrapeConfidence;
							const confColor =
								conf === null
									? "text-muted-foreground"
									: conf >= 70
										? "text-emerald-600"
										: conf >= 40
											? "text-amber-600"
											: "text-red-600";
							const confDot =
								conf === null
									? "bg-muted-foreground"
									: conf >= 70
										? "bg-emerald-500"
										: conf >= 40
											? "bg-amber-500"
											: "bg-red-500";
							const isLoading = loading === event.id;
							const isSelected = selected.has(event.id);

							const formattedDate = event.startDate
								? new Date(event.startDate).toLocaleDateString("es-PE", {
										day: "numeric",
										month: "short",
									})
								: "—";

							return (
								<tr
									key={event.id}
									className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-muted/20" : ""}`}
								>
									<td className="px-3 py-2.5">
										<label className="flex h-4 w-4 cursor-pointer items-center justify-center rounded border border-border">
											<input
												type="checkbox"
												checked={isSelected}
												onChange={(e) => onSelect(event.id, e.target.checked)}
												className="sr-only"
											/>
											{isSelected && <Check className="h-3 w-3" />}
										</label>
									</td>
									<td className="px-3 py-2.5 max-w-[280px]">
										<div className="truncate font-medium">{event.name}</div>
										<div className="truncate text-xs text-muted-foreground">
											{getEventTypeLabel(event.eventType)}
										</div>
									</td>
									<td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
										{event.country
											? `${countryFlag(event.country)} ${event.country}`
											: "—"}
									</td>
									<td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
										{formattedDate}
									</td>
									<td className="px-3 py-2.5">
										<span
											className={`rounded-full px-2 py-0.5 text-xs font-medium ${sourceColor}`}
										>
											{source}
										</span>
									</td>
									<td className="px-3 py-2.5">
										{conf !== null ? (
											<span
												className={`flex items-center gap-1 text-xs font-medium ${confColor}`}
											>
												<span
													className={`h-1.5 w-1.5 rounded-full ${confDot}`}
												/>
												{conf}%
											</span>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										)}
									</td>
									<td className="px-3 py-2.5">
										<div className="flex items-center justify-end gap-1">
											{event.approvalStatus === "pending" ? (
												<>
													<button
														onClick={() => onEdit(event)}
														disabled={isLoading}
														title="Editar"
														className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
													>
														<Pencil className="h-3.5 w-3.5" />
													</button>
													<button
														onClick={() => onReject(event.id)}
														disabled={isLoading}
														title="Rechazar"
														className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-500/30 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
													>
														<X className="h-3.5 w-3.5" />
													</button>
													<button
														onClick={() => onApprove(event.id)}
														disabled={isLoading}
														title="Aprobar"
														className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/30 text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
													>
														<Check className="h-3.5 w-3.5" />
													</button>
												</>
											) : (
												<span
													className={`rounded-full px-2 py-0.5 text-xs font-medium ${event.approvalStatus === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
												>
													{event.approvalStatus === "approved"
														? "Aprobado"
														: "Rechazado"}
												</span>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Bulk action bar */}
			{selected.size > 0 && (
				<div className="sticky bottom-0 flex items-center justify-between border-t bg-background/95 px-4 py-3 backdrop-blur-sm">
					<span className="text-sm text-muted-foreground">
						{selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
					</span>
					<div className="flex items-center gap-2">
						<button
							onClick={onBulkReject}
							disabled={bulkLoading}
							className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
						>
							<X className="h-3.5 w-3.5" />
							Rechazar todos
						</button>
						<button
							onClick={onBulkApprove}
							disabled={bulkLoading}
							className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
						>
							<Check className="h-3.5 w-3.5" />
							Aprobar todos
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
