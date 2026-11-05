import { describe, expect, it } from "vitest";
import {
  PAUSA_ENTRE_PELICULAS,
  TIEMPO_MAXIMO,
  TIEMPO_MINIMO,
  cabeEnTiempo,
  clasificarCandidatas,
  duracionSesion,
  esTiempoValido,
  formatearDuracion,
  llenarMiNoche,
  mensajeLlenarMiNoche,
  mensajeExcede,
  mensajeNoAgregada,
  puedeAgregar,
  validarNombreSesion,
  validarTiempoDisponible,
} from "./nocheDePelicula.ts";
import type { PeliculaConDuracion, PeliculaPorVer } from "./nocheDePelicula.ts";

// Datos de ejemplo de docs/backlog/E2-noche-de-pelicula.md
const conocida = (minutos: number) => ({ estado: "conocida" as const, minutos });
const up: PeliculaConDuracion = { tmdbId: 14160, titulo: "Up", posterUrl: null, duracion: 96 };
const coco: PeliculaConDuracion = { tmdbId: 354912, titulo: "Coco", posterUrl: null, duracion: 105 };
const her: PeliculaConDuracion = { tmdbId: 152601, titulo: "Her", posterUrl: null, duracion: 126 };
const dune: PeliculaConDuracion = { tmdbId: 438631, titulo: "Dune", posterUrl: null, duracion: 155 };

const porVer = (p: PeliculaConDuracion): PeliculaPorVer => ({ ...p, duracion: conocida(p.duracion) });
const listaEjemplo: PeliculaPorVer[] = [
  porVer(dune),
  porVer(her),
  { tmdbId: 1, titulo: "Cortometraje perdido", posterUrl: null, duracion: { estado: "desconocida" } },
  porVer(coco),
  porVer(up),
];

describe("reglas del cliente", () => {
  it("usa los valores que decidió el cliente", () => {
    expect(TIEMPO_MINIMO).toBe(30);
    expect(TIEMPO_MAXIMO).toBe(600);
    expect(PAUSA_ENTRE_PELICULAS).toBe(10);
  });
});

describe("validarTiempoDisponible", () => {
  it.each(["30", "120", "600", " 90 "])("acepta %s", (texto) => {
    expect(validarTiempoDisponible(texto)).toEqual({ valido: true, minutos: Number(texto.trim()) });
  });

  it.each(["29", "601", "0", "-5", "1000"])("rechaza %s por estar fuera de rango", (texto) => {
    expect(validarTiempoDisponible(texto)).toEqual({ valido: false, motivo: "fuera-de-rango" });
  });

  it.each(["90.5", "abc", "1e3", "12 min", "9O"])("rechaza %s por no ser entero", (texto) => {
    expect(validarTiempoDisponible(texto)).toEqual({ valido: false, motivo: "no-entero" });
  });

  it("rechaza el campo vacío o con solo espacios", () => {
    expect(validarTiempoDisponible("")).toEqual({ valido: false, motivo: "vacio" });
    expect(validarTiempoDisponible("   ")).toEqual({ valido: false, motivo: "vacio" });
  });
});

describe("esTiempoValido", () => {
  it("acepta los límites exactos y rechaza lo de afuera", () => {
    expect(esTiempoValido(30)).toBe(true);
    expect(esTiempoValido(600)).toBe(true);
    expect(esTiempoValido(29)).toBe(false);
    expect(esTiempoValido(601)).toBe(false);
    expect(esTiempoValido(90.5)).toBe(false);
    expect(esTiempoValido(Number.NaN)).toBe(false);
  });
});

describe("duracionSesion", () => {
  it("una sesión vacía dura 0", () => {
    expect(duracionSesion([])).toBe(0);
  });

  it("una sola película no lleva pausa", () => {
    expect(duracionSesion([96])).toBe(96);
  });

  it("n películas llevan n - 1 pausas", () => {
    expect(duracionSesion([96, 105])).toBe(211);
    expect(duracionSesion([96, 105, 126])).toBe(96 + 105 + 126 + 20);
  });

  it("usa la pausa que recibe", () => {
    expect(duracionSesion([60, 60, 60], 5)).toBe(190);
    expect(duracionSesion([60, 60], 0)).toBe(120);
  });
});

