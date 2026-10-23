-- =====================================================
-- CajaHuevo · Base de datos para Supabase (PostgreSQL)
-- Ejecutar completo en Supabase → SQL Editor → New query
-- =====================================================

-- -----------------------------------------------------
-- 1. Utilidades
-- -----------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------
-- 2. Productos
-- -----------------------------------------------------
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  categoria text not null default 'Cartón de huevos',
  precio_compra numeric(12, 2) not null default 0 check (precio_compra >= 0),
  precio_venta numeric(12, 2) not null default 0 check (precio_venta >= 0),
  stock integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 5 check (stock_minimo >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_productos_updated_at on public.productos;
create trigger trg_productos_updated_at
  before update on public.productos
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------
-- 3. Ventas
-- -----------------------------------------------------
create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  fecha timestamptz not null default now(),
  cliente text,
  metodo_pago text not null default 'Efectivo'
    check (metodo_pago in ('Efectivo', 'Nequi', 'Daviplata', 'Transferencia', 'Otro')),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  descuento numeric(12, 2) not null default 0 check (descuento >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  costo_total numeric(12, 2) not null default 0 check (costo_total >= 0),
  notas text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  producto_nombre text not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null default 0 check (precio_unitario >= 0),
  costo_unitario numeric(12, 2) not null default 0 check (costo_unitario >= 0),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0)
);

create index if not exists idx_ventas_fecha on public.ventas(fecha desc);
create index if not exists idx_venta_items_venta on public.venta_items(venta_id);
create index if not exists idx_venta_items_producto on public.venta_items(producto_id);

-- -----------------------------------------------------
-- 4. Gastos
-- -----------------------------------------------------
create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  categoria text not null default 'Otros',
  descripcion text not null,
  monto numeric(12, 2) not null check (monto > 0),
  metodo_pago text not null default 'Efectivo'
    check (metodo_pago in ('Efectivo', 'Nequi', 'Daviplata', 'Transferencia', 'Otro')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_gastos_fecha on public.gastos(fecha desc);

-- -----------------------------------------------------
-- 5. Caja menor (fondo de efectivo independiente)
-- -----------------------------------------------------
create table if not exists public.caja_movimientos (
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz not null default now(),
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  concepto text not null,
  monto numeric(12, 2) not null check (monto > 0),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_caja_fecha on public.caja_movimientos(fecha desc);

-- -----------------------------------------------------
-- 6. Función: registrar una venta de forma atómica
--    Valida stock, toma precios desde la base de datos
--    y descuenta el inventario en una sola transacción.
-- -----------------------------------------------------
create or replace function public.registrar_venta(
  p_items jsonb,
  p_cliente text default null,
  p_metodo_pago text default 'Efectivo',
  p_descuento numeric default 0,
  p_notas text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_venta_id uuid;
  v_subtotal numeric(12, 2) := 0;
  v_costo_total numeric(12, 2) := 0;
  v_descuento numeric(12, 2);
  v_total numeric(12, 2);
  v_item jsonb;
  v_producto record;
  v_cantidad integer;
  v_subtotal_item numeric(12, 2);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe tener al menos un producto';
  end if;

  if p_metodo_pago not in ('Efectivo', 'Nequi', 'Daviplata', 'Transferencia', 'Otro') then
    raise exception 'Método de pago no válido';
  end if;

  insert into public.ventas (cliente, metodo_pago, notas)
  values (nullif(trim(p_cliente), ''), p_metodo_pago, nullif(trim(p_notas), ''))
  returning id into v_venta_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_cantidad := coalesce((v_item ->> 'cantidad')::integer, 0);
    if v_cantidad <= 0 then
      raise exception 'La cantidad debe ser mayor que cero';
    end if;

    select * into v_producto
    from public.productos
    where id = (v_item ->> 'producto_id')::uuid
      and activo = true
    for update;

    if not found then
      raise exception 'Producto no encontrado o inactivo';
    end if;

    if v_producto.stock < v_cantidad then
      raise exception 'Stock insuficiente de "%". Disponible: %', v_producto.nombre, v_producto.stock;
    end if;

    v_subtotal_item := v_producto.precio_venta * v_cantidad;

    insert into public.venta_items (
      venta_id, producto_id, producto_nombre, cantidad,
      precio_unitario, costo_unitario, subtotal
    )
    values (
      v_venta_id, v_producto.id, v_producto.nombre, v_cantidad,
      v_producto.precio_venta, v_producto.precio_compra, v_subtotal_item
    );

    update public.productos
    set stock = stock - v_cantidad, updated_at = now()
    where id = v_producto.id;

    v_subtotal := v_subtotal + v_subtotal_item;
    v_costo_total := v_costo_total + (v_producto.precio_compra * v_cantidad);
  end loop;

  v_descuento := least(greatest(coalesce(p_descuento, 0), 0), v_subtotal);
  v_total := v_subtotal - v_descuento;

  update public.ventas
  set subtotal = v_subtotal,
      descuento = v_descuento,
      total = v_total,
      costo_total = v_costo_total
  where id = v_venta_id;

  return jsonb_build_object(
    'id', v_venta_id,
    'subtotal', v_subtotal,
    'descuento', v_descuento,
    'total', v_total,
    'costo_total', v_costo_total
  );
end;
$$;

-- -----------------------------------------------------
-- 7. Función: eliminar una venta y devolver el inventario
-- -----------------------------------------------------
create or replace function public.eliminar_venta(p_venta_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item record;
begin
  if not exists (select 1 from public.ventas where id = p_venta_id) then
    raise exception 'La venta no existe';
  end if;

  for v_item in
    select producto_id, cantidad
    from public.venta_items
    where venta_id = p_venta_id and producto_id is not null
  loop
    update public.productos
    set stock = stock + v_item.cantidad, updated_at = now()
    where id = v_item.producto_id;
  end loop;

  delete from public.ventas where id = p_venta_id;
end;
$$;

revoke all on function public.registrar_venta(jsonb, text, text, numeric, text) from public, anon;
revoke all on function public.eliminar_venta(uuid) from public, anon;
grant execute on function public.registrar_venta(jsonb, text, text, numeric, text) to authenticated;
grant execute on function public.eliminar_venta(uuid) to authenticated;

-- -----------------------------------------------------
-- 8. Seguridad: RLS (solo usuarios autenticados)
-- -----------------------------------------------------
alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_items enable row level security;
alter table public.gastos enable row level security;
alter table public.caja_movimientos enable row level security;

drop policy if exists "Autenticados: productos" on public.productos;
create policy "Autenticados: productos"
  on public.productos for all to authenticated using (true) with check (true);

drop policy if exists "Autenticados: ventas" on public.ventas;
create policy "Autenticados: ventas"
  on public.ventas for all to authenticated using (true) with check (true);

drop policy if exists "Autenticados: venta_items" on public.venta_items;
create policy "Autenticados: venta_items"
  on public.venta_items for all to authenticated using (true) with check (true);

drop policy if exists "Autenticados: gastos" on public.gastos;
create policy "Autenticados: gastos"
  on public.gastos for all to authenticated using (true) with check (true);

drop policy if exists "Autenticados: caja_movimientos" on public.caja_movimientos;
create policy "Autenticados: caja_movimientos"
  on public.caja_movimientos for all to authenticated using (true) with check (true);
