# DESIGN.md · Mi Cartelera Personal

Sistema de diseño **«Marquesina»**, versión 1.0 (noviembre 2026).

Este archivo dice cómo se **ve** la app. No define funcionalidad: qué hace la app lo dicen el PRD, las historias y las specs. Cuando una tarea toque la interfaz, el agente lee este archivo antes de escribir código. Su versión visual está en `docs/diseno/brand-board.html`.

## // 1. Cómo se usa este archivo

| Pregunta                | Respuesta                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| ¿Quién lo lee?          | Justin y el agente. `AGENTS.md` lo pide para cualquier tarea visual.                                             |
| ¿Qué decide?            | Cómo se usa y se personaliza Bootstrap, los tokens, los componentes, el layout, la accesibilidad y lo prohibido. |
| ¿Qué no decide?         | Reglas de negocio, textos ni comportamiento. Eso vive en `docs/specs/` y en `src/dominio/`.                      |
| ¿Cómo lo usa una spec?  | Cita tokens y componentes **por su nombre** («Tarjeta de título», `--acento`). No copia valores.                 |
| ¿Cómo se cambia?        | Se edita este archivo y el bloque `:root` de `src/index.css` en el mismo commit, con mensaje `docs(diseño): …`.  |
| ¿Si choca con una spec? | Gana la spec en lo que hace la app y gana este archivo en cómo se ve.                                            |

## // 2. Principios

1. **Sala de cine a oscuras.** Fondo casi negro, pósters como protagonistas y un solo acento amarillo de marquesina.
2. **Bootstrap primero, CSS propio después.** La estructura, los formularios y los utilitarios salen de Bootstrap. El CSS propio solo pone la marca encima.
3. **Un solo acento.** El amarillo `--acento` marca lo que se puede hacer o lo que está activo: botón principal, píldora activa, foco y estrellas. Rojo y verde se reservan para errores y estados.
4. **Nunca solo color.** Todo estado lleva texto («Por ver», «Viendo», «Vista», «Sin duración»). El color refuerza.
5. **Cifras que se comparan.** Duraciones y conteos van con `font-variant-numeric: tabular-nums` para que se alineen.

## // 3. Cómo se usa Bootstrap

- **Versión y carga:** Bootstrap **5.3.3**, solo `bootstrap.min.css`, desde jsDelivr en `index.html`. No se carga `bootstrap.bundle.js`, así que no hay componentes que dependan de JavaScript (modal, dropdown, tooltip, collapse, toast).
- **Tema:** `<body data-bs-theme="dark">` activa el modo oscuro de Bootstrap. Encima, `src/index.css` cambia el fondo, el texto y las fuentes.
- **Personalización:** no se recompila Sass ni se cambian las variables `--bs-*`. La marca se aplica con clases propias (`btn-acento`, `tarjeta-titulo`) y sobrescribiendo campos dentro de un contenedor propio (`.buscador .form-control`, `.panel-personal .form-control`).
- **Orden de carga:** primero Bootstrap, después Google Fonts y al final `src/index.css` (importado en `main.tsx`), para que lo propio gane sin `!important`.

### 3.1 Lo que sí se usa de Bootstrap

| Grupo          | Clases                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Layout         | `container`, `row`, `col-*`, `py-*`, `mb-*`, `mt-*`, `pt-*`                                                  |
| Flex y espacio | `d-flex`, `align-items-center`, `justify-content-between`, `gap-*`, `flex-fill`, `flex-wrap`                 |
| Botones        | `btn`, `btn-sm`, `btn-outline-light`, `btn-outline-danger`                                                   |
| Formularios    | `form-control`, `form-select`, `form-select-sm`, `form-label`, `form-text`, `is-invalid`, `invalid-feedback` |
| Avisos y carga | `alert`, `alert-danger`, `alert-success`, `spinner-border`, `spinner-border-sm`, `text-warning`              |
| Progreso       | `progress`, `progress-bar` (solo CSS; el ancho del relleno es la única excepción a los estilos en línea)     |
| Texto          | `text-secondary`, `text-center`, `fw-semibold`, `small`, `visually-hidden`                                   |

