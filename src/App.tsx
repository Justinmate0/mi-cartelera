import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient.ts";
import { obtenerSesionActual, cerrarSesion } from "./services/authService.ts";
import {
  obtenerMiLista,
  agregarALista,
  actualizarItem,
  eliminarItem,
} from "./services/miListaService.ts";
import type { ResultadoTmdb } from "./types/catalogo.ts";
import type { CambiosItem, ItemLista } from "./types/miLista.ts";
import { claveTitulo } from "./types/miLista.ts";
import PantallaAuth from "./components/PantallaAuth.tsx";
import EstadoCargaPantalla from "./components/EstadoCargaPantalla.tsx";
import BarraUsuario from "./components/BarraUsuario.tsx";
import type { Seccion } from "./components/BarraUsuario.tsx";
import Buscador from "./components/Buscador.tsx";
import MiLista from "./components/MiLista.tsx";
import DetalleTitulo from "./components/DetalleTitulo.tsx";

// Navegación sin router (como en la clase 12): solo estas 3 "pantallas" existen.
type Vista = Seccion | "detalle";

const App = () => {
  // ---- Sesión ----
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  // ---- Navegación ----
  const [vista, setVista] = useState<Vista>("buscar");
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);

  // ---- Colección personal (tabla mi_lista) ----
  const [miLista, setMiLista] = useState<ItemLista[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [recargar, setRecargar] = useState(0);

  const userId = sesion?.user.id ?? null;

  // Al abrir la app: recuperar la sesión guardada y escuchar login/logout.
  useEffect(() => {
    obtenerSesionActual()
      .then((sesionGuardada) => setSesion(sesionGuardada))
      .catch(() => setSesion(null))
      .finally(() => setCargandoSesion(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion);
      // Al cerrar sesión, borramos de la memoria la lista del usuario anterior.
      if (!nuevaSesion) setMiLista([]);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Cada vez que cambia el usuario conectado (o se pide reintentar), cargamos SU lista.
  useEffect(() => {
    if (!userId) return;
    let cancelado = false;

    const cargarLista = async () => {
      setCargandoLista(true);
      setErrorLista(null);
      try {
        const items = await obtenerMiLista();
        if (!cancelado) setMiLista(items);
      } catch (err) {
        if (!cancelado) setErrorLista(err instanceof Error ? err.message : "No se pudo cargar tu lista.");
      } finally {
        if (!cancelado) setCargandoLista(false);
      }
    };

    cargarLista();
    // Si el usuario cambia antes de que responda Supabase, ignoramos esa respuesta vieja.
    return () => {
      cancelado = true;
    };
  }, [userId, recargar]);

  // Conjunto de claves "tipo-id" para marcar en el buscador lo que ya está guardado.
  const clavesEnLista = useMemo(
    () => new Set(miLista.map((item) => claveTitulo(item.tipo_contenido, item.tmdb_id))),
    [miLista]
  );

  // ---- CRUD: la tabla se modifica en Supabase y luego se refleja en el estado ----
  const manejarAgregar = useCallback(
    async (resultado: ResultadoTmdb) => {
      if (!userId) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
      const nuevo = await agregarALista(resultado, userId);
      setMiLista((lista) => [nuevo, ...lista]);
    },
    [userId]
  );

  const manejarActualizar = async (id: number, cambios: CambiosItem) => {
    const actualizado = await actualizarItem(id, cambios);
    setMiLista((lista) => lista.map((item) => (item.id === id ? actualizado : item)));
  };

  const manejarEliminar = async (id: number) => {
    await eliminarItem(id);
    setMiLista((lista) => lista.filter((item) => item.id !== id));
    if (idSeleccionado === id) {
      setIdSeleccionado(null);
      setVista("mi-lista");
    }
  };

  const verDetalle = (id: number) => {
    setIdSeleccionado(id);
    setVista("detalle");
    window.scrollTo({ top: 0 });
  };

  const cambiarSeccion = (seccion: Seccion) => {
    setVista(seccion);
    setIdSeleccionado(null);
  };

  const manejarCerrarSesion = async () => {
    try {
      await cerrarSesion();
      setVista("buscar");
      setIdSeleccionado(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo cerrar la sesión.");
    }
  };

  if (cargandoSesion) return <EstadoCargaPantalla mensaje="Verificando sesión..." />;

  // Sin sesión no se puede ver ninguna pantalla de contenido.
  if (!sesion) return <PantallaAuth />;

  const itemSeleccionado = miLista.find((item) => item.id === idSeleccionado);

  return (
    <>
      <BarraUsuario
        email={sesion.user.email ?? ""}
        seccionActiva={vista === "detalle" ? "mi-lista" : vista}
        onCambiarSeccion={cambiarSeccion}
        onCerrarSesion={manejarCerrarSesion}
      />
      <main className="container py-4">
        {/* El buscador se oculta en vez de desmontarse: así no se pierden los resultados */}
        <div hidden={vista !== "buscar"}>
          <Buscador clavesEnLista={clavesEnLista} onAgregar={manejarAgregar} />
        </div>

        {vista === "mi-lista" && (
          <MiLista
            items={miLista}
            cargando={cargandoLista}
            error={errorLista}
            onReintentar={() => setRecargar((n) => n + 1)}
            onVerDetalle={verDetalle}
            onEliminar={manejarEliminar}
            onIrABuscar={() => cambiarSeccion("buscar")}
          />
        )}

        {vista === "detalle" && itemSeleccionado && (
          <DetalleTitulo
            key={itemSeleccionado.id}
            item={itemSeleccionado}
            onVolver={() => cambiarSeccion("mi-lista")}
            onGuardar={manejarActualizar}
            onEliminar={manejarEliminar}
          />
        )}
      </main>
    </>
  );
};

export default App;
