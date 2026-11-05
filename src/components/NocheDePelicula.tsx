import { useMemo, useState } from "react";
import type { ItemLista } from "../types/miLista.ts";
import type { PeliculaPorVer } from "../dominio/nocheDePelicula.ts";
import {
  MENSAJES_TIEMPO,
  clasificarCandidatas,
  validarTiempoDisponible,
} from "../dominio/nocheDePelicula.ts";
import { useDuraciones } from "../hooks/useDuraciones.ts";
import FormularioTiempo from "./FormularioTiempo.tsx";
import ListaCandidatas from "./ListaCandidatas.tsx";
import EstadoError from "./EstadoError.tsx";

interface NocheDePeliculaProps {
  peliculasPorVer: ItemLista[]; // ya filtradas por App: películas en estado «por ver» (R2.2)
  cargandoLista: boolean;
  errorLista: string | null;
  onReintentarLista: () => void;
  onIrABuscar: () => void;
}

// Pantalla «Noche de película» (épica E2). Spec: docs/specs/E2-noche-de-pelicula.md §5.
// Las reglas salen de src/dominio/; las consultas, de los servicios. Aquí solo se une todo.
const NocheDePelicula = ({
  peliculasPorVer,
  cargandoLista,
  errorLista,
  onReintentarLista,
  onIrABuscar,
}: NocheDePeliculaProps) => {
  const [tiempo, setTiempo] = useState<number | null>(null);
  const [errorTiempo, setErrorTiempo] = useState<string | null>(null);

  const ids = useMemo(() => peliculasPorVer.map((item) => item.tmdb_id), [peliculasPorVer]);
  const { estado, duraciones, error, reintentar } = useDuraciones(ids);

  const candidatas = useMemo<PeliculaPorVer[]>(
    () =>
      peliculasPorVer.map((item) => ({
        tmdbId: item.tmdb_id,
        titulo: item.titulo,
        posterUrl: item.poster_url,
        duracion: duraciones.get(item.tmdb_id) ?? { estado: "error" },
      })),
    [peliculasPorVer, duraciones]
  );

  const clasificacion = useMemo(
    () => (tiempo === null ? null : clasificarCandidatas(candidatas, tiempo)),
    [candidatas, tiempo]
  );

  const confirmarTiempo = (texto: string) => {
    const resultado = validarTiempoDisponible(texto);
    if (resultado.valido) {
      setTiempo(resultado.minutos);
      setErrorTiempo(null);
    } else {
      setTiempo(null);
      setErrorTiempo(MENSAJES_TIEMPO[resultado.motivo]);
    }
  };

  const contenido = () => {
    if (cargandoLista) {
      return (
        <div className="text-center py-5" role="status">
          <div className="spinner-border text-warning mb-2" />
          <p className="text-secondary">Cargando tu lista...</p>
        </div>
      );
    }
    if (errorLista) return <EstadoError mensaje={errorLista} onReintentar={onReintentarLista} />;
    if (peliculasPorVer.length === 0) {
      return (
        <section className="lista-vacia">
          <h2 className="subtitulo-detalle">No tienes películas por ver.</h2>
          <p className="text-secondary">Agrega películas a tu lista para armar una noche con ellas.</p>
          <button type="button" className="btn btn-acento" onClick={onIrABuscar}>
            Ir a buscar
          </button>
        </section>
      );
    }

    return (
      <div className="row g-4">
        <div className="col-lg-8">
          <FormularioTiempo error={errorTiempo} onConfirmar={confirmarTiempo} />

          {estado === "cargando" && (
            <div className="d-flex align-items-center gap-2 my-4" role="status">
              <div className="spinner-border spinner-border-sm text-warning" />
              <span className="text-secondary">Consultando duraciones en TMDB…</span>
            </div>
          )}

          {estado === "error" && (
            <div className="my-4">
              <EstadoError
                mensaje={error ?? "No se pudieron consultar las duraciones."}
                onReintentar={reintentar}
              />
            </div>
          )}

          {estado === "listo" && clasificacion && tiempo !== null && (
            <ListaCandidatas clasificacion={clasificacion} tiempo={tiempo} />
          )}

          {estado === "listo" && tiempo === null && !errorTiempo && (
            <p className="text-secondary my-4">Escribe tu tiempo libre para ver qué películas caben.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <section aria-labelledby="titulo-noche">
      <h1 id="titulo-noche" className="titulo-seccion mb-1">
        Noche de película
      </h1>
      <p className="bajada-noche">Elige qué ver según el tiempo que tienes.</p>
      {contenido()}
    </section>
  );
};

export default NocheDePelicula;
