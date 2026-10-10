import type { ResultadoTmdb } from "../types/catalogo.ts";
import Poster from "./Poster.tsx";

interface TarjetaResultadoProps {
  resultado: ResultadoTmdb;
  yaEnLista: boolean;
  agregando: boolean;
  onAgregar: (resultado: ResultadoTmdb) => void;
}

const TarjetaResultado = ({ resultado, yaEnLista, agregando, onAgregar }: TarjetaResultadoProps) => {
  const { titulo, anio, tipo, posterUrl } = resultado;

  return (
    <article className="tarjeta-titulo">
      <Poster url={posterUrl} titulo={titulo} />
      <div className="tarjeta-titulo-cuerpo">
        <h3 className="tarjeta-titulo-nombre">{titulo}</h3>
        <p className="tarjeta-titulo-meta">
          {anio ?? "Sin fecha"} · {tipo === "pelicula" ? "Película" : "Serie"}
        </p>
        <button
          type="button"
          className={`btn btn-sm mt-auto ${yaEnLista ? "btn-en-lista" : "btn-acento"}`}
          disabled={yaEnLista || agregando}
          onClick={() => onAgregar(resultado)}
          aria-label={yaEnLista ? `${titulo} ya está en tu lista` : `Agregar ${titulo} a mi lista`}
        >
          {yaEnLista ? "✓ En tu lista" : agregando ? "Agregando..." : "+ Agregar"}
        </button>
      </div>
    </article>
  );
};

export default TarjetaResultado;
