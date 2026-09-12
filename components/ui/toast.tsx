"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "info" | "error";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastApi {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, message, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts((x) => x.filter((y) => y.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const Icon = toast.kind === "success" ? Check : toast.kind === "error" ? X : Info;
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-center gap-2.5 rounded-lg border border-white/10 bg-app-modal px-4 py-2.5 text-sm text-off-white shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-200 ease-[var(--ease-fathom)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full",
          toast.kind === "success" && "bg-emerald-500/20 text-emerald-400",
          toast.kind === "info" && "bg-fathom/20 text-fathom",
          toast.kind === "error" && "bg-red-500/20 text-red-400",
        )}
      >
        <Icon className="size-3" strokeWidth={3} />
      </span>
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="ml-1 rounded p-0.5 text-white/40 hover:text-white"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
