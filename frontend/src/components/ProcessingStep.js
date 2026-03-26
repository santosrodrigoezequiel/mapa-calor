import React from 'react';

export default function ProcessingStep({ jobInfo, onCancel }) {
  const { status } = jobInfo;

  const mensajes = {
    pending: 'Iniciando...',
    running: 'Generando mapa de calor...',
  };

  return (
    <div className="card">
      <h2>Generando mapa…</h2>
      <p className="subtitle">
        Estamos descargando los bordes geográficos y calculando el mapa de calor.
        Tardará unos segundos.
      </p>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: status === 'running' ? '70%' : '20%' }}
          />
        </div>
      </div>

      <div className="spinner-row">
        <div className="spinner" />
        <span>{mensajes[status] || 'Procesando...'}</span>
      </div>

      <button className="btn-secondary" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  );
}
