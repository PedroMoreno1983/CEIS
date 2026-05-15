"""
Endpoints administrativos. Protegidos con token simple.
"""
import os
import tarfile
import tempfile
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Header, HTTPException, Body
from pydantic import BaseModel

from ..core.database import engine

router = APIRouter(prefix="/admin", tags=["admin"])

# Token simple desde env var. Si no está seteado, los endpoints están deshabilitados.
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")


def _check_token(token: str | None):
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="ADMIN_TOKEN no configurado en el servidor")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.post("/install-uploads")
async def install_uploads(
    file: UploadFile = File(...),
    x_admin_token: str | None = Header(None),
):
    """Recibe un tar.gz con la carpeta uploads/items y la descomprime al volumen."""
    _check_token(x_admin_token)

    from app.main import UPLOADS_DIR
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".tar.gz") as tmp:
        chunk_size = 1024 * 1024
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        with tarfile.open(tmp_path, "r:gz") as tar:
            for member in tar.getmembers():
                # strip components=1: ignorar el primer nivel ("uploads/")
                parts = member.name.split("/", 1)
                if len(parts) < 2:
                    continue
                member.name = parts[1]
                if not member.name:
                    continue
                # Sanitización contra path traversal
                target = (UPLOADS_DIR / member.name).resolve()
                if not str(target).startswith(str(UPLOADS_DIR.resolve())):
                    continue
                tar.extract(member, path=str(UPLOADS_DIR))
    finally:
        os.unlink(tmp_path)

    items_dir = UPLOADS_DIR / "items"
    n_files = len(list(items_dir.glob("*.png"))) if items_dir.exists() else 0

    return {
        "ok": True,
        "uploads_dir": str(UPLOADS_DIR),
        "items_count": n_files,
    }


@router.get("/uploads-status")
async def uploads_status(x_admin_token: str | None = Header(None)):
    _check_token(x_admin_token)
    from app.main import UPLOADS_DIR
    items_dir = UPLOADS_DIR / "items"
    n_files = len(list(items_dir.glob("*.png"))) if items_dir.exists() else 0
    return {
        "uploads_dir": str(UPLOADS_DIR),
        "exists": UPLOADS_DIR.exists(),
        "items_count": n_files,
    }


class MigratePayload(BaseModel):
    sql: str


@router.post("/migrate")
async def migrate_sql(
    payload: MigratePayload,
    x_admin_token: str | None = Header(None),
):
    """Ejecuta SQL raw en la base de datos. Solo para migraciones controladas."""
    _check_token(x_admin_token)
    async with engine.begin() as conn:
        raw = await conn.get_raw_connection()
        driver = raw.driver_connection
        await driver.execute(payload.sql)
    return {"ok": True}


@router.post("/seed-auth")
async def seed_auth(x_admin_token: str | None = Header(None)):
    """Crea usuario admin inicial si no existe."""
    _check_token(x_admin_token)
    from sqlalchemy import select, insert
    from ..models.usuario import Usuario
    from ..core.security import get_password_hash
    from ..core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Usuario).where(Usuario.email == "admin@ceis.cl"))
        if result.scalar_one_or_none():
            return {"ok": True, "created": False, "message": "Usuario admin ya existe"}

        user = Usuario(
            email="admin@ceis.cl",
            password_hash=get_password_hash("ceis2026"),
            nombres="Administrador",
            apellido_paterno="CEIS",
            rol="admin",
            activo=True,
        )
        session.add(user)
        await session.commit()
        return {"ok": True, "created": True, "usuario_id": str(user.id)}
