-- =====================================================================
-- Mi Cartelera Personal: tabla "mi_lista" + seguridad por usuario (RLS)
-- Ejecutar completo en Supabase > SQL Editor > New query > Run
-- =====================================================================

create table if not exists public.mi_lista (
  id                    bigint generated always as identity primary key,
  -- Dueño del registro. Por defecto se llena con el usuario que hace la petición.
  user_id               uuid not null default auth.uid()
                        references auth.users (id) on delete cascade,
  tmdb_id               integer not null,
  titulo                text not null,
  poster_url            text,
  tipo_contenido        text not null
                        check (tipo_contenido in ('pelicula', 'serie')),
  estado                text not null default 'por_ver'
                        check (estado in ('por_ver', 'viendo', 'vista')),
  calificacion_personal integer
                        check (calificacion_personal between 1 and 5),
  comentario            text,
  fecha_agregado        timestamptz not null default now(),
  -- Un mismo usuario no puede guardar dos veces el mismo título.
  unique (user_id, tmdb_id, tipo_contenido)
);

create index if not exists mi_lista_user_id_idx on public.mi_lista (user_id);

-- Activar Row Level Security: sin políticas, nadie puede leer ni escribir.
alter table public.mi_lista enable row level security;

-- Permisos base para usuarios autenticados (las políticas filtran qué filas).
grant select, insert, update, delete on public.mi_lista to authenticated;

-- READ: cada usuario solo ve sus propios títulos.
create policy "Usuarios ven solo su lista"
  on public.mi_lista for select
  to authenticated
  using (auth.uid() = user_id);

-- CREATE: solo puede insertar filas a su propio nombre.
create policy "Usuarios agregan a su propia lista"
  on public.mi_lista for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE: solo puede editar sus filas, y no puede "regalarlas" a otro usuario.
create policy "Usuarios editan solo su lista"
  on public.mi_lista for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: solo puede borrar sus propias filas.
create policy "Usuarios eliminan solo de su lista"
  on public.mi_lista for delete
  to authenticated
  using (auth.uid() = user_id);
