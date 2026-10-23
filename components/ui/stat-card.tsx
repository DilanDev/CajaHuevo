import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Acento = "primary" | "success" | "danger" | "info" | "neutral";

const acentos: Record<Acento, { burbuja: string; icono: string }> = {
  primary: { burbuja: "bg-[#fdf1e2]", icono: "text-primary" },
  success: { burbuja: "bg-[#eaf7ef]", icono: "text-success" },
  danger: { burbuja: "bg-[#fdf1f0]", icono: "text-destructive" },
  info: { burbuja: "bg-[#edf7f9]", icono: "text-[#0f6b78]" },
  neutral: { burbuja: "bg-muted", icono: "text-muted-foreground" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  tendencia,
  tendenciaInversa = false,
  acento = "primary",
  className,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  sub?: ReactNode;
  tendencia?: number | null;
  tendenciaInversa?: boolean;
  acento?: Acento;
  className?: string;
  valueClassName?: string;
}) {
  const tieneTendencia = tendencia !== null && tendencia !== undefined;
  const positiva = (tendencia ?? 0) >= 0;
  const esBuena = tendenciaInversa ? !positiva : positiva;
  const IconoTendencia = positiva ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={cn("tarjeta p-4 md:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              acentos[acento].burbuja
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", acentos[acento].icono)} />
          </span>
        )}
      </div>

      <p
        className={cn(
          "mt-2 text-[1.45rem] font-bold leading-tight tracking-tight tabular-nums md:text-[1.65rem]",
          valueClassName
        )}
      >
        {value}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {tieneTendencia && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              esBuena
                ? "bg-[#eaf7ef] text-success"
                : "bg-[#fdf1f0] text-destructive"
            )}
          >
            <IconoTendencia className="h-3 w-3" />
            {Math.abs((tendencia ?? 0) * 100).toFixed(0)}%
          </span>
        )}
        {sub && (
          <span className="text-xs text-muted-foreground">{sub}</span>
        )}
      </div>
    </div>
  );
}
