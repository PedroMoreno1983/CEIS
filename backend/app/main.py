import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from .core.security import decode_access_token
from .routers import items, generacion, instrumentos, aplicaciones
from .routers import colegios, docentes, cursos, estudiantes
from .routers import asignaturas, periodos, libro
from .routers import apoderados, mensajes, planes, pie
from .routers import dashboard
from .routers import citaciones
from .routers import admin
from .routers import auth
from .models import usuario  # noqa: F401 — registra modelo

# Resolver UPLOADS_DIR: env var > volumen Railway /app/uploads > path relativo (local)
_env = os.environ.get("UPLOADS_DIR")
if _env:
    UPLOADS_DIR = Path(_env)
elif Path("/app/uploads").exists():
    UPLOADS_DIR = Path("/app/uploads")
else:
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
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de autenticación y autorización global
PUBLIC_PATHS = {
    "/api/auth/login",
    "/api/health",
}

ROUTE_ROLES: dict[str, list[str]] = {
    "/api/admin": ["admin"],
    "/api/dashboard": ["admin", "directivo"],
    "/api/colegios": ["admin", "directivo"],
    "/api/docentes": ["admin", "directivo"],
    "/api/cursos": ["admin", "directivo", "docente"],
    "/api/estudiantes": ["admin", "directivo", "orientador", "docente"],
    "/api/libro": ["admin", "directivo", "docente"],
    "/api/planes": ["admin", "directivo", "orientador"],
    "/api/pie": ["admin", "directivo", "orientador"],
    "/api/apoderados": ["admin", "directivo", "orientador"],
    "/api/mensajes": ["admin", "directivo", "orientador", "docente", "apoderado"],
    "/api/asignaturas": ["admin", "directivo", "docente"],
    "/api/periodos": ["admin", "directivo", "docente"],
    "/api/citaciones": ["admin", "directivo", "orientador", "docente"],
    "/api/items": ["admin", "orientador"],
    "/api/generar": ["admin", "orientador"],
    "/api/instrumentos": ["admin", "orientador"],
    "/api/aplicaciones": ["admin", "orientador"],
}


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    if path in PUBLIC_PATHS or path.startswith("/api/aplicar/") or path.startswith("/uploads/"):
        return await call_next(request)
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "No autorizado"})
    token = auth[7:]
    payload = decode_access_token(token)
    if payload is None:
        return JSONResponse(status_code=401, content={"detail": "Token inválido"})

    # Verificar rol por prefijo de ruta
    rol = payload.get("rol", "")
    for prefix, allowed in ROUTE_ROLES.items():
        if path.startswith(prefix):
            if rol not in allowed:
                return JSONResponse(status_code=403, content={"detail": "No tienes permiso para esta acción"})
            break

    return await call_next(request)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(items.router, prefix="/api")
app.include_router(generacion.router, prefix="/api")
app.include_router(instrumentos.router, prefix="/api")
app.include_router(aplicaciones.router, prefix="/api")
app.include_router(colegios.router, prefix="/api")
app.include_router(docentes.router, prefix="/api")
app.include_router(cursos.router, prefix="/api")
app.include_router(estudiantes.router, prefix="/api")
app.include_router(asignaturas.router, prefix="/api")
app.include_router(periodos.router, prefix="/api")
app.include_router(libro.router, prefix="/api")
app.include_router(apoderados.router, prefix="/api")
app.include_router(mensajes.router, prefix="/api")
app.include_router(planes.router, prefix="/api")
app.include_router(pie.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(citaciones.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ceis-generador"}
