interface BarraUsuarioProps {
  email: string;
  onCerrarSesion: () => void;
}

// Barra superior fija: muestra quién está conectado y el botón de logout,
// visible en todas las pantallas privadas de la app.
const BarraUsuario = ({ email, onCerrarSesion }: BarraUsuarioProps) => (
  <header className="barra-usuario">
    <span className="marca">Mi Cartelera</span>
    <div className="d-flex align-items-center gap-3">
      <span className="email-usuario">{email}</span>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={onCerrarSesion}>
        Cerrar sesión
      </button>
    </div>
  </header>
);

export default BarraUsuario;
