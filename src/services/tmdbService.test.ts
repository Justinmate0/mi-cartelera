import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// El token se lee al cargar el módulo, así que se define antes de importarlo.
const cargarServicio = async () => {
  vi.resetModules();
  vi.stubEnv("VITE_TMDB_TOKEN", "token-de-prueba");
  return import("./tmdbService.ts");
};

const respuesta = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

describe("obtenerDuraciones (NP-04)", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it("devuelve conocida, desconocida o error por película", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const texto = String(url);
      if (texto.includes("/movie/1?")) return respuesta({ runtime: 96 });
      if (texto.includes("/movie/2?")) return respuesta({ runtime: 0 });
      if (texto.includes("/movie/3?")) return respuesta({ runtime: null });
      return respuesta({}, 500);
    });
    const { obtenerDuraciones } = await cargarServicio();

    const duraciones = await obtenerDuraciones([1, 2, 3, 4]);

    expect(duraciones.get(1)).toEqual({ estado: "conocida", minutos: 96 });
    expect(duraciones.get(2)).toEqual({ estado: "desconocida" });
    expect(duraciones.get(3)).toEqual({ estado: "desconocida" });
    expect(duraciones.get(4)).toEqual({ estado: "error" });
  });

  it("si fallan todas, lanza el error en español", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(respuesta({}, 401));
    const { obtenerDuraciones } = await cargarServicio();

    await expect(obtenerDuraciones([1, 2])).rejects.toThrow("El token de TMDB no es válido");
  });

  it("sin películas no consulta nada", async () => {
    const espia = vi.spyOn(globalThis, "fetch");
    const { obtenerDuraciones } = await cargarServicio();

    expect((await obtenerDuraciones([])).size).toBe(0);
    expect(espia).not.toHaveBeenCalled();
  });

  it("no hace más de 4 consultas a la vez y no repite ids", async () => {
    let enCurso = 0;
    let maximo = 0;
    const espia = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      enCurso += 1;
      maximo = Math.max(maximo, enCurso);
      await new Promise((resolver) => setTimeout(resolver, 5));
      enCurso -= 1;
      return respuesta({ runtime: 100 });
    });
    const { obtenerDuraciones } = await cargarServicio();

    const duraciones = await obtenerDuraciones([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2]);

    expect(duraciones.size).toBe(10);
    expect(espia).toHaveBeenCalledTimes(10);
    expect(maximo).toBeLessThanOrEqual(4);
  });
});
