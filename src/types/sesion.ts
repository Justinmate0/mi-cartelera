// Tipos de la Noche de película (E2). En camelCase; el servicio traduce desde las columnas snake_case.

export interface PeliculaDeSesion {
  posicion: number;
  tmdbId: number;
  titulo: string;
  posterUrl: string | null;
  duracion: number; // minutos, copiados de TMDB al guardar
}

export interface SesionGuardada {
  id: number;
  nombre: string | null;
  tiempoDisponible: number;
  duracionTotal: number; // duraciones + pausas
  creadaEn: string; // fecha ISO
  peliculas: PeliculaDeSesion[];
}

export interface NuevaSesion {
  nombre: string | null;
  tiempoDisponible: number;
  peliculas: { tmdbId: number; duracion: number }[];
}
