# // E2 · Tickets

Cada ticket se implementa en un commit con su id en el mensaje. Qué archivos toca cada uno está en la tabla ticket → archivos de `docs/specs/E2-noche-de-pelicula.md`.

**Definition of Done común** (vale para todos, además de la propia de cada ticket):

- `npm test`, `npm run build` y `npm run lint` pasan.
- Sin `any`. Los componentes no importan `supabaseClient` ni usan `fetch`.
- Ninguna clave en el commit. `.env` sigue fuera de git.
- Las pantallas de E1 funcionan igual.

Orden sugerido: NP-01 → NP-02 → NP-03 → NP-04 → NP-05 → NP-06 → NP-07 → NP-08 → NP-09 → NP-10 → NP-11 → NP-12 → NP-13.

Estado al 5 de noviembre de 2026: las casillas marcadas las revisó el agente con la evidencia de `docs/AUDITORIA.md`. Las pruebas en la app real las hizo Justin el 5 de noviembre y están en `docs/VERIFICACION.md`; lo que no probó en la app real sigue en «sin verificar» en la auditoría.

## // NP-01 · Preparar Vitest

- **Tipo:** chore (infraestructura de pruebas) · **Historia:** todas · **Tamaño:** S
- **Depende de:** nada
- **DoD:**
  - [x] `vitest` instalado como dependencia de desarrollo, con versión fija.
  - [x] Script `npm test` que corre Vitest una vez y sale.
  - [x] Los archivos `*.test.ts` no entran al build de la app.

## // NP-02 · Regla «cabe» en el dominio

- **Tipo:** feat (dominio) · **Historias:** H2.1, H2.2, H2.3 · **Tamaño:** M
- **Depende de:** NP-01
- **DoD:**
  - [x] `src/dominio/nocheDePelicula.ts` con las constantes y funciones puras de la spec, sin imports de red, Supabase ni React.
  - [x] Tests escritos antes que el código, y vistos en rojo.
  - [x] Tests de los bordes pedidos: sesión que ocupa exactamente el tiempo, una sola película sin pausa, película sin duración y tiempo fuera de rango (29, 601, decimales, vacío).
  - [x] Los mensajes al usuario salen de este archivo.

## // NP-03 · Tablas de sesiones con RLS

- **Tipo:** feat (datos) · **Historias:** H2.3, H2.4 · **Tamaño:** M
- **Depende de:** nada
- **DoD:**
  - [x] `supabase/migraciones/002_noche_de_pelicula.sql` con `sesiones`, `sesion_peliculas`, RLS, permisos y la función `guardar_sesion`.
  - [x] Migración aplicada en el proyecto `mi-cartelera` de Supabase.
  - [x] Probado con dos usuarios: ninguno ve ni borra las sesiones del otro.
  - [x] Probado que `guardar_sesion` rechaza una sesión que no cabe, vacía, con una película repetida o que no está «por ver».
  - [x] Los avisos de seguridad de Supabase revisados.

## // NP-04 · Servicio de duraciones de TMDB

- **Tipo:** feat (servicio) · **Historia:** H2.1 · **Tamaño:** S
- **Depende de:** NP-02 (tipo `DuracionConsultada`)
- **DoD:**
  - [x] `obtenerDuraciones` en `tmdbService.ts` devuelve la duración en minutos, «desconocida» o «error» por película.
  - [x] Máximo 4 consultas a la vez. Si fallan todas, lanza el error en español.
  - [x] Se puede cancelar con `AbortSignal`. `obtenerDetalle` sigue igual.

## // NP-05 · Servicio de sesiones

- **Tipo:** feat (servicio) · **Historias:** H2.3, H2.4 · **Tamaño:** S
- **Depende de:** NP-03
- **DoD:**
  - [x] `src/services/sesionesService.ts` con `obtenerSesiones`, `guardarSesion` y `eliminarSesion`.
  - [x] Tipos en `src/types/sesion.ts`, en camelCase.
  - [x] Errores de PostgreSQL traducidos al español.