## // 4. Tokens

Viven en el bloque `:root` de `src/index.css`. La columna «Hoy» dice si ya es variable o si el color está escrito suelto en el CSS de E1 (deuda DH-02). Todo código nuevo usa el nombre del token.

### 4.1 Color

| Token                                         | Valor                     | Uso                                                      | Hoy      |
| --------------------------------------------- | ------------------------- | -------------------------------------------------------- | -------- |
| `--fondo`                                     | `#0e0d12`                 | Fondo de la página                                       | variable |
| `--superficie`                                | `#18161f`                 | Tarjetas, paneles y campos                               | variable |
| `--superficie-alta`                           | `#23202b`                 | Fondo del póster vacío y de elementos sobre una tarjeta  | suelto   |
| `--borde`                                     | `#2a2733`                 | Bordes de tarjetas, paneles y campos                     | variable |
| `--texto`                                     | `#f2efe8`                 | Texto principal                                          | variable |
| `--texto-suave`                               | `#a39fae`                 | Texto secundario, metadatos y ayudas                     | variable |
| `--acento`                                    | `#f5b829`                 | Botón principal, píldora activa, foco y estrellas llenas | variable |
| `--acento-hover`                              | `#ffcb4a`                 | Hover del botón principal                                | variable |
| `--sobre-acento`                              | `#1a1400`                 | Texto sobre el acento                                    | suelto   |
| `--acento-suave`                              | `rgba(245, 184, 41, 0.2)` | Anillo de foco de los campos                             | suelto   |
| `--peligro`                                   | `#e5484d`                 | Errores de validación y texto de error                   | variable |
| `--peligro-fondo`                             | `rgba(229, 72, 77, 0.1)`  | Fondo del estado de error                                | suelto   |
| `--peligro-borde`                             | `rgba(229, 72, 77, 0.4)`  | Borde del estado de error                                | suelto   |
| `--exito`                                     | `#7fd39b`                 | Texto de «En tu lista» y confirmaciones                  | suelto   |
| `--exito-borde`                               | `#3a6b4a`                 | Borde de «En tu lista»                                   | suelto   |
| `--estado-por-ver` / `--estado-por-ver-fondo` | `#d9d2f5` / `#3b3550`     | Insignia «Por ver»                                       | suelto   |
| `--estado-vista` / `--estado-vista-fondo`     | `#b8f0cb` / `#1f5134`     | Insignia «Vista»                                         | suelto   |
| `--estrella-vacia`                            | `#4a4656`                 | Estrella sin llenar                                      | suelto   |

La insignia «Viendo» usa `--acento` con `--sobre-acento`.

Contrastes comprobados (WCAG 2.1):

| Combinación                                       | Contraste | Nivel |
| ------------------------------------------------- | --------- | ----- |
| `--texto` sobre `--superficie`                    | 15,6:1    | AAA   |
| `--texto-suave` sobre `--superficie`              | 6,9:1     | AA    |
| `--sobre-acento` sobre `--acento`                 | 10,3:1    | AAA   |
| `--acento` sobre `--superficie`                   | 10,0:1    | AAA   |
| `--peligro` sobre `--superficie`                  | 4,6:1     | AA    |
| `--exito` sobre `--superficie`                    | 10,0:1    | AAA   |
| `--estado-por-ver` sobre `--estado-por-ver-fondo` | 8,0:1     | AAA   |
| `--estado-vista` sobre `--estado-vista-fondo`     | 7,2:1     | AAA   |

`--estrella-vacia` sobre `--superficie` da 2,0:1. Es aceptable solo porque la calificación también se anuncia con texto (`aria-label`), nunca como única señal.

### 4.2 Tipografía

Se cargan de Google Fonts en `index.html`, con `display=swap`.

