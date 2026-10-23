import { Egg } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  tono = "claro",
  className,
}: {
  compact?: boolean;
  tono?: "claro" | "oscuro";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f6c453] text-[#3a2a0a] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
        <Egg className="h-5 w-5" strokeWidth={2.3} aria-hidden />
      </span>
      {!compact && (
        <span
          className={cn(
            "font-display text-[1.35rem] font-semibold leading-none tracking-tight",
            tono === "oscuro" ? "text-[#f4ecdf]" : "text-foreground"
          )}
        >
          Caja
          <span className={tono === "oscuro" ? "text-[#f6c453]" : "text-primary"}>
            Huevo
          </span>
        </span>
      )}
    </span>
  );
}
