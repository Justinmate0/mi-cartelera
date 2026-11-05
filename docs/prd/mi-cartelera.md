# // PRD · Mi Cartelera Personal

Versión 2.1 (después del refinamiento) · noviembre 2026 · Justin Peñafiel

Este documento describe el producto completo en lenguaje de producto. E1 es lo que ya está construido (Proyecto 3). E2, «Noche de película», es lo nuevo. Cómo se construye cada cosa vive en `docs/specs/`.

## // 1. Problema

Quien sigue películas y series acumula títulos «para después» en notas, capturas o de memoria, y los pierde. Mi Cartelera resolvió eso en su primera versión: una lista personal con lo que quiere ver, lo que está viendo y lo que ya vio.

Pero tener la lista no basta. La persona tiene muchas películas «por ver» y, cuando por fin tiene un rato libre, no sabe cuáles caben en ese tiempo. Empieza una de dos horas y media con una hora y media libre, y la deja a medias.

## // 2. Usuarios

- **Usuario de Mi Cartelera:** una persona con cuenta propia que guarda y sigue sus títulos. Usa la app sola, en computadora o celular.
- No hay roles. Cada cuenta ve y maneja solo lo suyo.
- No son usuarios de esta versión: grupos de amigos, familias que comparten cuenta ni administradores.

## // 3. Objetivo y éxito

- **E1:** que la persona tenga en un solo lugar todo lo que quiere ver y su avance.
- **E2:** que la persona termine lo que empieza. Cuando tiene un rato libre, elige películas que de verdad caben.
- **Cómo se mide el éxito de E2:** de las sesiones guardadas, al menos el 80 % tiene todas sus películas marcadas como «vista» dentro de los 7 días siguientes. [SUPUESTO: el cliente pidió «que termine lo que empieza» sin un número; el 80 % y los 7 días son una propuesta a confirmar. Medirlo necesita que la persona marque sus películas como vistas, cosa que E1 ya permite.]

## // 4. Alcance

### E1 · Mi lista (construida en el Proyecto 3)

- **H1.1 Acceso:** crear cuenta, iniciar y cerrar sesión. Sin sesión no se ve nada de la app.
- **H1.2 Buscar:** buscar películas y series del catálogo de TMDB por nombre.
- **H1.3 Guardar:** agregar un título a la lista, que entra como «por ver». Un título no se repite.
- **H1.4 Seguir:** cambiar el estado («por ver», «viendo», «vista»), calificar de 1 a 5 y comentar.
- **H1.5 Ordenar y filtrar:** ver la lista por estado, ordenada, con un resumen de cuántos hay de cada uno.
- **H1.6 Detalle:** ver sinopsis, géneros, duración, nota y elenco de un título.
- **H1.7 Quitar:** eliminar un título de la lista, con confirmación.

### E2 · Noche de película (nueva)

- **H2.1 Ver qué cabe en mi tiempo libre:** decir los minutos libres y ver qué películas «por ver» caben, cada una con su duración, y cuáles no se pueden usar y por qué.
- **H2.2 Armar la sesión:** agregar y quitar películas, viendo siempre cuánto dura la sesión y cuánto tiempo queda.
- **H2.3 Guardar la sesión:** guardarla para esa noche, con un nombre si se quiere.
- **H2.4 Consultar mis sesiones:** ver las sesiones guardadas con su detalle y borrar las que ya no sirven.
- **H2.5 Llenar mi noche (opcional):** pedir que la app proponga una combinación que aproveche al máximo el tiempo.

## // 5. No-alcance

- Series en la Noche de película. Solo cuentan películas.
- Ver con amigos o compartir sesiones.
- Recordatorios y notificaciones.
- Sincronizar con plataformas de streaming o con calendarios.
- Recomendar películas que no están en la lista de la persona.
- Marcar una sesión como realizada o cambiar el estado de sus películas desde la sesión.
- Configurar la pausa entre películas.

## // 6. Reglas de negocio

### E1 (vigentes)

- **R1.1** Cada persona solo ve, cambia y borra sus propios títulos.
- **R1.2** Un título entra a la lista como «por ver». Sus estados posibles son «por ver», «viendo» y «vista».
- **R1.3** La calificación es un entero de 1 a 5 o queda vacía. El comentario tiene máximo 500 caracteres.
- **R1.4** Un mismo título no se guarda dos veces en la lista de una persona.

