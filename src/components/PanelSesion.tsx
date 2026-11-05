import type { PeliculaConDuracion } from "../dominio/nocheDePelicula.ts";
import {
  PAUSA_ENTRE_PELICULAS,
  cabeEnTiempo,
  duracionSesion,
  formatearDuracion,
  mensajeExcede,
} from "../dominio/nocheDePelicula.ts";

interface PanelSesionProps {
  sesion: PeliculaConDuracion[];
  tiempo: number | null;
  onQuitar: (tmdbId: number) => void;
}

// Panel de sesión (DESIGN.md §6.12): la sesión armada, su barra de tiempo y sus acciones.
const PanelSesion = ({ sesion, tiempo, onQuitar }: PanelSesionProps) => {
  const duraciones = sesion.map((pelicula) => pelicula.duracion);
  const total = duracionSesion(duraciones, PAUSA_ENTRE_PELICULAS);
  const resultado = tiempo === null ? null : cabeEnTiempo(tiempo, duraciones, PAUSA_ENTRE_PELICULAS);
  const excede = resultado !== null && !resultado.cabe && resultado.motivo === "excede";
  const pausas = Math.max(0, sesion.length - 1);

  return (
    <aside className="panel-personal panel-sesion" aria-labelledby="titulo-sesion">
      <h2 id="titulo-sesion" className="subtitulo-detalle">
        Tu sesión
      </h2>

      {sesion.length === 0 ? (
        <p className="text-secondary">Agrega películas de la lista para armar tu noche.</p>
      ) : (
        <ol className="lista-sesion">
          {sesion.map((pelicula, indice) => (
            <li key={pelicula.tmdbId}>
              {indice > 0 && (
                <p className="fila-pausa cifra" aria-label={`Pausa de ${PAUSA_ENTRE_PELICULAS} minutos`}>
                  Pausa · {PAUSA_ENTRE_PELICULAS} min
                </p>
              )}
              <div className="fila-pelicula">
                <span className="nombre-en-sesion">{pelicula.titulo}</span>
                <span className="cifra text-secondary">{formatearDuracion(pelicula.duracion)}</span>
                <button
                  type="button"
                  className="boton-texto"
                  onClick={() => onQuitar(pelicula.tmdbId)}
                  aria-label={`Quitar ${pelicula.titulo} de la sesión`}
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {tiempo !== null && (
        <div className="barra-tiempo">
          <div
            className="progress"
            role="progressbar"
            aria-label="Tiempo de la sesión"
            aria-valuemin={0}
            aria-valuemax={tiempo}
            aria-valuenow={Math.min(total, tiempo)}
          >
            <div
              className={`progress-bar ${excede ? "barra-excede" : "barra-ok"}`}
              style={{ width: `${Math.min(100, (total / tiempo) * 100)}%` }}
            />
          </div>
          <p className="cifra mb-0 mt-2">
            Ocupa {formatearDuracion(total)} de {formatearDuracion(tiempo)}
            {resultado?.cabe && <> · Quedan {formatearDuracion(resultado.restante)}</>}
          </p>
          {pausas > 0 && (
            <p className="text-secondary small mb-0">
              Incluye {pausas} {pausas === 1 ? "pausa" : "pausas"} de {PAUSA_ENTRE_PELICULAS} min
            </p>
          )}
        </div>
      )}

      {tiempo === null && sesion.length > 0 && (
        <p className="text-secondary mb-0">
          Tu sesión dura <span className="cifra">{formatearDuracion(total)}</span>. Escribe tu tiempo libre
          para saber si cabe.
        </p>
      )}

      {tiempo !== null && excede && (
        <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
          {mensajeExcede(total, tiempo)}
        </div>
      )}
    </aside>
  );
};

export default PanelSesion;
