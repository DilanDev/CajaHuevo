import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm text-foreground shadow-[inset_0_1px_1px_rgba(36,28,20,0.03)] outline-none transition placeholder:text-muted-foreground/70 focus:border-[#c98a3f] focus:ring-2 focus:ring-[#e9b96e]/45 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
      "file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-20 w-full resize-y rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-[#c98a3f] focus:ring-2 focus:ring-[#e9b96e]/45 disabled:cursor-not-allowed disabled:bg-muted",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
