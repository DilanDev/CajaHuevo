export type MetodoPago =
  | "Efectivo"
  | "Nequi"
  | "Daviplata"
  | "Transferencia"
  | "Otro";

export const METODOS_PAGO: MetodoPago[] = [
  "Efectivo",
  "Nequi",
  "Daviplata",
  "Transferencia",
  "Otro",
];

export const CATEGORIAS_GASTO = [
  "Compra de mercancía",
  "Transporte",
  "Servicios",
  "Arriendo",
  "Empaques",
  "Mantenimiento",
  "Otros",
] as const;

export const CATEGORIAS_PRODUCTO = [
  "Cartón de huevos",
  "Cubeta",
  "Unidad",
  "Otro",
] as const;

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type VentaItem = {
  id: string;
  venta_id: string;
  producto_id: string | null;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  subtotal: number;
};

export type Venta = {
  id: string;
  numero: number;
  fecha: string;
  cliente: string | null;
  metodo_pago: MetodoPago;
  subtotal: number;
  descuento: number;
  total: number;
  costo_total: number;
  notas: string | null;
  created_at: string;
};

export type VentaConItems = Venta & {
  venta_items: VentaItem[];
};

export type Gasto = {
  id: string;
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
  metodo_pago: MetodoPago;
  created_at: string;
};

export type CajaMovimiento = {
  id: string;
  fecha: string;
  tipo: "ingreso" | "egreso";
  concepto: string;
  monto: number;
  created_at: string;
};

export type ItemCarrito = {
  producto: Producto;
  cantidad: number;
};

export type ResumenFinanciero = {
  ingresos: number;
  costoVentas: number;
  utilidadBruta: number;
  gastos: number;
  utilidadNeta: number;
  margen: number;
  numeroVentas: number;
  ticketPromedio: number;
  unidadesVendidas: number;
};
