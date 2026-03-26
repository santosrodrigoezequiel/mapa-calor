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

## Deploy

### 1. Backend en Railway
1. Nuevo proyecto → Deploy from GitHub repo
2. Root Directory: `backend`
3. Una vez deployado, generar dominio en Settings → Networking
4. Copiar la URL

### 2. Frontend en Vercel
1. Nuevo proyecto → importar repo
2. Root Directory: `frontend`
3. Environment Variable:
   ```
   REACT_APP_API_URL = https://TU-PROYECTO.railway.app
   ```
4. Deploy

## Desarrollo local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

## Paletas disponibles

| Paleta | Fondo | Bordes | Calor |
|--------|-------|--------|-------|
| Oscuro | `#434343` | `#5c3675` | transparente → violeta → `#d30054` |
| Clásico | `#757b89` | `#5c3675` | azul → verde → naranja → rojo |

## Regiones soportadas

Argentina, Brasil, Chile, Colombia, México, Perú, Uruguay, España, USA, Mundo, Auto
