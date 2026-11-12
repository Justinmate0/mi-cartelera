# // Auditoría de la épica «Noche de película»

Aquí reviso cada criterio contra lo que hay en el repo, sobre el último commit de la épica. La primera pasada la hizo el agente el 5 de noviembre de 2026, y después la actualicé con lo que probé yo en la app publicada ese mismo día

Estados:

- **cumple**: hay evidencia que lo cubre entero (un test, un comando, el SQL que corrí o revisar el código)
- **sin verificar**: falta probarlo en la app real, pero digo qué evidencia hay mientras tanto
- **no cumple**: hay evidencia de que falla

La prueba simulada (la app de verdad, pero con Supabase y TMDB falsos, en Chromium) me sirve de pista, pero no la cuento como «cumple» para lo que solo se ve en la app real

## // Resumen

| Grupo                    | Cumple | Sin verificar | No cumple |
| ------------------------ | ------ | ------------- | --------- |
| H2.1 Ver qué cabe (13)   | 8      | 5             | 0         |
| H2.2 Armar la sesión (9) | 5      | 4             | 0         |
| H2.3 Guardar (9)         | 4      | 5             | 0         |
| H2.4 Mis sesiones (9)    | 7      | 2             | 0         |
| H2.5 Llenar mi noche (5) | 2      | 3             | 0         |
| Spec S-01 a S-20         | 17     | 3             | 0         |
| Diseño D-01 a D-13       | 6      | 7             | 0         |

Ningún criterio quedó en «no cumple». El 5 de noviembre probé la app publicada con mis películas y con dos cuentas, y todo lo que probé pasó. Lo que sigue en «sin verificar» tiene tests o prueba simulada, pero no lo vi en la app real: red lenta o caída, películas sin duración en TMDB, doble clic, «Llenar mi noche» reemplazando una sesión, usarla solo con teclado y verla a 390 px en un celular de verdad

## // Criterios de aceptación

