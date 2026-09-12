"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Lightweight popover/menu primitive: click-to-open, outside click and Escape
 * to close, keyboard navigation between items, portal-positioned to the
 * trigger with 150ms pop-in (matches the app's default transition).
 */

type Align = "start" | "end" | "center";
type Side = "bottom" | "top";

interface Ctx {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  setTriggerEl: (el: HTMLElement | null) => void;
  id: string;
}

const DropdownCtx = createContext<Ctx | null>(null);

export function Dropdown({
  children,
  open: controlled,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const setOpen = (v: boolean) => {
    setInner(v);
    onOpenChange?.(v);
  };
  const triggerRef = useRef<HTMLElement | null>(null);
  const setTriggerEl = (el: HTMLElement | null) => {
    triggerRef.current = el;
  };
  const id = useId();
  return <DropdownCtx.Provider value={{ open, setOpen, triggerRef, setTriggerEl, id }}>{children}</DropdownCtx.Provider>;
}

export function DropdownTrigger({
  children,
  asChild,
  className,
}: {
  children: React.ReactElement<Record<string, unknown>>;
  asChild?: boolean;
  className?: string;
}) {
  const ctx = useContext(DropdownCtx)!;
  const child = children;
  const props = {
    ref: ctx.setTriggerEl,
    "aria-haspopup": "menu" as const,
    "aria-expanded": ctx.open,
    "aria-controls": ctx.id,
    onClick: (e: React.MouseEvent) => {
      (child.props.onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
      e.stopPropagation();
      ctx.setOpen(!ctx.open);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" && !ctx.open) {
        e.preventDefault();
        ctx.setOpen(true);
      }
    },
    className: cn(child.props.className as string, className),
  };
  if (asChild) {
    const Comp = child.type as React.ElementType;
    return <Comp {...child.props} {...props} />;
  }
  return (
    <button type="button" {...props}>
      {child}
    </button>
  );
}

export function DropdownContent({
  children,
  align = "start",
  side = "bottom",
  className,
  width,
  sideOffset = 6,
}: {
  children: React.ReactNode;
  align?: Align;
  side?: Side;
  className?: string;
  width?: number | "trigger";
  sideOffset?: number;
}) {
  const ctx = useContext(DropdownCtx)!;
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; w?: number; flipped: boolean } | null>(null);

  const place = () => {
    const t = ctx.triggerRef.current;
    const el = ref.current;
    if (!t || !el) return;
    const r = t.getBoundingClientRect();
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;
    let left = align === "end" ? r.right - mw : align === "center" ? r.left + r.width / 2 - mw / 2 : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
    let top = side === "bottom" ? r.bottom + sideOffset : r.top - mh - sideOffset;
    let flipped = false;
    if (side === "bottom" && top + mh > window.innerHeight - 8 && r.top - mh - sideOffset > 8) {
      top = r.top - mh - sideOffset;
      flipped = true;
    }
    setPos({ top, left, w: width === "trigger" ? r.width : typeof width === "number" ? width : undefined, flipped });
  };

  useLayoutEffect(() => {
    if (!ctx.open) return;
    place();
    const onScroll = () => place();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.open, align, side, sideOffset, width]);

  useEffect(() => {
    if (!ctx.open) return;
    const onDown = (e: MouseEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node) && !ctx.triggerRef.current?.contains(e.target as Node)) ctx.setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ctx.setOpen(false);
        (ctx.triggerRef.current as HTMLElement | null)?.focus();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement as HTMLElement);
        const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next]!.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ctx]);

  if (!ctx.open || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      id={ctx.id}
      role="menu"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: pos?.w, visibility: pos ? "visible" : "hidden" }}
      className={cn(
        "fixed z-[90] min-w-[180px] rounded-xl border border-white/10 bg-app-menu p-1.5 text-off-white shadow-[0_12px_40px_rgba(0,0,0,0.55)] animate-pop-in",
        pos?.flipped && "origin-bottom",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}

export function DropdownItem({
  children,
  onSelect,
  icon,
  destructive,
  disabled,
  selected,
  className,
  description,
  keepOpen,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  description?: React.ReactNode;
  keepOpen?: boolean;
}) {
  const ctx = useContext(DropdownCtx)!;
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={disabled}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
        if (!keepOpen) ctx.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[15px] leading-5 outline-none transition-colors duration-100 hover:bg-app-menu-hover focus-visible:bg-app-menu-hover disabled:opacity-50",
        destructive && "text-[#f05252]",
        selected && "text-fathom",
        className,
      )}
    >
      {icon && <span className="flex size-4 shrink-0 items-center justify-center text-white/60 [&_svg]:size-4">{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{children}</span>
        {description && <span className="text-[13px] leading-[18px] text-white/50">{description}</span>}
      </span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-white/10" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">{children}</div>;
}

export function useDropdownClose() {
  const ctx = useContext(DropdownCtx);
  return () => ctx?.setOpen(false);
}
