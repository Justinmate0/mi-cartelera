# // Spec E2 · Noche de película

Cómo se construye la épica E2. Fuentes: reglas R2.1 a R2.18 del PRD (`docs/prd/mi-cartelera.md`), historias y criterios de `docs/backlog/E2-noche-de-pelicula.md`, tickets de `docs/backlog/E2-tickets.md` y, para la interfaz, `DESIGN.md`.

Niveles de exigencia: **DEBE** y **NO DEBE** son obligatorios; **PUEDE** es opcional.

## // 1. Panorama

- La regla «cabe» vive en `src/dominio/nocheDePelicula.ts`, en funciones puras.
- La duración de cada película se consulta a TMDB (`/movie/{id}`, campo `runtime`) con `tmdbService`.
- Las sesiones se guardan en Supabase en dos tablas, `sesiones` y `sesion_peliculas`. Se leen y se borran con RLS, y solo se crean con la función `guardar_sesion`, que vuelve a validar la regla en la base.
- La pantalla `NocheDePelicula` reúne todo: pide el tiempo, muestra qué cabe, arma la sesión, la guarda y lista las guardadas.

Flujo: Mi lista (ya cargada en `App.tsx`) → filtro «película + por ver» → `obtenerDuraciones` → `clasificarCandidatas` → la persona agrega con `puedeAgregar` → `guardarSesion` → `guardar_sesion` en PostgreSQL → `obtenerSesiones`.

## // 2. Modelo de datos

### 2.1 Tablas

**`public.sesiones`**: una fila por sesión guardada.

| Columna             | Tipo              | Regla                                                               |
| ------------------- | ----------------- | ------------------------------------------------------------------- |
| `id`                | `bigint` identity | Clave primaria                                                      |
| `user_id`           | `uuid`            | Dueño. Por defecto `auth.uid()`. Se borra en cascada con el usuario |
| `nombre`            | `text`            | Opcional, de 1 a 60 caracteres (R2.11)                              |
| `tiempo_disponible` | `integer`         | Entre 30 y 600 (R2.1)                                               |
| `duracion_total`    | `integer`         | Mayor que 0 y menor o igual que `tiempo_disponible` (R2.4)          |
| `creada_en`         | `timestamptz`     | Por defecto `now()` (R2.11)                                         |

**`public.sesion_peliculas`**: las películas de cada sesión, con una copia de su título y duración (R2.10).

| Columna      | Tipo       | Regla                                                                          |
| ------------ | ---------- | ------------------------------------------------------------------------------ |
| `sesion_id`  | `bigint`   | Referencia a `sesiones`, se borra en cascada                                   |
| `posicion`   | `smallint` | Orden dentro de la sesión, desde 1                                             |
| `user_id`    | `uuid`     | Dueño, igual que el de la sesión. Se guarda para que RLS no necesite un `join` |
| `tmdb_id`    | `integer`  | Id de la película en TMDB                                                      |
| `titulo`     | `text`     | Copia del título al guardar                                                    |
| `poster_url` | `text`     | Copia del póster al guardar, puede ser `null`                                  |
| `duracion`   | `integer`  | Copia de la duración en minutos, mayor que 0                                   |

Clave primaria `(sesion_id, posicion)` y `unique (sesion_id, tmdb_id)`: una película va una sola vez por sesión, pero puede estar en varias sesiones (R2.7). No hay clave foránea hacia `mi_lista`: quitar una película de la lista no toca las sesiones (R2.10).

### 2.2 Migración

Archivo `supabase/migraciones/002_noche_de_pelicula.sql`. No cambia la tabla `mi_lista`.

```sql
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
```

La pausa de 10 minutos está escrita en la función porque es una regla fija del cliente (R2.3). Si cambia, se cambian a la vez `PAUSA_ENTRE_PELICULAS` y esta función, en el mismo ticket.

### 2.3 Por qué `security definer`

Como no hay política de `insert`, nadie puede escribir en las tablas directo, ni con la clave publishable desde la consola del navegador. La única puerta es `guardar_sesion`, que corre con permisos del dueño, pero toma al usuario de `auth.uid()` (no de un parámetro) y repite la validación. `search_path = ''` evita que alguien la engañe con una tabla falsa en otro esquema. La lectura y el borrado sí pasan por RLS.

