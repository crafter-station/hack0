"use client";

import { DollarSign, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PrizeInputProps {
	prizePool: string;
	prizeCurrency: "USD" | "PEN";
	prizeDescription: string;
	onPrizePoolChange: (value: string) => void;
	onPrizeCurrencyChange: (value: "USD" | "PEN") => void;
	onPrizeDescriptionChange: (value: string) => void;
}

export function PrizeInput({
	prizePool,
	prizeCurrency,
	prizeDescription,
	onPrizePoolChange,
	onPrizeCurrencyChange,
	onPrizeDescriptionChange,
}: PrizeInputProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<Trophy className="h-4 w-4" />
				Premios
			</div>

			<div className="rounded-lg border bg-card overflow-hidden transition-colors has-[:focus]:border-primary/50 has-[:focus]:ring-1 has-[:focus]:ring-primary/20">
				<div className="p-4 space-y-3">
					<label className="text-xs text-muted-foreground uppercase tracking-wide">
						Monto total
					</label>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
							{prizeCurrency === "USD" ? (
								<DollarSign className="h-5 w-5" />
							) : (
								<span className="text-lg font-bold">S/</span>
							)}
						</div>
						<div className="flex-1 flex items-center gap-2">
							<div className="flex rounded-lg border bg-muted/50">
								<button
									type="button"
									onClick={() => onPrizeCurrencyChange("USD")}
									className={cn(
										"px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors",
										prizeCurrency === "USD"
											? "bg-background shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									USD
								</button>
								<button
									type="button"
									onClick={() => onPrizeCurrencyChange("PEN")}
									className={cn(
										"px-3 py-1.5 text-sm font-medium rounded-r-lg transition-colors",
										prizeCurrency === "PEN"
											? "bg-background shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									PEN
								</button>
							</div>
							<Input
								type="number"
								value={prizePool}
								onChange={(e) => onPrizePoolChange(e.target.value)}
								placeholder="10000"
								className="border-0 shadow-none h-auto text-2xl font-semibold focus-visible:ring-0 px-0"
							/>
						</div>
					</div>
				</div>

				<div className="group border-t p-4 space-y-2 bg-muted/30 transition-colors hover:bg-muted/50 has-[:focus]:bg-muted/50">
					<label
						htmlFor="prize-description"
						className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
					>
						Distribución de premios
					</label>
					<Input
						id="prize-description"
						value={prizeDescription}
						onChange={(e) => onPrizeDescriptionChange(e.target.value)}
						placeholder={`1er lugar: ${prizeCurrency === "USD" ? "$" : "S/"}5000, 2do: ${prizeCurrency === "USD" ? "$" : "S/"}3000, 3er: ${prizeCurrency === "USD" ? "$" : "S/"}2000`}
						className="border-0 shadow-none px-2 py-1.5 h-auto text-sm focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
					/>
				</div>
			</div>
		</div>
	);
}
