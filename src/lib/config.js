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

export const PALETAS = {
  oscuro: {
    fondo: '#434343',
    bordes: '#5c3675',
    tiles: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
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
    tiles: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
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
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
