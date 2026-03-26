"""
Mapa de Calor — lógica portada del Colab.
Genera un HTML con mapa interactivo usando Folium.
"""

import json
import urllib.request
import io
import pandas as pd
import folium
from folium.plugins import HeatMap

# ── GeoJSON URLs ──────────────────────────────────────────────────────────────
GEOJSON_PAISES = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"

GEOJSON_PROVINCIAS = {
    "argentina": "https://raw.githubusercontent.com/gonzalobotelloleal/provincias-argentinas-geoJSON/master/provincias.json",
    "brasil":    "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson",
    "mexico":    "https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json",
    "usa":       "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json",
    "colombia":  "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/colombia-departments.geojson",
    "chile":     "https://raw.githubusercontent.com/roberveral/chile-geojson/master/regiones.geojson",
}

REGIONES = {
    "mundo":     {"centro": [20, 0],      "zoom": 2},
    "argentina": {"centro": [-38, -65],   "zoom": 4},
    "brasil":    {"centro": [-14, -51],   "zoom": 4},
    "mexico":    {"centro": [24, -102],   "zoom": 5},
    "colombia":  {"centro": [4, -74],     "zoom": 6},
    "chile":     {"centro": [-35, -71],   "zoom": 4},
    "peru":      {"centro": [-9, -75],    "zoom": 5},
    "uruguay":   {"centro": [-32.5, -56], "zoom": 6},
    "españa":    {"centro": [40, -3],     "zoom": 6},
    "usa":       {"centro": [38, -97],    "zoom": 4},
}

# ── Paletas de color ──────────────────────────────────────────────────────────
PALETAS = {
    "oscuro": {
        "fondo":    "#434343",
        "bordes":   "#5c3675",
        "tiles":    "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        "gradient": {
            0.0: "transparent",
            0.2: "#2d1040",
            0.4: "#5c3675",
            0.7: "#a0004a",
            1.0: "#d30054",
        },
    },
    "clasico": {
        "fondo":    "#757b89",
        "bordes":   "#5c3675",
        "tiles":    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        "gradient": {
            0.0: "transparent",
            0.2: "blue",
            0.4: "lime",
            0.7: "orange",
            1.0: "red",
        },
    },
}


def _detectar_separador(contenido: str) -> str:
    primera = contenido.splitlines()[0] if contenido else ""
    candidatos = {",": primera.count(","), ";": primera.count(";"),
                  "\t": primera.count("\t"), "|": primera.count("|")}
    sep = max(candidatos, key=candidatos.get)
    return sep if candidatos[sep] > 0 else ","


def parsear_csv(contenido: str) -> tuple[pd.DataFrame, str]:
    """Parsea el CSV y devuelve (df, nombre_columna_metrica)."""
    sep = _detectar_separador(contenido)
    df = pd.read_csv(io.StringIO(contenido), sep=sep, dtype=str, encoding_errors="ignore")

    if len(df.columns) < 3:
        raise ValueError("El CSV necesita al menos 3 columnas: nombre, latitud, longitud.")

    cols = list(df.columns)
    rename = {"nombre": cols[0], "lat": cols[1], "lon": cols[2]}
    if len(cols) > 3:
        rename["metrica"] = cols[3]

    df = df.rename(columns={v: k for k, v in rename.items()})

    df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
    df["lon"] = pd.to_numeric(df["lon"], errors="coerce")

    col_metrica = cols[3] if len(cols) > 3 else None
    if "metrica" in df.columns:
        df["metrica"] = pd.to_numeric(df["metrica"], errors="coerce").fillna(0)
    else:
        df["metrica"] = 1.0

    df = df.dropna(subset=["lat", "lon"])
    return df, col_metrica


def _cargar_geojson(url: str) -> dict | None:
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            return json.load(r)
    except Exception:
        return None


def generar_mapa(
    df: pd.DataFrame,
    col_metrica: str | None,
    region: str = "auto",
    nivel_bordes: str = "paises",
    paleta: str = "oscuro",
) -> str:
    """Genera el mapa y devuelve el HTML como string."""

    colores = PALETAS.get(paleta, PALETAS["oscuro"])

    # ── Centro y zoom ─────────────────────────────────────────────────────────
    if region == "auto" or region not in REGIONES:
        centro = [df["lat"].mean(), df["lon"].mean()]
        rango = max(df["lat"].max() - df["lat"].min(),
                    df["lon"].max() - df["lon"].min())
        if rango < 2:    zoom = 9
        elif rango < 5:  zoom = 7
        elif rango < 15: zoom = 5
        elif rango < 40: zoom = 4
        elif rango < 80: zoom = 3
        else:            zoom = 2
    else:
        cfg = REGIONES[region]
        centro, zoom = cfg["centro"], cfg["zoom"]

    # ── Mapa base ─────────────────────────────────────────────────────────────
    m = folium.Map(location=centro, zoom_start=zoom, tiles=None)

    folium.TileLayer(
        tiles=colores["tiles"],
        attr="CartoDB",
        name="Base",
        overlay=False,
        control=False,
    ).add_to(m)

    # CSS fondo personalizado
    css = f"""
    <style>
      .leaflet-container {{ background: {colores['fondo']} !important; }}
      .leaflet-tile-pane {{ opacity: 0.65; }}
      .leaflet-tooltip {{
        background: rgba(15,15,15,0.92);
        border: 1px solid #444;
        color: #f1f1f1;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        border-radius: 6px;
        padding: 6px 10px;
      }}
    </style>
    """
    m.get_root().html.add_child(folium.Element(css))

    # ── GeoJSON bordes ────────────────────────────────────────────────────────
    geojson_data = None
    if nivel_bordes == "provincias" and region in GEOJSON_PROVINCIAS:
        geojson_data = _cargar_geojson(GEOJSON_PROVINCIAS[region])

    if geojson_data is None:
        geojson_data = _cargar_geojson(GEOJSON_PAISES)

    if geojson_data:
        folium.GeoJson(
            geojson_data,
            name="Bordes",
            style_function=lambda _: {
                "fillColor":   "transparent",
                "color":       colores["bordes"],
                "weight":      1.2,
                "fillOpacity": 0,
            },
        ).add_to(m)

    # ── HeatMap ───────────────────────────────────────────────────────────────
    metrica_max = df["metrica"].max() or 1
    heat_data = [
        [row["lat"], row["lon"], row["metrica"] / metrica_max]
        for _, row in df.iterrows()
    ]

    HeatMap(
        heat_data,
        name="Calor",
        radius=25,
        blur=18,
        max_zoom=10,
        min_opacity=0.3,
        gradient=colores["gradient"],
    ).add_to(m)

    # ── Tooltips ──────────────────────────────────────────────────────────────
    label = col_metrica or "Valor"
    for _, row in df.iterrows():
        folium.CircleMarker(
            location=[row["lat"], row["lon"]],
            radius=12,
            color="transparent",
            fill=True,
            fill_color="transparent",
            fill_opacity=0,
            tooltip=folium.Tooltip(
                f"<b>{row['nombre']}</b><br>{label}: {int(row['metrica']):,}",
                sticky=True,
            ),
        ).add_to(m)

    # ── Fit bounds (auto) ─────────────────────────────────────────────────────
    if region == "auto":
        m.fit_bounds([
            [df["lat"].min(), df["lon"].min()],
            [df["lat"].max(), df["lon"].max()],
        ])

    return m._repr_html_()