**Límite conocido:** la duración la manda el cliente. La función comprueba que la sesión cabe con esas duraciones, pero no vuelve a preguntarle a TMDB. Alguien podría mandar duraciones falsas de sus propias películas; solo se engaña a sí mismo, y queda registrado en la auditoría.

## // 3. Dominio

Archivo `src/dominio/nocheDePelicula.ts`. Funciones puras: sin `fetch`, sin Supabase, sin React, sin fecha actual. Tests en `src/dominio/nocheDePelicula.test.ts`.

### 3.1 Constantes

- `TIEMPO_MINIMO = 30`, `TIEMPO_MAXIMO = 600` (R2.1)
- `PAUSA_ENTRE_PELICULAS = 10` (R2.3)
- `LARGO_MAXIMO_NOMBRE = 60` (R2.11)

### 3.2 Tipos

```ts
type DuracionConsultada =
  | { estado: "conocida"; minutos: number }
  | { estado: "desconocida" } // TMDB no tiene runtime, o es 0
  | { estado: "error" }; // la consulta falló

interface PeliculaPorVer {
  tmdbId: number;
  titulo: string;
  posterUrl: string | null;
  duracion: DuracionConsultada;
}
interface PeliculaConDuracion {
  tmdbId: number;
  titulo: string;
  posterUrl: string | null;
  duracion: number;
}
type MotivoNoDisponible = "sin-duracion" | "error-consulta";
```

### 3.3 Funciones

| Función                                                     | Qué hace                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validarTiempoDisponible(texto: string)`                    | Devuelve `{ valido: true, minutos }` o `{ valido: false, motivo }` con motivo `"vacio"`, `"no-entero"` o `"fuera-de-rango"`. Acepta espacios alrededor. «90.5», «1e3» y «abc» son `"no-entero"`; «-5», «29» y «601» son `"fuera-de-rango"`.                                                                                                                            |
| `esTiempoValido(minutos: number)`                           | `true` si es entero y está entre 30 y 600.                                                                                                                                                                                                                                                                                                                             |
| `duracionSesion(duraciones, pausa = PAUSA_ENTRE_PELICULAS)` | Suma de duraciones más `pausa × (n − 1)`. Con 0 películas, 0.                                                                                                                                                                                                                                                                                                          |
| `cabeEnTiempo(tiempoDisponible, duraciones, pausa)`         | **La regla «cabe».** Recibe el tiempo, las duraciones (`number \| null`) y la pausa. Devuelve `{ cabe: true, total, restante }` o `{ cabe: false, motivo }` con motivo `"tiempo-invalido"`, `"sin-duracion"` o `"excede"` (este último con `total` y `exceso`). Revisa en ese orden. Una duración `null`, no entera o ≤ 0 es `"sin-duracion"`. `total == tiempo` cabe. |
| `puedeAgregar(tiempo, sesion, candidata, pausa)`            | Devuelve `{ ok: true, total, restante }` o `{ ok: false, motivo }`: `"sin-duracion"`, `"repetida"` o `"no-cabe"` con `necesita`, `pausa` y `quedan`. `necesita` = duración + pausa si la sesión ya tiene películas. Coincide siempre con `cabeEnTiempo` de la sesión con la candidata.                                                                                 |
| `clasificarCandidatas(peliculas, tiempo)`                   | Devuelve `{ caben, muyLargas, noDisponibles }`. `caben`: con duración ≤ tiempo, de menor a mayor duración y con empate por título (`localeCompare` en español) (R2.8). `muyLargas`: cuántas duran más que el tiempo (R2.16). `noDisponibles`: las de duración desconocida o con error, con su motivo (R2.5, R2.17).                                                    |
| `llenarMiNoche(candidatas, tiempo, pausa)`                  | La combinación que ocupa más tiempo sin pasarse; con empate, la de menos películas; con otro empate, la primera en el orden de `clasificarCandidatas`. Devuelve las películas en ese orden, o `[]` si ninguna cabe. Se resuelve con una mochila 0/1 exacta: cada película pesa `duración + pausa` y la capacidad es `tiempo + pausa`.                                  |
| `validarNombreSesion(texto: string)`                        | `{ valido: true, nombre: string \| null }` (vacío o solo espacios da `null`) o `{ valido: false, motivo: "muy-largo" }`.                                                                                                                                                                                                                                               |
| `formatearDuracion(minutos: number)`                        | «45 min», «1 h», «1 h 36 min», «0 min».                                                                                                                                                                                                                                                                                                                                |

### 3.4 Mensajes

Los textos que ve la persona salen del dominio para que tests, spec y pantalla digan lo mismo.

| Clave                                      | Texto                                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MENSAJES_TIEMPO.vacio`                    | «Escribe cuántos minutos tienes libres.»                                                                                                                  |
| `MENSAJES_TIEMPO["no-entero"]`             | «Escribe un número entero de minutos, sin decimales.»                                                                                                     |
| `MENSAJES_TIEMPO["fuera-de-rango"]`        | «El tiempo debe estar entre 30 y 600 minutos.»                                                                                                            |
| `MENSAJES_NO_DISPONIBLE["sin-duracion"]`   | «TMDB no tiene su duración, así que no se puede agregar.»                                                                                                 |
| `MENSAJES_NO_DISPONIBLE["error-consulta"]` | «No se pudo consultar su duración en TMDB.»                                                                                                               |
| `mensajeNoAgregada(resultado)`             | «Ya está en tu sesión.» · el de «sin duración» · «No cabe: necesita 136 min (126 + 10 de pausa) y te quedan 29 min.» (sin el paréntesis si es la primera) |
| `mensajeExcede(total, tiempo)`             | «Tu sesión dura 3 h 31 min y tienes 3 h 20 min. Quita películas para que quepa.»                                                                          |
| `MENSAJE_NOMBRE_LARGO`                     | «El nombre puede tener máximo 60 caracteres.»                                                                                                             |
| `MENSAJE_SESION_VACIA`                     | «Agrega al menos una película para guardar la sesión.»                                                                                                    |

