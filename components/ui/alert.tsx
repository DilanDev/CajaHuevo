import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Variante = "info" | "error" | "success";

const estilos: Record<Variante, string> = {
  info: "border-[#e9d9b8] bg-[#fdf7ea] text-[#744d0d]",
  error: "border-[#f0c5c0] bg-[#fdf2f1] text-[#9a1f16]",
  success: "border-[#c4e3cf] bg-[#f0faf4] text-[#116336]",
};

const Iconos = {
  info: Info,
  error: AlertTriangle,
  success: CheckCircle2,
};

export function Alert({
  variant = "info",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: Variante;
  children: ReactNode;
}) {
  const Icono = Iconos[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        estilos[variant],
        className
      )}
      {...props}
    >
      <Icono className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}