describe("cabeEnTiempo: la regla «cabe»", () => {
  it("una sesión que ocupa exactamente el tiempo sí cabe", () => {
    expect(cabeEnTiempo(211, [96, 105], PAUSA_ENTRE_PELICULAS)).toEqual({
      cabe: true,
      total: 211,
      restante: 0,
    });
  });

  it("un minuto más que el tiempo ya no cabe", () => {
    expect(cabeEnTiempo(210, [96, 105], PAUSA_ENTRE_PELICULAS)).toEqual({
      cabe: false,
      motivo: "excede",
      total: 211,
      exceso: 1,
    });
  });

  it("una sola película no suma pausa: 120 cabe en 120", () => {
    expect(cabeEnTiempo(120, [120], PAUSA_ENTRE_PELICULAS)).toEqual({ cabe: true, total: 120, restante: 0 });
  });

  it("la pausa es la que hace que no quepa", () => {
    // 100 + 100 = 200 cabría en 205, pero con la pausa son 210.
    expect(cabeEnTiempo(205, [100, 100], PAUSA_ENTRE_PELICULAS)).toMatchObject({
      cabe: false,
      motivo: "excede",
    });
    expect(cabeEnTiempo(205, [100, 100], 0)).toMatchObject({ cabe: true, restante: 5 });
  });

  it("una película sin duración no cabe, aunque el tiempo alcance", () => {
    expect(cabeEnTiempo(600, [96, null], PAUSA_ENTRE_PELICULAS)).toEqual({
      cabe: false,
      motivo: "sin-duracion",
    });
  });

  it.each([0, -10, 95.5])("una duración de %s cuenta como sin duración", (duracion) => {
    expect(cabeEnTiempo(600, [duracion], PAUSA_ENTRE_PELICULAS)).toEqual({
      cabe: false,
      motivo: "sin-duracion",
    });
  });

  it.each([29, 601, 90.5])("un tiempo de %s está fuera del rango permitido", (tiempo) => {
    expect(cabeEnTiempo(tiempo, [10], PAUSA_ENTRE_PELICULAS)).toEqual({
      cabe: false,
      motivo: "tiempo-invalido",
    });
  });

  it("revisa el tiempo antes que las duraciones", () => {
    expect(cabeEnTiempo(10, [null], PAUSA_ENTRE_PELICULAS)).toEqual({
      cabe: false,
      motivo: "tiempo-invalido",
    });
  });

  it("acepta los límites del rango", () => {
    expect(cabeEnTiempo(30, [30], PAUSA_ENTRE_PELICULAS)).toMatchObject({ cabe: true, restante: 0 });
    expect(cabeEnTiempo(600, [295, 295], PAUSA_ENTRE_PELICULAS)).toMatchObject({ cabe: true, total: 600 });
  });

  it("una sesión vacía cabe y deja todo el tiempo", () => {
    expect(cabeEnTiempo(90, [], PAUSA_ENTRE_PELICULAS)).toEqual({ cabe: true, total: 0, restante: 90 });
  });
});

describe("puedeAgregar", () => {
  it("la primera película no trae pausa (CA-2.2.1)", () => {
    expect(puedeAgregar(240, [], up, PAUSA_ENTRE_PELICULAS)).toEqual({ ok: true, total: 96, restante: 144 });
  });

  it("la segunda trae su pausa (CA-2.2.2)", () => {
    expect(puedeAgregar(240, [up], coco, PAUSA_ENTRE_PELICULAS)).toEqual({
      ok: true,
      total: 211,
      restante: 29,
    });
  });

  it("no agrega la que no cabe en lo que queda y dice cuánto necesita (CA-2.2.3)", () => {
    expect(puedeAgregar(240, [up, coco], her, PAUSA_ENTRE_PELICULAS)).toEqual({
      ok: false,
      motivo: "no-cabe",
      necesita: 136,
      pausa: 10,
      quedan: 29,
    });
  });

  it("agrega justo hasta el límite exacto (CA-2.2.4)", () => {
    expect(puedeAgregar(211, [up], coco, PAUSA_ENTRE_PELICULAS)).toEqual({
      ok: true,
      total: 211,
      restante: 0,
    });
  });

  it("no repite una película en la misma sesión (CA-2.2.6)", () => {
    expect(puedeAgregar(600, [up], up, PAUSA_ENTRE_PELICULAS)).toEqual({ ok: false, motivo: "repetida" });
  });

  it("no agrega una película sin duración", () => {
    expect(puedeAgregar(600, [], { ...up, duracion: null }, PAUSA_ENTRE_PELICULAS)).toEqual({
      ok: false,
      motivo: "sin-duracion",
    });
  });

  it("dice lo mismo que cabeEnTiempo", () => {
    const sesion = [up, coco];
    for (const tiempo of [200, 230, 336, 337, 400]) {
      const agregar = puedeAgregar(tiempo, sesion, her, PAUSA_ENTRE_PELICULAS);
      const cabe = cabeEnTiempo(tiempo, [96, 105, 126], PAUSA_ENTRE_PELICULAS);
      expect(agregar.ok).toBe(cabe.cabe);
    }
  });
});

