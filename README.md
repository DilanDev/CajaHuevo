# CajaHuevo

Aplicación web para llevar la contabilidad de una tienda que vende cartones de
huevos: productos e inventario, ventas, gastos, caja menor y reporte contable.

Hecha con **Next.js 16**, **TypeScript**, **Tailwind CSS 4** y **Supabase**
(PostgreSQL + Auth). Lista para desplegar en **Vercel**.

## Qué incluye

- **Panel de inicio**: ventas del día, ingresos, gastos y ganancia neta del mes,
  serie de los últimos 14 días, stock bajo, últimas ventas y saldo de caja.
- **Productos**: crear y editar productos, precios de compra/venta, stock,
  stock mínimo, activar/desactivar y ajustes de inventario (entrada/salida).
- **Ventas**: punto de venta con carrito, método de pago, cliente, descuento y
  notas. Cada venta guarda el precio y el costo del momento, descuenta stock y
  se puede anular restaurando las unidades.
- **Gastos**: registro por categoría y método de pago, filtros por período,
  edición y eliminación.
- **Caja menor**: fondo independiente con ingresos y egresos, saldo calculado e
  historial de movimientos.
- **Contabilidad**: estado de resultados (ingresos, costo de mercancía,
  utilidad bruta, gastos y ganancia neta), gráfica de ventas vs. gastos,
  desglose por método de pago y categoría de gasto, productos más vendidos y
  exportación a CSV.
- **Acceso**: inicio de sesión con Supabase Auth. No hay registro público; el
  administrador se crea desde el panel de Supabase.

## Cómo se calcula la contabilidad

| Concepto | Origen |
| --- | --- |
| Ingresos por ventas | `ventas.total` (subtotal − descuento) |
| Costo de mercancía vendida | `ventas.costo_total` (costo del producto al momento de la venta) |
| Utilidad bruta | Ingresos − costo de mercancía |
| Gastos operativos | Tabla `gastos` del período |
| Ganancia neta | Utilidad bruta − gastos operativos |
| Margen neto | Ganancia neta ÷ ingresos |

Todos los reportes se calculan a partir de las ventas y gastos registrados, no
de saldos duplicados. La **caja menor** es un fondo aparte y no se suma al
estado de resultados.

## Requisitos

- Node.js 20 o superior
- Una cuenta y un proyecto en [Supabase](https://supabase.com)
- Una cuenta en [Vercel](https://vercel.com) para publicar

## 1. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Abre **SQL Editor → New query**.
3. Copia y ejecuta completo el archivo
   [`supabase/schema.sql`](supabase/schema.sql).

El script crea las tablas `productos`, `ventas`, `venta_items`, `gastos` y
`caja_movimientos`, las funciones `registrar_venta` y `eliminar_venta`, los
índices y las políticas de seguridad (RLS) para usuarios autenticados.

### Crear el usuario administrador

No hay pantalla de registro. Crea el acceso manualmente:

1. Ve a **Authentication → Users → Add user**.
2. Escribe el correo y la contraseña del administrador.
3. Activa **Auto Confirm User** (o confirma el correo desde el mismo panel).
4. Con esas credenciales inicia sesión en la app.

## 2. Variables de entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completa los valores desde **Supabase → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica
```

También se acepta la clave **anon public** tradicional con el nombre
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Usa siempre la clave pública; **nunca**
expongas la `service_role` en el frontend.

Sin estas variables el proyecto compila, pero la app muestra un aviso y no puede
consultar datos.

## 3. Ejecutar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Comandos disponibles:

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de producción
npm run start   # servir el build
npm run lint    # ESLint
```

## 4. Desplegar en Vercel

1. Sube el proyecto a un repositorio de GitHub/GitLab o usa la CLI de Vercel.
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio.
3. Framework preset: **Next.js** (se detecta automáticamente).
4. En **Environment Variables** agrega, para Production, Preview y Development:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Pulsa **Deploy**. Después de cambiar variables de entorno, vuelve a
   desplegar para que tomen efecto.

Con la CLI:

```bash
npx vercel
npx vercel --prod
```

## Seguridad

- RLS está activo en todas las tablas: solo usuarios autenticados pueden leer o
  escribir.
- Las funciones de venta se ejecutan con los permisos del usuario que las llama
  (`security invoker`), validan stock y toman los precios desde la base de datos.
- La clave `service_role` no se usa en el cliente.

## Estructura del proyecto

```
app/
  (app)/            páginas protegidas: dashboard, ventas, productos, gastos, caja, contabilidad
  login/            inicio de sesión
components/         UI, gráficos, navegación y diálogos
lib/
  services/         consultas y escrituras a Supabase
  hooks/            hook de consultas con recarga
  auth.tsx          contexto de autenticación
  format.ts         moneda COP, fechas y porcentajes
  periodos.ts       rangos de fechas (hoy, semana, mes, personalizado)
supabase/schema.sql esquema completo de la base de datos
types/              tipos compartidos
```

## Solución de problemas

- **“La base de datos no tiene las tablas”**: ejecuta `supabase/schema.sql` en
  el SQL Editor del proyecto correcto.
- **“Faltan las funciones de la base de datos”**: vuelve a ejecutar el script
  completo para crear `registrar_venta` y `eliminar_venta`.
- **Correo o contraseña incorrectos**: verifica el usuario en
  Authentication → Users y que esté confirmado.
- **No se pudo conectar con Supabase**: revisa la URL y la clave pública en
  `.env.local` (o en las variables de Vercel) y vuelve a iniciar el servidor.
- **El stock no cuadra tras una venta**: las ventas se descuentan de forma
  atómica en la base de datos; si anulas una venta, el stock se restaura
  automáticamente.
