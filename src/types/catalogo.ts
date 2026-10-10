// Tipos que describen lo que viene de TMDB, ya "traducido" a nuestro formato.

// Tipo union: solo existen estos dos tipos de contenido en la app.
export type TipoContenido = "pelicula" | "serie";

// Un resultado de búsqueda, listo para mostrar en una tarjeta.
export interface ResultadoTmdb {
  tmdbId: number;
  tipo: TipoContenido;
  titulo: string;
  anio: string | null;       // null si TMDB no trae fecha
  posterUrl: string | null;  // null si el título no tiene póster
  sinopsis: string;
  calificacionTmdb: number;  // de 0 a 10
}

export interface Actor {
  id: number;
  nombre: string;
  personaje: string;
  fotoUrl: string | null;
}

// Información ampliada que se muestra en la página de detalle.
export interface DetalleTmdb extends ResultadoTmdb {
  generos: string[];
  duracion: string | null; // "2 h 15 min" o "3 temporadas"
  elenco: Actor[];
}