## // 4. Servicios

### 4.1 `src/services/tmdbService.ts` (se agrega, no se cambia lo existente)

- `obtenerDuraciones(tmdbIds: number[], senal?: AbortSignal): Promise<Map<number, DuracionConsultada>>`
  - Pide `/movie/{id}?language=es-ES` con el mismo `pedirTmdb` de E1.
  - `runtime` mayor que 0 → `conocida`; `null`, ausente o 0 → `desconocida`; si la petición falla → `error`.
  - Máximo 4 peticiones a la vez (R-01).
  - Si hay al menos un id y **todas** fallan, lanza el primer error, ya en español. Un `AbortError` se relanza siempre.

### 4.2 `src/services/sesionesService.ts` (nuevo)

- `obtenerSesiones(): Promise<SesionGuardada[]>`: `select` de `sesiones` con `sesion_peliculas(*)`, ordenadas por `creada_en` descendente y sus películas por `posicion`. No filtra por usuario: lo hace RLS.
- `guardarSesion(nueva: NuevaSesion): Promise<number>`: llama `rpc("guardar_sesion", { p_nombre, p_tiempo_disponible, p_peliculas: [{ tmdb_id, duracion }] })` y devuelve el id.
- `eliminarSesion(id: number): Promise<void>`: `delete().eq("id", id).select("id")`. Si vuelven 0 filas, error «No se pudo borrar: la sesión no existe o no te pertenece.»
- Traduce errores: `42501` → «No tienes permiso para hacer esto.»; `22023` y `23514` → el mensaje de la función; otros → `error.message`.

### 4.3 `src/types/sesion.ts` (nuevo)

```ts
interface PeliculaDeSesion {
  posicion: number;
  tmdbId: number;
  titulo: string;
  posterUrl: string | null;
  duracion: number;
}
interface SesionGuardada {
  id: number;
  nombre: string | null;
  tiempoDisponible: number;
  duracionTotal: number;
  creadaEn: string;
  peliculas: PeliculaDeSesion[];
}
interface NuevaSesion {
  nombre: string | null;
  tiempoDisponible: number;
  peliculas: { tmdbId: number; duracion: number }[];
}
```

## // 5. Componentes e interfaz

Todo lo visual sigue `DESIGN.md`. Esta sección cita sus componentes por nombre y no repite valores.

### 5.1 Árbol