| Criterio  | Estado        | Evidencia                                                                                                                                                                                                   |
| --------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-2.1.1  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Test de `clasificarCandidatas` con 120 → Up, Coco. Simulado igual (V-01).                                                                           |
| CA-2.1.2  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Test de `muyLargas` = 2. Simulado: «2 películas duran más que tu tiempo» (V-01).                                                                    |
| CA-2.1.3  | cumple        | Es una regla de orden pura: test «con la misma duración ordena por título» (V-02).                                                                                                                          |
| CA-2.1.4  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Tests de `validarTiempoDisponible` con 29, 601, 90.5, abc y vacío. Simulado: mensajes y 0 tarjetas (V-03).                                          |
| CA-2.1.5  | sin verificar | Tests con 30 y 600. Simulado (V-04).                                                                                                                                                                        |
| CA-2.1.6  | sin verificar | Test de «sin-duracion». Simulado (V-05). Depende de encontrar en TMDB una película real sin duración.                                                                                                       |
| CA-2.1.7  | cumple        | Revisión de código del filtro de `App.tsx` (solo `pelicula` y `por_ver`) y simulado con 600 (V-06).                                                                                                         |
| CA-2.1.8  | sin verificar | Simulado con TMDB lento (V-07).                                                                                                                                                                             |
| CA-2.1.9  | sin verificar | Test del servicio: si fallan todas, lanza error. Simulado (V-08).                                                                                                                                           |
| CA-2.1.10 | sin verificar | Test de «error-consulta». Simulado con Coco fallando (V-05).                                                                                                                                                |
| CA-2.1.11 | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado con lista vacía (V-09).                                                                                                                    |
| CA-2.1.12 | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado con 60 (V-10).                                                                                                                             |
| CA-2.1.13 | cumple        | `App.tsx` solo muestra la barra y las secciones con sesión iniciada (lógica de E1 sin cambios). Simulado (V-11).                                                                                            |
| CA-2.2.1  | sin verificar | Test de `puedeAgregar` (V-12).                                                                                                                                                                              |
| CA-2.2.2  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Tests de `duracionSesion`. Simulado: «Ocupa 3 h 31 min de 4 h · Quedan 29 min» (V-13).                                                              |
| CA-2.2.3  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Test del mensaje exacto. Simulado (V-14).                                                                                                           |
| CA-2.2.4  | sin verificar | Test de ajuste exacto con 211 (V-15).                                                                                                                                                                       |
| CA-2.2.5  | sin verificar | V-16, solo navegador.                                                                                                                                                                                       |
| CA-2.2.6  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Test de «repetida». Simulado (V-17).                                                                                                                |
| CA-2.2.7  | sin verificar | Revisión de código: «No disponibles» no tiene botones (V-18).                                                                                                                                               |
| CA-2.2.8  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Test de «excede» y del mensaje. Simulado (V-20).                                                                                                    |
| CA-2.2.9  | cumple        | Lo probé en la app publicada con mis películas (5 nov). V-19, solo navegador.                                                                                                                               |
| CA-2.3.1  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado: «Sesión guardada.» y la tarjeta en Mis sesiones (V-21).                                                                                   |
| CA-2.3.2  | sin verificar | Simulado: «Noche del 5 de noviembre» (V-22).                                                                                                                                                                |
| CA-2.3.3  | sin verificar | Test de `validarNombreSesion` y rechazo en SQL. Simulado (V-23).                                                                                                                                            |
| CA-2.3.4  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado: botón deshabilitado y el texto (V-24).                                                                                                    |
| CA-2.3.5  | sin verificar | SQL que corrí en Supabase: «estado en mi_lista después de guardar: por_ver» (V-25). Falta mirarlo en Mi lista.                                                                                              |
| CA-2.3.6  | sin verificar | Simulado con el servidor fallando: mensaje y la sesión se queda (V-26).                                                                                                                                     |
| CA-2.3.7  | sin verificar | Simulado: doble clic, sale 1 sola llamada (V-27).                                                                                                                                                           |
| CA-2.3.8  | cumple        | SQL que corrí en Supabase: rechaza sesión que no cabe, película no «por ver», vacía, repetida, nombre largo, sin duración y tiempo fuera de rango (V-28, captura 07).                                       |
| CA-2.3.9  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado: el panel se vacía y el tiempo sigue (V-21).                                                                                               |
| CA-2.4.1  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado (V-29). La consulta ordena por `creada_en` descendente.                                                                                    |
| CA-2.4.2  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado (V-30).                                                                                                                                    |
| CA-2.4.3  | cumple        | Lo probé en la app publicada con mis películas (5 nov). SQL: la sesión conserva la película después de borrarla de `mi_lista`. Simulado: «Ya no está en tu lista» (V-33).                                   |
| CA-2.4.4  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado (V-34).                                                                                                                                    |
| CA-2.4.5  | sin verificar | La base solo prohíbe repetir dentro de una sesión (`unique (sesion_id, tmdb_id)`) (V-35).                                                                                                                   |
| CA-2.4.6  | cumple        | Lo probé en la app publicada con mis películas (5 nov). SQL que corrí en Supabase: B ve 0 sesiones y borra 0 filas de A. Captura con las dos cuentas en `docs/capturas/08-sesiones-dos-cuentas.png` (V-36). |
| CA-2.4.7  | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado (V-31).                                                                                                                                    |
| CA-2.4.8  | sin verificar | Simulado (V-32).                                                                                                                                                                                            |
| CA-2.4.9  | cumple        | Sin política ni permiso de `update`; el update directo falla en el SQL; la interfaz solo tiene «Eliminar» (V-37).                                                                                           |
| CA-2.5.1  | cumple        | Test con 240 → Up y Her, 232 min, 8 libres; otro test lo compara contra todas las combinaciones (V-38).                                                                                                     |
| CA-2.5.2  | cumple        | Test de empate: 45 + 10 + 45 contra 100 → gana la de una sola película (V-39).                                                                                                                              |
| CA-2.5.3  | sin verificar | Simulado: la propuesta reemplaza a Coco y sale el aviso (V-38).                                                                                                                                             |
| CA-2.5.4  | sin verificar | Test con 60 → `[]`. Simulado: el aviso sale y la sesión no cambia (V-39).                                                                                                                                   |
| CA-2.5.5  | sin verificar | Test: nunca incluye una sin duración ni repetida. En la interfaz solo recibe las que caben (V-39).                                                                                                          |

## // Spec (DEBE / NO DEBE)

