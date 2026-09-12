"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "./dropdown";

export interface SelectOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  dot?: "on" | "off";
}

/**
 * Pill dropdown select as used throughout Fathom settings ("No meetings. I'll
 * record manually ⌄", "On ⌄", "Forever ⌄") and on the call page (template and
 * language pills).
 */
export function PillSelect<T extends string>({
  value,
  options,
  onChange,
  className,
  menuClassName,
  align = "end",
  width,
  size = "md",
  variant = "filled",
  renderValue,
  ariaLabel,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  className?: string;
  menuClassName?: string;
  align?: "start" | "end";
  width?: number;
  size?: "sm" | "md";
  variant?: "filled" | "outline" | "ghost";
  renderValue?: (o: SelectOption<T> | undefined) => React.ReactNode;
  ariaLabel?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Dropdown>
      <DropdownTrigger>
        <span
          aria-label={ariaLabel}
          className={cn(
            "inline-flex items-center gap-2 whitespace-nowrap rounded-lg font-medium text-off-white transition-colors duration-150",
            size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-3.5 text-[15px]",
            variant === "filled" && "bg-[#35353c] hover:bg-[#3e3e46]",
            variant === "outline" && "border border-white/25 bg-transparent hover:bg-white/5",
            variant === "ghost" && "bg-transparent hover:bg-white/8",
            className,
          )}
        >
          {current?.dot && (
            <span
              className={cn("size-2 rounded-full", current.dot === "on" ? "bg-fathom" : "border border-white/40")}
            />
          )}
          {current?.icon && <span className="[&_svg]:size-4 text-white/80">{current.icon}</span>}
          <span>{renderValue ? renderValue(current) : current?.label}</span>
          <ChevronDown className="size-4 text-white/70" strokeWidth={2.25} />
        </span>
      </DropdownTrigger>
      <DropdownContent align={align} width={width} className={cn("p-2", menuClassName)}>
        {options.map((o) => (
          <DropdownItem
            key={o.value}
            onSelect={() => onChange(o.value)}
            icon={o.icon}
            description={o.description}
            className={cn(o.value === value && "text-fathom", o.description && "py-2.5")}
          >
            <span className="flex items-center gap-2">
              <span>{o.label}</span>
              {o.badge}
              {o.value === value && !o.description && <Check className="ml-auto size-4 text-emerald-400" strokeWidth={2.5} />}
            </span>
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
