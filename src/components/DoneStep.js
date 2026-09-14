import React, { useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { dibujar, htmlAutonomo } from '../lib/mapa';

const REGION_LABELS = {
  auto: 'Auto', argentina: 'Argentina', brasil: 'Brasil', chile: 'Chile',
  colombia: 'Colombia', mexico: 'México', peru: 'Perú', uruguay: 'Uruguay',
  usa: 'Estados Unidos', españa: 'España', mundo: 'Mundo',
};

const PALETA_LABELS = {
  oscuro: '🌑 Modo oscuro',
  clasico: '🌍 Modo clásico',
};

export default function DoneStep({ datos, resumen, config, aviso, onReset }) {
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);

  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;
    mapaRef.current = dibujar(L, contenedorRef.current, datos);

    return () => {
      if (mapaRef.current) {
        mapaRef.current.remove();
        mapaRef.current = null;
      }
    };
  }, [datos]);

  const handleDownload = useCallback(() => {
    const html = htmlAutonomo(datos);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapa_calor_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [datos]);

  return (
    <div className="card card-done">
      <div className="done-icon">✅</div>
      <h2>¡Mapa generado!</h2>
      <p className="subtitle">
        Se procesaron <strong>{resumen.puntos}</strong> puntos geográficos.
        {resumen.descartados > 0 && (
          <> Quedaron afuera <strong>{resumen.descartados}</strong> filas sin coordenadas válidas.</>
        )}
      </p>

      {aviso && <div className="aviso-banner">ℹ️ {aviso}</div>}

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

      <div className="map-container">
        <div ref={contenedorRef} className="map-canvas" />
      </div>

      <div className="btn-row">
        <button className="btn-primary" onClick={handleDownload}>
          ⬇️ Descargar HTML
        </button>
        <button className="btn-secondary" onClick={onReset}>
          Nuevo mapa
        </button>
      </div>
    </div>
  );
}
