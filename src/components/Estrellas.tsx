const ESCALA = [1, 2, 3, 4, 5];

interface EstrellasProps {
  valor: number | null;
  onCambiar?: (valor: number | null) => void; // si no se pasa, son de solo lectura
}

const Estrellas = ({ valor, onCambiar }: EstrellasProps) => {
  // Modo solo lectura: para las tarjetas de la lista.
  if (!onCambiar) {
    if (valor === null) return <span className="sin-calificar">Sin calificar</span>;
    return (
      <span className="estrellas" aria-label={`${valor} de 5 estrellas`}>
        {ESCALA.map((n) => (
          <span key={n} className={n <= valor ? "llena" : "vacia"} aria-hidden="true">★</span>
        ))}
      </span>
    );
  }

  // Modo editable: para el formulario de la página de detalle.
  return (
    <div className="d-flex align-items-center flex-wrap gap-2">
      <div className="estrellas estrellas-editables" role="radiogroup" aria-label="Tu calificación">
        {ESCALA.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} de 5`}
            className={valor !== null && n <= valor ? "llena" : "vacia"}
            onClick={() => onCambiar(n)}
          >
            ★
          </button>
        ))}
      </div>
      {valor !== null && (
        <button type="button" className="boton-texto" onClick={() => onCambiar(null)}>
          Quitar calificación
        </button>
      )}
    </div>
  );
};

export default Estrellas;