| Uso                                       | Fuente                                         | Tamaño           |
| ----------------------------------------- | ---------------------------------------------- | ---------------- |
| Marca «Mi Cartelera»                      | Bebas Neue, espaciado 0.04em, color `--acento` | 1.5rem           |
| Título de pantalla (`titulo-seccion`)     | Bebas Neue, espaciado 0.04em                   | 2.4rem           |
| Subtítulo de bloque (`subtitulo-detalle`) | Bebas Neue                                     | 1.6rem           |
| Texto, botones y campos                   | Inter 400, 500 y 600                           | 1rem (Bootstrap) |
| Metadatos y ayudas                        | Inter, `--texto-suave`                         | 0.8rem a 0.9rem  |
| Cifras (`cifra`)                          | Inter con `tabular-nums`                       | el del contexto  |

### 4.3 Forma y espacio

- Radios: 12px en tarjetas y estado de error, 16px en paneles grandes, 999px en píldoras e insignias.
- El espacio sale de los utilitarios de Bootstrap (`gap-2`, `mb-3`, `py-4`). En CSS propio se usa `rem`, en pasos de 0.25rem.
- Movimiento: solo `transition` de 0.2s en hover de tarjetas. Con `prefers-reduced-motion: reduce` no se anima nada nuevo.

## // 5. Layout

- **Barra superior** fija (`barra-usuario`): marca y navegación a la izquierda, correo y «Cerrar sesión» a la derecha. Se envuelve en pantallas angostas.
- **Contenido** en `main.container.py-4`. Cada pantalla abre con un `h1.titulo-seccion`.
- **Grilla de pósters** (`grilla-titulos`): `repeat(auto-fill, minmax(150px, 1fr))`; en menos de 576px, dos columnas.
- **Pantallas con panel lateral:** `row` de Bootstrap con `col-lg-8` y `col-lg-4`. Por debajo de 992px, una sola columna en el mismo orden.
- Nunca hay scroll horizontal, ni a 390px de ancho.

## // 6. Componentes

Las clases propias van en español y en kebab-case.

### 6.1 Botón

| Variante    | Clases                                         | Uso                                                                         |
| ----------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| Principal   | `btn btn-acento`                               | Una acción principal por bloque: «Buscar», «Guardar cambios», «Ir a buscar» |
| Secundario  | `btn btn-outline-light` (`btn-sm` en tarjetas) | Acciones de apoyo: «Detalle», «Reintentar», «Cerrar sesión»                 |
| Destructivo | `btn btn-outline-danger`                       | Eliminar, siempre con confirmación                                          |
| Ya hecho    | `btn btn-en-lista` deshabilitado               | Estado que no se repite: «✓ En tu lista»                                    |
| De texto    | `boton-texto`                                  | Enlaces dentro de un párrafo: «Volver», «Crear cuenta»                      |

Mientras una acción se envía, el botón se deshabilita y cambia su texto («Guardando...»). El principal deshabilitado conserva `--acento` con opacidad 0.65. Hoy E1 no lo cumple porque `.btn:disabled` de Bootstrap le gana a `.btn-acento` (deuda DH-10).

### 6.2 Píldoras de navegación y de filtro

- Navegación (`navegacion button`): transparente con `--texto-suave`; la activa lleva fondo `--acento`, texto `--sobre-acento` y `aria-current="page"`.
- Filtros (`filtros button`): fondo `--superficie` con `--borde`; el activo lleva `--acento` y `aria-pressed="true"`. Muestran su conteo entre paréntesis.

### 6.3 Tarjeta de título

`tarjeta-titulo`: póster 2:3 arriba (botón que abre el detalle), insignia de estado en la esquina superior izquierda y debajo el cuerpo con nombre, metadato (tipo o duración), estrellas y acciones. Fondo `--superficie`, `--borde`, radio 12px. En hover sube 3px y el borde pasa a `--acento`.

### 6.4 Póster

`Poster`: imagen 2:3 con `alt` «Póster de …». Sin imagen, un recuadro `--superficie-alta` con el título en Bebas Neue.

### 6.5 Insignia de estado

`badge-estado` con texto obligatorio, en píldora: `badge-por-ver`, `badge-viendo` y `badge-vista`. No se usan los `badge` de Bootstrap.

### 6.6 Campo de formulario

- `form-control` o `form-select` de Bootstrap dentro de un contenedor propio que pone fondo `--superficie`, borde `--borde` y texto `--texto`.
- Foco: borde `--acento` y anillo `--acento-suave`.
- Error: `is-invalid` en el campo, mensaje debajo en `invalid-feedback` o `texto-validacion`, `aria-invalid="true"` y `aria-describedby` hacia el mensaje.

