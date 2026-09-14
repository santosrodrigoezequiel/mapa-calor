/**
 * Parseo del CSV en el browser. Reemplaza a pandas.
 *
 * Se esperan las columnas en orden: nombre · latitud · longitud · métrica.
 * El nombre de las columnas no importa; la cuarta es opcional.
 */

const SEPARADORES = [',', ';', '\t', '|'];

/** Elige el separador por frecuencia en el encabezado. */
export function detectarSeparador(contenido) {
  const primera = (contenido.split(/\r?\n/)[0] || '');
  let elegido = ',';
  let maximo = 0;
  for (const sep of SEPARADORES) {
    const n = primera.split(sep).length - 1;
    if (n > maximo) {
      maximo = n;
      elegido = sep;
    }
  }
  return maximo > 0 ? elegido : ',';
}

/** Parser de CSV con comillas dobles y escape "" según RFC 4180. */
function parsearFilas(contenido, sep) {
  const filas = [];
  let campo = '';
  let fila = [];
  let enComillas = false;

  for (let i = 0; i < contenido.length; i++) {
    const c = contenido[i];

    if (enComillas) {
      if (c === '"') {
        if (contenido[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      enComillas = true;
    } else if (c === sep) {
      fila.push(campo);
      campo = '';
    } else if (c === '\n') {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else if (c !== '\r') {
      campo += c;
    }
  }

  if (campo !== '' || fila.length) {
    fila.push(campo);
    filas.push(fila);
  }

  return filas.filter((f) => f.some((v) => v.trim() !== ''));
}

/**
 * Convierte a número. Acepta la coma como separador decimal, que es lo que
 * exporta Excel en es-AR: sin esto un CSV con ";" deja todas las filas afuera.
 */
function aNumero(valor) {
  if (valor == null) return NaN;
  let t = String(valor).trim().replace(/\s/g, '');
  if (!t) return NaN;
  if (t.includes(',') && !t.includes('.')) t = t.replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * @returns {{ puntos: Array<{nombre,lat,lon,metrica}>, etiquetaMetrica: string|null,
 *             descartados: number }}
 */
export function parsearCsv(contenido) {
  const limpio = contenido.replace(/^﻿/, '');
  const sep = detectarSeparador(limpio);
  const filas = parsearFilas(limpio, sep);

  if (filas.length < 2) {
    throw new Error('El CSV no tiene filas de datos debajo del encabezado.');
  }

  const encabezado = filas[0];
  if (encabezado.length < 3) {
    throw new Error('El CSV necesita al menos 3 columnas: nombre, latitud, longitud.');
  }

  const tieneMetrica = encabezado.length > 3;
  const etiquetaMetrica = tieneMetrica ? encabezado[3].trim() || 'Valor' : null;

  const puntos = [];
  let descartados = 0;

  for (const fila of filas.slice(1)) {
    const lat = aNumero(fila[1]);
    const lon = aNumero(fila[2]);

    // Mismo criterio que el original: sin coordenada válida, la fila no entra.
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      descartados++;
      continue;
    }

    const metrica = tieneMetrica ? aNumero(fila[3]) : 1;
    puntos.push({
      nombre: (fila[0] || '').trim(),
      lat,
      lon,
      metrica: Number.isFinite(metrica) ? metrica : 0,
    });
  }

  if (!puntos.length) {
    throw new Error(
      'Ninguna fila tiene latitud y longitud válidas. Revisá que las columnas 2 y 3 sean las coordenadas.',
    );
  }

  return { puntos, etiquetaMetrica, descartados };
}
