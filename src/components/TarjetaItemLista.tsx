import type { ItemLista } from "../types/miLista.ts";
import Poster from "./Poster.tsx";
import EstadoBadge from "./EstadoBadge.tsx";
import Estrellas from "./Estrellas.tsx";

interface TarjetaItemListaProps {
  item: ItemLista;
  eliminando: boolean;
  onVerDetalle: (id: number) => void;
  onEliminar: (item: ItemLista) => void;
}

// La tarjeta solo AVISA al padre (onVerDetalle / onEliminar); no decide nada sola.
const TarjetaItemLista = ({ item, eliminando, onVerDetalle, onEliminar }: TarjetaItemListaProps) => (
  <article className="tarjeta-titulo">
    <button
      type="button"
      className="boton-poster"
      onClick={() => onVerDetalle(item.id)}
      aria-label={`Ver detalle de ${item.titulo}`}
    >
      <Poster url={item.poster_url} titulo={item.titulo} />
      <span className="esquina-estado">
        <EstadoBadge estado={item.estado} />
      </span>
    </button>
    <div className="tarjeta-titulo-cuerpo">
      <h3 className="tarjeta-titulo-nombre">{item.titulo}</h3>
      <p className="tarjeta-titulo-meta">
        {item.tipo_contenido === "pelicula" ? "Película" : "Serie"}
      </p>
      <Estrellas valor={item.calificacion_personal} />
      <div className="d-flex gap-2 mt-auto pt-2">
        <button type="button" className="btn btn-sm btn-outline-light flex-fill" onClick={() => onVerDetalle(item.id)}>
          Detalle
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => onEliminar(item)}
          disabled={eliminando}
          aria-label={`Eliminar ${item.titulo}`}
        >
          {eliminando ? "..." : "Eliminar"}
        </button>
      </div>
    </div>
  </article>
);

export default TarjetaItemLista;
