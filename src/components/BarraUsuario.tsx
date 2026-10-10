export type Seccion = "buscar" | "mi-lista";

interface BarraUsuarioProps {
  email: string;
  seccionActiva: Seccion;
  onCambiarSeccion: (seccion: Seccion) => void;
  onCerrarSesion: () => void;
}

// Barra superior fija: navegación, quién está conectado y el botón de logout,
// visible en todas las pantallas privadas de la app.
const BarraUsuario = ({ email, seccionActiva, onCambiarSeccion, onCerrarSesion }: BarraUsuarioProps) => (
  <header className="barra-usuario">
    <div className="d-flex align-items-center gap-4">
      <span className="marca">Mi Cartelera</span>
      <nav className="navegacion" aria-label="Secciones">
        <button
          type="button"
          className={seccionActiva === "buscar" ? "activa" : ""}
          aria-current={seccionActiva === "buscar" ? "page" : undefined}
          onClick={() => onCambiarSeccion("buscar")}
        >
          Buscar
        </button>
        <button
          type="button"
          className={seccionActiva === "mi-lista" ? "activa" : ""}
          aria-current={seccionActiva === "mi-lista" ? "page" : undefined}
          onClick={() => onCambiarSeccion("mi-lista")}
        >
          Mi lista
        </button>
      </nav>
    </div>
    <div className="d-flex align-items-center gap-3">
      <span className="email-usuario">{email}</span>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={onCerrarSesion}>
        Cerrar sesión
      </button>
    </div>
  </header>
);

export default BarraUsuario;
