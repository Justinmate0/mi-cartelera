-- =====================================================================
-- Migración 002 · Noche de película (épica E2)
-- Spec: docs/specs/E2-noche-de-pelicula.md, sección 2. Ticket NP-03.
-- Ejecutar completo en Supabase > SQL Editor > New query > Run. Se puede repetir.
-- No toca la tabla mi_lista.
-- =====================================================================

-- ============ Tablas ============
create table if not exists public.sesiones (
  id                bigint generated always as identity primary key,
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre            text check (nombre is null or char_length(nombre) between 1 and 60),
  tiempo_disponible integer not null check (tiempo_disponible between 30 and 600),
  duracion_total    integer not null check (duracion_total > 0 and duracion_total <= tiempo_disponible),
  creada_en         timestamptz not null default now()
);

create table if not exists public.sesion_peliculas (
  sesion_id  bigint not null references public.sesiones (id) on delete cascade,
  posicion   smallint not null check (posicion >= 1),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tmdb_id    integer not null,
  titulo     text not null,
  poster_url text,
  duracion   integer not null check (duracion > 0),
  primary key (sesion_id, posicion),
  unique (sesion_id, tmdb_id)
);

create index if not exists sesiones_user_id_idx on public.sesiones (user_id, creada_en desc);
create index if not exists sesion_peliculas_user_id_idx on public.sesion_peliculas (user_id);

-- ============ RLS ============
alter table public.sesiones enable row level security;
alter table public.sesion_peliculas enable row level security;

-- Nadie escribe directo en las tablas: las sesiones se crean solo con guardar_sesion.
revoke all on public.sesiones, public.sesion_peliculas from anon;
revoke insert, update on public.sesiones, public.sesion_peliculas from authenticated;
grant select, delete on public.sesiones to authenticated;
grant select on public.sesion_peliculas to authenticated;

drop policy if exists "Usuarios ven solo sus sesiones" on public.sesiones;
create policy "Usuarios ven solo sus sesiones"
  on public.sesiones for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Usuarios borran solo sus sesiones" on public.sesiones;
create policy "Usuarios borran solo sus sesiones"
  on public.sesiones for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Usuarios ven solo las peliculas de sus sesiones" on public.sesion_peliculas;
create policy "Usuarios ven solo las peliculas de sus sesiones"
  on public.sesion_peliculas for select to authenticated
  using ((select auth.uid()) = user_id);

-- ============ Guardar con validación en la base (R2.15) ============
create or replace function public.guardar_sesion(
  p_nombre text,
  p_tiempo_disponible integer,
  p_peliculas jsonb
) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario  uuid := auth.uid();
  v_nombre   text := nullif(btrim(p_nombre), '');
  v_cantidad integer;
  v_total    integer;
  v_sesion   bigint;
begin
  if v_usuario is null then
    raise exception 'Necesitas iniciar sesión para guardar.' using errcode = '42501';
  end if;
  if p_tiempo_disponible is null or p_tiempo_disponible not between 30 and 600 then
    raise exception 'El tiempo debe estar entre 30 y 600 minutos.' using errcode = '22023';
  end if;
  if v_nombre is not null and char_length(v_nombre) > 60 then
    raise exception 'El nombre puede tener máximo 60 caracteres.' using errcode = '22023';
  end if;
  if p_peliculas is null or jsonb_typeof(p_peliculas) <> 'array' or jsonb_array_length(p_peliculas) = 0 then
    raise exception 'Agrega al menos una película para guardar la sesión.' using errcode = '22023';
  end if;

  -- Validaciones sobre las películas recibidas, en el orden en que llegaron.
  if exists (
    select 1 from jsonb_array_elements(p_peliculas) as e
    where (e ->> 'tmdb_id') is null or (e ->> 'duracion') is null or (e ->> 'duracion')::integer <= 0
  ) then
    raise exception 'Una película no tiene duración conocida.' using errcode = '22023';
  end if;
  if (select count(distinct (e ->> 'tmdb_id')::integer) from jsonb_array_elements(p_peliculas) as e)
     <> jsonb_array_length(p_peliculas) then
    raise exception 'Una película no puede ir dos veces en la misma sesión.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_peliculas) as e
    where not exists (
      select 1 from public.mi_lista m
      where m.user_id = v_usuario and m.tmdb_id = (e ->> 'tmdb_id')::integer
        and m.tipo_contenido = 'pelicula' and m.estado = 'por_ver'
    )
  ) then
    raise exception 'Solo puedes usar películas «por ver» de tu lista.' using errcode = '22023';
  end if;

  select count(*), sum((e ->> 'duracion')::integer) + 10 * (count(*) - 1)
    into v_cantidad, v_total
  from jsonb_array_elements(p_peliculas) as e;
  if v_total > p_tiempo_disponible then
    raise exception 'La sesión no cabe en el tiempo disponible.' using errcode = '23514';
  end if;

  insert into public.sesiones (user_id, nombre, tiempo_disponible, duracion_total)
  values (v_usuario, v_nombre, p_tiempo_disponible, v_total)
  returning id into v_sesion;

  insert into public.sesion_peliculas (sesion_id, posicion, user_id, tmdb_id, titulo, poster_url, duracion)
  select v_sesion, e.orden, v_usuario, m.tmdb_id, m.titulo, m.poster_url, (e.valor ->> 'duracion')::integer
  from jsonb_array_elements(p_peliculas) with ordinality as e(valor, orden)
  join public.mi_lista m
    on m.user_id = v_usuario and m.tmdb_id = (e.valor ->> 'tmdb_id')::integer and m.tipo_contenido = 'pelicula';

  return v_sesion;
end;
$$;

revoke all on function public.guardar_sesion(text, integer, jsonb) from public, anon;
grant execute on function public.guardar_sesion(text, integer, jsonb) to authenticated;