### 6.7 Panel

`panel-personal`: bloque destacado con fondo `--superficie`, `--borde`, radio 16px y relleno 1.5rem. Agrupa un formulario o un resumen.

### 6.8 Estados de una pantalla

| Estado              | Cómo se ve                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Cargando            | `spinner-border text-warning` con un texto en `text-secondary`, dentro de un contenedor con `role="status"`       |
| Error               | `EstadoError`: caja `estado-error` (`--peligro-fondo`, `--peligro-borde`) con `role="alert"` y botón «Reintentar» |
| Vacío               | `lista-vacia`: título, una frase de ayuda y un botón principal que lleva a donde se resuelve                      |
| Aviso de una acción | `alert alert-danger py-2` o `alert alert-success py-2`, debajo del bloque que lo produjo                          |

### 6.9 Barra de tiempo (E2)

Muestra cuánto del tiempo disponible ocupa la sesión.

- `progress` de Bootstrap con fondo `--superficie-alta` y relleno `--acento`. Si la sesión no cabe, el relleno pasa a `--peligro` y ocupa todo el ancho.
- Debajo, en una línea con la clase `cifra`: «Ocupa 3 h 31 min de 4 h · Quedan 29 min». Si hay pausas: «incluye 1 pausa de 10 min», en `--texto-suave`.
- Accesibilidad: `role="progressbar"` con `aria-valuemin="0"`, `aria-valuemax` igual al tiempo disponible, `aria-valuenow` igual a lo que ocupa y `aria-label="Tiempo de la sesión"`. El texto de abajo dice lo mismo, así que el color nunca es la única señal.

### 6.10 Tarjeta de candidata (E2)

Variante de la Tarjeta de título (6.3) para las películas que caben.

- Póster, título y la duración en el lugar del metadato, con la clase `cifra`.
- Acción: botón secundario `btn-sm` «Agregar». Si ya está en la sesión, el botón «Ya hecho» con «✓ En la sesión».
- Si no cabe en lo que queda, debajo del botón se lee «No cabe en lo que queda» en `--texto-suave`. El botón sigue activo para que, al presionarlo, el aviso explique cuánto necesita.
- No lleva insignia de estado: todas son «por ver».

### 6.11 Lista de no disponibles (E2)

Lista simple debajo de las candidatas, con el subtítulo «No disponibles». Cada fila: título en `--texto` y su motivo en `--texto-suave`. Sin póster ni botón, porque no se pueden agregar.

### 6.12 Panel de sesión (E2)

Usa el Panel (6.7). A 992px o más va en la columna derecha (`col-lg-4`) y se queda visible al bajar (`position: sticky`). Orden fijo de arriba abajo:

1. Subtítulo «Tu sesión» en el estilo de `subtitulo-detalle`.
2. Lista ordenada (`ol`) de películas: título, duración en `cifra` y botón de texto «Quitar». Entre dos películas, una fila «Pausa · 10 min» en `--texto-suave`.
3. Barra de tiempo (6.9).
4. Campo de formulario (6.6) «Nombre (opcional)».
5. Botón principal «Guardar sesión» y botón secundario «Llenar mi noche», con los avisos debajo.

Vacío: «Agrega películas de la lista para armar tu noche.» en `--texto-suave`.

### 6.13 Tarjeta de sesión guardada (E2)

Una sesión guardada en «Mis sesiones», hecha con `details` y `summary` nativos (sin JavaScript de Bootstrap).

- Cerrada: nombre o «Noche del …» en peso 600, y debajo, en `cifra` y `--texto-suave`: «2 películas · 3 h 31 min de 4 h · guardada el 7 de noviembre».
- Abierta: la misma lista ordenada del Panel de sesión, sin «Quitar». Una película que ya no está en la lista lleva el texto «Ya no está en tu lista».
- Acción: botón destructivo `btn-sm` «Borrar sesión», con confirmación.
- Fondo `--superficie`, `--borde`, radio 12px. El foco del `summary` es visible.

