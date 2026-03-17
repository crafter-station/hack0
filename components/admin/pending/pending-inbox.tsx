"use client";

import {
	AlertCircle,
	Building2,
	Check,
	ChevronDown,
	Globe,
	Globe2,
	LayoutGrid,
	List,
	PackageOpen,
	X,
	Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { PendingOrgEvents } from "@/components/admin/pending-org-events";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	approveScrapedEvent,
	bulkApprove,
	bulkApproveByFilter,
	bulkReject,
	rejectScrapedEvent,
} from "@/lib/actions/scraper-curation";
import type { Event } from "@/lib/db/schema";
import { PendingEditModal } from "./pending-edit-modal";
import { PendingEventCard } from "./pending-event-card";
import { PendingEventTable } from "./pending-event-table";

const SOURCE_LABEL: Record<string, string> = {
	manual: "Manual / Luma",
	devpost: "Devpost",
	meetup: "Meetup",
	eventbrite: "Eventbrite",
	mlh: "MLH",
	perplexity: "Perplexity",
	exa: "Exa",
	haiku: "Haiku",
	universities: "Universidades",
	hackathon_com: "Hackathon.com",
	websearch: "WebSearch",
};

type FilterType = "pending" | "approved" | "rejected" | "all";
type ViewType = "cards" | "table";
type ConfidenceFilter = "all" | "high" | "medium" | "low";
type ScopeFilter = "all" | "latam" | "global_latam_eligible";
type Section = "curation" | "orphans";

const confidenceRanges: Record<
	ConfidenceFilter,
	(c: number | null) => boolean
> = {
	all: () => true,
	high: (c) => c !== null && c >= 70,
	medium: (c) => c !== null && c >= 40 && c < 70,
	low: (c) => c !== null && c < 40,
};

interface PendingOrgEvent {
	id: string;
	name: string;
	slug: string;
	shortCode: string | null;
	startDate: Date | null;
	createdAt: Date | null;
	eventImageUrl: string | null;
	lumaHosts: { id: string; name: string | null; avatarUrl: string | null }[];
}

interface OrgOption {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
}

interface PendingInboxProps {
	initialEvents: Event[];
	stats: {
		pending: number;
		approvedToday: number;
		rejectedToday: number;
		total: number;
	};
	orphanEvents: PendingOrgEvent[];
	organizations: OrgOption[];
}

