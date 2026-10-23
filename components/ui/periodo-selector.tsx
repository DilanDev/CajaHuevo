"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  crearPeriodo,
  PERIODOS_RAPIDOS,
  type ClavePeriodo,
  type Periodo,
} from "@/lib/periodos";
import {
  fechaISOLocal,
  finDelDia,
  inicioDelDia,
  parseFechaLocal,
} from "@/lib/format";

export function PeriodoSelector({
  periodo,
  onChange,
}: {
  periodo: Periodo;
  onChange: (periodo: Periodo) => void;
}) {
  const [personalizadoAbierto, setPersonalizadoAbierto] = useState(
    periodo.clave === "personalizado"
  );
  const [fechas, setFechas] = useState(() => ({
    desde: fechaISOLocal(periodo.desde),
    hasta: fechaISOLocal(periodo.hasta),
  }));
  const [error, setError] = useState<string | null>(null);
  const { desde, hasta } = fechas;

  function seleccionar(clave: ClavePeriodo) {
    setError(null);
    setPersonalizadoAbierto(clave === "personalizado");

    if (clave === "personalizado") {
      setFechas({
        desde: fechaISOLocal(periodo.desde),
        hasta: fechaISOLocal(periodo.hasta),
      });
      return;
    }

    onChange(crearPeriodo(clave));
  }

  function aplicarPersonalizado() {
    if (!desde || !hasta) {
      setError("Selecciona las dos fechas.");
      return;
    }
    const inicio = inicioDelDia(parseFechaLocal(desde));
    const fin = finDelDia(parseFechaLocal(hasta));
    if (inicio > fin) {
      setError("La fecha inicial no puede ser mayor que la final.");
      return;
    }
    setError(null);
    onChange({
      clave: "personalizado",
      desde: inicio,
      hasta: fin,
      etiqueta: "Personalizado",
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PERIODOS_RAPIDOS.map((item) => {
          const activo = periodo.clave === item.clave;
          return (
            <button
              key={item.clave}
              type="button"
              onClick={() => seleccionar(item.clave)}
              aria-pressed={activo}
              className={cn(
                "h-8 rounded-full border px-3 text-[13px] font-semibold transition",
                activo
                  ? "border-[#241c14] bg-[#241c14] text-[#fffdf8]"
                  : "border-border bg-card text-muted-foreground hover:border-[#c9b79d] hover:text-foreground"
              )}
            >
              {item.etiqueta}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => seleccionar("personalizado")}
          aria-pressed={periodo.clave === "personalizado"}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition",
            periodo.clave === "personalizado"
              ? "border-[#241c14] bg-[#241c14] text-[#fffdf8]"
              : "border-border bg-card text-muted-foreground hover:border-[#c9b79d] hover:text-foreground"
          )}
        >
          <CalendarRange className="h-3.5 w-3.5" />
          Personalizado
        </button>
      </div>

      {personalizadoAbierto && (
        <div className="animar-entrada rounded-xl border bg-card p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="periodo-desde"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Desde
              </label>
              <Input
                id="periodo-desde"
                type="date"
                value={desde}
                max={hasta}
                onChange={(evento) =>
                  setFechas((anterior) => ({
                    ...anterior,
                    desde: evento.target.value,
                  }))
                }
                className="h-10"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="periodo-hasta"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Hasta
              </label>
              <Input
                id="periodo-hasta"
                type="date"
                value={hasta}
                min={desde}
                onChange={(evento) =>
                  setFechas((anterior) => ({
                    ...anterior,
                    hasta: evento.target.value,
                  }))
                }
                className="h-10"
              />
            </div>
            <Button size="sm" onClick={aplicarPersonalizado} className="h-10">
              Aplicar
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