### E2 · Decisiones del cliente

- **R2.1 Tiempo disponible:** número entero de minutos, entre 30 y 600, ambos incluidos.
- **R2.2 Qué entra:** solo películas de la lista de la persona en estado «por ver».
- **R2.3 Pausas:** 10 minutos entre una película y la siguiente. No hay pausa antes de la primera ni después de la última. Una sesión de n películas tiene n − 1 pausas.
- **R2.4 Cuándo cabe:** una sesión cabe si la suma de las duraciones más las pausas no supera el tiempo disponible. Si lo ocupa exactamente, sí cabe.
- **R2.5 Duración:** se toma de TMDB. Una película sin duración conocida no se puede agregar, y la app explica por qué.
- **R2.6 Estado:** guardar una sesión no cambia el estado de sus películas: siguen «por ver».

### E2 · Decisiones de Justin (los cinco puntos abiertos)

- **R2.7 Una película puede estar en varias sesiones guardadas.** Cada sesión es un plan para una noche distinta, y si la persona no alcanzó a ver una película el viernes, debe poder ponerla otra vez en el plan del sábado. Prohibirlo la obligaría a borrar el plan viejo. Dentro de una misma sesión, en cambio, una película va una sola vez.
- **R2.8 Las películas que caben se muestran de la más corta a la más larga, y con la misma duración, por título en orden alfabético.** Con poco tiempo, lo primero que sirve es lo más corto, y ese orden ayuda a ver de un vistazo cuántas entran. El orden alfabético hace que la lista no cambie entre una visita y otra.
- **R2.9 Una sesión guardada no se modifica; se puede borrar y armar otra.** Armar una sesión toma segundos, así que editarla no ahorra trabajo, y una sesión que no cambia es un registro claro de lo que se planeó. [SUPUESTO: si las personas piden editar, se considera en una versión siguiente.]
- **R2.10 Si la persona quita de su lista una película que está en una sesión guardada, la sesión se queda como estaba,** con el título y la duración que tenía al guardarse, y la película se marca como «ya no está en tu lista». La sesión es un plan del pasado; borrarla o cambiarla en silencio haría que la persona pierda un plan sin saberlo.
- **R2.11 Una sesión tiene un nombre opcional, de hasta 60 caracteres, y siempre la fecha y hora en que se guardó.** Sin nombre, se muestra con su fecha. El nombre ayuda a distinguir planes («Viernes de terror»); la fecha sirve de orden y de nombre de respaldo.

### E2 · Reglas que salen del refinamiento

Vienen de los casos borde aceptados en `docs/backlog/E2-refinamiento.md`.

- **R2.12** Una película se puede agregar a la sesión solo si cabe en el tiempo que queda, contando la pausa que trae con ella si no es la primera.
- **R2.13** Una sesión necesita al menos una película para guardarse.
- **R2.14** Si la persona cambia el tiempo disponible y la sesión armada ya no cabe, la app lo dice y no deja guardar hasta que vuelva a caber.
- **R2.15** Una sesión que no cumple las reglas R2.1 a R2.4, o con películas que no están «por ver» en la lista de la persona, nunca queda guardada, aunque alguien intente saltarse la pantalla.
- **R2.16** Las películas que duran más que todo el tiempo disponible no aparecen entre las que caben; la app dice cuántas son.
- **R2.17** Si no se pudo consultar la duración de una película, aparece como no disponible con ese motivo, distinto de «sin duración».
- **R2.18** Cada persona solo ve y borra sus propias sesiones.

## // 7. Supuestos

- [SUPUESTO] La duración que da TMDB es la de la película completa, con créditos. No se descuentan los créditos.
- [SUPUESTO] La duración de cada película se consulta cada vez que la persona abre la Noche de película; no se guarda en su lista.
- [SUPUESTO] Las personas tienen menos de 100 películas «por ver». Con más, la consulta de duraciones puede tardar.
- [SUPUESTO] La métrica de éxito de la sección 3.

## // 8. Puntos abiertos

- Confirmar con el cliente el número de la métrica de éxito (80 % en 7 días).
- Si más adelante se permite marcar una sesión como realizada, choca con R2.6 y hay que decidir cuál gana.
- Si las personas piden editar sesiones, revisar R2.9.
