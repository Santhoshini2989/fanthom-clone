import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-lg border border-white/10 bg-app-input px-3.5 text-[15px] text-off-white placeholder:text-white/40 outline-none transition-[border-color,box-shadow] duration-150 focus:border-fathom focus:ring-1 focus:ring-fathom disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full resize-none rounded-lg border border-white/25 bg-app-input px-4 py-3 text-[15px] leading-6 text-off-white placeholder:text-white/40 outline-none transition-[border-color,box-shadow] duration-150 focus:border-fathom focus:ring-1 focus:ring-fathom disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
