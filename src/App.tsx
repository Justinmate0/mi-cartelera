import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient.ts";
import { obtenerSesionActual, cerrarSesion } from "./services/authService.ts";
import PantallaAuth from "./components/PantallaAuth.tsx";
import EstadoCargaPantalla from "./components/EstadoCargaPantalla.tsx";
import BarraUsuario from "./components/BarraUsuario.tsx";

const App = () => {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  // Al abrir la app: recuperar la sesión guardada y escuchar login/logout.
  useEffect(() => {
    obtenerSesionActual()
      .then((sesionGuardada) => setSesion(sesionGuardada))
      .catch(() => setSesion(null))
      .finally(() => setCargandoSesion(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const manejarCerrarSesion = async () => {
    try {
      await cerrarSesion();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo cerrar la sesión.");
    }
  };

  if (cargandoSesion) return <EstadoCargaPantalla mensaje="Verificando sesión..." />;

  // Sin sesión no se puede ver ninguna pantalla de contenido.
  if (!sesion) return <PantallaAuth />;

  return (
    <>
      <BarraUsuario email={sesion.user.email ?? ""} onCerrarSesion={manejarCerrarSesion} />
      <main className="container py-5">
        <h1 className="titulo-seccion">Bienvenido a tu cartelera</h1>
        <p className="text-secondary">
          Sesión iniciada correctamente. Aquí irá el buscador y tu lista.
        </p>
      </main>
    </>
  );
};

export default App;
