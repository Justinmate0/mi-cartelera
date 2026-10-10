import type { EstadoVisualizacion } from "../types/miLista.ts";

interface EstadoBadgeProps {
  estado: EstadoVisualizacion;
}

// Union + switch: TypeScript verifica que se cubran los tres estados (como en la clase 10).
const EstadoBadge = ({ estado }: EstadoBadgeProps) => {
  switch (estado) {
    case "por_ver":
      return <span className="badge-estado badge-por-ver">Por ver</span>;
    case "viendo":
      return <span className="badge-estado badge-viendo">Viendo</span>;
    case "vista":
      return <span className="badge-estado badge-vista">Vista</span>;
  }
};

export default EstadoBadge;
