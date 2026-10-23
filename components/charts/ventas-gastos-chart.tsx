"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatCOP,
  formatCOPCompacto,
  formatFecha,
  formatFechaCorta,
  fechaISOLocal,
  parseFechaLocal,
} from "@/lib/format";
import type { DiaContabilidad } from "@/lib/services/finanzas";
import { cn } from "@/lib/utils";

const VENTAS = "#b45309";
const GASTOS = "#2a78d6";
const TINTA_MUTED = "#6b5d4e";
const CUADRICULA = "#ece3d4";
const BASE = "#d8cab6";
const ALTO = 250;
const MARGEN = { arriba: 20, derecha: 76, abajo: 30, izquierda: 56 };

type Punto = DiaContabilidad & { etiqueta: string };
type Granularidad = "día" | "semana" | "mes";

function techoBonito(valor: number): number {
  if (valor <= 0) return 1000;
  const magnitud = Math.pow(10, Math.floor(Math.log10(valor)));
  const normalizado = valor / magnitud;
  const factor =
    normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  return factor * magnitud;
}

function agruparDatos(datos: DiaContabilidad[]): {
  puntos: Punto[];
  granularidad: Granularidad;
} {
  if (datos.length === 0) {
    return { puntos: [], granularidad: "día" };
  }

  const granularidad: Granularidad =
    datos.length > 180 ? "mes" : datos.length > 45 ? "semana" : "día";

  if (granularidad === "día") {
    return {
      granularidad,
      puntos: datos.map((d) => ({
        ...d,
        etiqueta: formatFechaCorta(parseFechaLocal(d.fecha)),
      })),
    };
  }

  const mapa = new Map<string, Punto>();

  for (const dia of datos) {
    const fecha = parseFechaLocal(dia.fecha);
    let clave: string;
    let etiqueta: string;

    if (granularidad === "mes") {
      clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-01`;
      etiqueta = fecha.toLocaleDateString("es-CO", {
        month: "short",
        year: "2-digit",
      });
    } else {
      const diaSemana = fecha.getDay();
      const offset = diaSemana === 0 ? 6 : diaSemana - 1;
      const lunes = new Date(fecha);
      lunes.setDate(lunes.getDate() - offset);
      clave = fechaISOLocal(lunes);
      etiqueta = formatFechaCorta(lunes);
    }

    const actual = mapa.get(clave) ?? {
      fecha: clave,
      ventas: 0,
      gastos: 0,
      utilidad: 0,
      etiqueta,
    };
    actual.ventas += dia.ventas;
    actual.gastos += dia.gastos;
    actual.utilidad += dia.utilidad;
    mapa.set(clave, actual);
  }

  return { granularidad, puntos: Array.from(mapa.values()) };
}

function Leyenda({ compacta = false }: { compacta?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 text-xs text-muted-foreground",
        compacta && "text-[11px]"
      )}
    >
      <span className="flex items-center gap-1.5">
        <span
          className="h-[2px] w-4 rounded-full"
          style={{ backgroundColor: VENTAS }}
        />
        Ventas
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-[2px] w-4 rounded-full"
          style={{ backgroundColor: GASTOS }}
        />
        Gastos
      </span>
    </div>
  );
}

export function VentasGastosChart({
  datos,
  titulo = "Ventas y gastos",
}: {
  datos: DiaContabilidad[];
  titulo?: string;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  const [indice, setIndice] = useState<number | null>(null);

  const { puntos, granularidad } = useMemo(() => agruparDatos(datos), [datos]);

  useEffect(() => {
    const elemento = contenedorRef.current;
    if (!elemento) return;
    const observador = new ResizeObserver((entradas) => {
      setAncho(Math.floor(entradas[0].contentRect.width));
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const hayDatos = puntos.some((p) => p.ventas > 0 || p.gastos > 0);

  if (puntos.length === 0) return null;

  if (!hayDatos) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center text-sm text-muted-foreground">
        Aún no hay ventas ni gastos en este período.
      </div>
    );
  }

  const anchoUtil = Math.max(ancho - MARGEN.izquierda - MARGEN.derecha, 10);
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const maxValor = techoBonito(
    Math.max(...puntos.map((p) => Math.max(p.ventas, p.gastos)))
  );
  const x = (i: number) =>
    MARGEN.izquierda +
    (puntos.length === 1 ? anchoUtil / 2 : (i / (puntos.length - 1)) * anchoUtil);
  const y = (valor: number) =>
    MARGEN.arriba + altoUtil - (valor / maxValor) * altoUtil;

  const camino = (clave: "ventas" | "gastos") =>
    puntos
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[clave]).toFixed(1)}`
      )
      .join(" ");

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxValor);
  const pasoEtiqueta = Math.max(1, Math.ceil(puntos.length / 6));
  const indicesEtiqueta = puntos
    .map((_, i) => i)
    .filter(
      (i) => i % pasoEtiqueta === 0 || i === puntos.length - 1
    );

  const ultimo = puntos.length - 1;
  const ultimoPunto = puntos[ultimo];
  const yVentas = y(ultimoPunto.ventas);
  const yGastos = y(ultimoPunto.gastos);
  const etiquetasFinalesVisibles = Math.abs(yVentas - yGastos) >= 16;

  const indiceActivo =
    indice !== null && indice < puntos.length ? indice : null;
  const activo = indiceActivo !== null ? puntos[indiceActivo] : null;
  const tooltipIzquierda =
    indiceActivo !== null
      ? Math.min(Math.max(x(indiceActivo), 92), Math.max(ancho - 92, 92))
      : 0;

  function moverIndice(evento: React.PointerEvent<SVGRectElement>) {
    const rect = evento.currentTarget.getBoundingClientRect();
    const relativo = evento.clientX - rect.left;
    const idx = Math.round(
      (relativo / Math.max(rect.width, 1)) * (puntos.length - 1)
    );
    setIndice(Math.max(0, Math.min(puntos.length - 1, idx)));
  }

  function manejarTeclas(evento: React.KeyboardEvent<SVGSVGElement>) {
    if (indice === null && (evento.key === "ArrowLeft" || evento.key === "ArrowRight")) {
      evento.preventDefault();
      setIndice(0);
      return;
    }

    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      setIndice((actual) => Math.min(puntos.length - 1, (actual ?? 0) + 1));
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      setIndice((actual) => Math.max(0, (actual ?? 0) - 1));
    } else if (evento.key === "Escape") {
      setIndice(null);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {granularidad !== "día" && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Agrupado por {granularidad}
            </span>
          )}
        </div>
        <Leyenda />
      </div>

      <div
        ref={contenedorRef}
        className="relative w-full"
        style={{ height: ALTO }}
      >
        {ancho > 0 && (
          <>
            <svg
              width={ancho}
              height={ALTO}
              role="img"
              tabIndex={0}
              aria-label={`${titulo}. Gráfico de líneas del ${formatFecha(
                parseFechaLocal(puntos[0].fecha).toISOString()
              )} al ${formatFecha(
                parseFechaLocal(puntos[ultimo].fecha).toISOString()
              )}. Usa las flechas izquierda y derecha para explorar. Los datos completos están en la tabla.`}
              onKeyDown={manejarTeclas}
              onBlur={() => setIndice(null)}
              className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ticks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={MARGEN.izquierda}
                    x2={ancho - MARGEN.derecha + 10}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={CUADRICULA}
                    strokeWidth={1}
                  />
                  <text
                    x={MARGEN.izquierda - 10}
                    y={y(tick) + 4}
                    textAnchor="end"
                    fontSize={10.5}
                    fill={TINTA_MUTED}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCOPCompacto(tick)}
                  </text>
                </g>
              ))}

              <line
                x1={MARGEN.izquierda}
                x2={ancho - MARGEN.derecha + 10}
                y1={y(0)}
                y2={y(0)}
                stroke={BASE}
                strokeWidth={1}
              />

              {indicesEtiqueta.map((i) => (
                <text
                  key={`${puntos[i].fecha}-${i}`}
                  x={x(i)}
                  y={ALTO - 8}
                  textAnchor={
                    i === 0
                      ? "start"
                      : i === ultimo
                        ? "end"
                        : "middle"
                  }
                  fontSize={10.5}
                  fill={TINTA_MUTED}
                >
                  {puntos[i].etiqueta}
                </text>
              ))}

              <path
                d={camino("ventas")}
                fill="none"
                stroke={VENTAS}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d={camino("gastos")}
                fill="none"
                stroke={GASTOS}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {indiceActivo !== null && (
                <line
                  x1={x(indiceActivo)}
                  x2={x(indiceActivo)}
                  y1={MARGEN.arriba}
                  y2={ALTO - MARGEN.abajo}
                  stroke={BASE}
                  strokeWidth={1}
                />
              )}

              <circle
                cx={x(ultimo)}
                cy={yVentas}
                r={4}
                fill={VENTAS}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <circle
                cx={x(ultimo)}
                cy={yGastos}
                r={4}
                fill={GASTOS}
                stroke="#ffffff"
                strokeWidth={2}
              />

              {indiceActivo !== null && activo && (
                <>
                  <circle
                    cx={x(indiceActivo)}
                    cy={y(activo.ventas)}
                    r={4.5}
                    fill={VENTAS}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <circle
                    cx={x(indiceActivo)}
                    cy={y(activo.gastos)}
                    r={4.5}
                    fill={GASTOS}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                </>
              )}

              {etiquetasFinalesVisibles && (
                <>
                  <rect
                    x={ancho - MARGEN.derecha + 14}
                    y={yVentas - 1}
                    width={8}
                    height={2}
                    rx={1}
                    fill={VENTAS}
                  />
                  <text
                    x={ancho - MARGEN.derecha + 26}
                    y={yVentas + 4}
                    fontSize={10.5}
                    fontWeight={600}
                    fill={TINTA_MUTED}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCOPCompacto(ultimoPunto.ventas)}
                  </text>
                  <rect
                    x={ancho - MARGEN.derecha + 14}
                    y={yGastos - 1}
                    width={8}
                    height={2}
                    rx={1}
                    fill={GASTOS}
                  />
                  <text
                    x={ancho - MARGEN.derecha + 26}
                    y={yGastos + 4}
                    fontSize={10.5}
                    fontWeight={600}
                    fill={TINTA_MUTED}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCOPCompacto(ultimoPunto.gastos)}
                  </text>
                </>
              )}

              <rect
                x={MARGEN.izquierda}
                y={MARGEN.arriba}
                width={anchoUtil}
                height={altoUtil}
                fill="transparent"
                onPointerMove={moverIndice}
                onPointerDown={moverIndice}
                onPointerLeave={() => setIndice(null)}
              />
            </svg>

            {activo && (
              <div
                className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-xl border bg-card p-2.5 text-xs shadow-lg"
                style={{ left: tooltipIzquierda }}
                role="status"
              >
                <p className="font-semibold text-foreground">
                  {granularidad === "día"
                    ? formatFecha(activo.fecha)
                    : granularidad === "semana"
                      ? `Semana del ${formatFecha(activo.fecha)}`
                      : parseFechaLocal(activo.fecha).toLocaleDateString(
                          "es-CO",
                          { month: "long", year: "numeric" }
                        )}
                </p>
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className="h-[2px] w-3 rounded-full"
                        style={{ backgroundColor: VENTAS }}
                      />
                      Ventas
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatCOP(activo.ventas)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className="h-[2px] w-3 rounded-full"
                        style={{ backgroundColor: GASTOS }}
                      />
                      Gastos
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatCOP(activo.gastos)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t pt-1">
                    <span className="text-muted-foreground">Utilidad</span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        activo.utilidad >= 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {formatCOP(activo.utilidad)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <details className="mt-3">
        <summary className="w-fit cursor-pointer text-xs font-medium text-muted-foreground transition hover:text-foreground">
          Ver tabla de datos
        </summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/95 backdrop-blur">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">
                  {granularidad === "mes"
                    ? "Mes"
                    : granularidad === "semana"
                      ? "Semana"
                      : "Día"}
                </th>
                <th className="px-3 py-2 text-right font-semibold">Ventas</th>
                <th className="px-3 py-2 text-right font-semibold">Gastos</th>
                <th className="px-3 py-2 text-right font-semibold">Utilidad</th>
              </tr>
            </thead>
            <tbody>
              {puntos.map((p) => (
                <tr key={p.fecha} className="border-t">
                  <td className="px-3 py-1.5">{p.etiqueta}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatCOP(p.ventas)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatCOP(p.gastos)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatCOP(p.utilidad)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
