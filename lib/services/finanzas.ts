import type {
  Gasto,
  MetodoPago,
  ResumenFinanciero,
  Venta,
  VentaItem,
} from "@/types";
import { fechaISOLocal } from "@/lib/format";
import type { Rango } from "@/lib/periodos";
import { listarGastos } from "@/lib/services/gastos";
import { listarVentasSinDetalle } from "@/lib/services/ventas";
import { verificarConfiguracion } from "@/lib/services/util";
import { supabase } from "@/lib/supabase/client";
import { traerTodo } from "@/lib/services/util";

export type DiaContabilidad = {
  fecha: string;
  ventas: number;
  gastos: number;
  utilidad: number;
};

export type MetodoResumen = {
  metodo: MetodoPago;
  total: number;
  cantidad: number;
};

export type CategoriaGastoResumen = {
  categoria: string;
  total: number;
  cantidad: number;
};

export type ProductoResumen = {
  nombre: string;
  cantidad: number;
  ingresos: number;
  utilidad: number;
};

export type DatosContabilidad = {
  resumen: ResumenFinanciero;
  serie: DiaContabilidad[];
  porMetodo: MetodoResumen[];
  porCategoriaGasto: CategoriaGastoResumen[];
  topProductos: ProductoResumen[];
};

type VentaConItemsLigero = Venta & {
  venta_items: Pick<
    VentaItem,
    | "producto_nombre"
    | "cantidad"
    | "subtotal"
    | "precio_unitario"
    | "costo_unitario"
  >[];
};

export function calcularResumen(
  ventas: Pick<Venta, "total" | "costo_total" | "numero">[],
  gastos: Pick<Gasto, "monto">[]
): ResumenFinanciero {
  const ingresos = ventas.reduce((total, venta) => total + Number(venta.total || 0), 0);
  const costoVentas = ventas.reduce(
    (total, venta) => total + Number(venta.costo_total || 0),
    0
  );
  const totalGastos = gastos.reduce(
    (total, gasto) => total + Number(gasto.monto || 0),
    0
  );
  const utilidadBruta = ingresos - costoVentas;
  const utilidadNeta = utilidadBruta - totalGastos;

  return {
    ingresos,
    costoVentas,
    utilidadBruta,
    gastos: totalGastos,
    utilidadNeta,
    margen: ingresos > 0 ? utilidadNeta / ingresos : 0,
    numeroVentas: ventas.length,
    ticketPromedio: ventas.length > 0 ? ingresos / ventas.length : 0,
    unidadesVendidas: 0,
  };
}

export async function obtenerResumenFinanciero(
  rango: Rango
): Promise<ResumenFinanciero> {
  const [ventas, gastos] = await Promise.all([
    listarVentasSinDetalle(rango),
    listarGastos(rango),
  ]);

  return calcularResumen(ventas, gastos);
}

export async function obtenerSerieDiaria(
  rango: Rango
): Promise<DiaContabilidad[]> {
  const [ventas, gastos] = await Promise.all([
    listarVentasSinDetalle(rango),
    listarGastos(rango),
  ]);

  return construirSerieDiaria(rango, ventas, gastos);
}

