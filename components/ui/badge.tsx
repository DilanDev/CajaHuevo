import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tono = "neutral" | "primary" | "success" | "danger" | "warning" | "info";

const tonos: Record<Tono, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  primary: "border-[#e9c9a4] bg-[#fdf1e2] text-[#92400e]",
  success: "border-[#bfe3cc] bg-[#eef9f2] text-[#12683a]",
  danger: "border-[#f2c7c3] bg-[#fdf1f0] text-[#a1231a]",
  warning: "border-[#f0dfa8] bg-[#fdf8e7] text-[#8a5a06]",
  info: "border-[#c9dde3] bg-[#eff8fa] text-[#0f5d6b]",
};

export function Badge({
  className,
  tono = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tono?: Tono }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-5",
        tonos[tono],
        className
      )}
      {...props}
    />
  );
}
