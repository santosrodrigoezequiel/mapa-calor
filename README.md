# 🗺️ Mapa de Calor | Data viewer

Genera mapas de calor interactivos a partir de un CSV con coordenadas geográficas.

## Formato del CSV

Las columnas se leen por posición, no por nombre. El encabezado puede decir cualquier cosa.

| A | B | C | D |
|---|---|---|---|
| Nombre del punto | Latitud | Longitud | Métrica (clicks, usuarios, etc.) |

La cuarta columna es opcional: sin ella, todos los puntos pesan igual. El nombre de esa
columna es el que aparece en el tooltip.

Acepta `,` `;` tab y `|` como separador, comillas dobles y coma decimal
(que es lo que exporta Excel en es-AR).

## Arquitectura

```
public/geo/   → bordes geográficos, generados por tools/build-geo.mjs
src/lib/      → parseo del CSV y armado del mapa (Leaflet + leaflet.heat)
src/          → React
```

`src/lib/mapa-core.js` es la única fuente de verdad del mapa: la app la importa para el
mapa en vivo y `htmlAutonomo()` la embebe como texto en el HTML que se descarga. Por eso
esa función tiene que quedar autosuficiente — sin imports ni referencias al módulo.

## Desarrollo local

```bash
npm install
npm start
```

## Deploy

Push a `main`. Vercel buildea y publica solo.

Para el alta inicial: importar el repo en Vercel, framework Create React App, todo lo
demás por defecto. No hay variables de entorno que configurar.

## Bordes geográficos

Los geojson están commiteados en `public/geo/` y salen de
[Natural Earth](https://www.naturalearthdata.com/): `admin_0_countries` para el nivel país
y `admin_1_states_provinces` para las divisiones internas. `tools/build-geo.mjs` los baja,
filtra por región, se queda solo con el nombre, simplifica la geometría (Douglas-Peucker)
y redondea a 3 decimales.

```bash
npm run geo
```

Se corre a mano, solo si hay que actualizar los bordes o sumar una región. Para sumar una,
agregala en `REGIONES` de `tools/build-geo.mjs` con su código ISO A3, en `REGIONES` y
`PROVINCIAS_POR_REGION` de `src/lib/config.js`, y en el selector de `UploadStep.js`.

## Paletas disponibles

| Paleta | Fondo | Bordes | Calor |
|--------|-------|--------|-------|
| Oscuro | `#434343` | `#5c3675` | transparente → violeta → `#d30054` |
| Clásico | `#757b89` | `#5c3675` | azul → verde → naranja → rojo |

## Regiones soportadas

Auto (encuadra según el CSV), Mundo, y con divisiones internas: Argentina, Brasil, Chile,
Colombia, España, México, Perú, Uruguay y Estados Unidos.

---

[Rodrigo Ezequiel Santos](https://www.linkedin.com/in/santosrodrigoezequiel/) · LinkedIn
