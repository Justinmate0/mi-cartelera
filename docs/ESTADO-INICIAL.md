# // Estado inicial de Mi Cartelera Personal

Informe del Proyecto 3 tal como estaba en el commit `de7929c` (10 de octubre de 2026), antes de empezar la épica «Noche de película». Se armó con el agente en plan mode: solo lectura, sin cambiar archivos. Después lo revisó y corrigió Justin (ver la última sección).

Qué se leyó: `README.md`, `package.json`, `index.html`, `tsconfig*.json`, `.oxlintrc.json`, `.gitignore`, `.env.example`, `supabase/schema.sql`, todo `src/` y el historial de git (11 commits y 4 ramas).

Qué se ejecutó: `npm ci`, `npm run build` (compila), `npm run lint` (sin avisos), `tsc --strict` sobre `src/` (pasa) y `prettier --check src` (13 archivos sin formato de Prettier).

## // 1. Qué hace la app hoy

Mi Cartelera Personal guarda las películas y series que una persona quiere ver, está viendo o ya vio, cada una con su calificación y comentario. Todo es privado por cuenta.

- **Acceso:** registro, inicio de sesión y cierre de sesión con Supabase Auth. Sin sesión solo se ve la pantalla de acceso, y la sesión se mantiene al recargar.
- **Buscar:** busca películas y series en TMDB (`/search/multi`), con estados de carga, error con «Reintentar», sin resultados y validación del texto (2 a 100 caracteres).
- **Mi lista:** agrega desde la búsqueda con estado inicial «por ver». Filtra por estado, ordena (recientes, antiguos, mejor calificados) y muestra el contador «Tienes N pendientes, N en progreso y N vistas».
- **Detalle:** póster, sinopsis, géneros, duración, nota de TMDB y elenco. Desde ahí se cambia el estado, la calificación (1 a 5) y el comentario (máximo 500), o se elimina el título.
- **Publicada** en Vercel (`mi-cartelera-kappa.vercel.app`), con despliegue automático en cada push a `main`.

## // 2. Stack

| Capa        | Qué usa                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base        | React 19.2, TypeScript 6.0, Vite 8.3                                                                                                                                 |
| Datos       | Supabase JS 2.117: Auth y tabla `public.mi_lista`                                                                                                                    |
| API externa | TMDB v3 con token de lectura (`/search/multi`, `/movie/{id}`, `/tv/{id}` con `credits`)                                                                              |
| Estilos     | Bootstrap 5.3.3 por CDN (solo CSS, sin su JavaScript), `data-bs-theme="dark"` y `src/index.css` con variables propias. Fuentes Bebas Neue e Inter desde Google Fonts |
| Calidad     | oxlint. No había tests ni formateador                                                                                                                                |
| Navegación  | Sin router: un tipo unión `Vista = "buscar" \| "mi-lista" \| "detalle"` en `App.tsx`                                                                                 |

Estructura: `src/services/` (auth, TMDB y `mi_lista`), `src/types/`, `src/components/` (12 componentes), `src/lib/supabaseClient.ts` y `supabase/schema.sql`.

Base de datos: una sola tabla, `mi_lista`, con `user_id` por defecto `auth.uid()`, checks de `tipo_contenido`, `estado` y `calificacion_personal`, `unique (user_id, tmdb_id, tipo_contenido)` y RLS con cuatro políticas (`select`, `insert`, `update`, `delete`) que comparan `auth.uid() = user_id`.

## // 3. Harness

El Proyecto 3 no tenía harness: ni `AGENTS.md`, ni `CLAUDE.md`, ni `.claude/`. Se agregó en los dos commits anteriores a este informe:

- `AGENTS.md` (33 líneas) con la regla «ninguna funcionalidad sin spec», las reglas de claves y la arquitectura por capas. `CLAUDE.md` lo importa con `@AGENTS.md`.
- `.claude/skills/commit/SKILL.md` con `disable-model-invocation: true`: solo corre cuando la persona escribe `/commit`.
- `.claude/hooks/formatear.cjs`, conectado en `.claude/settings.json` al evento `PostToolUse` (`Edit|Write|MultiEdit`). Ejecuta solo el Prettier del proyecto sobre el archivo recién editado. No toca archivos fuera del proyecto ni archivos `.env*`.
- `.claude/settings.json` también niega al agente leer o editar `.env` y `.env.local`.

## // 4. Inconsistencias

