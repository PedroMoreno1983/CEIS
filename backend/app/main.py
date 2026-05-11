from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import items, generacion, instrumentos, aplicaciones

UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
(UPLOADS_DIR / "items").mkdir(exist_ok=True)

app = FastAPI(
    title="CEIS Generador de Instrumentos",
    description="API para generar y gestionar instrumentos de orientación vocacional CEIS Maristas",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(items.router, prefix="/api")
app.include_router(generacion.router, prefix="/api")
app.include_router(instrumentos.router, prefix="/api")
app.include_router(aplicaciones.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ceis-generador"}
