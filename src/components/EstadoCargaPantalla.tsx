interface EstadoCargaPantallaProps {
  mensaje?: string;
}

const EstadoCargaPantalla = ({ mensaje = "Cargando..." }: EstadoCargaPantallaProps) => (
  <div className="pantalla-centrada" role="status">
    <div className="spinner-border text-warning mb-3" />
    <p className="text-secondary">{mensaje}</p>
  </div>
);

export default EstadoCargaPantalla;
