# // E2 · Registro del refinamiento con la IA

Patrón «poke-holes»: primero se escribió el camino feliz de cada historia (los criterios con los datos de ejemplo). Después se le pidió al agente, en plan mode, que actuara como socio de producto escéptico y buscara casos borde, supuestos y escenarios faltantes. Cada caso propuesto quedó aceptado o rechazado con su razón, y Justin revisa estas decisiones. Los aceptados pasaron al PRD como regla (R2.12 en adelante) y a los criterios.

Prompt usado:

> Estás en plan mode: no modifiques archivos. Lee docs/prd/mi-cartelera.md y docs/backlog/E2-noche-de-pelicula.md. Actúa como socio de producto escéptico. Para la épica E2 dame los casos borde, supuestos y escenarios que faltan, uno por línea, con la pregunta que habría que hacerle al cliente. No propongas soluciones técnicas.

## // Casos aceptados

**RF-01 · «Decir cuánto tiempo tengo» no es una historia.** Sola no le da valor a la persona.
Aceptado: se juntó con «Ver qué cabe» en H2.1. Las historias pasaron de seis a cinco.

**RF-02 · Tiempo con decimales, negativo, vacío o con letras.** La ficha dice «número entero» pero no qué pasa con lo demás.
Aceptado: todo lo que no sea un entero entre 30 y 600 se rechaza con un mensaje y no se consulta nada. → CA-2.1.4, CA-2.1.5.

**RF-03 · Películas que duran más que todo el tiempo.** ¿Se muestran, se esconden o se cuentan?
Aceptado: no aparecen entre las que caben, pero la app dice cuántas son, para que la persona no piense que se perdieron. → R2.16, CA-2.1.2.

**RF-04 · Falla la consulta de una película, no de todas.** No es lo mismo que «sin duración».
Aceptado: esa película aparece como no disponible con un motivo distinto, y las demás se usan normal. Si fallan todas, es un error de pantalla con «Reintentar». → R2.17, CA-2.1.9, CA-2.1.10.

**RF-05 · Agregar una película que no cabe en lo que queda, aunque sí cabía en el tiempo total.** La pausa cambia la cuenta: la segunda película trae 10 minutos más.
Aceptado: no se agrega, y el mensaje dice cuánto necesita, con la pausa separada, y cuánto queda. → R2.12, CA-2.2.3.

**RF-06 · La misma película dos veces en una sesión.**
Aceptado: no se permite dentro de una sesión, aunque sí en sesiones distintas (R2.7). → CA-2.2.6.

**RF-07 · Cambiar el tiempo disponible con la sesión ya armada.** La sesión puede dejar de caber.
Aceptado: la app lo avisa y no deja guardar hasta que vuelva a caber. No quita películas sola, porque no sabría cuál quiere quitar la persona. → R2.14, CA-2.2.8.

**RF-08 · Guardar una sesión vacía.**
Aceptado: no se puede; una sesión sin películas no es un plan. → R2.13, CA-2.3.4.

**RF-09 · Doble clic en «Guardar».**
Aceptado: se guarda una sola sesión. → CA-2.3.7.

**RF-10 · Alguien guarda una sesión saltándose la pantalla** (por ejemplo, con la consola del navegador) con duraciones falsas, una película que no es suya o que no está «por ver».
Aceptado: la sesión no se guarda si no cabe o si sus películas no están «por ver» en la lista de esa persona. → R2.15, CA-2.3.8. Límite conocido: la duración la manda la app; el sistema no la vuelve a pedir a TMDB al guardar. Queda registrado en la auditoría.

**RF-11 · Muchas películas «por ver».** Consultar la duración de cada una puede tardar o chocar con el límite de TMDB.
Aceptado como supuesto (menos de 100 películas) y riesgo R-01 del estado inicial. La spec limita cuántas consultas salen a la vez.

**RF-12 · Lista sin películas «por ver», o ninguna que quepa.**
Aceptado: mensajes distintos para cada caso, y en el primero, la opción de ir a buscar. → CA-2.1.11, CA-2.1.12.

**RF-13 · Qué pasa con la sesión armada después de guardar.**
Aceptado: se vacía para armar otra y el tiempo se mantiene, porque lo normal es planear varias noches seguidas. → CA-2.3.9.

**RF-14 · Empates en el orden de lo que cabe.**
Aceptado: con la misma duración, por título alfabético, para que el orden no cambie entre visitas. → R2.8, CA-2.1.3.

**RF-15 · Empates en «Llenar mi noche».**
Aceptado: entre combinaciones que ocupan lo mismo, la de menos películas, porque tiene menos pausas y menos cambios. → CA-2.5.2.

## // Casos rechazados

**RF-16 · Descontar los créditos finales de la duración.**
Rechazado: TMDB no da la duración sin créditos y el cliente pidió usar la de TMDB (R2.5). Queda como supuesto.

**RF-17 · Pausa configurable** (5, 15 o 20 minutos).
Rechazado: el cliente decidió 10 minutos fijos. Va en el no-alcance.

**RF-18 · Incluir películas en estado «viendo»,** porque la persona podría querer terminarlas.
Rechazado: el cliente decidió solo «por ver» (R2.2). Además, de una película a medias no se sabe cuánto falta.

**RF-19 · Guardar la duración en la lista para no consultar TMDB cada vez.**
Rechazado para esta épica: cambia la tabla de E1 y su flujo de agregar, y el Proyecto 3 no se reescribe. Queda como mejora en la deuda.

**RF-20 · Actualizar la duración de una sesión guardada si TMDB la cambia.**
Rechazado: la sesión guarda lo que se planeó (R2.10). Un cambio de TMDB después no la toca.

**RF-21 · Reordenar las películas dentro de la sesión.**
Rechazado: el orden es el de agregado y basta con quitar y volver a agregar. No cambia si la sesión cabe.

**RF-22 · Recordar el tiempo disponible entre visitas.**
Rechazado: es un dato de esa noche. Guardarlo daría un número viejo la próxima vez.

**RF-23 · Avisar si la sesión termina muy tarde según la hora actual.**
Rechazado: es un recordatorio con hora, y recordatorios y calendarios están en el no-alcance.

**RF-24 · Sugerir películas del catálogo que llenen el tiempo que sobra.**
Rechazado: recomendar fuera de la lista está en el no-alcance. «Llenar mi noche» solo usa la lista.
