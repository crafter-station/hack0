"use client";

import { Check, LayoutGrid, List, PackageOpen, X } from "lucide-react";
import { useState } from "react";
import {
	approveScrapedEvent,
	bulkApprove,
	bulkReject,
	rejectScrapedEvent,
} from "@/lib/actions/scraper-curation";
import type { Event } from "@/lib/db/schema";
import { ScraperCard } from "./scraper-card";
import { ScraperEditModal } from "./scraper-edit-modal";
import { ScraperTable } from "./scraper-table";

const SOURCES = [
	"devpost",
	"meetup",
	"eventbrite",
	"mlh",
	"linkedin",
	"perplexity",
	"exa",
	"haiku",
	"universities",
	"social",
	"hackathon_com",
] as const;

type FilterType = "pending" | "approved" | "rejected" | "all";
type ViewType = "cards" | "table";

interface ScraperInboxProps {
	initialEvents: Event[];
	stats: {
		pending: number;
		approvedToday: number;
		rejectedToday: number;
		total: number;
	};
}

export function ScraperInbox({ initialEvents, stats }: ScraperInboxProps) {
	const [events, setEvents] = useState(initialEvents);
	const [filter, setFilter] = useState<FilterType>("pending");
	const [sourceFilter, setSourceFilter] = useState<string>("all");
	const [view, setView] = useState<ViewType>("cards");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState<string | null>(null);
	const [bulkLoading, setBulkLoading] = useState(false);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);

	const [liveStats, setLiveStats] = useState(stats);

	const filteredEvents = events.filter((e) => {
		const matchFilter = filter === "all" || e.approvalStatus === filter;
		const matchSource =
			sourceFilter === "all" || e.scrapeSource === sourceFilter;
		return matchFilter && matchSource;
	});

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
			updateEventInList(id, { isApproved: false, approvalStatus: "rejected" });
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
			ids.forEach((id) =>
				updateEventInList(id, { isApproved: true, approvalStatus: "approved" }),
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
			ids.forEach((id) =>
				updateEventInList(id, {
					isApproved: false,
					approvalStatus: "rejected",
				}),
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
					{(["pending", "approved", "rejected", "all"] as const).map((f) => (
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
					))}
				</div>

				{/* Source filter */}
				<select
					value={sourceFilter}
					onChange={(e) => {
						setSourceFilter(e.target.value);
						setSelected(new Set());
					}}
					className="rounded-md border bg-background px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-foreground/30"
				>
					<option value="all">Todas las fuentes</option>
					{SOURCES.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>

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
					{filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""}
				</span>
			</div>

			{/* Bulk action bar (for card view) */}
			{view === "cards" && selected.size > 0 && (
				<div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2.5">
					<span className="text-sm text-muted-foreground">
						{selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
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
						{sourceFilter !== "all" ? `de ${sourceFilter}` : ""}
					</p>
				</div>
			) : view === "cards" ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredEvents.map((event) => (
						<ScraperCard
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
				<ScraperTable
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
				<ScraperEditModal
					event={editingEvent}
					onClose={() => setEditingEvent(null)}
					onSaved={handleEditSaved}
				/>
			)}
		</div>
	);
}
