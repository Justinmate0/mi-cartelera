# AGENTS.md · Mi Cartelera Personal

App para guardar películas y series «por ver», «viendo» y «vista» (E1) y armar una «Noche de película» con las que caben en un tiempo libre (E2).

## // Stack
React 19 + TypeScript + Vite · Supabase (Auth + PostgreSQL con RLS) · TMDB API v3 · Bootstrap 5.3 por CDN + `src/index.css` · Vitest · Vercel (despliega `main`).

## // Comandos
- `npm run dev` levanta la app · `npm test` corre Vitest (desde NP-01) · `npm run build` revisa tipos y compila · `npm run lint` corre oxlint.

## // Regla de oro
- Ninguna funcionalidad sin spec. Antes de escribir código debe existir su historia en `docs/backlog/` y su spec en `docs/specs/`. Si falta, detente y avisa.
- Orden de cambio: PRD → backlog → spec → tests → código → `docs/VERIFICACION.md`. Una corrección también va de arriba hacia abajo.
- Un commit por ticket, con su id en el mensaje (`feat(NP-04): …`). Commits con `/commit`.

## // Claves y seguridad
- Las claves viven solo en `.env` (está en `.gitignore`). Nunca leas, muestres ni subas `.env`; usa `.env.example` como referencia.
- En el frontend solo van la URL y la clave publishable/anon de Supabase y el token de lectura de TMDB. Nunca la `service_role`.
- Toda tabla nueva lleva RLS con `auth.uid() = user_id`. No filtres por usuario en el frontend como sustituto de RLS.

## // Arquitectura
- `src/dominio/`: reglas de negocio en funciones puras, sin red ni Supabase. Cada regla tiene tests en `*.test.ts`.
- `src/services/`: única capa que habla con Supabase y TMDB. Devuelve datos tipados y errores en español.
- `src/components/`: no importan `supabaseClient` ni usan `fetch`; reciben datos o llaman a un servicio.
- `supabase/`: `schema.sql` (E1) y `migraciones/` (E2 en adelante), numeradas.

## // Convenciones
- TypeScript sin `any`. camelCase en TS, snake_case en la base de datos. Nombres y textos en español.
- Para cualquier tarea visual, lee `DESIGN.md` antes de escribir código.
- No cambies el comportamiento de E1: buscar, mi lista, detalle y sesión deben seguir igual.

## // Documentos
`docs/ESTADO-INICIAL.md` · `docs/prd/` · `docs/backlog/` · `docs/specs/` · `docs/diseno/` · `docs/VERIFICACION.md` · `docs/AUDITORIA.md`.