| Criterio | Estado        | Evidencia                                                                                    |
| -------- | ------------- | -------------------------------------------------------------------------------------------- |
| S-01     | cumple        | Test de tiempo exacto (`cabe: true`, `restante: 0`).                                         |
| S-02     | cumple        | Test de una película sin pausa.                                                              |
| S-03     | cumple        | Tests de n − 1 pausas con 2 y 3 películas, y con otra pausa.                                 |
| S-04     | cumple        | Tests con `null`, 0, negativa y decimal.                                                     |
| S-05     | cumple        | Tests con 29, 601, decimales y vacío.                                                        |
| S-06     | cumple        | Tests de orden y de exclusión de las muy largas.                                             |
| S-07     | cumple        | `nocheDePelicula.ts` no tiene ningún `import` (V-40).                                        |
| S-08     | cumple        | Tests de `llenarMiNoche`, incluido el de fuerza bruta.                                       |
| S-09     | cumple        | SQL con dos usuarios (V-36).                                                                 |
| S-10     | cumple        | SQL: insert y update directos dan «permission denied» (V-28).                                |
| S-11     | cumple        | SQL: los siete rechazos (V-28).                                                              |
| S-12     | cumple        | SQL: estado sigue `por_ver` (V-25).                                                          |
| S-13     | cumple        | SQL: la sesión sobrevive al borrar de `mi_lista` (V-33).                                     |
| S-14     | cumple        | Solo `.env.example` en git; `.env` ignorado; ninguna clave en el historial (V-42).           |
| S-15     | cumple        | `grep` sin resultados en `src/components` y `src/hooks` (V-40).                              |
| S-16     | cumple        | `grep` sin sumas ni `reduce` en componentes; los totales salen de `duracionSesion` (V-40).   |
| S-17     | sin verificar | Simulado sin sesión (V-11). Falta en la app real.                                            |
| S-18     | cumple        | `grep` de `any` sin resultados (V-40).                                                       |
| S-19     | sin verificar | Comparación píxel por píxel antes/después en simulado (V-43). Falta contra `docs/capturas/`. |
| S-20     | sin verificar | Depende de D-04 a D-11.                                                                      |

## // Diseño (DESIGN.md)

| Criterio | Estado        | Evidencia                                                                                                                                                                                                                                                                    |
| -------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01     | cumple        | `grep` sin hex ni `rgba` en `src/styles` y `src/components` (V-44).                                                                                                                                                                                                          |
| D-02     | cumple        | Un solo `style={`: el ancho de la barra de tiempo (V-44).                                                                                                                                                                                                                    |
| D-03     | cumple        | Solo `bootstrap.min.css` 5.3.3 (V-44).                                                                                                                                                                                                                                       |
| D-04     | sin verificar | Código: un `btn-acento` por bloque; eliminar usa `btn-outline-danger` (V-45).                                                                                                                                                                                                |
| D-05     | sin verificar | Código: «En la sesión», «No cabe en lo que queda», «Ya no está en tu lista» y los motivos son texto (V-45).                                                                                                                                                                  |
| D-06     | sin verificar | Código: carga con `spinner-border text-warning` y `role="status"`; errores con `EstadoError` (V-45).                                                                                                                                                                         |
| D-07     | cumple        | `h1.titulo-seccion` en la pantalla; duraciones con `cifra` (revisión de código, V-45).                                                                                                                                                                                       |
| D-08     | sin verificar | Simulado solo con teclado: encontró el botón amarillo sin anillo de foco, ya corregido (V-46).                                                                                                                                                                               |
| D-09     | sin verificar | Simulado a 1280 y 390, sin scroll horizontal (V-47).                                                                                                                                                                                                                         |
| D-10     | cumple        | Lo probé en la app publicada con mis películas (5 nov). Simulado: píldora activa amarilla (V-48).                                                                                                                                                                            |
| D-11     | sin verificar | Código de `FormularioTiempo.tsx` con los tres atributos (V-48).                                                                                                                                                                                                              |
| D-12     | sin verificar | Simulado: a 1280 px solo cambia el botón nuevo; a 390 px había un problema, ya corregido (V-43).                                                                                                                                                                             |
| D-13     | cumple        | Medición de todos los botones, campos y enlaces en Buscar, Mi lista, Detalle y Noche de película: antes había 28 controles distintos por debajo de 44 px (por ejemplo «Quitar» de 46 × 24, «Cerrar sesión» de 107 × 31 y las estrellas de 33 × 29); después, ninguno (V-49). |

