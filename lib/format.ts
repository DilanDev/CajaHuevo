export function formatCOP(valor: number | string | null | undefined): string {
  const num = Number(valor ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
}

/** Formato compacto para ejes de gráficos: $12 mil, $1,2 M */
export function formatCOPCompacto(valor: number | null | undefined): string {
  const num = Number(valor ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatNumero(valor: number | string | null | undefined): string {
  const num = Number(valor ?? 0);
  return new Intl.NumberFormat("es-CO").format(Number.isFinite(num) ? num : 0);
}

export function formatPorcentaje(valor: number | null | undefined): string {
  const num = Number(valor ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(num) ? num : 0);
}

export function parseFechaLocal(fechaISO: string): Date {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  if (!anio || !mes || !dia) return new Date();
  return new Date(anio, mes - 1, dia);
}

/** Fecha local en formato YYYY-MM-DD (sin desfase de zona horaria). */
export function fechaISOLocal(fecha = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function formatFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? parseFechaLocal(fecha.slice(0, 10)) : fecha;
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatFechaCorta(fecha: string | Date): string {
  const d = typeof fecha === "string" ? parseFechaLocal(fecha.slice(0, 10)) : fecha;
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

export function formatFechaHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFechaLarga(fecha: string | Date = new Date()): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const texto = d.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function inicioDelDia(fecha = new Date()): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function finDelDia(fecha = new Date()): Date {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

export function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Porcentaje de cambio entre dos valores (0 si no hay base). */
export function variacion(actual: number, anterior: number): number | null {
  if (!anterior) return actual > 0 ? 1 : null;
  return (actual - anterior) / anterior;
}

export function iniciales(texto: string): string {
  return texto
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