```
App.tsx
├── BarraUsuario          ← se agrega la sección "noche"
└── NocheDePelicula       ← nueva pantalla (se monta la primera vez y luego se oculta con hidden)
    ├── FormularioTiempo
    ├── ListaCandidatas   → TarjetaCandidata × n, lista de no disponibles
    ├── PanelSesion
    └── MisSesiones       → TarjetaSesion × n
```

Hook `src/hooks/useDuraciones.ts`: recibe los ids, llama a `obtenerDuraciones`, guarda en memoria lo ya consultado y devuelve `{ estado: "cargando" | "listo" | "error", duraciones, error, reintentar }`. Solo consulta los ids nuevos.

### 5.2 Props y responsabilidades

| Componente         | Props                                                                                                                        | Hace                                                                                        | Componente de DESIGN.md                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `NocheDePelicula`  | `peliculasPorVer: ItemLista[]`, `idsEnLista: Set<number>`, `cargandoLista`, `errorLista`, `onReintentarLista`, `onIrABuscar` | Guarda el tiempo y la sesión armada. Llama a las funciones del dominio y a `guardarSesion`. | Layout de pantallas con panel lateral (§5)            |
| `FormularioTiempo` | `onConfirmar(texto)`, `error: string \| null`                                                                                | Campo «¿Cuántos minutos tienes libres?» y botón «Ver qué cabe».                             | Campo de formulario, Botón principal                  |
| `ListaCandidatas`  | `clasificacion`, `idsEnSesion`, `restante`, `onAgregar(pelicula)`, `aviso`                                                   | Grilla de las que caben, aviso de las muy largas y lista de no disponibles.                 | Tarjeta de candidata, Lista de no disponibles, Póster |
| `PanelSesion`      | `sesion`, `tiempo`, `onQuitar`, `onGuardar(nombre)`, `onLlenar`, `guardando`, `aviso`                                        | Muestra la sesión, la barra y el formulario de guardado.                                    | Panel de sesión, Barra de tiempo                      |
| `MisSesiones`      | `idsEnLista`, `recargar: number`                                                                                             | Carga, muestra y borra sesiones con `sesionesService`.                                      | Tarjeta de sesión guardada, Estados de una pantalla   |

### 5.3 Textos de la pantalla

- Título: «Noche de película». Bajo el título: «Elige qué ver según el tiempo que tienes.»
- Carga: «Consultando duraciones en TMDB…» · Lista sin películas: «No tienes películas por ver.» con botón «Ir a buscar».
- Ninguna cabe: «Ninguna de tus películas por ver cabe en {tiempo}.» · Muy largas: «{n} película(s) dura(n) más que tu tiempo.»
- Tras guardar: «Sesión guardada.» · Mis sesiones vacía: «Todavía no guardas ninguna sesión.»
- Sin nombre: «Noche del {día} de {mes}» · Película borrada de la lista: «Ya no está en tu lista».
- Llenar mi noche: «Se armó una sesión de {n} película(s) que ocupa {total}.» o «Ninguna película cabe en ese tiempo.»

### 5.4 Estilos

- Tokens nuevos en `:root` de `src/index.css`: los de la columna «suelto» de DESIGN.md §4.1. Las reglas de E1 no se cambian (DH-02 sigue abierta).
- `src/styles/noche-de-pelicula.css`, importado en `main.tsx` después de `index.css`. Solo `var(--…)`.
- La regla de DH-10 (`.btn-acento:disabled`) va en ese archivo y también arregla el botón «Buscando…» de E1.

## // 6. Criterios DEBE / NO DEBE

**Dominio**

- **S-01** `cabeEnTiempo` DEBE devolver `cabe: true` cuando suma + pausas es igual al tiempo disponible.
- **S-02** Una sesión de una película NO DEBE sumar pausas.
- **S-03** Una sesión de n películas DEBE sumar exactamente n − 1 pausas de `PAUSA_ENTRE_PELICULAS`.
- **S-04** Una duración `null`, 0, negativa o con decimales DEBE dar `"sin-duracion"`, y `puedeAgregar` NO DEBE aceptarla.
- **S-05** Un tiempo fuera de 30 a 600 o no entero DEBE dar `"tiempo-invalido"` en `cabeEnTiempo` y un motivo en `validarTiempoDisponible`.
- **S-06** `clasificarCandidatas` DEBE ordenar por duración ascendente y título, y NO DEBE incluir en `caben` una película más larga que el tiempo.
- **S-07** Las funciones de `src/dominio/` NO DEBEN importar nada de `src/services/`, `src/lib/`, React ni hacer `fetch`.
- **S-08** `llenarMiNoche` DEBE devolver una combinación que quepa, la que ocupa más, y con empate la de menos películas.

