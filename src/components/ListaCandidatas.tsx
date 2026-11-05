import type { Clasificacion, PeliculaConDuracion, ResultadoAgregar } from "../dominio/nocheDePelicula.ts";
import { MENSAJES_NO_DISPONIBLE, formatearDuracion } from "../dominio/nocheDePelicula.ts";
import Poster from "./Poster.tsx";

interface ListaCandidatasProps {
  clasificacion: Clasificacion;
  tiempo: number;
  idsEnSesion: ReadonlySet<number>;
  evaluaciones: ReadonlyMap<number, ResultadoAgregar>; // puedeAgregar de cada candidata, calculado con el dominio
  aviso: { tmdbId: number; texto: string } | null;
  onAgregar: (pelicula: PeliculaConDuracion) => void;
}

interface TarjetaCandidataProps {
  pelicula: PeliculaConDuracion;
  enSesion: boolean;
  noCabeEnLoQueQueda: boolean;
  aviso: string | null;
  onAgregar: (pelicula: PeliculaConDuracion) => void;
}

// Tarjeta de candidata (DESIGN.md §6.10): variante de la Tarjeta de título.
const TarjetaCandidata = ({
  pelicula,
  enSesion,
  noCabeEnLoQueQueda,
  aviso,
  onAgregar,
}: TarjetaCandidataProps) => (
  <li className="tarjeta-titulo">
    <Poster url={pelicula.posterUrl} titulo={pelicula.titulo} />
    <div className="tarjeta-titulo-cuerpo">
      <h3 className="tarjeta-titulo-nombre">{pelicula.titulo}</h3>
      <p className="tarjeta-titulo-meta cifra">{formatearDuracion(pelicula.duracion)}</p>
      <div className="mt-auto pt-2">
        {enSesion ? (
          <button type="button" className="btn btn-sm btn-en-lista w-100" disabled>
            ✓ En la sesión
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-outline-light w-100"
            onClick={() => onAgregar(pelicula)}
            aria-label={`Agregar ${pelicula.titulo} a la sesión`}
          >
            Agregar
          </button>
        )}
        {!enSesion && noCabeEnLoQueQueda && !aviso && <p className="nota-no-cabe">No cabe en lo que queda</p>}
        {aviso && (
          <p className="aviso-no-agregada" role="alert">
            {aviso}
          </p>
        )}
      </div>
    </div>
  </li>
);

// Qué cabe (H2.1): las que caben, cuántas son muy largas y las no disponibles con su motivo.
const ListaCandidatas = ({
  clasificacion,
  tiempo,
  idsEnSesion,
  evaluaciones,
  aviso,
  onAgregar,
}: ListaCandidatasProps) => {
  const { caben, muyLargas, noDisponibles } = clasificacion;

  return (
    <section className="candidatas" aria-labelledby="titulo-candidatas">
      <h2 id="titulo-candidatas" className="subtitulo-detalle">
        Caben en <span className="cifra">{formatearDuracion(tiempo)}</span>
      </h2>

      {caben.length === 0 && (
        <p className="text-secondary">
          Ninguna de tus películas por ver cabe en {formatearDuracion(tiempo)}.
        </p>
      )}

      {muyLargas > 0 && (
        <p className="aviso-muy-largas">
          {muyLargas === 1
            ? "1 película dura más que tu tiempo."
            : `${muyLargas} películas duran más que tu tiempo.`}
        </p>
      )}

      {caben.length > 0 && (
        <ul className="grilla-titulos lista-sin-estilo">
          {caben.map((pelicula) => (
            <TarjetaCandidata
              key={pelicula.tmdbId}
              pelicula={pelicula}
              enSesion={idsEnSesion.has(pelicula.tmdbId)}
              noCabeEnLoQueQueda={evaluaciones.get(pelicula.tmdbId)?.ok === false}
              aviso={aviso?.tmdbId === pelicula.tmdbId ? aviso.texto : null}
              onAgregar={onAgregar}
            />
          ))}
        </ul>
      )}

      {noDisponibles.length > 0 && (
        <div className="no-disponibles">
          <h3 className="subtitulo-no-disponibles">No disponibles</h3>
          <ul className="lista-sin-estilo">
            {noDisponibles.map(({ pelicula, motivo }) => (
              <li key={pelicula.tmdbId}>
                <span className="fw-semibold">{pelicula.titulo}</span>
                <span className="motivo-no-disponible">{MENSAJES_NO_DISPONIBLE[motivo]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ListaCandidatas;
