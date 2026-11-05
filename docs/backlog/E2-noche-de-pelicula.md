# // E2 · Noche de película · Historias y criterios

Reglas de referencia: R2.1 a R2.18 del PRD (`docs/prd/mi-cartelera.md`). Los criterios hablan de lo que la persona ve y hace, sin detalle técnico.

**Datos de ejemplo** que usan los criterios. La lista «por ver» de la persona tiene estas películas, con la duración que da TMDB:

- Up · 96 min (1 h 36 min)
- Coco · 105 min (1 h 45 min)
- Her · 126 min (2 h 6 min)
- Dune · 155 min (2 h 35 min)
- Cortometraje perdido · TMDB no tiene su duración

Además tiene la serie «Dark» en «por ver», la película «Alien» en «viendo» y la película «Psicosis» en «vista».

## // H2.1 · Ver qué películas caben en mi tiempo libre

**Como** usuario de Mi Cartelera, **quiero** decir cuántos minutos libres tengo y ver qué películas de mi lista «por ver» caben, **para** no empezar una que no alcanzo a terminar.

Prioridad: Must · Estado: refinada

- **CA-2.1.1** DADO que tengo los datos de ejemplo, CUANDO digo que tengo 120 minutos, ENTONCES veo Up (1 h 36 min) y Coco (1 h 45 min), en ese orden, y no veo Her ni Dune.
- **CA-2.1.2** DADO que tengo los datos de ejemplo, CUANDO digo que tengo 120 minutos, ENTONCES veo un aviso de que 2 películas duran más que mi tiempo.
- **CA-2.1.3** DADO que dos películas duran lo mismo, CUANDO aparecen entre las que caben, ENTONCES se ordenan por título alfabéticamente.
- **CA-2.1.4** DADO que estoy en la Noche de película, CUANDO escribo 29, 601, 90.5, «abc» o dejo el campo vacío, ENTONCES veo un mensaje que me pide un número entero de minutos entre 30 y 600, y no se muestra ninguna película.
- **CA-2.1.5** DADO que estoy en la Noche de película, CUANDO escribo 30 o 600, ENTONCES la app los acepta y me muestra lo que cabe.
- **CA-2.1.6** DADO que Cortometraje perdido no tiene duración en TMDB, CUANDO veo qué cabe, ENTONCES aparece como no disponible con el motivo «TMDB no tiene su duración, así que no se puede agregar».
- **CA-2.1.7** DADO que tengo la serie Dark «por ver», Alien «viendo» y Psicosis «vista», CUANDO veo qué cabe con 600 minutos, ENTONCES ninguna de las tres aparece.
- **CA-2.1.8** DADO que la app está consultando las duraciones, CUANDO entro a la Noche de película, ENTONCES veo un indicador de carga con el texto «Consultando duraciones en TMDB…».
- **CA-2.1.9** DADO que no se pudo consultar ninguna duración, CUANDO termina la consulta, ENTONCES veo un mensaje de error con la opción «Reintentar».
- **CA-2.1.10** DADO que no se pudo consultar la duración de una sola película, CUANDO veo qué cabe, ENTONCES esa película aparece como no disponible con el motivo «No se pudo consultar su duración en TMDB» y las demás se muestran normal.
- **CA-2.1.11** DADO que no tengo películas «por ver», CUANDO entro a la Noche de película, ENTONCES veo un mensaje que me lo dice y la opción de ir a buscar.
- **CA-2.1.12** DADO que tengo los datos de ejemplo, CUANDO digo que tengo 60 minutos, ENTONCES veo «Ninguna de tus películas por ver cabe en 1 h» y el aviso de que 4 duran más.
- **CA-2.1.13** DADO que no inicié sesión, CUANDO abro la app, ENTONCES no puedo llegar a la Noche de película.

## // H2.2 · Armar una sesión con las que caben

**Como** usuario de Mi Cartelera, **quiero** agregar y quitar películas a mi sesión viendo cuánto dura y cuánto tiempo me queda, **para** saber que voy a terminar todo lo que empiece.

Prioridad: Must · Estado: refinada