describe("clasificarCandidatas", () => {
  it("con 120 minutos muestra Up y Coco en ese orden y cuenta 2 muy largas (CA-2.1.1, CA-2.1.2)", () => {
    const resultado = clasificarCandidatas(listaEjemplo, 120);
    expect(resultado.caben.map((p) => p.titulo)).toEqual(["Up", "Coco"]);
    expect(resultado.caben.map((p) => p.duracion)).toEqual([96, 105]);
    expect(resultado.muyLargas).toBe(2);
  });

  it("pone las que no tienen duración en no disponibles con su motivo (CA-2.1.6, CA-2.1.10)", () => {
    const conError: PeliculaPorVer = { ...porVer(her), duracion: { estado: "error" } };
    const resultado = clasificarCandidatas(
      [...listaEjemplo.filter((p) => p.titulo !== "Her"), conError],
      600
    );
    expect(resultado.noDisponibles.map((n) => [n.pelicula.titulo, n.motivo])).toEqual([
      ["Cortometraje perdido", "sin-duracion"],
      ["Her", "error-consulta"],
    ]);
    expect(resultado.caben.map((p) => p.titulo)).toEqual(["Up", "Coco", "Dune"]);
  });

  it("con la misma duración ordena por título (CA-2.1.3)", () => {
    const resultado = clasificarCandidatas(
      [porVer({ ...up, titulo: "Zodiaco" }), porVer({ ...coco, titulo: "Ágata", duracion: 96 }), porVer(her)],
      600
    );
    expect(resultado.caben.map((p) => p.titulo)).toEqual(["Ágata", "Zodiaco", "Her"]);
  });

  it("una película que dura exactamente el tiempo sí aparece", () => {
    expect(clasificarCandidatas([porVer(her)], 126).caben).toHaveLength(1);
  });

  it("con 60 minutos no cabe ninguna y las 4 son muy largas (CA-2.1.12)", () => {
    const resultado = clasificarCandidatas(listaEjemplo, 60);
    expect(resultado.caben).toEqual([]);
    expect(resultado.muyLargas).toBe(4);
  });

  it("no cambia el arreglo que recibe", () => {
    const copia = [...listaEjemplo];
    clasificarCandidatas(listaEjemplo, 300);
    expect(listaEjemplo).toEqual(copia);
  });
});

describe("validarNombreSesion", () => {
  it("vacío o con espacios queda sin nombre", () => {
    expect(validarNombreSesion("")).toEqual({ valido: true, nombre: null });
    expect(validarNombreSesion("   ")).toEqual({ valido: true, nombre: null });
  });

  it("recorta los espacios y acepta hasta 60 caracteres", () => {
    expect(validarNombreSesion("  Viernes de Pixar ")).toEqual({ valido: true, nombre: "Viernes de Pixar" });
    expect(validarNombreSesion("a".repeat(60))).toEqual({ valido: true, nombre: "a".repeat(60) });
  });

  it("rechaza más de 60 caracteres (CA-2.3.3)", () => {
    expect(validarNombreSesion("a".repeat(61))).toEqual({ valido: false, motivo: "muy-largo" });
  });
});

describe("textos", () => {
  it("formatea duraciones", () => {
    expect(formatearDuracion(0)).toBe("0 min");
    expect(formatearDuracion(45)).toBe("45 min");
    expect(formatearDuracion(60)).toBe("1 h");
    expect(formatearDuracion(96)).toBe("1 h 36 min");
    expect(formatearDuracion(211)).toBe("3 h 31 min");
    expect(formatearDuracion(600)).toBe("10 h");
  });

  it("explica por qué no se agregó una película (CA-2.2.3)", () => {
    expect(mensajeNoAgregada({ ok: false, motivo: "no-cabe", necesita: 136, pausa: 10, quedan: 29 })).toBe(
      "No cabe: necesita 136 min (126 + 10 de pausa) y te quedan 29 min."
    );
    expect(mensajeNoAgregada({ ok: false, motivo: "no-cabe", necesita: 155, pausa: 0, quedan: 120 })).toBe(
      "No cabe: necesita 155 min y te quedan 120 min."
    );
    expect(mensajeNoAgregada({ ok: false, motivo: "repetida" })).toBe("Ya está en tu sesión.");
    expect(mensajeNoAgregada({ ok: false, motivo: "sin-duracion" })).toBe(
      "TMDB no tiene su duración, así que no se puede agregar."
    );
  });

  it("avisa cuando la sesión ya no cabe (CA-2.2.8)", () => {
    expect(mensajeExcede(211, 200)).toBe(
      "Tu sesión dura 3 h 31 min y tienes 3 h 20 min. Quita películas para que quepa."
    );
  });
});