## // 7. Accesibilidad

- Contraste mínimo AA (4,5:1 en texto). Los tokens de la sección 4.1 ya lo cumplen.
- Foco visible en todo control. Nunca `outline: none` sin reemplazo.
- Todo lo que se toca mide al menos 44 × 44 px (WCAG 2.5.5): botones, campos, píldoras, estrellas y botones de texto. Lo aplica `src/styles/controles.css` en toda la app. Se agregó por el comentario del profesor al Entregable 3 («algunos botones y controles son pequeños»).
- Toda acción se puede hacer solo con teclado, en el orden en que se lee.
- Botones de íconos o repetidos llevan `aria-label` con el título («Eliminar Dune»).
- `lang="es"` en `index.html`.

## // 8. Reglas para el agente

**Haz:**

- Usa primero las clases de Bootstrap de la sección 3.1 y después los componentes de la sección 6.
- Usa solo tokens: `var(--acento)`, `var(--superficie)`. Si falta un color, agrégalo primero aquí y en `:root`.
- Pon el CSS de una pantalla nueva en su propio archivo en `src/styles/` e impórtalo desde `main.tsx`, después de `index.css`.
- Comprueba la pantalla a 1280px y a 390px de ancho.

**No hagas:**

- No escribas colores hexadecimales ni `rgba()` fuera de `:root`.
- No agregues Tailwind, otra librería de componentes, CSS-in-JS ni el JavaScript de Bootstrap.
- No uses estilos en línea (`style={…}`), salvo el ancho del relleno de una barra de progreso.
- No cambies los colores de Bootstrap con `--bs-*` ni uses `!important`.
- No agregues fuentes, sombras decorativas, gradientes nuevos ni iconos de librerías.
- No cambies la apariencia de las pantallas de E1 en una tarea de E2.

## // 9. Criterios verificables de diseño

| #    | Criterio                                                                                                                 | Cómo se comprueba                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| D-01 | Ningún archivo de `src/styles/` ni de `src/components/` contiene un color hexadecimal o `rgba()`.                        | Comando: `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgba?\(" src/styles src/components` no lista nada |
| D-02 | No hay estilos en línea, salvo el ancho del relleno de una barra de progreso.                                            | Comando: `grep -rn "style={" src`                                                           |
| D-03 | `index.html` solo carga `bootstrap.min.css` de Bootstrap, sin su JavaScript ni otra librería de UI.                      | Comando: `grep -n "bootstrap\|tailwind" index.html package.json`                            |
| D-04 | Cada bloque tiene como máximo un botón principal `btn-acento`; eliminar usa `btn-outline-danger`.                        | Revisión de código y navegador                                                              |
| D-05 | Todo estado de una película se muestra con texto, no solo con color.                                                     | Navegador                                                                                   |
| D-06 | La carga muestra `spinner-border text-warning` con texto y `role="status"`; el error usa `EstadoError` con «Reintentar». | Navegador y revisión de código                                                              |
| D-07 | Cada pantalla abre con un `h1.titulo-seccion` y las duraciones usan la clase `cifra`.                                    | Revisión de código                                                                          |
| D-08 | Al recorrer la pantalla con Tab, todo control muestra el foco.                                                           | Navegador, solo con teclado                                                                 |
| D-09 | A 1280px se ven el contenido y el panel lado a lado; a 390px, una columna sin scroll horizontal.                         | Navegador, modo responsive                                                                  |
| D-10 | Una sección nueva aparece en la barra con la misma píldora activa que «Buscar» y «Mi lista».                             | Navegador                                                                                   |
| D-11 | Un campo con error tiene `is-invalid`, el mensaje debajo, `aria-invalid="true"` y `aria-describedby`.                    | Navegador e inspector                                                                       |
| D-12 | Las pantallas de E1 se ven igual que antes de la épica, salvo los arreglos registrados en `docs/AUDITORIA.md`.           | Navegador, contra `docs/capturas/`                                                          |
| D-13 | Ningún control mide menos de 44 × 44 px.                                                                                 | Navegador: medir con el inspector, o el script de medición de `docs/VERIFICACION.md` (V-49) |
