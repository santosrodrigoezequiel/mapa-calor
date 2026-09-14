/**
 * Prepara los datos del mapa (centro, zoom, bordes) y genera el HTML autónomo
 * que se descarga. Todo en el browser: no hay backend.
 */

import { REGIONES, PROVINCIAS_POR_REGION, PALETAS, ATRIBUCION } from './config';
import { construirMapa } from './mapa-core';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_HEAT_JS = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';

/** Zoom aproximado según cuánto territorio abarcan los puntos, en grados. */
function zoomSegunRango(rango) {
  if (rango < 2) return 9;
  if (rango < 5) return 7;
  if (rango < 15) return 5;
  if (rango < 40) return 4;
  if (rango < 80) return 3;
  return 2;
}

async function cargarGeojson(ruta) {
  const res = await fetch(ruta);
  if (!res.ok) throw new Error(`No se pudo cargar ${ruta} (HTTP ${res.status})`);
  return res.json();
}

/**
 * @returns {{ datos: object, aviso: string }}
 */
export async function prepararDatos(puntos, etiquetaMetrica, config) {
  const { region, nivel_bordes: nivelBordes, paleta } = config;

  // ── Centro, zoom y encuadre ───────────────────────────────────────────────
  let centro;
  let zoom;
  let bounds = null;

  const lats = puntos.map((p) => p.lat);
  const lons = puntos.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  if (region === 'auto' || !REGIONES[region]) {
    centro = [
      lats.reduce((a, b) => a + b, 0) / lats.length,
      lons.reduce((a, b) => a + b, 0) / lons.length,
    ];
    zoom = zoomSegunRango(Math.max(maxLat - minLat, maxLon - minLon));
    bounds = [
      [minLat, minLon],
      [maxLat, maxLon],
    ];
  } else {
    centro = REGIONES[region].centro;
    zoom = REGIONES[region].zoom;
  }

  // ── Bordes ────────────────────────────────────────────────────────────────
  let aviso = '';
  let geojson = null;
  const slugProvincia = PROVINCIAS_POR_REGION[region];

  if (nivelBordes === 'provincias' && !slugProvincia) {
    // Antes esto caía a países sin decir nada y parecía que el selector no andaba.
    aviso =
      'No hay divisiones internas para esa región: se dibujaron los bordes de países. ' +
      'Elegí un país en "Región" para ver provincias o estados.';
  }

  const ruta =
    nivelBordes === 'provincias' && slugProvincia
      ? `${process.env.PUBLIC_URL}/geo/provincias-${slugProvincia}.json`
      : `${process.env.PUBLIC_URL}/geo/paises.json`;

  try {
    geojson = await cargarGeojson(ruta);
  } catch (e) {
    geojson = null;
    aviso = `No se pudieron cargar los bordes geográficos (${e.message}). El mapa se dibuja sin ellos.`;
  }

  return {
    datos: {
      puntos,
      geojson,
      etiquetaMetrica,
      centro,
      zoom,
      bounds,
      paleta: PALETAS[paleta] || PALETAS.oscuro,
      atribucion: ATRIBUCION,
    },
    aviso,
  };
}

/** Dibuja el mapa en vivo dentro de un contenedor del DOM. */
export function dibujar(L, contenedor, datos) {
  return construirMapa(L, contenedor, datos);
}

/**
 * HTML autónomo y compartible: Leaflet por CDN, datos y bordes embebidos.
 * La lógica del mapa es la misma función que usa la app, serializada.
 */
export function htmlAutonomo(datos, titulo = 'Mapa de calor') {
  const json = JSON.stringify(datos).replace(/</g, '\\u003c');
  const fuente = construirMapa.toString();

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo.replace(/</g, '&lt;')}</title>
<link rel="stylesheet" href="${LEAFLET_CSS}">
<style>
  html, body { margin: 0; height: 100%; }
  #mapa { position: absolute; inset: 0; }
</style>
</head>
<body>
<div id="mapa"></div>
<script src="${LEAFLET_JS}"></script>
<script src="${LEAFLET_HEAT_JS}"></script>
<script>
var DATOS = ${json};
var construir = ${fuente};
construir(L, document.getElementById('mapa'), DATOS);
</script>
</body>
</html>
`;
}
