import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { DetalleTmdb } from "../types/catalogo.ts";
import type { CambiosItem, EstadoVisualizacion, ItemLista } from "../types/miLista.ts";
import { ESTADOS, ETIQUETAS_ESTADO } from "../types/miLista.ts";
import { obtenerDetalle } from "../services/tmdbService.ts";
import Poster from "./Poster.tsx";
import EstadoBadge from "./EstadoBadge.tsx";
import Estrellas from "./Estrellas.tsx";
import EstadoError from "./EstadoError.tsx";

const LARGO_MAXIMO_COMENTARIO = 500;

interface DetalleTituloProps {
  item: ItemLista;
  onVolver: () => void;
  onGuardar: (id: number, cambios: CambiosItem) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

type EstadoCarga = "cargando" | "exito" | "error";

const formatearFecha = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" });

const DetalleTitulo = ({ item, onVolver, onGuardar, onEliminar }: DetalleTituloProps) => {
  // ---- Datos de TMDB (sinopsis completa, elenco, géneros) ----
  const [detalle, setDetalle] = useState<DetalleTmdb | null>(null);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCarga>("cargando");
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // ---- Formulario personal (estado, calificación, comentario) ----
  const [estado, setEstado] = useState<EstadoVisualizacion>(item.estado);
  const [calificacion, setCalificacion] = useState<number | null>(item.calificacion_personal);
  const [comentario, setComentario] = useState(item.comentario ?? "");
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  useEffect(() => {
    const controlador = new AbortController();

    const cargarDetalle = async () => {
      setEstadoCarga("cargando");
      setErrorCarga(null);
      try {
        const datos = await obtenerDetalle(item.tmdb_id, item.tipo_contenido, controlador.signal);
        setDetalle(datos);
        setEstadoCarga("exito");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setErrorCarga(
          err instanceof TypeError
            ? "No se pudo conectar con TMDB. Revisa tu conexión a internet."
            : err instanceof Error
              ? err.message
              : "No se pudo cargar la información."
        );
        setEstadoCarga("error");
      }
    };

    cargarDetalle();
    // Si el usuario sale de la página antes de que responda TMDB, cancelamos la petición.
    return () => controlador.abort();
  }, [item.tmdb_id, item.tipo_contenido, intento]);

  const comentarioLimpio = comentario.trim();
  const hayCambios =
    estado !== item.estado ||
    calificacion !== item.calificacion_personal ||
    (comentarioLimpio || null) !== item.comentario;

  const manejarGuardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!hayCambios) return;
    setGuardando(true);
    setMensaje(null);
    try {
      await onGuardar(item.id, {
        estado,
        calificacion_personal: calificacion,
        comentario: comentarioLimpio || null,
      });
      setMensaje({ tipo: "exito", texto: "Cambios guardados." });
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "No se pudo guardar." });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async () => {
    if (!window.confirm(`¿Seguro que quieres quitar "${item.titulo}" de tu lista?`)) return;
    setEliminando(true);
    setMensaje(null);
    try {
      await onEliminar(item.id); // si funciona, App nos devuelve a "Mi lista"
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "No se pudo eliminar." });
      setEliminando(false);
    }
  };

  const tipoTexto = item.tipo_contenido === "pelicula" ? "Película" : "Serie";

  return (
    <section className="detalle">
      <button type="button" className="boton-texto mb-3" onClick={onVolver}>
        ← Volver a mi lista
      </button>

      <div className="detalle-cabecera">
        <Poster url={detalle?.posterUrl ?? item.poster_url} titulo={item.titulo} className="detalle-poster" />

        <div className="detalle-info">
          <p className="tarjeta-titulo-meta mb-1">
            {[tipoTexto, detalle?.anio, detalle?.duracion].filter(Boolean).join(" · ")}
          </p>
          <h1 className="detalle-titulo">{item.titulo}</h1>
          <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
            <EstadoBadge estado={item.estado} />
            <span className="text-secondary small">Agregado el {formatearFecha(item.fecha_agregado)}</span>
          </div>

          {estadoCarga === "cargando" && (
            <div className="d-flex align-items-center gap-2 text-secondary" role="status">
              <div className="spinner-border spinner-border-sm text-warning" /> Cargando información de TMDB...
            </div>
          )}

          {estadoCarga === "error" && errorCarga && (
            <EstadoError mensaje={errorCarga} onReintentar={() => setIntento((n) => n + 1)} />
          )}

          {estadoCarga === "exito" && detalle && (
            <>
              <p className="detalle-tmdb">
                <span className="nota-tmdb">★ {detalle.calificacionTmdb.toFixed(1)}</span> Calificación
                oficial de TMDB
              </p>
              {detalle.generos.length > 0 && (
                <ul className="lista-generos" aria-label="Géneros">
                  {detalle.generos.map((genero) => (
                    <li key={genero}>{genero}</li>
                  ))}
                </ul>
              )}
              <h2 className="subtitulo-detalle">Sinopsis</h2>
              <p className="detalle-sinopsis">{detalle.sinopsis}</p>
            </>
          )}
        </div>
      </div>

      {/* ---- Lo personal: calificación propia y comentario ---- */}
      <form className="panel-personal" onSubmit={manejarGuardar}>
        <h2 className="subtitulo-detalle">Tu opinión</h2>

        <div className="mb-3">
          <span className="form-label d-block">Estado</span>
          <div className="filtros" role="radiogroup" aria-label="Estado de visualización">
            {ESTADOS.map((opcion) => (
              <button
                key={opcion}
                type="button"
                role="radio"
                aria-checked={estado === opcion}
                className={estado === opcion ? "activo" : ""}
                onClick={() => setEstado(opcion)}
              >
                {ETIQUETAS_ESTADO[opcion]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <span className="form-label d-block">Tu calificación</span>
          <Estrellas valor={calificacion} onCambiar={setCalificacion} />
        </div>

        <div className="mb-3">
          <label htmlFor="comentario" className="form-label">Comentario</label>
          <textarea
            id="comentario"
            className="form-control"
            rows={4}
            maxLength={LARGO_MAXIMO_COMENTARIO}
            placeholder="¿Qué te pareció? ¿Quién te la recomendó?"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          <div className="form-text text-end">
            {comentario.length}/{LARGO_MAXIMO_COMENTARIO}
          </div>
        </div>

        {mensaje && (
          <div className={`alert py-2 ${mensaje.tipo === "exito" ? "alert-success" : "alert-danger"}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="d-flex flex-wrap gap-2">
          <button type="submit" className="btn btn-acento" disabled={!hayCambios || guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={manejarEliminar} disabled={eliminando}>
            {eliminando ? "Eliminando..." : "Eliminar de mi lista"}
          </button>
        </div>
      </form>

      {/* ---- Elenco ---- */}
      {estadoCarga === "exito" && detalle && detalle.elenco.length > 0 && (
        <div className="mt-5">
          <h2 className="subtitulo-detalle">Elenco principal</h2>
          <ul className="grilla-elenco">
            {detalle.elenco.map((actor) => (
              <li key={actor.id} className="actor">
                {actor.fotoUrl ? (
                  <img src={actor.fotoUrl} alt={actor.nombre} loading="lazy" />
                ) : (
                  <div className="actor-sin-foto" aria-hidden="true">{actor.nombre.charAt(0)}</div>
                )}
                <p className="actor-nombre">{actor.nombre}</p>
                {actor.personaje && <p className="actor-personaje">{actor.personaje}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default DetalleTitulo;
