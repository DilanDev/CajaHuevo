/**
 * Descarga una matriz de datos como CSV compatible con Excel en español
 * (UTF-8 con BOM y punto y coma como separador).
 */
export function descargarCSV(
  nombreArchivo: string,
  filas: (string | number | null | undefined)[][]
) {
  const contenido = filas
    .map((fila) =>
      fila
        .map((celda) => {
          const texto = celda === null || celda === undefined ? "" : String(celda);
          return `"${texto.replace(/"/g, '""')}"`;
        })
        .join(";")
    )
    .join("\r\n");

  const blob = new Blob(["﻿" + contenido], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo.endsWith(".csv")
    ? nombreArchivo
    : `${nombreArchivo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
