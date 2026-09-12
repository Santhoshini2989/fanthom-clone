import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary" // solid cyan, black text (marketing CTA / modal primary)
  | "cyan" // solid #55bbf9-ish cyan with dark text (app primary, e.g. Regenerate Summary)
  | "share" // dark cyan tint with cyan text (Share button)
  | "outline-cyan" // cyan border, cyan text (Copy Link)
  | "ghost" // transparent
  | "secondary" // gray card surface
  | "danger"
  | "yellow" // pricing CTA
  | "white"; // auth buttons

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-fathom text-black hover:brightness-110 active:brightness-95",
  cyan: "bg-[#55bbf9] text-[#0a0a0a] hover:bg-[#6cc5fa] active:bg-[#45aeee]",
  share: "bg-app-share text-fathom hover:bg-[#25323a] active:bg-[#1c262c]",
  "outline-cyan": "border border-fathom text-fathom bg-transparent hover:bg-fathom/10 active:bg-fathom/15",
  ghost: "bg-transparent text-off-white/80 hover:bg-white/8 hover:text-off-white active:bg-white/12",
  secondary: "bg-app-card text-off-white hover:bg-app-card-hover active:brightness-95",
  danger: "bg-[#c0392b] text-white hover:bg-[#d24537] active:bg-[#b03427]",
  yellow: "bg-brand-yellow text-black hover:brightness-105 active:brightness-95",
  white: "bg-white text-black border border-[#d9dbe0] hover:bg-[#f3f4f6] active:bg-[#e5e7eb]",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-xs rounded-md gap-1.5",
  sm: "h-8 px-3 text-sm rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-6 text-base rounded-lg gap-2",
  icon: "size-9 rounded-lg",
  "icon-sm": "size-7 rounded-md",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-[background-color,color,filter,transform] duration-150 ease-[var(--ease-fathom)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fathom/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