## // NP-06 · Estilos y entrada a la pantalla

- **Tipo:** feat (interfaz) · **Historia:** H2.1 · **Tamaño:** S
- **Depende de:** nada
- **DoD:**
  - [x] Tokens de E2 agregados a `:root` sin cambiar las reglas existentes de `index.css`.
  - [x] `src/styles/noche-de-pelicula.css` importado en `main.tsx`.
  - [x] Corrige la deuda DH-10 (botón principal deshabilitado).
  - [x] «Noche de película» en la barra, con la píldora activa (D-10), y la pantalla con su título.

## // NP-07 · Ver qué cabe

- **Tipo:** feat (interfaz) · **Historia:** H2.1 · **Tamaño:** M
- **Depende de:** NP-02, NP-04, NP-06
- **DoD:**
  - [x] Cumple CA-2.1.1 a CA-2.1.13 en tests y prueba simulada (falta la app real, ver auditoría).
  - [x] La clasificación y el orden salen de `clasificarCandidatas`; el componente no calcula duraciones.
  - [x] Estados de carga, error, vacío y «ninguna cabe».

## // NP-08 · Armar la sesión

- **Tipo:** feat (interfaz) · **Historia:** H2.2 · **Tamaño:** M
- **Depende de:** NP-07
- **DoD:**
  - [x] Cumple CA-2.2.1 a CA-2.2.9 en tests y prueba simulada (falta la app real).
  - [x] Agregar usa `puedeAgregar` y los totales salen de `duracionSesion`; el componente no suma minutos.

## // NP-09 · Guardar la sesión

- **Tipo:** feat (interfaz) · **Historia:** H2.3 · **Tamaño:** S
- **Depende de:** NP-05, NP-08
- **DoD:**
  - [x] Cumple CA-2.3.1 a CA-2.3.9 en prueba simulada; CA-2.3.8 probado con SQL en NP-03 (falta la app real).
  - [x] El botón se deshabilita mientras guarda.

## // NP-10 · Mis sesiones

- **Tipo:** feat (interfaz) · **Historia:** H2.4 · **Tamaño:** M
- **Depende de:** NP-05, NP-06
- **DoD:**
  - [x] Cumple CA-2.4.1 a CA-2.4.9 en prueba simulada; CA-2.4.6 probado con SQL.
  - [x] CA-2.4.6 demostrado con dos cuentas en el navegador (Justin, 5 nov, captura `docs/capturas/08-sesiones-dos-cuentas.png`).
  - [x] Se actualiza sola después de guardar o borrar.

## // NP-11 · Llenar mi noche

- **Tipo:** feat (dominio e interfaz) · **Historia:** H2.5 · **Tamaño:** M
- **Depende de:** NP-02, NP-08
- **DoD:**
  - [x] `llenarMiNoche` como función pura, con tests de la mejor combinación, empates, nada cabe y ajuste exacto.
  - [x] Cumple CA-2.5.1 a CA-2.5.5 en tests y prueba simulada (falta la app real).

## // NP-12 · Verificación en el navegador

- **Tipo:** docs (verificación) · **Historias:** todas · **Tamaño:** S
- **Depende de:** NP-07 a NP-11
- **DoD:**
  - [x] `docs/VERIFICACION.md` con una fila por criterio: pasos, resultado esperado y resultado obtenido.
  - [x] Las filas de comandos las llenó el agente; las de navegador, Justin (5 nov).

## // NP-13 · Auditoría y README

- **Tipo:** docs · **Historias:** todas · **Tamaño:** S
- **Depende de:** NP-12
- **DoD:**
  - [x] `docs/AUDITORIA.md` con cada criterio en «cumple», «no cumple» o «sin verificar», con evidencia.
  - [x] Hallazgos corregidos de arriba hacia abajo o registrados como pendientes con su razón.
  - [x] README con la sección de la épica, cómo correr los tests y cómo está armado el harness.
