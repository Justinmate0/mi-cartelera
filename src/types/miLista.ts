import type { TipoContenido } from "./catalogo.ts";

// Tipo union obligatorio: el estado solo puede ser uno de estos tres valores.
export type EstadoVisualizacion = "por_ver" | "viendo" | "vista";

export const ESTADOS: EstadoVisualizacion[] = ["por_ver", "viendo", "vista"];

export const ETIQUETAS_ESTADO: Record<EstadoVisualizacion, string> = {
  por_ver: "Por ver",
  viendo: "Viendo",
  vista: "Vista",
};

// Una fila de la tabla mi_lista. Los nombres coinciden con las columnas de PostgreSQL.
export interface ItemLista {
  id: number;
  user_id: string;
  tmdb_id: number;
  titulo: string;
  poster_url: string | null;
  tipo_contenido: TipoContenido;
  estado: EstadoVisualizacion;
  calificacion_personal: number | null; // 1 a 5, o null si aún no califica
  comentario: string | null;
  fecha_agregado: string; // fecha en formato ISO
}

// Lo único que el usuario puede editar de un título guardado.
export type CambiosItem = Pick<ItemLista, "estado" | "calificacion_personal" | "comentario">;

// Clave única para saber si un resultado de TMDB ya está en la lista.
export const claveTitulo = (tipo: TipoContenido, tmdbId: number): string => `${tipo}-${tmdbId}`;