**Datos y seguridad**

- **S-09** Una cuenta NO DEBE poder leer ni borrar sesiones ni películas de sesión de otra cuenta.
- **S-10** Nadie DEBE poder insertar o actualizar `sesiones` o `sesion_peliculas` directo; solo con `guardar_sesion`.
- **S-11** `guardar_sesion` NO DEBE guardar una sesión vacía, con tiempo fuera de rango, con nombre de más de 60, con una película repetida, con una película que no está «por ver» en la lista del usuario, ni que no quepa.
- **S-12** Guardar una sesión NO DEBE cambiar el estado de ninguna fila de `mi_lista`.
- **S-13** Borrar una fila de `mi_lista` NO DEBE borrar ni cambiar sesiones.
- **S-14** Las claves DEBEN leerse solo de `import.meta.env`, y `.env` NO DEBE estar en git.

**Interfaz y arquitectura**

- **S-15** Los componentes NO DEBEN importar `supabaseClient` ni llamar a `fetch`.
- **S-16** Los componentes NO DEBEN sumar duraciones ni comparar con el tiempo: lo hacen con el dominio.
- **S-17** La pantalla NO DEBE ser accesible sin sesión.
- **S-18** El código NO DEBE usar `any`.
- **S-19** Las pantallas de E1 DEBEN funcionar igual (D-12).
- **S-20** La pantalla DEBE cumplir D-01 a D-11 de `DESIGN.md`.

## // 7. Tabla criterio → verificación

V-xx son las filas de `docs/VERIFICACION.md`.

| Criterio                               | Cómo se verifica                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| CA-2.1.1, CA-2.1.2, CA-2.1.3           | Test de `clasificarCandidatas` + navegador (V-01, V-02)                              |
| CA-2.1.4, CA-2.1.5                     | Test de `validarTiempoDisponible` + navegador (V-03, V-04)                           |
| CA-2.1.6, CA-2.1.10                    | Test de `clasificarCandidatas` + navegador (V-05)                                    |
| CA-2.1.7                               | Revisión de código del filtro en `App.tsx` + navegador (V-06)                        |
| CA-2.1.8, CA-2.1.9                     | Navegador con la red lenta o bloqueada en DevTools (V-07, V-08)                      |
| CA-2.1.11, CA-2.1.12                   | Navegador (V-09, V-10)                                                               |
| CA-2.1.13                              | Navegador sin sesión (V-11)                                                          |
| CA-2.2.1 a CA-2.2.5                    | Tests de `duracionSesion`, `cabeEnTiempo` y `puedeAgregar` + navegador (V-12 a V-16) |
| CA-2.2.6, CA-2.2.7, CA-2.2.9           | Test de `puedeAgregar` + navegador (V-17, V-18, V-19)                                |
| CA-2.2.8                               | Test de `cabeEnTiempo` (`excede`) + navegador (V-20)                                 |
| CA-2.3.1, CA-2.3.2, CA-2.3.9           | Navegador + SQL en Supabase (V-21, V-22)                                             |
| CA-2.3.3, CA-2.3.4                     | Test de `validarNombreSesion` + navegador (V-23, V-24)                               |
| CA-2.3.5                               | SQL: estado de `mi_lista` antes y después (V-25)                                     |
| CA-2.3.6, CA-2.3.7                     | Navegador con la red desconectada y doble clic (V-26, V-27)                          |
| CA-2.3.8                               | SQL como usuario autenticado llamando `guardar_sesion` con datos inválidos (V-28)    |
| CA-2.4.1, CA-2.4.2, CA-2.4.7, CA-2.4.8 | Navegador (V-29 a V-32)                                                              |
| CA-2.4.3                               | Navegador: quitar de Mi lista y volver (V-33)                                        |
| CA-2.4.4, CA-2.4.5                     | Navegador + SQL (V-34, V-35)                                                         |
| CA-2.4.6                               | Dos cuentas en el navegador + SQL con dos usuarios (V-36)                            |
| CA-2.4.9                               | Revisión de código: sin política de `update` ni función de edición (V-37)            |
| CA-2.5.1 a CA-2.5.5                    | Tests de `llenarMiNoche` + navegador (V-38, V-39)                                    |
| S-01 a S-08                            | `npm test`                                                                           |
| S-07, S-15, S-16, S-18                 | Comandos `grep` en `src/` (V-40)                                                     |
| S-09 a S-13                            | SQL en Supabase con dos usuarios (V-28, V-36, V-41)                                  |
| S-14                                   | `git ls-files` y `grep` de claves en el historial (V-42)                             |
| S-17, S-19                             | Navegador (V-11, V-43)                                                               |
| D-01, D-02, D-03                       | Comandos `grep` (V-44)                                                               |
| D-04 a D-11                            | Navegador a 1280px y 390px y con teclado (V-45 a V-48)                               |
| D-12                                   | Navegador contra `docs/capturas/` (V-43)                                             |

