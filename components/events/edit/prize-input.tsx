"use client";

import { Trophy } from "lucide-react";
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
		<div className="space-y-3 pt-4 border-t">
			<div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
				<Trophy className="h-4 w-4" />
				Premios
			</div>

			<div className="space-y-3">
				<label className="text-xs text-muted-foreground">Monto total</label>
				<div className="flex items-center gap-2">
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
						className="flex-1"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<label
					htmlFor="prize-description"
					className="text-xs text-muted-foreground"
				>
					Distribución de premios
				</label>
				<Input
					id="prize-description"
					value={prizeDescription}
					onChange={(e) => onPrizeDescriptionChange(e.target.value)}
					placeholder={`1er lugar: ${prizeCurrency === "USD" ? "$" : "S/"}5000, 2do: ${prizeCurrency === "USD" ? "$" : "S/"}3000, 3er: ${prizeCurrency === "USD" ? "$" : "S/"}2000`}
					className="text-sm"
				/>
			</div>
		</div>
	);
}