export function construirSerieDiaria(
  rango: Rango,
  ventas: Pick<Venta, "fecha" | "total" | "costo_total">[],
  gastos: Pick<Gasto, "fecha" | "monto">[]
): DiaContabilidad[] {
  const ventasPorDia = new Map<string, { total: number; costo: number }>();
  const gastosPorDia = new Map<string, number>();

  for (const venta of ventas) {
    const clave = fechaISOLocal(new Date(venta.fecha));
    const actual = ventasPorDia.get(clave) ?? { total: 0, costo: 0 };
    actual.total += Number(venta.total || 0);
    actual.costo += Number(venta.costo_total || 0);
    ventasPorDia.set(clave, actual);
  }

  for (const gasto of gastos) {
    const clave = gasto.fecha.slice(0, 10);
    gastosPorDia.set(clave, (gastosPorDia.get(clave) ?? 0) + Number(gasto.monto || 0));
  }

  const serie: DiaContabilidad[] = [];
  const cursor = new Date(rango.desde);
  cursor.setHours(12, 0, 0, 0);
  const fin = new Date(rango.hasta);
  fin.setHours(12, 0, 0, 0);

  while (cursor <= fin) {
    const clave = fechaISOLocal(cursor);
    const venta = ventasPorDia.get(clave) ?? { total: 0, costo: 0 };
    const gasto = gastosPorDia.get(clave) ?? 0;

    serie.push({
      fecha: clave,
      ventas: venta.total,
      gastos: gasto,
      utilidad: venta.total - venta.costo - gasto,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return serie;
}

export function agruparPorMetodo(
  ventas: Pick<Venta, "metodo_pago" | "total">[]
): MetodoResumen[] {
  const mapa = new Map<MetodoPago, MetodoResumen>();

  for (const venta of ventas) {
    const actual = mapa.get(venta.metodo_pago) ?? {
      metodo: venta.metodo_pago,
      total: 0,
      cantidad: 0,
    };
    actual.total += Number(venta.total || 0);
    actual.cantidad += 1;
    mapa.set(venta.metodo_pago, actual);
  }

  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}

export function agruparGastosPorCategoria(
  gastos: Pick<Gasto, "categoria" | "monto">[]
): CategoriaGastoResumen[] {
  const mapa = new Map<string, CategoriaGastoResumen>();

  for (const gasto of gastos) {
    const categoria = gasto.categoria || "Otros";
    const actual = mapa.get(categoria) ?? {
      categoria,
      total: 0,
      cantidad: 0,
    };
    actual.total += Number(gasto.monto || 0);
    actual.cantidad += 1;
    mapa.set(categoria, actual);
  }

  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}

export function agruparProductos(
  ventas: VentaConItemsLigero[]
): ProductoResumen[] {
  const mapa = new Map<string, ProductoResumen>();

  for (const venta of ventas) {
    for (const item of venta.venta_items ?? []) {
      const clave = item.producto_nombre.trim().toLowerCase();
      const actual = mapa.get(clave) ?? {
        nombre: item.producto_nombre,
        cantidad: 0,
        ingresos: 0,
        utilidad: 0,
      };
      const cantidad = Number(item.cantidad || 0);
      const ingresos = Number(item.subtotal || 0);
      const costo = Number(item.costo_unitario || 0) * cantidad;

      actual.cantidad += cantidad;
      actual.ingresos += ingresos;
      actual.utilidad += ingresos - costo;
      mapa.set(clave, actual);
    }
  }

  return Array.from(mapa.values()).sort((a, b) => b.ingresos - a.ingresos);
}

export async function obtenerDatosContabilidad(
  rango: Rango
): Promise<DatosContabilidad> {
  verificarConfiguracion();

  const desdeISO = rango.desde.toISOString();
  const hastaISO = rango.hasta.toISOString();

  const [ventas, gastos] = await Promise.all([
    traerTodo<VentaConItemsLigero>(() =>
      supabase
        .from("ventas")
        .select(
          "id, numero, fecha, cliente, metodo_pago, subtotal, descuento, total, costo_total, notas, created_at, venta_items(producto_nombre, cantidad, subtotal, precio_unitario, costo_unitario)"
        )
        .gte("fecha", desdeISO)
        .lte("fecha", hastaISO)
        .order("fecha", { ascending: false })
    ),
    listarGastos(rango),
  ]);

  const resumen = calcularResumen(ventas, gastos);
  const topProductos = agruparProductos(ventas);
  resumen.unidadesVendidas = topProductos.reduce(
    (total, producto) => total + producto.cantidad,
    0
  );

  return {
    resumen,
    serie: construirSerieDiaria(rango, ventas, gastos),
    porMetodo: agruparPorMetodo(ventas),
    porCategoriaGasto: agruparGastosPorCategoria(gastos),
    topProductos,
  };
}
