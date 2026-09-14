/**
 * Regiones, paletas y bordes disponibles.
 * Los geojson se sirven desde /geo/ y los genera tools/build-geo.mjs.
 */

export const REGIONES = {
  mundo: { centro: [20, 0], zoom: 2 },
  argentina: { centro: [-38, -65], zoom: 4 },
  brasil: { centro: [-14, -51], zoom: 4 },
  mexico: { centro: [24, -102], zoom: 5 },
  colombia: { centro: [4, -74], zoom: 6 },
  chile: { centro: [-35, -71], zoom: 4 },
  peru: { centro: [-9, -75], zoom: 5 },
  uruguay: { centro: [-32.5, -56], zoom: 6 },
  españa: { centro: [40, -3], zoom: 6 },
  usa: { centro: [38, -97], zoom: 4 },
};

/**
 * Regiones que tienen divisiones internas, con el slug del archivo en /geo/.
 * "mundo" y "auto" no están: solo se dibujan a nivel país.
 */
export const PROVINCIAS_POR_REGION = {
  argentina: 'argentina',
  brasil: 'brasil',
  chile: 'chile',
  colombia: 'colombia',
  españa: 'espana',
  mexico: 'mexico',
  peru: 'peru',
  uruguay: 'uruguay',
  usa: 'usa',
};

/**
 * Basemap: Esri Gray Canvas.
 *
 * Antes esto apuntaba a CARTO (basemaps.cartocdn.com). CARTO pasó a exigir API
 * key y devuelve el tile con un watermark "API KEY REQUIRED" dibujado encima,
 * con HTTP 200 — así que no falla, se ve mal. Esri sirve el mismo estilo sin
 * key. Ojo con el orden de la ruta: ArcGIS es {z}/{y}/{x}, no {z}/{x}/{y}.
 */
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';

export const PALETAS = {
  oscuro: {
    fondo: '#434343',
    bordes: '#5c3675',
    tiles: `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    maxNativeZoom: 16,
    gradient: {
      0.0: 'transparent',
      0.2: '#2d1040',
      0.4: '#5c3675',
      0.7: '#a0004a',
      1.0: '#d30054',
    },
  },
  clasico: {
    fondo: '#757b89',
    bordes: '#5c3675',
    tiles: `${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    maxNativeZoom: 16,
    gradient: {
      0.0: 'transparent',
      0.2: 'blue',
      0.4: 'lime',
      0.7: 'orange',
      1.0: 'red',
    },
  },
};

export const ATRIBUCION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ';
