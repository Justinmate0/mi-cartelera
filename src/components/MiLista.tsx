import { useMemo, useState } from "react";
import type { EstadoVisualizacion, ItemLista } from "../types/miLista.ts";
import { ESTADOS, ETIQUETAS_ESTADO } from "../types/miLista.ts";
import TarjetaItemLista from "./TarjetaItemLista.tsx";
import EstadoError from "./EstadoError.tsx";

type FiltroEstado = "todos" | EstadoVisualizacion;
type Orden = "recientes" | "antiguos" | "mejor-calificados";

interface MiListaProps {
  items: ItemLista[];
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
  onVerDetalle: (id: number) => void;
  onEliminar: (id: number) => Promise<void>;
  onIrABuscar: () => void;
}

// Ordena SIN mutar el arreglo original: primero copiamos con [...items].
const ordenarItems = (items: ItemLista[], orden: Orden): ItemLista[] => {
  const copia = [...items];
  switch (orden) {
    case "recientes":
      return copia.sort((a, b) => b.fecha_agregado.localeCompare(a.fecha_agregado));
    case "antiguos":
      return copia.sort((a, b) => a.fecha_agregado.localeCompare(b.fecha_agregado));
    case "mejor-calificados":
      // Los que no tienen calificación (null) van al final.
      return copia.sort((a, b) => (b.calificacion_personal ?? 0) - (a.calificacion_personal ?? 0));
  }
};

const MiLista = ({ items, cargando, error, onReintentar, onVerDetalle, onEliminar, onIrABuscar }: MiListaProps) => {
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [avisoError, setAvisoError] = useState<string | null>(null);

  // Contador resumen con filter (uno por estado).
  const conteo = useMemo(
    () => ({
      por_ver: items.filter((item) => item.estado === "por_ver").length,
      viendo: items.filter((item) => item.estado === "viendo").length,
      vista: items.filter((item) => item.estado === "vista").length,
    }),
    [items]
  );

  const itemsVisibles = useMemo(
    () => ordenarItems(filtro === "todos" ? items : items.filter((item) => item.estado === filtro), orden),
    [items, filtro, orden]
  );

  const manejarEliminar = async (item: ItemLista) => {
    if (!window.confirm(`¿Seguro que quieres quitar "${item.titulo}" de tu lista?`)) return;
    setAvisoError(null);
    setEliminandoId(item.id);
    try {
      await onEliminar(item.id);
    } catch (err) {
      setAvisoError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setEliminandoId(null);
    }
  };

  if (cargando) {
    return (
      <div className="text-center py-5" role="status">
        <div className="spinner-border text-warning mb-2" />
        <p className="text-secondary">Cargando tu lista...</p>
      </div>
    );
  }

  if (error) return <EstadoError mensaje={error} onReintentar={onReintentar} />;

  if (items.length === 0) {
    return (
      <section className="lista-vacia">
        <h1 className="titulo-seccion">Tu lista está vacía</h1>
        <p className="text-secondary">Busca una película o serie y agrégala para empezar.</p>
        <button type="button" className="btn btn-acento" onClick={onIrABuscar}>
          Ir a buscar
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1 className="titulo-seccion mb-2">Mi lista</h1>

      <p className="contador-resumen">
        Tienes <strong>{conteo.por_ver}</strong> {conteo.por_ver === 1 ? "pendiente" : "pendientes"},{" "}
        <strong>{conteo.viendo}</strong> en progreso y{" "}
        <strong>{conteo.vista}</strong> {conteo.vista === 1 ? "vista" : "vistas"}.
      </p>

      <div className="controles-lista">
        <div className="filtros" role="group" aria-label="Filtrar por estado">
          <button
            type="button"
            className={filtro === "todos" ? "activo" : ""}
            aria-pressed={filtro === "todos"}
            onClick={() => setFiltro("todos")}
          >
            Todos ({items.length})
          </button>
          {ESTADOS.map((estado) => (
            <button
              key={estado}
              type="button"
              className={filtro === estado ? "activo" : ""}
              aria-pressed={filtro === estado}
              onClick={() => setFiltro(estado)}
            >
              {ETIQUETAS_ESTADO[estado]} ({conteo[estado]})
            </button>
          ))}
        </div>

        <label className="selector-orden">
          <span>Ordenar:</span>
          <select
            className="form-select form-select-sm"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
          >
            <option value="recientes">Agregados recientemente</option>
            <option value="antiguos">Agregados hace más tiempo</option>
            <option value="mejor-calificados">Mejor calificados</option>
          </select>
        </label>
      </div>

      {avisoError && <div className="alert alert-danger py-2">{avisoError}</div>}

      {itemsVisibles.length === 0 ? (
        <p className="text-secondary">
          No tienes títulos en "{filtro === "todos" ? "Todos" : ETIQUETAS_ESTADO[filtro]}".
        </p>
      ) : (
        <div className="grilla-titulos">
          {itemsVisibles.map((item) => (
            <TarjetaItemLista
              key={item.id}
              item={item}
              eliminando={eliminandoId === item.id}
              onVerDetalle={onVerDetalle}
              onEliminar={manejarEliminar}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MiLista;
