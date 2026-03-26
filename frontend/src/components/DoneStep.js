import React, { useRef, useEffect } from 'react';

const REGION_LABELS = {
  auto: 'Auto', argentina: 'Argentina', brasil: 'Brasil', chile: 'Chile',
  colombia: 'Colombia', mexico: 'México', peru: 'Perú', uruguay: 'Uruguay',
  usa: 'Estados Unidos', españa: 'España', mundo: 'Mundo',
};

const PALETA_LABELS = {
  oscuro: '🌑 Modo oscuro',
  clasico: '🌍 Modo clásico',
};

export default function DoneStep({ jobInfo, config, mapHtml, onDownload, onReset }) {
  const iframeRef = useRef();

useEffect(() => {
  if (iframeRef.current && mapHtml) {
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    // Inyectar CSS que fuerza el mapa a llenar todo el iframe
    const htmlFull = mapHtml.replace(
      '</head>',
      `<style>
        html, body { height: 100% !important; margin: 0 !important; padding: 0 !important; }
        #map { height: 100% !important; min-height: 100% !important; }
        .folium-map { height: 100% !important; }
      </style></head>`
    );
    doc.open();
    doc.write(htmlFull);
    doc.close();
  }
}, [mapHtml]);

  return (
    <div className="card card-done">
      <div className="done-icon">✅</div>
      <h2>¡Mapa generado!</h2>
      <p className="subtitle">
        Se procesaron <strong>{jobInfo.puntos}</strong> puntos geográficos correctamente.
      </p>

      {/* Config summary */}
      <div className="config-summary">
        <div className="config-tag">
          🌍 Región: <strong>{REGION_LABELS[config.region] || config.region}</strong>
        </div>
        <div className="config-tag">
          🗺️ Bordes: <strong>{config.nivel_bordes === 'provincias' ? 'Provincias' : 'Países'}</strong>
        </div>
        <div className="config-tag">
          🎨 Paleta: <strong>{PALETA_LABELS[config.paleta] || config.paleta}</strong>
        </div>
      </div>

      {/* Mapa embebido */}
      <div className="map-container">
        <iframe
          ref={iframeRef}
          title="Mapa de calor"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* Acciones */}
      <div className="btn-row">
        <button className="btn-primary" onClick={onDownload}>
          ⬇️ Descargar HTML
        </button>
        <button className="btn-secondary" onClick={onReset}>
          Nuevo mapa
        </button>
      </div>
    </div>
  );
}
