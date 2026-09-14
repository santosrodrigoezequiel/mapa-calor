/**
 * build-geo.mjs — genera los geojson de bordes que la app sirve como estáticos.
 *
 * Baja Natural Earth, filtra por región, se queda solo con el nombre, simplifica
 * la geometría (Douglas-Peucker) y redondea las coordenadas. El resultado va a
 * public/geo/ y se commitea: en producción no se baja nada de internet.
 *
 *   node tools/build-geo.mjs
 *
 * Se corre a mano, cuando haya que actualizar los bordes o sumar una región.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = path.join(RAIZ, 'public', 'geo');
const CACHE = path.join(RAIZ, 'node_modules', '.cache', 'natural-earth');

const FUENTES = {
  paises: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
  provincias: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson',
};

// Código ISO A3 de cada región con divisiones internas disponibles.
const REGIONES = {
  argentina: 'ARG',
  brasil: 'BRA',
  chile: 'CHL',
  colombia: 'COL',
  espana: 'ESP',
  mexico: 'MEX',
  peru: 'PER',
  uruguay: 'URY',
  usa: 'USA',
};

const DECIMALES = 3;      // ~110 m, de sobra para un borde de referencia
const TOL_PAISES = 0.02;  // el 110m ya viene grueso
const TOL_PROV = 0.01;    // ~1,1 km

// ── Douglas-Peucker ──────────────────────────────────────────────────────────

function distanciaPerpendicular([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const tc = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (x1 + tc * dx), y - (y1 + tc * dy));
}

function simplificar(puntos, tol) {
  if (puntos.length <= 2) return puntos;

  let maxDist = 0;
  let idx = 0;
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];

  for (let i = 1; i < puntos.length - 1; i++) {
    const d = distanciaPerpendicular(puntos[i], primero, ultimo);
    if (d > maxDist) {
      maxDist = d;
      idx = i;
    }
  }

  if (maxDist <= tol) return [primero, ultimo];

  return [
    ...simplificar(puntos.slice(0, idx + 1), tol).slice(0, -1),
    ...simplificar(puntos.slice(idx), tol),
  ];
}

function redondearAnillo(anillo) {
  const f = 10 ** DECIMALES;
  const salida = [];
  for (const [x, y] of anillo) {
    const p = [Math.round(x * f) / f, Math.round(y * f) / f];
    const previo = salida[salida.length - 1];
    if (!previo || previo[0] !== p[0] || previo[1] !== p[1]) salida.push(p);
  }
  return salida;
}

/** Simplifica un anillo cerrado manteniéndolo cerrado. Devuelve null si degeneró. */
function procesarAnillo(anillo, tol) {
  const r = redondearAnillo(simplificar(anillo, tol));
  if (r.length < 4) return null;
  const [px, py] = r[0];
  const [ux, uy] = r[r.length - 1];
  if (px !== ux || py !== uy) r.push([px, py]);
  return r.length >= 4 ? r : null;
}

function procesarGeometria(geom, tol) {
  if (geom.type === 'Polygon') {
    const anillos = geom.coordinates.map((a) => procesarAnillo(a, tol)).filter(Boolean);
    return anillos.length ? { type: 'Polygon', coordinates: anillos } : null;
  }
  if (geom.type === 'MultiPolygon') {
    const polis = geom.coordinates
      .map((poli) => poli.map((a) => procesarAnillo(a, tol)).filter(Boolean))
      .filter((poli) => poli.length);
    return polis.length ? { type: 'MultiPolygon', coordinates: polis } : null;
  }
  return null;
}

// ── Descarga con cache local ─────────────────────────────────────────────────

async function bajar(nombre, url) {
  const destino = path.join(CACHE, `${nombre}.geojson`);
  if (fs.existsSync(destino)) {
    console.log(`  cache  ${nombre}`);
    return JSON.parse(fs.readFileSync(destino, 'utf8'));
  }
  console.log(`  bajando ${nombre}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${nombre}: HTTP ${res.status}`);
  const texto = await res.text();
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(destino, texto);
  return JSON.parse(texto);
}

function escribir(archivo, features) {
  const destino = path.join(SALIDA, archivo);
  fs.writeFileSync(destino, JSON.stringify({ type: 'FeatureCollection', features }));
  const kb = (fs.statSync(destino).size / 1024).toFixed(0);
  console.log(`  ${archivo.padEnd(26)} ${String(features.length).padStart(4)} features  ${kb} KB`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('Fuentes:');
const [paises, provincias] = await Promise.all([
  bajar('paises', FUENTES.paises),
  bajar('provincias', FUENTES.provincias),
]);

fs.mkdirSync(SALIDA, { recursive: true });
console.log('\nGenerando:');

// Países del mundo — el borde por defecto de cualquier región.
escribir(
  'paises.json',
  paises.features
    .map((f) => {
      const geometry = procesarGeometria(f.geometry, TOL_PAISES);
      return geometry && { type: 'Feature', properties: { nombre: f.properties.NAME }, geometry };
    })
    .filter(Boolean),
);

// Divisiones internas, un archivo por región.
for (const [region, iso] of Object.entries(REGIONES)) {
  const features = provincias.features
    .filter((f) => f.properties.adm0_a3 === iso)
    .map((f) => {
      const geometry = procesarGeometria(f.geometry, TOL_PROV);
      const nombre = f.properties.name || f.properties.name_local || '';
      return geometry && { type: 'Feature', properties: { nombre }, geometry };
    })
    .filter(Boolean);

  if (!features.length) {
    console.warn(`  ⚠ ${region}: sin features para ${iso}`);
    continue;
  }
  escribir(`provincias-${region}.json`, features);
}

console.log('\nListo.');