1. **«Tipado estricto» sin `strict`.** El README dice que el tipado es estricto, pero `tsconfig.app.json` no activa `"strict": true`. El código hoy pasa `tsc --strict`, así que es una promesa sin candado: nada impide que un cambio futuro la rompa.
2. **Colores fuera de las variables.** `src/index.css` define 8 variables en `:root`, pero usa 14 colores hexadecimales sueltos (9 distintos, como `#1a1400` para el texto sobre el acento o `#23202b` para el fondo de pósters) y 5 `rgba(...)` fuera de ese bloque.
3. **Dos estilos de código.** `main.tsx` y `vite.config.ts` usan comillas simples y no llevan punto y coma; el resto usa comillas dobles y punto y coma. 13 archivos no pasan Prettier.
4. **Avisos nativos mezclados con avisos propios.** La app tiene su `EstadoError` y alertas de Bootstrap, pero eliminar usa `window.confirm` (en `MiLista` y `DetalleTitulo`) y el error al cerrar sesión usa `alert()`.
5. **`schema.sql` se ejecuta una sola vez.** La tabla y el índice usan `if not exists`, pero las políticas no. Si se vuelve a ejecutar, falla en el primer `create policy`.
6. **La duración se pierde como número.** `obtenerDetalle` convierte `runtime` en texto («2 h 15 min»). El dato numérico existe en TMDB pero ningún servicio lo devuelve, y `mi_lista` no lo guarda.
7. **Tipos de la base escritos a mano.** `miListaService` devuelve `data as ItemLista[]`. Si cambia una columna, TypeScript no se entera.

## // 5. Riesgos

- **R-01 · Muchas consultas a TMDB.** Como la duración no está en `mi_lista`, saber qué películas caben en un tiempo obliga a pedir el detalle de cada película «por ver». Con listas grandes puede salir el límite de TMDB (error 429).
- **R-02 · `main` se publica sola.** Vercel despliega cada push a `main`. Un commit a medias de la épica nueva quedaría publicado.
- **R-03 · Claves `VITE_` visibles.** Por diseño de Vite, la URL, la clave publishable de Supabase y el token de TMDB quedan en el código del navegador. Es aceptable porque la seguridad depende de RLS y el token solo lee, pero exige que nunca se use la `service_role`.
- **R-04 · Sin tests.** Ninguna regla está probada automáticamente. Un cambio en E2 podría romper E1 sin que nadie lo note.
- **R-05 · Proyecto de Supabase pausado.** El proyecto gratuito `mi-cartelera` estaba en pausa por inactividad el 5 de noviembre de 2026. Mientras está pausado, la app publicada no funciona.

## // 6. Deuda heredada (pendiente, sin corregir)

Se registra aquí y no se corrige en esta épica, salvo que un ticket lo diga.

- [ ] **DH-01** Activar `"strict": true` en `tsconfig.app.json` (inconsistencia 1).
- [ ] **DH-02** Pasar los 14 colores sueltos de `index.css` a variables de `:root` (inconsistencia 2). La épica E2 solo agrega variables nuevas y no toca las reglas existentes.
- [ ] **DH-03** Formatear con Prettier los 13 archivos de E1 en un commit aparte de solo formato (inconsistencia 3).
- [ ] **DH-04** Reemplazar `window.confirm` y `alert()` por avisos propios (inconsistencia 4).
- [ ] **DH-05** Hacer `schema.sql` repetible con `drop policy if exists` (inconsistencia 5).
- [ ] **DH-06** Generar los tipos de la base con `supabase gen types` en lugar de escribirlos a mano (inconsistencia 7).
- [ ] **DH-07** Agregar `"engines": { "node": ">=20.19" }` en `package.json`, que el README pide pero no exige.
- [ ] **DH-08** Borrar del remoto las ramas `feature/auth`, `feature/coleccion`, `feature/tmdb` y `docs/readme`, que ya están fusionadas en `main`.
- [ ] **DH-09** Agregar tests de E1: `validarConsulta` del buscador y el orden de `MiLista` (R-04).
- [ ] **DH-10** El botón principal deshabilitado (por ejemplo «Buscando...») se vuelve transparente: la regla `.btn:disabled` de Bootstrap le gana a `.btn-acento`, que no define su estado `:disabled`.

## // 7. Revisión de Justin

Lo que confirmé o corregí después de leer el informe del agente:

- [x] Leí el informe completo.
- [x] Lo que hace la app (sección 1) coincide con lo que veo al usarla.
- [x] Las inconsistencias y la deuda están bien descritas.
- Correcciones: ninguna. Revisado el 5 de noviembre de 2026.
