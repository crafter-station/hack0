"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue))
    } else {
      onValueChange([...value, optionValue])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs cursor-pointer hover:bg-accent/50 transition-colors min-h-9",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {value.length === 0 ? (
              <span className="text-muted-foreground">
                {placeholder}
              </span>
            ) : value.length <= 2 ? (
              value.map((v) => {
                const option = options.find((o) => o.value === v)
                return (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="text-xs font-normal gap-1"
                  >
                    {option?.label}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-0.5 rounded-full hover:bg-secondary-foreground/20 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onValueChange(value.filter((val) => val !== v))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          onValueChange(value.filter((val) => val !== v))
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                )
              })
            ) : (
              <Badge variant="secondary" className="text-xs font-normal">
                {value.length} seleccionados
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="max-h-60 overflow-auto p-1">
          {options.map((option) => {
            const isSelected = value.includes(option.value)
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelect(option.value)
                  }
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  isSelected && "bg-accent/50"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {isSelected && <Check className="h-4 w-4" />}
                </span>
                {option.label}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
