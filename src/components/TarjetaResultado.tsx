import type { ResultadoTmdb } from "../types/catalogo.ts";
import Poster from "./Poster.tsx";

interface TarjetaResultadoProps {
  resultado: ResultadoTmdb;
}

const TarjetaResultado = ({ resultado }: TarjetaResultadoProps) => {
  const { titulo, anio, tipo, posterUrl } = resultado;

  return (
    <article className="tarjeta-titulo">
      <Poster url={posterUrl} titulo={titulo} />
      <div className="tarjeta-titulo-cuerpo">
        <h3 className="tarjeta-titulo-nombre">{titulo}</h3>
        <p className="tarjeta-titulo-meta">
          {anio ?? "Sin fecha"} · {tipo === "pelicula" ? "Película" : "Serie"}
        </p>
      </div>
    </article>
  );
};

export default TarjetaResultado;