## // Hallazgos

De más grave a menos grave. Los que se corrigieron tienen su commit

1. **Botones y controles pequeños (corregido).** Es lo que me marcó el profe en el Entregable 3, y seguía pasando: 28 controles medían menos de 44 px de alto o de ancho, en E1 y en E2. Lo corregí en `fix(NP-13)` con `src/styles/controles.css`, que hace que todo control mida al menos 44 × 44 px sin tocar las reglas de E1 (D-13)
2. **La barra se rompía en celular (corregido).** Con la tercera sección, a 390 px «Mi Cartelera» se partía en dos líneas y las píldoras se aplastaban, y eso pasaba también en Buscar y Mi lista (D-12). Lo encontré comparando E1 antes y después de la épica. Corregido en `fix(NP-06)`: la navegación baja a su propia línea
3. **El botón amarillo no mostraba el foco con el teclado (corregido).** Venía de E1, `btn-acento` solo cambiaba de tono. Corregido en `fix(NP-06)` con un borde de foco (D-08)
4. **Salía «Failed to fetch» en inglés al guardar sin internet (corregido).** Corregido en `fix(NP-05)`, ahora sale el mensaje en español
5. **`guardar_sesion` confía en la duración que manda el navegador (pendiente, aceptado).** La base revisa que cada película esté «por ver» en mi lista y que la suma quepa, pero no le vuelve a pedir la duración a TMDB. O sea, alguien que arme la llamada a mano podría mandar duraciones falsas, pero solo de sus propias películas, así que solo se daña su propia cuenta. Por eso lo acepto. Arreglarlo pediría una Edge Function con el token de TMDB en el servidor
6. **Aviso de Supabase sobre `guardar_sesion` (a propósito).** Supabase avisa que un usuario con sesión puede ejecutar una función `security definer`. Es a propósito, porque es la única forma de crear sesiones (S-10). La función usa `search_path = ''`, valida todo y solo escribe filas con `auth.uid()`, y `anon` no la puede ejecutar. Está explicado en la spec §2.3
7. **Avisos de Supabase que vienen de E1 (pendiente, fuera de la épica).** «Leaked password protection» está apagado, y las 4 políticas de `mi_lista` usan `auth.uid()` sin `select` (es tema de rendimiento). No los toqué para no cambiar E1, quedan para una épica de mantenimiento. Las políticas nuevas sí usan `(select auth.uid())`
8. **La tabla ticket → archivos de la spec no coincidía con lo hecho (corregido en la spec).** NP-01 no tocó `tsconfig.app.json` (no hizo falta, Vite solo empaqueta lo que importa `main.tsx`), NP-03 sumó `supabase/pruebas/rls_noche_de_pelicula.sql`, NP-04 sumó `tmdbService.test.ts`, NP-07 y NP-10 tocaron `App.tsx` (para pasar la lista y los ids) y hubo dos commits de arreglo. Actualicé la tabla con una nota
9. **El hook de Prettier formatea el archivo entero (pendiente, aceptado).** Si el agente edita un archivo de E1 que no estaba formateado, el cambio sale más grande de lo que es. En la épica lo evité regresando esos cambios a mano. Se podría arreglar formateando solo los archivos nuevos
10. **`.btn-en-lista` deshabilitado (menor, pendiente).** El botón «✓ En la sesión» usa el estilo de E1, que tiene colores sueltos en `index.css` (deuda DH-02 del estado inicial). No lo toqué para no cambiar E1

## // Qué hizo el agente y qué verifiqué yo

- **El agente:** escribió los documentos a partir de mis decisiones, la migración, el SQL de prueba, el código y los tests, corrió los comandos y la prueba simulada, y encontró y corrigió los hallazgos 1 a 4
- **Yo:** decidí los cinco puntos abiertos, apliqué la migración en Supabase, corrí el SQL de RLS (captura 07), probé la app publicada con mis películas y dos cuentas (capturas 08 a 11) y revisé la sección 7 de `docs/ESTADO-INICIAL.md`
