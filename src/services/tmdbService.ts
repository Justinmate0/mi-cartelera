import type { Actor, DetalleTmdb, ResultadoTmdb, TipoContenido } from "../types/catalogo.ts";

const API_URL = "https://api.themoviedb.org/3";
const IMAGEN_URL = "https://image.tmdb.org/t/p";
const TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const IDIOMA = "es-ES";

// ---- Formas "crudas" que devuelve TMDB (solo los campos que usamos) ----
interface ResultadoCrudo {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  overview?: string;
  vote_average?: number;
}

interface RespuestaBusqueda {
  results: ResultadoCrudo[];
}

interface DetalleCrudo extends ResultadoCrudo {
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  number_of_seasons?: number;
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
}

// ---- Utilidades ----
export const construirImagenUrl = (ruta: string | null, tamano = "w342"): string | null =>
  ruta ? `${IMAGEN_URL}/${tamano}${ruta}` : null;

const tipoATmdb = (tipo: TipoContenido): "movie" | "tv" =>
  tipo === "pelicula" ? "movie" : "tv";

// Hace la petición a TMDB con el token en el encabezado y traduce los errores.
const pedirTmdb = async <T>(ruta: string, senal?: AbortSignal): Promise<T> => {
  if (!TOKEN || TOKEN === "pendiente") {
    throw new Error("Falta configurar VITE_TMDB_TOKEN en el archivo .env.");
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
    signal: senal,
  });

  if (!respuesta.ok) {
    if (respuesta.status === 401) throw new Error("El token de TMDB no es válido. Revisa tu archivo .env.");
    if (respuesta.status === 404) throw new Error("No se encontró ese título en TMDB.");
    if (respuesta.status === 429) throw new Error("Demasiadas búsquedas seguidas. Espera unos segundos y reintenta.");
    throw new Error(`TMDB respondió con un error (código ${respuesta.status}).`);
  }

  return (await respuesta.json()) as T;
};

// Convierte un resultado crudo de TMDB a nuestro formato. Devuelve null si es una persona.
const normalizar = (crudo: ResultadoCrudo, tipoForzado?: TipoContenido): ResultadoTmdb | null => {
  const tipo: TipoContenido | null =
    tipoForzado ?? (crudo.media_type === "movie" ? "pelicula" : crudo.media_type === "tv" ? "serie" : null);
  if (!tipo) return null;

  const fecha = tipo === "pelicula" ? crudo.release_date : crudo.first_air_date;

  return {
    tmdbId: crudo.id,
    tipo,
    titulo: (tipo === "pelicula" ? crudo.title : crudo.name) ?? "Sin título",
    anio: fecha ? fecha.slice(0, 4) : null,
    posterUrl: construirImagenUrl(crudo.poster_path),
    sinopsis: crudo.overview?.trim() || "Sin sinopsis disponible.",
    calificacionTmdb: crudo.vote_average ?? 0,
  };
};

/**
 * buscarTitulos — busca películas y series a la vez (endpoint /search/multi).
 * Descarta los resultados que son personas (actores, directores).
 */
export const buscarTitulos = async (
  consulta: string,
  senal?: AbortSignal
): Promise<ResultadoTmdb[]> => {
  const parametros = new URLSearchParams({
    query: consulta,
    language: IDIOMA,
    include_adult: "false",
    page: "1",
  });

  const datos = await pedirTmdb<RespuestaBusqueda>(`/search/multi?${parametros}`, senal);

  return datos.results
    .map((resultado) => normalizar(resultado))
    .filter((resultado): resultado is ResultadoTmdb => resultado !== null);
};

/**
 * obtenerDetalle — trae la ficha completa de un título, incluyendo el elenco
 * (append_to_response=credits evita hacer una segunda petición).
 */
export const obtenerDetalle = async (
  tmdbId: number,
  tipo: TipoContenido,
  senal?: AbortSignal
): Promise<DetalleTmdb> => {
  const parametros = new URLSearchParams({ language: IDIOMA, append_to_response: "credits" });
  const crudo = await pedirTmdb<DetalleCrudo>(`/${tipoATmdb(tipo)}/${tmdbId}?${parametros}`, senal);

  const base = normalizar(crudo, tipo);
  if (!base) throw new Error("No se pudo leer la información del título.");

  let duracion: string | null = null;
  if (tipo === "pelicula" && crudo.runtime) {
    const horas = Math.floor(crudo.runtime / 60);
    const minutos = crudo.runtime % 60;
    duracion = horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`;
  } else if (tipo === "serie" && crudo.number_of_seasons) {
    duracion = `${crudo.number_of_seasons} ${crudo.number_of_seasons === 1 ? "temporada" : "temporadas"}`;
  }

  const elenco: Actor[] = (crudo.credits?.cast ?? []).slice(0, 10).map((actor) => ({
    id: actor.id,
    nombre: actor.name,
    personaje: actor.character,
    fotoUrl: construirImagenUrl(actor.profile_path, "w185"),
  }));

  return {
    ...base,
    posterUrl: construirImagenUrl(crudo.poster_path, "w500"),
    generos: (crudo.genres ?? []).map((genero) => genero.name),
    duracion,
    elenco,
  };
};
