"""CRUD de colegios (clientes CEIS)."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Colegio
from ..schemas.gestion import ColegioCreate, ColegioOut, ColegioUpdate

router = APIRouter(prefix="/colegios", tags=["gestion: colegios"])


@router.post("", response_model=ColegioOut, status_code=201)
async def crear_colegio(body: ColegioCreate, db: AsyncSession = Depends(get_db)):
    if body.rbd:
        existe = await db.scalar(select(Colegio).where(Colegio.rbd == body.rbd))
        if existe:
            raise HTTPException(409, f"Ya existe un colegio con RBD {body.rbd}")

    colegio = Colegio(**body.model_dump())
    db.add(colegio)
    await db.commit()
    await db.refresh(colegio)
    return ColegioOut.model_validate(colegio)


@router.get("", response_model=list[ColegioOut])
async def listar_colegios(
    estado: str | None = Query(None),
    dependencia: str | None = Query(None),
    q: str | None = Query(None, description="Buscar por nombre o RBD"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Colegio)
    if estado:
        query = query.where(Colegio.estado == estado)
    if dependencia:
        query = query.where(Colegio.dependencia == dependencia)
    if q:
        like = f"%{q}%"
        query = query.where((Colegio.nombre.ilike(like)) | (Colegio.rbd.ilike(like)))
    query = query.order_by(Colegio.nombre)
    rows = (await db.execute(query)).scalars().all()
    return [ColegioOut.model_validate(c) for c in rows]


@router.get("/{colegio_id}", response_model=ColegioOut)
async def obtener_colegio(colegio_id: UUID, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")
    return ColegioOut.model_validate(colegio)


@router.patch("/{colegio_id}", response_model=ColegioOut)
async def actualizar_colegio(
    colegio_id: UUID, body: ColegioUpdate, db: AsyncSession = Depends(get_db),
):
    colegio = await db.get(Colegio, colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")

    cambios = body.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(colegio, k, v)
    await db.commit()
    await db.refresh(colegio)
    return ColegioOut.model_validate(colegio)


@router.delete("/{colegio_id}", status_code=204)
async def eliminar_colegio(colegio_id: UUID, db: AsyncSession = Depends(get_db)):
    """Borra el colegio. Cascada en docentes/cursos/estudiantes."""
    colegio = await db.get(Colegio, colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")
    await db.delete(colegio)
    await db.commit()
