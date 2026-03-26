"""
Mapa de Calor — API FastAPI
Railway deployment
"""

import io
import uuid
import threading
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from heatmap import parsear_csv, generar_mapa, REGIONES

app = FastAPI(title="Mapa de Calor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Jobs en memoria
jobs: dict[str, dict] = {}


def _run_job(job_id: str, contenido: str, region: str, nivel_bordes: str, paleta: str):
    jobs[job_id]["status"] = "running"
    try:
        df, col_metrica = parsear_csv(contenido)
        jobs[job_id]["puntos"] = len(df)
        html = generar_mapa(df, col_metrica, region, nivel_bordes, paleta)
        jobs[job_id]["html"] = html
        jobs[job_id]["status"] = "done"
    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)


@app.get("/")
def root():
    return {"status": "ok", "service": "Mapa de Calor API"}


@app.get("/regiones")
def get_regiones():
    return {"regiones": list(REGIONES.keys()) + ["auto"]}


@app.post("/generate")
async def generate(
    file: UploadFile = File(...),
    region: str = Form("auto"),
    nivel_bordes: str = Form("paises"),
    paleta: str = Form("oscuro"),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "El archivo debe ser .csv")

    contenido = (await file.read()).decode("utf-8-sig", errors="ignore")

    if not contenido.strip():
        raise HTTPException(400, "El archivo CSV está vacío.")

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "pending",
        "puntos": 0,
        "html": None,
        "error": "",
        "created_at": datetime.utcnow().isoformat(),
        "config": {"region": region, "nivel_bordes": nivel_bordes, "paleta": paleta},
    }

    thread = threading.Thread(
        target=_run_job,
        args=(job_id, contenido, region, nivel_bordes, paleta),
        daemon=True,
    )
    thread.start()

    return {"job_id": job_id, "message": "Generando mapa..."}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job no encontrado")
    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "puntos": job.get("puntos", 0),
        "error": job.get("error", ""),
        "config": job.get("config", {}),
    }


@app.get("/result/{job_id}")
def get_result(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job no encontrado")
    job = jobs[job_id]
    if job["status"] != "done":
        raise HTTPException(400, f"Job no completado (estado: {job['status']})")
    return HTMLResponse(content=job["html"])


@app.get("/download/{job_id}")
def download_result(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job no encontrado")
    job = jobs[job_id]
    if job["status"] != "done":
        raise HTTPException(400, "Job no completado")
    from fastapi.responses import Response
    return Response(
        content=job["html"].encode("utf-8"),
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename=mapa_calor_{job_id[:8]}.html"},
    )


@app.delete("/job/{job_id}")
def delete_job(job_id: str):
    if job_id in jobs:
        del jobs[job_id]
    return {"deleted": job_id}
