import { useState } from "react";
import type { FormEvent } from "react";
import { registrarUsuario, iniciarSesion } from "../services/authService.ts";

type ModoAuth = "login" | "registro";

const PantallaAuth = () => {
  const [modo, setModo] = useState<ModoAuth>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);
    setAviso(null);
    setEnviando(true);

    try {
      if (modo === "login") {
        await iniciarSesion(email.trim(), password);
      } else {
        const sesionIniciada = await registrarUsuario(email.trim(), password);
        if (!sesionIniciada) {
          setAviso("Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.");
          setModo("login");
        }
      }
      // Si hay sesión nueva, onAuthStateChange en App.tsx cambia de pantalla solo.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  };

  const cambiarModo = () => {
    setModo(modo === "login" ? "registro" : "login");
    setError(null);
    setAviso(null);
  };

  return (
    <main className="pantalla-auth">
      <div className="tarjeta-auth">
        <p className="marca mb-1">Mi Cartelera</p>
        <h1 className="titulo-auth mb-4">
          {modo === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {aviso && <div className="alert alert-success py-2">{aviso}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
            {modo === "registro" && (
              <div className="form-text">Mínimo 6 caracteres.</div>
            )}
          </div>
          <button type="submit" className="btn btn-acento w-100" disabled={enviando}>
            {enviando ? "Un momento..." : modo === "login" ? "Entrar" : "Registrarme"}
          </button>
        </form>

        <button type="button" className="cambiar-modo-auth" onClick={cambiarModo}>
          {modo === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </main>
  );
};

export default PantallaAuth;
