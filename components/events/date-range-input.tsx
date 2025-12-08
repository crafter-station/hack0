"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface DateRangeInputProps {
	startDate: string;
	endDate: string;
	registrationDeadline: string;
	onStartDateChange: (value: string) => void;
	onEndDateChange: (value: string) => void;
	onRegistrationDeadlineChange: (value: string) => void;
}

export function DateRangeInput({
	startDate,
	endDate,
	registrationDeadline,
	onStartDateChange,
	onEndDateChange,
	onRegistrationDeadlineChange,
}: DateRangeInputProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<Calendar className="h-4 w-4" />
				Fechas del evento
			</div>

			<div className="rounded-lg border bg-card overflow-hidden transition-colors has-[:focus]:border-primary/50 has-[:focus]:ring-1 has-[:focus]:ring-primary/20">
				<div className="grid grid-cols-2 divide-x">
					<div className="group p-4 space-y-2 transition-colors hover:bg-muted/20 has-[:focus]:bg-muted/30">
						<label
							htmlFor="start-date"
							className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
						>
							Inicio
						</label>
						<Input
							id="start-date"
							type="datetime-local"
							value={startDate}
							onChange={(e) => onStartDateChange(e.target.value)}
							className="border-0 shadow-none px-2 py-1.5 h-auto text-base font-medium focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
						/>
					</div>

					<div className="group p-4 space-y-2 transition-colors hover:bg-muted/20 has-[:focus]:bg-muted/30">
						<label
							htmlFor="end-date"
							className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
						>
							Fin
						</label>
						<Input
							id="end-date"
							type="datetime-local"
							value={endDate}
							onChange={(e) => onEndDateChange(e.target.value)}
							className="border-0 shadow-none px-2 py-1.5 h-auto text-base font-medium focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
						/>
					</div>
				</div>

				<div className="group border-t p-4 space-y-2 bg-muted/30 transition-colors hover:bg-muted/50 has-[:focus]:bg-muted/50 has-[:focus]:border-t-primary/50">
					<label
						htmlFor="registration-deadline"
						className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
					>
						Cierre de inscripciones
					</label>
					<Input
						id="registration-deadline"
						type="datetime-local"
						value={registrationDeadline}
						onChange={(e) => onRegistrationDeadlineChange(e.target.value)}
						className="border-0 shadow-none px-2 py-1.5 h-auto text-base font-medium focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
					/>
				</div>
			</div>
		</div>
	);
}