- **CA-2.2.1** DADO que tengo 240 minutos y la sesión vacía, CUANDO agrego Up, ENTONCES la sesión dura 1 h 36 min, sin pausas, y me quedan 2 h 24 min.
- **CA-2.2.2** DADO que tengo 240 minutos y Up en la sesión, CUANDO agrego Coco, ENTONCES la sesión dura 3 h 31 min (96 + 10 de pausa + 105), dice que incluye 1 pausa de 10 min, y me quedan 29 min.
- **CA-2.2.3** DADO que tengo 240 minutos con Up y Coco en la sesión, CUANDO intento agregar Her, ENTONCES no se agrega y veo «No cabe: necesita 136 min (126 + 10 de pausa) y te quedan 29 min».
- **CA-2.2.4** DADO que tengo 211 minutos y la sesión vacía, CUANDO agrego Up y después Coco, ENTONCES las dos se agregan, la sesión dura 3 h 31 min y me quedan 0 min.
- **CA-2.2.5** DADO que tengo 240 minutos con Up y Coco en la sesión, CUANDO quito Up, ENTONCES la sesión dura 1 h 45 min, sin pausas, y me quedan 2 h 15 min.
- **CA-2.2.6** DADO que Up ya está en la sesión, CUANDO la veo entre las que caben, ENTONCES dice «En la sesión» y no la puedo agregar otra vez.
- **CA-2.2.7** DADO que Cortometraje perdido no tiene duración, CUANDO busco cómo agregarlo, ENTONCES no tiene opción de agregar y su motivo sigue visible.
- **CA-2.2.8** DADO que tengo 240 minutos con Up y Coco en la sesión, CUANDO cambio mi tiempo a 200, ENTONCES veo «Tu sesión dura 3 h 31 min y tienes 3 h 20 min. Quita películas para que quepa.» y no puedo guardarla.
- **CA-2.2.9** DADO que tengo películas en la sesión, CUANDO la miro, ENTONCES veo sus películas en el orden en que las agregué, con su duración y la pausa entre cada una.

## // H2.3 · Guardar la sesión para esa noche

**Como** usuario de Mi Cartelera, **quiero** guardar la sesión que armé, con un nombre si quiero, **para** tenerla lista cuando llegue la noche.

Prioridad: Must · Estado: refinada

- **CA-2.3.1** DADO que armé una sesión con Up y Coco en 240 minutos, CUANDO la guardo con el nombre «Viernes de Pixar», ENTONCES veo «Sesión guardada» y aparece en mis sesiones con ese nombre, 2 películas y 3 h 31 min de 4 h.
- **CA-2.3.2** DADO que armé una sesión, CUANDO la guardo sin nombre, ENTONCES aparece en mis sesiones como «Noche del» y la fecha de hoy.
- **CA-2.3.3** DADO que armé una sesión, CUANDO escribo un nombre de más de 60 caracteres, ENTONCES veo «El nombre puede tener máximo 60 caracteres» y no se guarda.
- **CA-2.3.4** DADO que la sesión está vacía, CUANDO quiero guardarla, ENTONCES no puedo y veo «Agrega al menos una película para guardar la sesión».
- **CA-2.3.5** DADO que guardé una sesión con Up y Coco, CUANDO abro Mi lista, ENTONCES Up y Coco siguen «por ver».
- **CA-2.3.6** DADO que se cayó la conexión, CUANDO guardo, ENTONCES veo un mensaje de error y la sesión armada sigue ahí para intentar otra vez.
- **CA-2.3.7** DADO que presiono «Guardar sesión» dos veces seguidas, CUANDO termina, ENTONCES se guarda una sola sesión.
- **CA-2.3.8** DADO que alguien intenta guardar, sin pasar por la pantalla, una sesión que no cabe o con una película que no está «por ver» en su lista, CUANDO la envía, ENTONCES la sesión no se guarda.
- **CA-2.3.9** DADO que guardé una sesión, CUANDO termina el guardado, ENTONCES la sesión armada se vacía para empezar otra, y el tiempo disponible se mantiene.

## // H2.4 · Consultar y borrar mis sesiones guardadas

**Como** usuario de Mi Cartelera, **quiero** ver mis sesiones guardadas con su detalle y borrar las que ya no me sirven, **para** saber qué planeé ver.

Prioridad: Must · Estado: refinada

