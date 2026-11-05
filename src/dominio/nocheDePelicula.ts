// Reglas de negocio de la Noche de película (épica E2).
// Funciones puras: no llaman a TMDB ni a Supabase, no usan React ni la fecha actual.
// Spec: docs/specs/E2-noche-de-pelicula.md, sección 3. Reglas: R2.1 a R2.18 del PRD.

// ---- Decisiones del cliente ----
export const TIEMPO_MINIMO = 30; // R2.1
export const TIEMPO_MAXIMO = 600; // R2.1
export const PAUSA_ENTRE_PELICULAS = 10; // R2.3
export const LARGO_MAXIMO_NOMBRE = 60; // R2.11

// ---- Tipos ----
export type DuracionConsultada =
  | { estado: "conocida"; minutos: number }
  | { estado: "desconocida" } // TMDB no tiene runtime (o es 0)
  | { estado: "error" }; // la consulta a TMDB falló

export interface PeliculaPorVer {
  tmdbId: number;
  titulo: string;
  posterUrl: string | null;
  duracion: DuracionConsultada;
}

export interface PeliculaConDuracion {
  tmdbId: number;
  titulo: string;
  posterUrl: string | null;
  duracion: number;
}

export type MotivoTiempo = "vacio" | "no-entero" | "fuera-de-rango";
export type ResultadoTiempo = { valido: true; minutos: number } | { valido: false; motivo: MotivoTiempo };

export type ResultadoCabe =
  | { cabe: true; total: number; restante: number }
  | { cabe: false; motivo: "tiempo-invalido" }
  | { cabe: false; motivo: "sin-duracion" }
  | { cabe: false; motivo: "excede"; total: number; exceso: number };

export type ResultadoAgregar =
  | { ok: true; total: number; restante: number }
  | { ok: false; motivo: "sin-duracion" }
  | { ok: false; motivo: "repetida" }
  | { ok: false; motivo: "no-cabe"; necesita: number; pausa: number; quedan: number };

export type MotivoNoDisponible = "sin-duracion" | "error-consulta";

export interface Clasificacion {
  caben: PeliculaConDuracion[];
  muyLargas: number;
  noDisponibles: { pelicula: PeliculaPorVer; motivo: MotivoNoDisponible }[];
}

export type ResultadoNombre =
  { valido: true; nombre: string | null } | { valido: false; motivo: "muy-largo" };

// ---- Tiempo disponible ----

export const esTiempoValido = (minutos: number): boolean =>
  Number.isInteger(minutos) && minutos >= TIEMPO_MINIMO && minutos <= TIEMPO_MAXIMO;

// Valida lo que la persona escribió en el campo. Solo dígitos (con signo opcional) cuentan como entero.
export const validarTiempoDisponible = (texto: string): ResultadoTiempo => {
  const limpio = texto.trim();
  if (limpio === "") return { valido: false, motivo: "vacio" };
  if (!/^-?\d+$/.test(limpio)) return { valido: false, motivo: "no-entero" };
  const minutos = Number(limpio);
  if (!esTiempoValido(minutos)) return { valido: false, motivo: "fuera-de-rango" };
  return { valido: true, minutos };
};

// ---- La regla «cabe» ----

const esDuracionValida = (duracion: number | null): duracion is number =>
  duracion !== null && Number.isInteger(duracion) && duracion > 0;

// Suma de duraciones más una pausa entre cada par de películas (n − 1 pausas).
export const duracionSesion = (
  duraciones: readonly number[],
  pausa: number = PAUSA_ENTRE_PELICULAS
): number => {
  if (duraciones.length === 0) return 0;
  const suma = duraciones.reduce((total, duracion) => total + duracion, 0);
  return suma + pausa * (duraciones.length - 1);
};

// R2.4: cabe si duraciones + pausas no supera el tiempo disponible. Ocupar el tiempo exacto sí cabe.
export const cabeEnTiempo = (
  tiempoDisponible: number,
  duraciones: readonly (number | null)[],
  pausa: number
): ResultadoCabe => {
  if (!esTiempoValido(tiempoDisponible)) return { cabe: false, motivo: "tiempo-invalido" };
  if (!duraciones.every(esDuracionValida)) return { cabe: false, motivo: "sin-duracion" };

  const total = duracionSesion(duraciones as readonly number[], pausa);
  if (total > tiempoDisponible) {
    return { cabe: false, motivo: "excede", total, exceso: total - tiempoDisponible };
  }
  return { cabe: true, total, restante: tiempoDisponible - total };
};

