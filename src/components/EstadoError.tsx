interface EstadoErrorProps {
  mensaje: string;
  onReintentar?: () => void;
}

// Mensaje de error reutilizable, con botón "Reintentar" opcional.
const EstadoError = ({ mensaje, onReintentar }: EstadoErrorProps) => (
  <div className="estado-error" role="alert">
    <p className="mb-3">{mensaje}</p>
    {onReintentar && (
      <button type="button" className="btn btn-outline-light btn-sm" onClick={onReintentar}>
        Reintentar
      </button>
    )}
  </div>
);

export default EstadoError;