## // 8. Tabla ticket → archivos

| Ticket | Archivos                                                                                                                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NP-01  | `package.json`, `package-lock.json`, `vite.config.ts`                                                                                                                                              |
| NP-02  | `src/dominio/nocheDePelicula.ts`, `src/dominio/nocheDePelicula.test.ts`                                                                                                                            |
| NP-03  | `supabase/migraciones/002_noche_de_pelicula.sql`, `supabase/pruebas/rls_noche_de_pelicula.sql`                                                                                                     |
| NP-04  | `src/services/tmdbService.ts`, `src/services/tmdbService.test.ts`                                                                                                                                  |
| NP-05  | `src/services/sesionesService.ts`, `src/types/sesion.ts`                                                                                                                                           |
| NP-06  | `src/index.css` (solo `:root`), `src/styles/noche-de-pelicula.css`, `src/main.tsx`, `src/components/BarraUsuario.tsx`, `src/App.tsx`, `src/components/NocheDePelicula.tsx`                         |
| NP-07  | `src/App.tsx`, `src/hooks/useDuraciones.ts`, `src/components/NocheDePelicula.tsx`, `src/components/FormularioTiempo.tsx`, `src/components/ListaCandidatas.tsx`, `src/styles/noche-de-pelicula.css` |
| NP-08  | `src/components/NocheDePelicula.tsx`, `src/components/ListaCandidatas.tsx`, `src/components/PanelSesion.tsx`, `src/styles/noche-de-pelicula.css`                                                   |
| NP-09  | `src/components/NocheDePelicula.tsx`, `src/components/PanelSesion.tsx`                                                                                                                             |
| NP-10  | `src/App.tsx`, `src/components/MisSesiones.tsx`, `src/components/NocheDePelicula.tsx`, `src/styles/noche-de-pelicula.css`                                                                          |
| NP-11  | `src/dominio/nocheDePelicula.ts`, `src/dominio/nocheDePelicula.test.ts`, `src/components/PanelSesion.tsx`, `src/components/NocheDePelicula.tsx`                                                    |
| NP-12  | `docs/VERIFICACION.md`                                                                                                                                                                             |
| NP-13  | `docs/AUDITORIA.md`, `README.md`, `docs/backlog/E2-tickets.md`, esta tabla                                                                                                                         |

Tabla ajustada después de implementar para que diga lo que de verdad tocó cada commit (hallazgo 7 de `docs/AUDITORIA.md`). Además hubo dos arreglos: `fix(NP-05)` en `sesionesService.ts` y `fix(NP-06)` en `BarraUsuario.tsx` y `noche-de-pelicula.css`.

Ningún ticket de interfaz (NP-06 a NP-10) toca `src/dominio/`, `src/services/` ni `supabase/`. NP-11 toca el dominio porque agrega una regla nueva, con sus tests.

## // 9. Fuera de esta spec

Series, compartir sesiones, recordatorios, editar una sesión guardada, marcarla como realizada, filtrar por género y guardar la duración en `mi_lista` (RF-19).
