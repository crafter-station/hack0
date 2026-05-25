import { CheckCircle2, Database } from "lucide-react";
import { cn } from "@/lib/utils";

type EventStatusType = "ongoing" | "open" | "upcoming" | "ended";
type ApprovalStatus = "approved" | "pending" | "rejected";

interface StatusBadgeProps {
	status: EventStatusType;
	label: string;
	className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
				status === "ended" && "bg-muted text-muted-foreground",
				status === "ongoing" &&
					"bg-brand-green/10 text-brand-green dark:text-brand-green",
				status === "open" &&
					"bg-brand-grid/10 text-brand-grid dark:text-brand-grid",
				status === "upcoming" &&
					"bg-amber-500/10 text-amber-700 dark:text-amber-400",
				className,
			)}
		>
			<span
				className={cn(
					"h-1.5 w-1.5 rounded-full",
					status === "ongoing"
						? "bg-brand-green animate-pulse"
						: "bg-current opacity-60",
				)}
			/>
			{label}
		</div>
	);
}

interface ApprovalBadgeProps {
	status: ApprovalStatus;
	className?: string;
}

export function ApprovalBadge({ status, className }: ApprovalBadgeProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
				status === "approved" &&
					"bg-brand-green/10 text-brand-green dark:text-brand-green",
				status === "pending" &&
					"bg-amber-500/10 text-amber-700 dark:text-amber-400",
				status === "rejected" && "bg-red-500/10 text-red-700 dark:text-red-400",
				className,
			)}
		>
			{status === "approved" && (
				<CheckCircle2 className="h-3 w-3 text-brand-green shrink-0" />
			)}
			{status === "approved"
				? "Aprobado"
				: status === "pending"
					? "Pendiente"
					: "Rechazado"}
		</div>
	);
}

interface FeaturedBadgeProps {
	className?: string;
}

export function FeaturedBadge({ className }: FeaturedBadgeProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400",
				className,
			)}
		>
			Destacado
		</div>
	);
}

interface ImportedBadgeProps {
	className?: string;
}

export function ImportedBadge({ className }: ImportedBadgeProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground",
				className,
			)}
		>
			<Database className="h-3 w-3" />
			Importado
		</div>
	);
}

interface VerifiedBadgeProps {
	className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-brand-grid/10 text-brand-grid dark:text-brand-grid",
				className,
			)}
		>
			<CheckCircle2 className="h-3 w-3 text-brand-green shrink-0" />
			Verificado
		</div>
	);
}
