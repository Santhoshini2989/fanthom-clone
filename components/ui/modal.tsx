"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal matching Fathom's "Share Recording" / "Customize Template" dialogs:
 * #1b1b20 surface, 16px radius, 28px title, optional #141417 footer band.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
  className,
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  className?: string;
  hideClose?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0]!;
        const last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const first = panel.current?.querySelector<HTMLElement>("input, textarea, button:not([data-close])");
      first?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10 animate-fade-in sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: width }}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-app-modal text-off-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] animate-pop-in",
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            {title ? <h2 className="text-[26px] font-semibold leading-8 tracking-tight">{title}</h2> : <span />}
            {!hideClose && (
              <button
                type="button"
                data-close
                onClick={onClose}
                aria-label="Close"
                className="-mr-1.5 -mt-1 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/8 hover:text-white"
              >
                <X className="size-6" strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 pb-6 pt-5">{children}</div>
        {footer && <div className="flex items-center justify-between gap-3 bg-app-modal-footer px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  destructive,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={480}>
      <p className="text-[15px] leading-6 text-white/70">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-lg bg-app-card px-4 text-sm font-medium text-white/80 transition-colors hover:bg-app-card-hover"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            "h-10 rounded-lg px-4 text-sm font-semibold transition-colors",
            destructive ? "bg-[#c0392b] text-white hover:bg-[#d24537]" : "bg-[#55bbf9] text-black hover:bg-[#6cc5fa]",
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
