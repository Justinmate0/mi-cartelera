import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient.ts";
import type { NuevaSesion, SesionGuardada } from "../types/sesion.ts";

// Formas "crudas" que devuelve Supabase (nombres de columnas de PostgreSQL).
interface PeliculaCruda {
  posicion: number;
  tmdb_id: number;
  titulo: string;
  poster_url: string | null;
  duracion: number;
}

interface SesionCruda {
  id: number;
  nombre: string | null;
  tiempo_disponible: number;
  duracion_total: number;
  creada_en: string;
  sesion_peliculas: PeliculaCruda[];
}

// Convierte los errores de PostgreSQL en mensajes en español.
// guardar_sesion ya lanza sus propios mensajes (códigos 22023 y 23514).
const traducirError = (error: PostgrestError): string => {
  // Sin internet, supabase-js no lanza: devuelve un error con el mensaje en inglés del navegador.
  if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
    return "No se pudo conectar con Supabase. Revisa tu internet e intenta otra vez.";
  }
  switch (error.code) {
    case "42501":
      return "No tienes permiso para hacer esto.";
    case "22023":
    case "23514":
      return error.message;
    case "PGRST202":
      return "Falta crear la función guardar_sesion en Supabase (migración 002).";
    case "42P01":
    case "PGRST205":
      return "Faltan las tablas de sesiones en Supabase (migración 002).";
    default:
      return error.message;
  }
};

const aSesion = (cruda: SesionCruda): SesionGuardada => ({
  id: cruda.id,
  nombre: cruda.nombre,
  tiempoDisponible: cruda.tiempo_disponible,
  duracionTotal: cruda.duracion_total,
  creadaEn: cruda.creada_en,
  peliculas: [...cruda.sesion_peliculas]
    .sort((a, b) => a.posicion - b.posicion)
    .map((pelicula) => ({
      posicion: pelicula.posicion,
      tmdbId: pelicula.tmdb_id,
      titulo: pelicula.titulo,
      posterUrl: pelicula.poster_url,
      duracion: pelicula.duracion,
    })),
});

/**
 * READ — sesiones del usuario conectado, de la más reciente a la más antigua.
 * No filtramos por user_id: RLS solo devuelve las del usuario.
 */
export const obtenerSesiones = async (): Promise<SesionGuardada[]> => {
  const { data, error } = await supabase
    .from("sesiones")
    .select(
      "id, nombre, tiempo_disponible, duracion_total, creada_en, sesion_peliculas (posicion, tmdb_id, titulo, poster_url, duracion)"
    )
    .order("creada_en", { ascending: false })
    .order("posicion", { referencedTable: "sesion_peliculas", ascending: true });

  if (error) throw new Error(traducirError(error));
  return (data as SesionCruda[]).map(aSesion);
};

/**
 * CREATE — guarda la sesión con la función guardar_sesion, que vuelve a validar
 * en la base que la sesión cabe y que sus películas están «por ver» (R2.15).
 */
export const guardarSesion = async (nueva: NuevaSesion): Promise<number> => {
  const { data, error } = await supabase.rpc("guardar_sesion", {
    p_nombre: nueva.nombre,
    p_tiempo_disponible: nueva.tiempoDisponible,
    p_peliculas: nueva.peliculas.map((pelicula) => ({
      tmdb_id: pelicula.tmdbId,
      duracion: pelicula.duracion,
    })),
  });

  if (error) throw new Error(traducirError(error));
  return data as number;
};

/**
 * DELETE — borra una sesión (sus películas se borran en cascada).
 * Si RLS la bloquea, Supabase no da error pero devuelve 0 filas: lo tratamos como error.
 */
export const eliminarSesion = async (id: number): Promise<void> => {
  const { data, error } = await supabase.from("sesiones").delete().eq("id", id).select("id");

  if (error) throw new Error(traducirError(error));
  if (!data || data.length === 0) {
    throw new Error("No se pudo borrar: la sesión no existe o no te pertenece.");
  }
};
