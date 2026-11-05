import { useMemo, useState } from "react";
import type { ItemLista } from "../types/miLista.ts";
import type { PeliculaConDuracion, PeliculaPorVer, ResultadoAgregar } from "../dominio/nocheDePelicula.ts";
import {
  MENSAJES_TIEMPO,
  PAUSA_ENTRE_PELICULAS,
  clasificarCandidatas,
  mensajeNoAgregada,
  puedeAgregar,
  validarTiempoDisponible,
} from "../dominio/nocheDePelicula.ts";
import { useDuraciones } from "../hooks/useDuraciones.ts";
import { guardarSesion } from "../services/sesionesService.ts";
import FormularioTiempo from "./FormularioTiempo.tsx";
import ListaCandidatas from "./ListaCandidatas.tsx";
import PanelSesion from "./PanelSesion.tsx";
import MisSesiones from "./MisSesiones.tsx";
import EstadoError from "./EstadoError.tsx";

interface NocheDePeliculaProps {
  peliculasPorVer: ItemLista[]; // ya filtradas por App: películas en estado «por ver» (R2.2)
  idsEnLista: ReadonlySet<number>; // tmdb_id de todas las películas de Mi lista, para «Ya no está en tu lista»
  cargandoLista: boolean;
  errorLista: string | null;
  onReintentarLista: () => void;
  onIrABuscar: () => void;
}

// Pantalla «Noche de película» (épica E2). Spec: docs/specs/E2-noche-de-pelicula.md §5.
// Las reglas salen de src/dominio/; las consultas, de los servicios. Aquí solo se une todo.
const NocheDePelicula = ({
  peliculasPorVer,
  idsEnLista,
  cargandoLista,
  errorLista,
  onReintentarLista,
  onIrABuscar,
}: NocheDePeliculaProps) => {
  const [tiempo, setTiempo] = useState<number | null>(null);
  const [errorTiempo, setErrorTiempo] = useState<string | null>(null);
  // Sesión armada, en el orden en que se agregaron las películas (CA-2.2.9).
  const [sesion, setSesion] = useState<PeliculaConDuracion[]>([]);
  const [avisoAgregar, setAvisoAgregar] = useState<{ tmdbId: number; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [avisoPanel, setAvisoPanel] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  // Cambia cada vez que se guarda una sesión, para que «Mis sesiones» se recargue.
  const [versionSesiones, setVersionSesiones] = useState(0);

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

  const idsEnSesion = useMemo(() => new Set(sesion.map((pelicula) => pelicula.tmdbId)), [sesion]);

  // Para cada candidata, el dominio dice si cabe en lo que queda (R2.12).
  const evaluaciones = useMemo(() => {
    const mapa = new Map<number, ResultadoAgregar>();
    if (tiempo === null || !clasificacion) return mapa;
    for (const pelicula of clasificacion.caben) {
      mapa.set(pelicula.tmdbId, puedeAgregar(tiempo, sesion, pelicula, PAUSA_ENTRE_PELICULAS));
    }
    return mapa;
  }, [clasificacion, sesion, tiempo]);

  const agregar = (pelicula: PeliculaConDuracion) => {
    if (tiempo === null) return;
    const resultado = puedeAgregar(tiempo, sesion, pelicula, PAUSA_ENTRE_PELICULAS);
    if (resultado.ok) {
      setSesion((actual) => [...actual, pelicula]);
      setAvisoAgregar(null);
      setAvisoPanel(null);
    } else {
      setAvisoAgregar({ tmdbId: pelicula.tmdbId, texto: mensajeNoAgregada(resultado) });
    }
  };

  // Guarda en Supabase. El botón ya está deshabilitado mientras guarda (CA-2.3.7).
  const guardar = async (nombre: string | null): Promise<boolean> => {
    if (tiempo === null || guardando) return false;
    setGuardando(true);
    setAvisoPanel(null);
    try {
      await guardarSesion({
        nombre,
        tiempoDisponible: tiempo,
        peliculas: sesion.map((pelicula) => ({ tmdbId: pelicula.tmdbId, duracion: pelicula.duracion })),
      });
      setSesion([]); // CA-2.3.9: se vacía para armar otra; el tiempo se mantiene.
      setAvisoAgregar(null);
      setAvisoPanel({ tipo: "exito", texto: "Sesión guardada." });
      setVersionSesiones((n) => n + 1);
      return true;
    } catch (err) {
      // CA-2.3.6: la sesión armada no se pierde.
      setAvisoPanel({
        tipo: "error",
        texto:
          err instanceof TypeError
            ? "No se pudo conectar. Revisa tu internet e intenta otra vez."
            : err instanceof Error
              ? err.message
              : "No se pudo guardar la sesión.",
      });
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const quitar = (tmdbId: number) => {
    setAvisoPanel(null);
    setSesion((actual) => actual.filter((pelicula) => pelicula.tmdbId !== tmdbId));
    setAvisoAgregar(null);
  };

  const confirmarTiempo = (texto: string) => {
    setAvisoAgregar(null);
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
            <ListaCandidatas
              clasificacion={clasificacion}
              tiempo={tiempo}
              idsEnSesion={idsEnSesion}
              evaluaciones={evaluaciones}
              aviso={avisoAgregar}
              onAgregar={agregar}
            />
          )}

          {estado === "listo" && tiempo === null && !errorTiempo && (
            <p className="text-secondary my-4">Escribe tu tiempo libre para ver qué películas caben.</p>
          )}
        </div>
        <div className="col-lg-4">
          <PanelSesion
            sesion={sesion}
            tiempo={tiempo}
            onQuitar={quitar}
            onGuardar={guardar}
            guardando={guardando}
            aviso={avisoPanel}
          />
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
      <MisSesiones idsEnLista={idsEnLista} recargar={versionSesiones} />
    </section>
  );
};

export default NocheDePelicula;