- **CA-2.4.1** DADO que tengo sesiones guardadas, CUANDO abro «Mis sesiones», ENTONCES las veo de la más reciente a la más antigua, cada una con su nombre o su fecha, cuántas películas tiene, cuánto dura y de cuánto tiempo era.
- **CA-2.4.2** DADO que tengo la sesión «Viernes de Pixar», CUANDO abro su detalle, ENTONCES veo Up y Coco en orden, con su duración, la pausa entre ellas y el total.
- **CA-2.4.3** DADO que la sesión «Viernes de Pixar» tiene Up, CUANDO quito Up de Mi lista y vuelvo a ver la sesión, ENTONCES la sesión sigue igual y Up dice «Ya no está en tu lista».
- **CA-2.4.4** DADO que tengo la sesión «Viernes de Pixar», CUANDO la borro y confirmo, ENTONCES desaparece de mis sesiones y Up y Coco siguen en Mi lista.
- **CA-2.4.5** DADO que guardé Up en la sesión del viernes, CUANDO armo otra sesión, ENTONCES puedo agregar Up otra vez y guardarla.
- **CA-2.4.6** DADO que la cuenta A y la cuenta B tienen sesiones, CUANDO A abre «Mis sesiones», ENTONCES solo ve las suyas, y no puede ver ni borrar las de B aunque lo intente sin pasar por la pantalla.
- **CA-2.4.7** DADO que no tengo sesiones guardadas, CUANDO abro «Mis sesiones», ENTONCES veo «Todavía no guardas ninguna sesión».
- **CA-2.4.8** DADO que no se pudieron cargar mis sesiones, CUANDO abro «Mis sesiones», ENTONCES veo un mensaje de error con «Reintentar».
- **CA-2.4.9** DADO que tengo una sesión guardada, CUANDO la miro, ENTONCES no tengo forma de cambiar sus películas, su nombre ni su tiempo.

## // H2.5 · Llenar mi noche (opcional)

**Como** usuario de Mi Cartelera, **quiero** que la app me proponga una combinación de películas que aproveche mi tiempo, **para** no probar combinaciones a mano.

Prioridad: Could · Estado: refinada

- **CA-2.5.1** DADO que tengo 240 minutos y los datos de ejemplo, CUANDO presiono «Llenar mi noche», ENTONCES la sesión queda con Up y Her, dura 3 h 52 min y me quedan 8 min, porque es la combinación que deja menos tiempo libre.
- **CA-2.5.2** DADO que dos combinaciones ocupan el mismo tiempo, CUANDO presiono «Llenar mi noche», ENTONCES elige la que tiene menos películas.
- **CA-2.5.3** DADO que ya tenía películas en la sesión, CUANDO presiono «Llenar mi noche», ENTONCES la propuesta reemplaza la sesión armada y veo cuántas películas puso y cuánto ocupa.
- **CA-2.5.4** DADO que tengo 60 minutos y los datos de ejemplo, CUANDO presiono «Llenar mi noche», ENTONCES veo que ninguna película cabe y la sesión no cambia.
- **CA-2.5.5** DADO que hay películas sin duración, CUANDO presiono «Llenar mi noche», ENTONCES la propuesta nunca las incluye.

## // INVEST

| Historia | I   | N   | V   | E   | S   | T   | Nota                                                                          |
| -------- | --- | --- | --- | --- | --- | --- | ----------------------------------------------------------------------------- |
| H2.1     | Sí  | Sí  | Sí  | Sí  | Sí  | Sí  | Sola ya sirve: la persona sabe qué ver aunque no guarde nada.                 |
| H2.2     | Sí  | Sí  | Sí  | Sí  | Sí  | Sí  | Depende de que existan candidatas (H2.1), pero se prueba con cualquier lista. |
| H2.3     | Sí  | Sí  | Sí  | Sí  | Sí  | Sí  | Necesita una sesión armada; el valor es tenerla después.                      |
| H2.4     | Sí  | Sí  | Sí  | Sí  | Sí  | Sí  | Se puede probar con sesiones creadas desde la base.                           |
| H2.5     | Sí  | Sí  | Sí  | Sí  | Sí  | Sí  | Opcional; no bloquea a ninguna otra.                                          |

La primera versión del backlog tenía «Decir cuánto tiempo tengo» como historia aparte. No pasaba la V de INVEST, porque sola no le da nada a la persona, así que se juntó con «Ver qué cabe» en H2.1 (ver el refinamiento, caso RF-01).
