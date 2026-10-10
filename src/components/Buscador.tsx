import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ResultadoTmdb } from "../types/catalogo.ts";
import { buscarTitulos } from "../services/tmdbService.ts";
import TarjetaResultado from "./TarjetaResultado.tsx";
import EstadoError from "./EstadoError.tsx";

// Los 4 estados posibles de una búsqueda (tipo union, como en las clases 6 y 12).
type EstadoBusqueda = "inicial" | "cargando" | "exito" | "error";

const LARGO_MINIMO = 2;
const LARGO_MAXIMO = 100;

// Revisa el texto antes de llamar a la API. Devuelve el mensaje de error o null.
const validarConsulta = (texto: string): string | null => {
  if (texto.length === 0) return "Escribe el nombre de una película o serie.";
  if (texto.length < LARGO_MINIMO) return `Escribe al menos ${LARGO_MINIMO} caracteres.`;
  if (texto.length > LARGO_MAXIMO) return `Máximo ${LARGO_MAXIMO} caracteres.`;
  return null;
};

const Buscador = () => {
  const [consulta, setConsulta] = useState("");
  const [estado, setEstado] = useState<EstadoBusqueda>("inicial");
  const [resultados, setResultados] = useState<ResultadoTmdb[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [ultimaConsulta, setUltimaConsulta] = useState("");

  // Guarda el controlador de la búsqueda en curso para cancelarla si llega otra.
  const controladorRef = useRef<AbortController | null>(null);

  const buscar = async (texto: string) => {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;

    setEstado("cargando");
    setError(null);
    setUltimaConsulta(texto);

    try {
      const encontrados = await buscarTitulos(texto, controlador.signal);
      setResultados(encontrados);
      setEstado("exito");
    } catch (err) {
      // Si la búsqueda fue cancelada por una nueva, no mostramos error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        err instanceof TypeError
          ? "No se pudo conectar con TMDB. Revisa tu conexión a internet."
          : err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado."
      );
      setEstado("error");
    }
  };

  const manejarEnvio = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const texto = consulta.trim();
    const mensaje = validarConsulta(texto);
    setErrorValidacion(mensaje);
    if (mensaje) return;
    buscar(texto);
  };

  return (
    <section>
      <h1 className="titulo-seccion mb-3">Buscar películas y series</h1>

      <form className="buscador" onSubmit={manejarEnvio} noValidate>
        <input
          type="search"
          className="form-control"
          placeholder="Ej: Interstellar, The Office, Coco..."
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          maxLength={LARGO_MAXIMO}
          aria-label="Título a buscar"
          aria-invalid={errorValidacion !== null}
        />
        <button type="submit" className="btn btn-acento" disabled={estado === "cargando"}>
          {estado === "cargando" ? "Buscando..." : "Buscar"}
        </button>
      </form>
      {errorValidacion && <p className="texto-validacion">{errorValidacion}</p>}

      <div className="mt-4">
        {estado === "inicial" && (
          <p className="text-secondary">Busca un título para empezar a armar tu cartelera.</p>
        )}

        {estado === "cargando" && (
          <div className="text-center py-5" role="status">
            <div className="spinner-border text-warning mb-2" />
            <p className="text-secondary">Buscando en TMDB...</p>
          </div>
        )}

        {estado === "error" && error && (
          <EstadoError mensaje={error} onReintentar={() => buscar(ultimaConsulta)} />
        )}

        {estado === "exito" && resultados.length === 0 && (
          <p className="text-secondary">
            No encontramos películas ni series para "{ultimaConsulta}". Prueba con otro nombre.
          </p>
        )}

        {estado === "exito" && resultados.length > 0 && (
          <>
            <p className="text-secondary mb-3">
              {resultados.length} resultado{resultados.length === 1 ? "" : "s"} para "{ultimaConsulta}"
            </p>
            <div className="grilla-titulos">
              {resultados.map((resultado) => (
                <TarjetaResultado key={`${resultado.tipo}-${resultado.tmdbId}`} resultado={resultado} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Buscador;