export function PendingInbox({
	initialEvents,
	stats,
	orphanEvents,
	organizations,
}: PendingInboxProps) {
	const [events, setEvents] = useState(initialEvents);
	const [section, setSection] = useState<Section>("curation");
	const [filter, setFilter] = useState<FilterType>("pending");
	const [sourcesSelected, setSourcesSelected] = useState<Set<string>>(
		new Set(),
	);
	const [sourcePopoverOpen, setSourcePopoverOpen] = useState(false);
	const sourcePopoverRef = useRef<HTMLDivElement>(null);

	// Derive available sources from data
	const availableSources = useMemo(() => {
		const counts = new Map<string, number>();
		for (const e of events) {
			const src = e.scrapeSource ?? "manual";
			counts.set(src, (counts.get(src) ?? 0) + 1);
		}
		return Array.from(counts.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([source, count]) => ({ source, count }));
	}, [events]);
	const [confidenceFilter, setConfidenceFilter] =
		useState<ConfidenceFilter>("all");
	const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
	const [view, setView] = useState<ViewType>("cards");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState<string | null>(null);
	const [bulkLoading, setBulkLoading] = useState(false);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);
	const [confirmBulkApprove, setConfirmBulkApprove] = useState(false);
	const [liveStats, setLiveStats] = useState(stats);

	const filteredEvents = events.filter((e) => {
		const matchFilter = filter === "all" || e.approvalStatus === filter;
		const matchSource =
			sourcesSelected.size === 0 ||
			sourcesSelected.has(e.scrapeSource ?? "manual");
		const matchConfidence = confidenceRanges[confidenceFilter](
			e.scrapeConfidence ?? null,
		);
		const matchScope = scopeFilter === "all" || e.scope === scopeFilter;
		return matchFilter && matchSource && matchConfidence && matchScope;
	});

	const hasActiveFilters =
		sourcesSelected.size > 0 ||
		confidenceFilter !== "all" ||
		scopeFilter !== "all";

	const updateEventInList = (
		id: string,
		patch: Partial<Event> & { approvalStatus?: Event["approvalStatus"] },
	) => {
		setEvents((prev) =>
			prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
		);
	};

	const handleApprove = async (id: string) => {
		setLoading(id);
		const result = await approveScrapedEvent(id);
		if (result.success) {
			updateEventInList(id, { isApproved: true, approvalStatus: "approved" });
			setLiveStats((s) => ({
				...s,
				pending: Math.max(0, s.pending - 1),
				approvedToday: s.approvedToday + 1,
			}));
		}
		setLoading(null);
	};

	const handleReject = async (id: string) => {
		setLoading(id);
		const result = await rejectScrapedEvent(id);
		if (result.success) {
			updateEventInList(id, {
				isApproved: false,
				approvalStatus: "rejected",
			});
			setLiveStats((s) => ({
				...s,
				pending: Math.max(0, s.pending - 1),
				rejectedToday: s.rejectedToday + 1,
			}));
		}
		setLoading(null);
	};

	const handleSelect = (id: string, checked: boolean) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelected(new Set(filteredEvents.map((e) => e.id)));
		} else {
			setSelected(new Set());
		}
	};

	const handleBulkApprove = async () => {
		setBulkLoading(true);
		const ids = Array.from(selected);
		const result = await bulkApprove(ids);
		if (result.success) {
			const idSet = new Set(ids);
			setEvents((prev) =>
				prev.map((e) =>
					idSet.has(e.id)
						? { ...e, isApproved: true, approvalStatus: "approved" as const }
						: e,
				),
			);
			setLiveStats((s) => ({
				...s,
				pending: Math.max(0, s.pending - ids.length),
				approvedToday: s.approvedToday + ids.length,
			}));
			setSelected(new Set());
		}
		setBulkLoading(false);
	};

	const handleBulkReject = async () => {
		setBulkLoading(true);
		const ids = Array.from(selected);
		const result = await bulkReject(ids);
		if (result.success) {
			const idSet = new Set(ids);
			setEvents((prev) =>
				prev.map((e) =>
					idSet.has(e.id)
						? { ...e, isApproved: false, approvalStatus: "rejected" as const }
						: e,
				),
			);
			setLiveStats((s) => ({
				...s,
				pending: Math.max(0, s.pending - ids.length),
				rejectedToday: s.rejectedToday + ids.length,
			}));
			setSelected(new Set());
		}
		setBulkLoading(false);
	};

	const pendingFiltered = useMemo(
		() => filteredEvents.filter((e) => e.approvalStatus === "pending"),
		[filteredEvents],
	);
	const pendingFilteredCount = pendingFiltered.length;

	const handleBulkApproveByFilter = async () => {
		setConfirmBulkApprove(false);
		if (pendingFiltered.length === 0) return;

		setBulkLoading(true);
		const source =
			sourcesSelected.size === 1 ? Array.from(sourcesSelected)[0] : undefined;
		let confidenceMin: number | undefined;
		let confidenceMax: number | undefined;
		if (confidenceFilter === "high") confidenceMin = 70;
		if (confidenceFilter === "medium") {
			confidenceMin = 40;
			confidenceMax = 70;
		}
		if (confidenceFilter === "low") confidenceMax = 40;

		const result = await bulkApproveByFilter(
			source,
			confidenceMin,
			confidenceMax,
		);
		if (result.success) {
			for (const e of pendingFiltered) {
				updateEventInList(e.id, {
					isApproved: true,
					approvalStatus: "approved",
				});
			}
			setLiveStats((s) => ({
				...s,
				pending: Math.max(0, s.pending - pendingFiltered.length),
				approvedToday: s.approvedToday + pendingFiltered.length,
			}));
			setSelected(new Set());
		}
		setBulkLoading(false);
	};

	const handleEditSaved = (updated: Partial<Event> & { id: string }) => {
		updateEventInList(updated.id, {
			...updated,
			isApproved: true,
			approvalStatus: "approved",
		});
		setLiveStats((s) => ({
			...s,
			pending: Math.max(0, s.pending - 1),
			approvedToday: s.approvedToday + 1,
		}));
		setEditingEvent(null);
	};

	return (
		<div className="space-y-4">
			{/* Section toggle */}
			<div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
				<button
					onClick={() => setSection("curation")}
					className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
						section === "curation"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Curación
				</button>
				<button
					onClick={() => setSection("orphans")}
					className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
						section === "orphans"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Sin organización
					{orphanEvents.length > 0 && (
						<span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/10 px-1 text-[10px] font-medium text-amber-600">
							{orphanEvents.length}
						</span>
					)}
				</button>
			</div>

			{section === "orphans" ? (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="rounded-lg border bg-card p-4">
							<div className="flex items-center gap-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
									<AlertCircle className="h-4 w-4 text-amber-500" />
								</div>
								<div>
									<p className="text-2xl font-semibold">
										{orphanEvents.length}
									</p>
									<p className="text-xs text-muted-foreground">
										Sin organización
									</p>
								</div>
							</div>
						</div>
						<div className="rounded-lg border bg-card p-4">
							<div className="flex items-center gap-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10">
									<Building2 className="h-4 w-4 text-blue-500" />
								</div>
								<div>
									<p className="text-2xl font-semibold">
										{organizations.length}
									</p>
									<p className="text-xs text-muted-foreground">
										Orgs disponibles
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="rounded-lg border bg-card">
						<div className="border-b px-4 py-3">
							<h2 className="font-medium">Eventos sin organización</h2>
							<p className="text-sm text-muted-foreground">
								Eventos importados que no pudieron ser asignados automáticamente
							</p>
						</div>
						<div className="p-4">
							<PendingOrgEvents
								events={orphanEvents}
								organizations={organizations}
							/>
						</div>
					</div>
				</div>
			) : (
				<>
					{/* Stats bar */}
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div className="rounded-lg border bg-card p-3">
							<p className="text-xl font-semibold">{liveStats.pending}</p>
							<p className="text-xs text-muted-foreground">Pendientes</p>
						</div>
						<div className="rounded-lg border bg-card p-3">
							<p className="text-xl font-semibold text-emerald-600">
								{liveStats.approvedToday}
							</p>
							<p className="text-xs text-muted-foreground">Aprobados hoy</p>
						</div>
						<div className="rounded-lg border bg-card p-3">
							<p className="text-xl font-semibold text-red-500">
								{liveStats.rejectedToday}
							</p>
							<p className="text-xs text-muted-foreground">Rechazados hoy</p>
						</div>
						<div className="rounded-lg border bg-card p-3">
							<p className="text-xl font-semibold text-muted-foreground">
								{liveStats.total}
							</p>
							<p className="text-xs text-muted-foreground">Total scrapeados</p>
						</div>
					</div>

					{/* Toolbar */}
					<div className="flex flex-wrap items-center gap-3">
						{/* Filter tabs */}
						<div className="flex gap-1 rounded-lg bg-muted p-1">
							{(["pending", "approved", "rejected", "all"] as const).map(
								(f) => (
									<button
										key={f}
										onClick={() => {
											setFilter(f);
											setSelected(new Set());
										}}
										className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
											filter === f
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										{f === "pending"
											? "Pendientes"
											: f === "approved"
												? "Aprobados"
												: f === "rejected"
													? "Rechazados"
													: "Todos"}
									</button>
								),
							)}
						</div>

						{/* Source multiselect */}
						<div className="relative" ref={sourcePopoverRef}>
							<button
								onClick={() => setSourcePopoverOpen((v) => !v)}
								className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
									sourcesSelected.size > 0
										? "border-foreground/30 bg-foreground/5 text-foreground"
										: "bg-background text-muted-foreground hover:text-foreground"
								}`}
							>
								{sourcesSelected.size === 0
									? "Fuentes"
									: sourcesSelected.size === 1
										? (SOURCE_LABEL[Array.from(sourcesSelected)[0]] ??
											Array.from(sourcesSelected)[0])
										: `${sourcesSelected.size} fuentes`}
								<ChevronDown className="h-3 w-3 opacity-50" />
							</button>
							{sourcePopoverOpen && (
								<>
									<div
										className="fixed inset-0 z-40"
										onClick={() => setSourcePopoverOpen(false)}
									/>
									<div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border bg-card p-1.5 shadow-lg">
										<div className="mb-1 flex items-center justify-between px-2 py-1">
											<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
												Fuentes
											</span>
											{sourcesSelected.size > 0 && (
												<button
													onClick={() => {
														setSourcesSelected(new Set());
														setSelected(new Set());
													}}
													className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
												>
													Limpiar
												</button>
											)}
										</div>
										{availableSources.map(({ source, count }) => {
											const active = sourcesSelected.has(source);
											return (
												<button
													key={source}
													onClick={() => {
														setSourcesSelected((prev) => {
															const next = new Set(prev);
															if (active) next.delete(source);
															else next.add(source);
															return next;
														});
														setSelected(new Set());
													}}
													className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
														active
															? "bg-foreground/5 text-foreground"
															: "text-muted-foreground hover:bg-muted hover:text-foreground"
													}`}
												>
													<span
														className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
															active
																? "border-foreground bg-foreground text-background"
																: "border-muted-foreground/30"
														}`}
													>
														{active && <Check className="h-2.5 w-2.5" />}
													</span>
													<span className="flex-1 text-left">
														{SOURCE_LABEL[source] ?? source}
													</span>
													<span className="tabular-nums text-[10px] text-muted-foreground/70">
														{count}
													</span>
												</button>
											);
										})}
									</div>
								</>
							)}
						</div>

						{/* Scope chips */}
						<div className="flex gap-1 rounded-lg bg-muted p-1">
							{(
								[
									{ key: "all", label: "Todos", icon: null },
									{ key: "latam", label: "LATAM", icon: Globe },
									{
										key: "global_latam_eligible",
										label: "Global",
										icon: Globe2,
									},
								] as const
							).map((chip) => (
								<button
									key={chip.key}
									onClick={() => {
										setScopeFilter(chip.key);
										if (chip.key !== "latam") setConfidenceFilter("all");
										setSelected(new Set());
									}}
									className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
										scopeFilter === chip.key
											? "bg-background text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{chip.icon && <chip.icon className="h-3 w-3" />}
									{chip.label}
								</button>
							))}
						</div>

						{/* Confidence chips — only for LATAM scope */}
						{scopeFilter === "latam" && (
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex gap-1 rounded-lg bg-muted p-1">
										{(
											[
												{ key: "all", label: "Todos" },
												{ key: "high", label: "Alta", dot: "bg-emerald-500" },
												{ key: "medium", label: "Media", dot: "bg-amber-500" },
												{ key: "low", label: "Baja", dot: "bg-red-500" },
											] as const
										).map((chip) => (
											<button
												key={chip.key}
												onClick={() => {
													setConfidenceFilter(chip.key);
													setSelected(new Set());
												}}
												className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
													confidenceFilter === chip.key
														? "bg-background text-foreground shadow-sm"
														: "text-muted-foreground hover:text-foreground"
												}`}
											>
												{"dot" in chip && (
													<span
														className={`h-1.5 w-1.5 rounded-full ${chip.dot}`}
													/>
												)}
												{chip.label}
											</button>
										))}
									</div>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									Confianza de que el evento es relevante para LATAM
								</TooltipContent>
							</Tooltip>
						)}

						{/* Bulk approve by filter */}
						{hasActiveFilters &&
							filter === "pending" &&
							pendingFilteredCount > 0 && (
								<button
									onClick={() => setConfirmBulkApprove(true)}
									disabled={bulkLoading}
									className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
								>
									<Zap className="h-3 w-3" />
									Aprobar {pendingFilteredCount} filtrados
								</button>
							)}

						{/* Spacer */}
						<div className="flex-1" />

						{/* View toggle */}
						<div className="flex gap-1 rounded-lg bg-muted p-1">
							<button
								onClick={() => setView("cards")}
								className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${view === "cards" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
							>
								<LayoutGrid className="h-3.5 w-3.5" />
							</button>
							<button
								onClick={() => setView("table")}
								className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${view === "table" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
							>
								<List className="h-3.5 w-3.5" />
							</button>
						</div>

						{/* Count */}
						<span className="text-xs text-muted-foreground">
							{filteredEvents.length} evento
							{filteredEvents.length !== 1 ? "s" : ""}
						</span>
					</div>

					{/* Bulk action bar (for card view) */}
					{view === "cards" && selected.size > 0 && (
						<div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2.5">
							<span className="text-sm text-muted-foreground">
								{selected.size} seleccionado
								{selected.size !== 1 ? "s" : ""}
							</span>
							<div className="flex items-center gap-2">
								<button
									onClick={handleBulkReject}
									disabled={bulkLoading}
									className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
								>
									<X className="h-3.5 w-3.5" />
									Rechazar todos
								</button>
								<button
									onClick={handleBulkApprove}
									disabled={bulkLoading}
									className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
								>
									<Check className="h-3.5 w-3.5" />
									Aprobar todos
								</button>
							</div>
						</div>
					)}

					{/* Content */}
					{filteredEvents.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
							<PackageOpen className="mb-3 h-8 w-8 text-muted-foreground/50" />
							<p className="text-sm font-medium">Sin eventos</p>
							<p className="mt-1 text-xs text-muted-foreground">
								No hay eventos{" "}
								{filter === "pending"
									? "pendientes"
									: filter === "approved"
										? "aprobados"
										: filter === "rejected"
											? "rechazados"
											: ""}{" "}
								{sourcesSelected.size > 0
									? `de ${Array.from(sourcesSelected)
											.map((s) => SOURCE_LABEL[s] ?? s)
											.join(", ")}`
									: ""}
							</p>
						</div>
					) : view === "cards" ? (
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
							{filteredEvents.map((event) => (
								<PendingEventCard
									key={event.id}
									event={event}
									selected={selected.has(event.id)}
									onSelect={handleSelect}
									onApprove={handleApprove}
									onReject={handleReject}
									onEdit={setEditingEvent}
									loading={loading}
								/>
							))}
						</div>
					) : (
						<PendingEventTable
							events={filteredEvents}
							selected={selected}
							onSelect={handleSelect}
							onSelectAll={handleSelectAll}
							onApprove={handleApprove}
							onReject={handleReject}
							onEdit={setEditingEvent}
							onBulkApprove={handleBulkApprove}
							onBulkReject={handleBulkReject}
							loading={loading}
							bulkLoading={bulkLoading}
						/>
					)}

					{/* Edit modal */}
					{editingEvent && (
						<PendingEditModal
							event={editingEvent}
							onClose={() => setEditingEvent(null)}
							onSaved={handleEditSaved}
						/>
					)}

					{/* Bulk approve confirmation */}
					<AlertDialog
						open={confirmBulkApprove}
						onOpenChange={setConfirmBulkApprove}
					>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Aprobar eventos filtrados</AlertDialogTitle>
								<AlertDialogDescription>
									Esto aprobará{" "}
									<span className="font-semibold text-foreground">
										{pendingFilteredCount} evento
										{pendingFilteredCount !== 1 ? "s" : ""}
									</span>{" "}
									pendiente{pendingFilteredCount !== 1 ? "s" : ""} que coinciden
									con los filtros actuales. Esta acción no se puede deshacer.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleBulkApproveByFilter}
									className="bg-emerald-600 text-white hover:bg-emerald-700"
								>
									<Check className="mr-1.5 h-3.5 w-3.5" />
									Aprobar {pendingFilteredCount}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</>
			)}
		</div>
	);
}
