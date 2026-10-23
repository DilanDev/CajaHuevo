import { formatCOP, formatPorcentaje } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ItemBarra = {
  etiqueta: string;
  valor: number;
  detalle?: string;
};

export function BarrasDesglose({
  items,
  color = "#b45309",
  mostrarPorcentaje = true,
  vacio = "Sin datos en este período.",
}: {
  items: ItemBarra[];
  color?: string;
  mostrarPorcentaje?: boolean;
  vacio?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{vacio}</p>
    );
  }

  const total = items.reduce((suma, item) => suma + item.valor, 0);
  const maximo = Math.max(...items.map((item) => item.valor), 1);

  return (
    <ul className="space-y-3.5">
      {items.map((item) => {
        const ancho = Math.max((item.valor / maximo) * 100, item.valor > 0 ? 2 : 0);
        const porcentaje = total > 0 ? item.valor / total : 0;

        return (
          <li key={item.etiqueta} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[13px] font-medium text-foreground">
                {item.etiqueta}
                {item.detalle && (
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                    {item.detalle}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[13px] font-semibold tabular-nums text-foreground">
                {formatCOP(item.valor)}
                {mostrarPorcentaje && total > 0 && (
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                    {formatPorcentaje(porcentaje)}
                  </span>
                )}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-[#f1e9dc]"
              role="presentation"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-300 group-hover:opacity-85"
                )}
                style={{ width: `${ancho}%`, backgroundColor: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
