// Hook PostToolUse: después de que el agente edita o crea un archivo, lo formatea con Prettier.
// Solo ejecuta el Prettier instalado en el proyecto, sobre el archivo que se acaba de tocar.
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const EXTENSIONES = new Set([".ts", ".tsx", ".js", ".cjs", ".json", ".css", ".md", ".html"]);

let entrada = "";
process.stdin.on("data", (trozo) => (entrada += trozo));
process.stdin.on("end", () => {
  try {
    const evento = JSON.parse(entrada || "{}");
    const archivo = evento.tool_input && evento.tool_input.file_path;
    if (!archivo || !EXTENSIONES.has(path.extname(archivo))) return;

    const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const relativo = path.relative(raiz, archivo);
    // Nunca toca archivos fuera del proyecto ni archivos de claves.
    if (relativo.startsWith("..") || path.basename(archivo).startsWith(".env")) return;

    const prettier = path.join(raiz, "node_modules", "prettier", "bin", "prettier.cjs");
    if (!fs.existsSync(prettier)) {
      console.error("Prettier no está instalado: ejecuta npm install.");
      return;
    }
    execFileSync(process.execPath, [prettier, "--write", "--ignore-unknown", archivo], {
      cwd: raiz,
      stdio: "ignore",
    });
  } catch (error) {
    // Un fallo de formato no debe bloquear al agente; solo se avisa.
    console.error(`No se pudo formatear: ${error.message}`);
  }
});
