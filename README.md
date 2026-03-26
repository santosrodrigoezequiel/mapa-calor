# 🗺️ Mapa de Calor | CSV

Genera mapas de calor interactivos a partir de un CSV con coordenadas geográficas.

## Formato del CSV

| A | B | C | D |
|---|---|---|---|
| Nombre del punto | Latitud | Longitud | Métrica (clicks, usuarios, etc.) |

El nombre de las columnas puede ser cualquiera.

## Arquitectura

```
frontend/   → React app → Vercel
backend/    → FastAPI   → Railway
```

```
LinkedIn - https://www.linkedin.com/in/santosrodrigoezequiel/
