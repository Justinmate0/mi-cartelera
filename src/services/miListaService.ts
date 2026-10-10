import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient.ts";
import type { ResultadoTmdb } from "../types/catalogo.ts";
import type { CambiosItem, ItemLista } from "../types/miLista.ts";

const TABLA = "mi_lista";

// Convierte los errores de PostgreSQL/Supabase en mensajes claros en español.
const traducirError = (error: PostgrestError): string => {
  switch (error.code) {
    case "23505":
      return "Este título ya está en tu lista.";
    case "23514":
      return "Algún dato no es válido (revisa la calificación: debe ser de 1 a 5).";
    case "42501":
      return "No tienes permiso para hacer esto.";
    case "PGRST116":
      return "Ese título ya no existe en tu lista o no te pertenece.";
    default:
      return error.message;
  }
};

/**
 * READ — obtiene SOLO los títulos del usuario conectado.
 * No filtramos por user_id aquí: las políticas RLS de PostgreSQL lo hacen solas.
 */
export const obtenerMiLista = async (): Promise<ItemLista[]> => {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("fecha_agregado", { ascending: false });

  if (error) throw new Error(traducirError(error));
  return data as ItemLista[];
};

// CREATE — guarda un resultado de TMDB en la tabla propia, con estado inicial "por ver".
export const agregarALista = async (
  resultado: ResultadoTmdb,
  userId: string
): Promise<ItemLista> => {
  const { data, error } = await supabase
    .from(TABLA)
    .insert({
      user_id: userId,
      tmdb_id: resultado.tmdbId,
      titulo: resultado.titulo,
      poster_url: resultado.posterUrl,
      tipo_contenido: resultado.tipo,
      estado: "por_ver",
    })
    .select()
    .single();

  if (error) throw new Error(traducirError(error));
  return data as ItemLista;
};

// UPDATE — cambia estado, calificación y comentario. .eq("id") es el WHERE de SQL.
export const actualizarItem = async (id: number, cambios: CambiosItem): Promise<ItemLista> => {
  const { data, error } = await supabase
    .from(TABLA)
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(traducirError(error));
  return data as ItemLista;
};

/**
 * DELETE — elimina un título. Pedimos de vuelta el id borrado para confirmar:
 * si RLS bloqueó la operación, Supabase no da error pero devuelve 0 filas.
 */
export const eliminarItem = async (id: number): Promise<void> => {
  const { data, error } = await supabase.from(TABLA).delete().eq("id", id).select("id");

  if (error) throw new Error(traducirError(error));
  if (!data || data.length === 0) {
    throw new Error("No se pudo eliminar: el título no existe o no te pertenece.");
  }
};