describe("llenarMiNoche (H2.5)", () => {
  const ordenadas = clasificarCandidatas(listaEjemplo, 240).caben;

  it("con 240 minutos propone Up y Her, que dejan solo 8 libres (CA-2.5.1)", () => {
    const propuesta = llenarMiNoche(ordenadas, 240, PAUSA_ENTRE_PELICULAS);
    expect(propuesta.map((p) => p.titulo)).toEqual(["Up", "Her"]);
    expect(
      cabeEnTiempo(
        240,
        propuesta.map((p) => p.duracion),
        PAUSA_ENTRE_PELICULAS
      )
    ).toEqual({
      cabe: true,
      total: 232,
      restante: 8,
    });
  });

  it("con el mismo tiempo ocupado elige la de menos películas (CA-2.5.2)", () => {
    const a = { ...up, tmdbId: 1, titulo: "A", duracion: 45 };
    const b = { ...up, tmdbId: 2, titulo: "B", duracion: 45 };
    const c = { ...up, tmdbId: 3, titulo: "C", duracion: 100 };
    // A + pausa + B = 100 y C sola = 100: gana C, con menos películas.
    expect(llenarMiNoche([a, b, c], 100, PAUSA_ENTRE_PELICULAS).map((p) => p.titulo)).toEqual(["C"]);
  });

  it("si ninguna cabe devuelve una sesión vacía (CA-2.5.4)", () => {
    expect(llenarMiNoche([dune, her], 60, PAUSA_ENTRE_PELICULAS)).toEqual([]);
    expect(llenarMiNoche([], 300, PAUSA_ENTRE_PELICULAS)).toEqual([]);
  });

  it("puede llenar el tiempo exacto, pausas incluidas", () => {
    // Up + Coco = 96 + 10 + 105 = 211
    expect(llenarMiNoche([up, coco, dune], 211, PAUSA_ENTRE_PELICULAS).map((p) => p.titulo)).toEqual([
      "Up",
      "Coco",
    ]);
  });

  it("la propuesta siempre cabe y no repite películas", () => {
    for (let tiempo = 30; tiempo <= 600; tiempo += 7) {
      const propuesta = llenarMiNoche([up, coco, her, dune], tiempo, PAUSA_ENTRE_PELICULAS);
      const ids = propuesta.map((p) => p.tmdbId);
      expect(new Set(ids).size).toBe(ids.length);
      if (propuesta.length > 0) {
        expect(
          cabeEnTiempo(
            tiempo,
            propuesta.map((p) => p.duracion),
            PAUSA_ENTRE_PELICULAS
          ).cabe
        ).toBe(true);
      }
    }
  });

  it("no hay otra combinación que ocupe más tiempo (comparado contra todas)", () => {
    const peliculas = [up, coco, her, dune, { ...up, tmdbId: 9, titulo: "Corto", duracion: 40 }];
    for (const tiempo of [90, 150, 240, 330, 420, 600]) {
      let mejor = 0;
      for (let mascara = 1; mascara < 1 << peliculas.length; mascara++) {
        const elegidas = peliculas.filter((_, i) => mascara & (1 << i)).map((p) => p.duracion);
        const total = duracionSesion(elegidas);
        if (total <= tiempo) mejor = Math.max(mejor, total);
      }
      const propuesta = llenarMiNoche(peliculas, tiempo, PAUSA_ENTRE_PELICULAS);
      expect(duracionSesion(propuesta.map((p) => p.duracion))).toBe(mejor);
    }
  });

  it("nunca incluye películas sin duración ni repetidas (CA-2.5.5)", () => {
    const rara = { ...up, tmdbId: 7, titulo: "Sin duración", duracion: 0 };
    const propuesta = llenarMiNoche([rara, up, up, coco], 600, PAUSA_ENTRE_PELICULAS);
    expect(propuesta.map((p) => p.titulo)).toEqual(["Up", "Coco"]);
  });

  it("arma el aviso con cuántas películas puso y cuánto ocupa", () => {
    expect(mensajeLlenarMiNoche([up, her], PAUSA_ENTRE_PELICULAS)).toBe(
      "Se armó una sesión de 2 películas que ocupa 3 h 52 min."
    );
    expect(mensajeLlenarMiNoche([up], PAUSA_ENTRE_PELICULAS)).toBe(
      "Se armó una sesión de 1 película que ocupa 1 h 36 min."
    );
    expect(mensajeLlenarMiNoche([], PAUSA_ENTRE_PELICULAS)).toBe("Ninguna película cabe en ese tiempo.");
  });
});
