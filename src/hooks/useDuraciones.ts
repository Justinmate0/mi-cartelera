import { useCallback, useEffect, useRef, useState } from "react";
import type { DuracionConsultada } from "../dominio/nocheDePelicula.ts";
import { obtenerDuraciones } from "../services/tmdbService.ts";

export type EstadoDuraciones = "cargando" | "listo" | "error";

interface ResultadoDuraciones {
  estado: EstadoDuraciones;
  duraciones: ReadonlyMap<number, DuracionConsultada>;
  error: string | null;
  reintentar: () => void;
}

/**
 * useDuraciones — consulta en TMDB la duración de las películas indicadas.
 * Guarda en memoria lo ya consultado y solo pide los ids nuevos (o los que fallaron).
 * Spec E2 §5.1. La consulta la hace tmdbService; este hook solo maneja el estado.
 */
export const useDuraciones = (tmdbIds: readonly number[]): ResultadoDuraciones => {
  const cache = useRef(new Map<number, DuracionConsultada>());
  const [duraciones, setDuraciones] = useState<ReadonlyMap<number, DuracionConsultada>>(new Map());
  const [estado, setEstado] = useState<EstadoDuraciones>("cargando");
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // Clave estable: el efecto solo corre si cambia el conjunto de ids.
  const clave = [...new Set(tmdbIds)].sort((a, b) => a - b).join(",");

  useEffect(() => {
    const ids = clave === "" ? [] : clave.split(",").map(Number);
    const faltan = ids.filter((id) => {
      const guardada = cache.current.get(id);
      return guardada === undefined || guardada.estado === "error";
    });
    const publicar = () =>
      setDuraciones(new Map(ids.map((id) => [id, cache.current.get(id) ?? { estado: "error" }])));

    if (faltan.length === 0) {
      publicar();
      setEstado("listo");
      setError(null);
      return;
    }

    const controlador = new AbortController();
    setEstado("cargando");
    setError(null);

    obtenerDuraciones(faltan, controlador.signal)
      .then((nuevas) => {
        nuevas.forEach((duracion, id) => cache.current.set(id, duracion));
        publicar();
        setEstado("listo");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "No se pudieron consultar las duraciones en TMDB.");
        setEstado("error");
      });

    // Si la pantalla se desmonta o cambian los ids, se cancela la consulta anterior.
    return () => controlador.abort();
  }, [clave, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { estado, duraciones, error, reintentar };
};