// R2.12: una película entra si cabe en lo que queda, contando la pausa que trae si no es la primera.
export const puedeAgregar = (
  tiempoDisponible: number,
  sesion: readonly PeliculaConDuracion[],
  candidata: { tmdbId: number; duracion: number | null },
  pausa: number
): ResultadoAgregar => {
  if (!esDuracionValida(candidata.duracion)) return { ok: false, motivo: "sin-duracion" };
  if (sesion.some((pelicula) => pelicula.tmdbId === candidata.tmdbId))
    return { ok: false, motivo: "repetida" };

  const resultado = cabeEnTiempo(
    tiempoDisponible,
    [...sesion.map((pelicula) => pelicula.duracion), candidata.duracion],
    pausa
  );
  if (resultado.cabe) return { ok: true, total: resultado.total, restante: resultado.restante };

  const pausaQueTrae = sesion.length > 0 ? pausa : 0;
  const ocupado = duracionSesion(
    sesion.map((pelicula) => pelicula.duracion),
    pausa
  );
  return {
    ok: false,
    motivo: "no-cabe",
    necesita: candidata.duracion + pausaQueTrae,
    pausa: pausaQueTrae,
    quedan: Math.max(0, tiempoDisponible - ocupado),
  };
};

// ---- Qué cabe ----

// R2.8: de la más corta a la más larga; con la misma duración, por título.
const ordenarPorDuracion = (a: PeliculaConDuracion, b: PeliculaConDuracion): number =>
  a.duracion - b.duracion || a.titulo.localeCompare(b.titulo, "es");

// Separa las películas «por ver» en las que caben, las muy largas (R2.16) y las no disponibles (R2.5, R2.17).
export const clasificarCandidatas = (
  peliculas: readonly PeliculaPorVer[],
  tiempoDisponible: number
): Clasificacion => {
  const caben: PeliculaConDuracion[] = [];
  const noDisponibles: Clasificacion["noDisponibles"] = [];
  let muyLargas = 0;

  for (const pelicula of peliculas) {
    const { duracion } = pelicula;
    if (duracion.estado === "error") {
      noDisponibles.push({ pelicula, motivo: "error-consulta" });
    } else if (duracion.estado === "desconocida" || !esDuracionValida(duracion.minutos)) {
      noDisponibles.push({ pelicula, motivo: "sin-duracion" });
    } else if (duracion.minutos > tiempoDisponible) {
      muyLargas += 1;
    } else {
      caben.push({ ...pelicula, duracion: duracion.minutos });
    }
  }

  noDisponibles.sort((a, b) => a.pelicula.titulo.localeCompare(b.pelicula.titulo, "es"));
  return { caben: caben.sort(ordenarPorDuracion), muyLargas, noDisponibles };
};

// ---- Nombre de la sesión ----

export const validarNombreSesion = (texto: string): ResultadoNombre => {
  const limpio = texto.trim();
  if (limpio === "") return { valido: true, nombre: null };
  if (limpio.length > LARGO_MAXIMO_NOMBRE) return { valido: false, motivo: "muy-largo" };
  return { valido: true, nombre: limpio };
};

// ---- Textos ----

export const formatearDuracion = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
};

export const MENSAJES_TIEMPO: Record<MotivoTiempo, string> = {
  vacio: "Escribe cuántos minutos tienes libres.",
  "no-entero": "Escribe un número entero de minutos, sin decimales.",
  "fuera-de-rango": `El tiempo debe estar entre ${TIEMPO_MINIMO} y ${TIEMPO_MAXIMO} minutos.`,
};

export const MENSAJES_NO_DISPONIBLE: Record<MotivoNoDisponible, string> = {
  "sin-duracion": "TMDB no tiene su duración, así que no se puede agregar.",
  "error-consulta": "No se pudo consultar su duración en TMDB.",
};

export const MENSAJE_NOMBRE_LARGO = `El nombre puede tener máximo ${LARGO_MAXIMO_NOMBRE} caracteres.`;
export const MENSAJE_SESION_VACIA = "Agrega al menos una película para guardar la sesión.";

export const mensajeNoAgregada = (resultado: Extract<ResultadoAgregar, { ok: false }>): string => {
  switch (resultado.motivo) {
    case "repetida":
      return "Ya está en tu sesión.";
    case "sin-duracion":
      return MENSAJES_NO_DISPONIBLE["sin-duracion"];
    case "no-cabe": {
      const detalle =
        resultado.pausa > 0 ? ` (${resultado.necesita - resultado.pausa} + ${resultado.pausa} de pausa)` : "";
      return `No cabe: necesita ${resultado.necesita} min${detalle} y te quedan ${resultado.quedan} min.`;
    }
  }
};

export const mensajeExcede = (total: number, tiempoDisponible: number): string =>
  `Tu sesión dura ${formatearDuracion(total)} y tienes ${formatearDuracion(tiempoDisponible)}. Quita películas para que quepa.`;
