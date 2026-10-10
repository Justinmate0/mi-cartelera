import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient.ts";

// Traduce los mensajes de error mas comunes de Supabase Auth al espanol.
const traducirError = (mensaje: string): string => {
  const traducciones: Record<string, string> = {
    "Invalid login credentials": "Correo o contraseña incorrectos.",
    "User already registered": "Ya existe una cuenta con ese correo.",
    "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión.",
    "Password should be at least 6 characters.":
      "La contraseña debe tener al menos 6 caracteres.",
  };
  return traducciones[mensaje] ?? mensaje;
};

/**
 * registrarUsuario — crea la cuenta en Supabase Auth.
 * Devuelve true si Supabase ya inicio la sesion (confirmacion por correo desactivada)
 * o false si el usuario primero debe confirmar su correo.
 */
export const registrarUsuario = async (
  email: string,
  password: string
): Promise<boolean> => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(traducirError(error.message));
  return data.session !== null;
};

export const iniciarSesion = async (
  email: string,
  password: string
): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(traducirError(error.message));
};

export const cerrarSesion = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(traducirError(error.message));
};

export const obtenerSesionActual = async (): Promise<Session | null> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(traducirError(error.message));
  return data.session;
};
