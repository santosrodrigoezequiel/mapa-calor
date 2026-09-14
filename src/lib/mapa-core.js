/**
 * Armado del mapa. Única fuente de verdad: la app la importa para el mapa en
 * vivo y el generador de descargas la embebe como texto en el HTML autónomo
 * (via Function.prototype.toString), así los dos no pueden quedar distintos.
 *
 * REGLA: esta función tiene que ser autosuficiente. No puede referenciar nada
 * del módulo — ni imports, ni constantes de arriba. Todo entra por argumento.
 */

/**
 * @param {object} L        Leaflet, con el plugin heat ya cargado.
 * @param {HTMLElement} contenedor
 * @param {object} datos    { puntos, geojson, etiquetaMetrica, centro, zoom,
 *                            bounds, paleta, atribucion }
 * @returns {object} la instancia del mapa
 */
export function construirMapa(L, contenedor, datos) {
  const paleta = datos.paleta;

  // ── Estilos (una vez por documento) ────────────────────────────────────────
  const ID_ESTILOS = 'mapa-calor-estilos';
  if (!contenedor.ownerDocument.getElementById(ID_ESTILOS)) {
    const estilo = contenedor.ownerDocument.createElement('style');
    estilo.id = ID_ESTILOS;
    estilo.textContent = [
      '.mapa-calor .leaflet-tile-pane { opacity: 0.65; }',
      '.mapa-calor .leaflet-tooltip {',
      '  background: rgba(15,15,15,0.92);',
      '  border: 1px solid #444;',
      '  color: #f1f1f1;',
      "  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;",
      '  font-size: 13px;',
      '  border-radius: 6px;',
      '  padding: 6px 10px;',
      '  box-shadow: 0 2px 8px rgba(0,0,0,0.4);',
      '}',
      '.mapa-calor .leaflet-tooltip:before { display: none; }',
    ].join('\n');
    contenedor.ownerDocument.head.appendChild(estilo);
  }

  contenedor.classList.add('mapa-calor');
  contenedor.style.background = paleta.fondo;

  // ── Mapa base ─────────────────────────────────────────────────────────────
  const mapa = L.map(contenedor, {
    center: datos.centro,
    zoom: datos.zoom,
    preferCanvas: true,
  });

  L.tileLayer(paleta.tiles, {
    attribution: datos.atribucion || '',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapa);

  // ── Bordes ────────────────────────────────────────────────────────────────
  if (datos.geojson) {
    L.geoJSON(datos.geojson, {
      interactive: false,
      style: function () {
        return {
          fillColor: 'transparent',
          color: paleta.bordes,
          weight: 1.2,
          fillOpacity: 0,
        };
      },
    }).addTo(mapa);
  }

  // ── Capa de calor ─────────────────────────────────────────────────────────
  let maximo = 0;
  for (let i = 0; i < datos.puntos.length; i++) {
    if (datos.puntos[i].metrica > maximo) maximo = datos.puntos[i].metrica;
  }
  if (!(maximo > 0)) maximo = 1;

  const calor = datos.puntos.map(function (p) {
    return [p.lat, p.lon, Math.max(0, p.metrica) / maximo];
  });

  L.heatLayer(calor, {
    radius: 25,
    blur: 18,
    maxZoom: 10,
    minOpacity: 0.3,
    gradient: paleta.gradient,
  }).addTo(mapa);

  // ── Tooltips: marcadores invisibles sobre cada punto ──────────────────────
  const etiqueta = datos.etiquetaMetrica || 'Valor';
  datos.puntos.forEach(function (p) {
    const valor = Math.round(p.metrica).toLocaleString('es-AR');
    const nombre = String(p.nombre || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    L.circleMarker([p.lat, p.lon], {
      radius: 12,
      color: 'transparent',
      fill: true,
      fillColor: 'transparent',
      fillOpacity: 0,
    })
      .bindTooltip('<b>' + nombre + '</b><br>' + etiqueta + ': ' + valor, { sticky: true })
      .addTo(mapa);
  });

  if (datos.bounds) mapa.fitBounds(datos.bounds);

  return mapa;
}
