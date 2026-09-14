import React from 'react';

export default function ProcessingStep() {
  return (
    <div className="card">
      <h2>Generando mapa…</h2>
      <p className="subtitle">
        Leyendo el CSV y cargando los bordes geográficos.
      </p>

      <div className="spinner-row">
        <div className="spinner" />
        <span>Procesando…</span>
      </div>
    </div>
  );
}
