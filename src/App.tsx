import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient.ts";
import { obtenerSesionActual, cerrarSesion } from "./services/authService.ts";
import PantallaAuth from "./components/PantallaAuth.tsx";
import EstadoCargaPantalla from "./components/EstadoCargaPantalla.tsx";
import BarraUsuario from "./components/BarraUsuario.tsx";
import type { Seccion } from "./components/BarraUsuario.tsx";
import Buscador from "./components/Buscador.tsx";

const App = () => {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [seccion, setSeccion] = useState<Seccion>("buscar");

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
      setSeccion("buscar");
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo cerrar la sesión.");
    }
  };

  if (cargandoSesion) return <EstadoCargaPantalla mensaje="Verificando sesión..." />;

  // Sin sesión no se puede ver ninguna pantalla de contenido.
  if (!sesion) return <PantallaAuth />;

  return (
    <>
      <BarraUsuario
        email={sesion.user.email ?? ""}
        seccionActiva={seccion}
        onCambiarSeccion={setSeccion}
        onCerrarSesion={manejarCerrarSesion}
      />
      <main className="container py-4">
        {seccion === "buscar" && <Buscador />}
        {seccion === "mi-lista" && (
          <section>
            <h1 className="titulo-seccion">Mi lista</h1>
            <p className="text-secondary">Aquí aparecerán los títulos que guardes (Etapa 3).</p>
          </section>
        )}
      </main>
    </>
  );
};

export default App;
