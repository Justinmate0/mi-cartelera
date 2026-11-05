import { useState } from "react";
import type { FormEvent } from "react";
import { TIEMPO_MAXIMO, TIEMPO_MINIMO } from "../dominio/nocheDePelicula.ts";

interface FormularioTiempoProps {
  error: string | null;
  onConfirmar: (texto: string) => void;
}

// Campo del tiempo disponible. Solo avisa el texto escrito; la validación vive en el dominio.
const FormularioTiempo = ({ error, onConfirmar }: FormularioTiempoProps) => {
  const [texto, setTexto] = useState("");

  const manejarEnvio = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    onConfirmar(texto);
  };

  return (
    <form className="formulario-tiempo" onSubmit={manejarEnvio} noValidate>
      <label htmlFor="tiempo-disponible" className="form-label fw-semibold">
        ¿Cuántos minutos tienes libres?
      </label>
      <div className="fila-tiempo">
        <input
          id="tiempo-disponible"
          className={`form-control ${error ? "is-invalid" : ""}`}
          inputMode="numeric"
          autoComplete="off"
          placeholder={`Entre ${TIEMPO_MINIMO} y ${TIEMPO_MAXIMO}`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "tiempo-error" : "tiempo-ayuda"}
        />
        <button type="submit" className="btn btn-acento">
          Ver qué cabe
        </button>
      </div>
      {error ? (
        <p id="tiempo-error" className="texto-validacion" role="alert">
          {error}
        </p>
      ) : (
        <p id="tiempo-ayuda" className="form-text text-secondary mb-0">
          Minutos enteros, entre {TIEMPO_MINIMO} y {TIEMPO_MAXIMO}.
        </p>
      )}
    </form>
  );
};

export default FormularioTiempo;
