"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectOption {
	value: string;
	label: string;
	description?: string;
}

interface SearchableSelectProps {
	options: SearchableSelectOption[];
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	className?: string;
	disabled?: boolean;
}

export function SearchableSelect({
	options,
	value,
	onValueChange,
	placeholder = "Seleccionar...",
	searchPlaceholder = "Buscar...",
	emptyMessage = "No se encontraron resultados",
	className,
	disabled = false,
}: SearchableSelectProps) {
	const [open, setOpen] = useState(false);

	const selectedOption = useMemo(
		() => options.find((option) => option.value === value),
		[options, value],
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
					disabled={disabled}
				>
					<span className={cn(!value && "text-muted-foreground")}>
						{selectedOption?.label || placeholder}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={(currentValue) => {
										onValueChange(
											currentValue === value ? "" : currentValue,
										);
										setOpen(false);
									}}
									className="flex flex-col items-start gap-1"
								>
									<div className="flex w-full items-center gap-2">
										<Check
											className={cn(
												"h-4 w-4 shrink-0",
												value === option.value ? "opacity-100" : "opacity-0",
											)}
										/>
										<span className="flex-1">{option.label}</span>
									</div>
									{option.description && (
										<span className="ml-6 text-xs text-muted-foreground">
											{option.description}
										</span>
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
