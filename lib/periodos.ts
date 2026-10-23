import {
  fechaISOLocal,
  finDelDia,
  inicioDelDia,
  mismoDia,
  sumarDias,
} from "@/lib/format";

export type ClavePeriodo =
  | "hoy"
  | "ayer"
  | "semana"
  | "mes"
  | "mes_anterior"
  | "personalizado";

export type Rango = {
  desde: Date;
  hasta: Date;
};

export type Periodo = Rango & {
  clave: ClavePeriodo;
  etiqueta: string;
};

export function inicioDeSemana(fecha = new Date()): Date {
  const d = inicioDelDia(fecha);
  const dia = d.getDay(); // 0 = domingo
  const diferencia = dia === 0 ? 6 : dia - 1; // lunes como inicio
  return sumarDias(d, -diferencia);
}

export function inicioDeMes(fecha = new Date()): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1, 0, 0, 0, 0);
}

export function finDeMes(fecha = new Date()): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function crearPeriodo(clave: ClavePeriodo, base = new Date()): Periodo {
  const hoy = new Date();

  switch (clave) {
    case "hoy":
      return {
        clave,
        desde: inicioDelDia(base),
        hasta: finDelDia(base),
        etiqueta: mismoDia(base, hoy) ? "Hoy" : fechaISOLocal(base),
      };
    case "ayer": {
      const ayer = sumarDias(base, -1);
      return {
        clave,
        desde: inicioDelDia(ayer),
        hasta: finDelDia(ayer),
        etiqueta: "Ayer",
      };
    }
    case "semana":
      return {
        clave,
        desde: inicioDeSemana(base),
        hasta: finDelDia(base),
        etiqueta: "Esta semana",
      };
    case "mes_anterior": {
      const mesAnterior = new Date(base.getFullYear(), base.getMonth() - 1, 15);
      return {
        clave,
        desde: inicioDeMes(mesAnterior),
        hasta: finDeMes(mesAnterior),
        etiqueta: mesAnterior.toLocaleDateString("es-CO", {
          month: "long",
          year: "numeric",
        }),
      };
    }
    case "mes":
    default:
      return {
        clave: "mes",
        desde: inicioDeMes(base),
        hasta: finDelDia(base),
        etiqueta: "Este mes",
      };
  }
}

export const PERIODOS_RAPIDOS: { clave: ClavePeriodo; etiqueta: string }[] = [
  { clave: "hoy", etiqueta: "Hoy" },
  { clave: "ayer", etiqueta: "Ayer" },
  { clave: "semana", etiqueta: "Semana" },
  { clave: "mes", etiqueta: "Mes" },
  { clave: "mes_anterior", etiqueta: "Mes anterior" },
];

/** Etiqueta legible para un rango personalizado. */
export function etiquetaRango(desde: string, hasta: string): string {
  if (desde === hasta) return desde;
  return `${desde} → ${hasta}`;
}
