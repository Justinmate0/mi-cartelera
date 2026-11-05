import { useEffect, useState } from "react";
import type { SesionGuardada } from "../types/sesion.ts";
import { PAUSA_ENTRE_PELICULAS, formatearDuracion } from "../dominio/nocheDePelicula.ts";
import { eliminarSesion, obtenerSesiones } from "../services/sesionesService.ts";
import EstadoError from "./EstadoError.tsx";

interface MisSesionesProps {
  idsEnLista: ReadonlySet<number>; // tmdb_id de las películas que siguen en Mi lista (R2.10)
  recargar: number; // cambia cuando se guarda una sesión nueva
}

type EstadoCarga = "cargando" | "listo" | "error";

const formatearFecha = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-EC", { day: "numeric", month: "long" });

// R2.11: sin nombre, la sesión se muestra con su fecha.
const nombreVisible = (sesion: SesionGuardada): string =>
  sesion.nombre ?? `Noche del ${formatearFecha(sesion.creadaEn)}`;

interface TarjetaSesionProps {
  sesion: SesionGuardada;
  idsEnLista: ReadonlySet<number>;
  borrando: boolean;
  onBorrar: (sesion: SesionGuardada) => void;
}

// Tarjeta de sesión guardada (DESIGN.md §6.13). Solo lectura: una sesión no se edita (R2.9).
const TarjetaSesion = ({ sesion, idsEnLista, borrando, onBorrar }: TarjetaSesionProps) => {
  const cantidad = sesion.peliculas.length;
  return (
    <li>
      <details className="tarjeta-sesion">
        <summary>
          <span className="nombre-sesion">{nombreVisible(sesion)}</span>
          <span className="meta-sesion cifra">
            {cantidad} {cantidad === 1 ? "película" : "películas"} · {formatearDuracion(sesion.duracionTotal)}{" "}
            de {formatearDuracion(sesion.tiempoDisponible)} · guardada el {formatearFecha(sesion.creadaEn)}
          </span>
        </summary>
        <div className="detalle-sesion">
          <ol className="lista-sesion">
            {sesion.peliculas.map((pelicula, indice) => (
              <li key={pelicula.posicion}>
                {indice > 0 && <p className="fila-pausa cifra">Pausa · {PAUSA_ENTRE_PELICULAS} min</p>}
                <div className="fila-pelicula">
                  <span className="nombre-en-sesion">
                    {pelicula.titulo}
                    {!idsEnLista.has(pelicula.tmdbId) && (
                      <span className="ya-no-esta">Ya no está en tu lista</span>
                    )}
                  </span>
                  <span className="cifra text-secondary">{formatearDuracion(pelicula.duracion)}</span>
                </div>
              </li>
            ))}
          </ol>
          <p className="cifra mb-3">
            Total: {formatearDuracion(sesion.duracionTotal)} de {formatearDuracion(sesion.tiempoDisponible)}
          </p>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => onBorrar(sesion)}
            disabled={borrando}
            aria-label={`Borrar la sesión ${nombreVisible(sesion)}`}
          >
            {borrando ? "Borrando..." : "Borrar sesión"}
          </button>
        </div>
      </details>
    </li>
  );
};

// Mis sesiones (H2.4): carga, muestra y borra las sesiones guardadas del usuario.
const MisSesiones = ({ idsEnLista, recargar }: MisSesionesProps) => {
  const [sesiones, setSesiones] = useState<SesionGuardada[]>([]);
  const [estado, setEstado] = useState<EstadoCarga>("cargando");
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [borrandoId, setBorrandoId] = useState<number | null>(null);
  const [avisoError, setAvisoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setEstado("cargando");
      setError(null);
      try {
        const datos = await obtenerSesiones();
        if (cancelado) return;
        setSesiones(datos);
        setEstado("listo");
      } catch (err) {
        if (cancelado) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar tus sesiones.");
        setEstado("error");
      }
    };

    cargar();
    // Si llega otra recarga antes de que responda Supabase, se ignora la respuesta vieja.
    return () => {
      cancelado = true;
    };
  }, [recargar, intento]);

  const borrar = async (sesion: SesionGuardada) => {
    if (!window.confirm(`¿Seguro que quieres borrar la sesión "${nombreVisible(sesion)}"?`)) return;
    setAvisoError(null);
    setBorrandoId(sesion.id);
    try {
      await eliminarSesion(sesion.id);
      setSesiones((actuales) => actuales.filter((s) => s.id !== sesion.id));
    } catch (err) {
      setAvisoError(err instanceof Error ? err.message : "No se pudo borrar la sesión.");
    } finally {
      setBorrandoId(null);
    }
  };

  return (
    <section className="mis-sesiones" aria-labelledby="titulo-mis-sesiones">
      <h2 id="titulo-mis-sesiones" className="subtitulo-detalle">
        Mis sesiones
      </h2>

      {estado === "cargando" && (
        <div className="d-flex align-items-center gap-2" role="status">
          <div className="spinner-border spinner-border-sm text-warning" />
          <span className="text-secondary">Cargando tus sesiones…</span>
        </div>
      )}

      {estado === "error" && (
        <EstadoError
          mensaje={error ?? "No se pudieron cargar tus sesiones."}
          onReintentar={() => setIntento((n) => n + 1)}
        />
      )}

      {estado === "listo" && sesiones.length === 0 && (
        <p className="text-secondary">Todavía no guardas ninguna sesión.</p>
      )}

      {avisoError && <div className="alert alert-danger py-2">{avisoError}</div>}

      {estado === "listo" && sesiones.length > 0 && (
        <ul className="lista-sin-estilo lista-sesiones">
          {sesiones.map((sesion) => (
            <TarjetaSesion
              key={sesion.id}
              sesion={sesion}
              idsEnLista={idsEnLista}
              borrando={borrandoId === sesion.id}
              onBorrar={borrar}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default MisSesiones;
