"""CRUD de citaciones a apoderados."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Apoderado, Estudiante
from ..models.libro import Citacion
from ..schemas.libro import CitacionCreate, CitacionOut, CitacionUpdate

router = APIRouter(prefix="/citaciones", tags=["gestion: citaciones"])


@router.post("", response_model=CitacionOut, status_code=201)
async def crear_citacion(body: CitacionCreate, db: AsyncSession = Depends(get_db)):
    est = await db.get(Estudiante, body.estudiante_id)
    if not est:
        raise HTTPException(404, "Estudiante no encontrado")
    if body.apoderado_id:
        apo = await db.get(Apoderado, body.apoderado_id)
        if not apo or apo.colegio_id != est.colegio_id:
            raise HTTPException(400, "Apoderado inválido para este estudiante")

    c = Citacion(**body.model_dump())
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return await _enriquecer(db, c)


@router.get("", response_model=list[CitacionOut])
async def listar_citaciones(
    estudiante_id: UUID | None = Query(None),
    apoderado_id: UUID | None = Query(None),
    estado: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Citacion)
    if estudiante_id:
        q = q.where(Citacion.estudiante_id == estudiante_id)
    if apoderado_id:
        q = q.where(Citacion.apoderado_id == apoderado_id)
    if estado:
        q = q.where(Citacion.estado == estado)
    q = q.order_by(Citacion.fecha_citacion.desc())
    rows = (await db.execute(q)).scalars().all()
    return [await _enriquecer(db, c) for c in rows]


@router.get("/{citacion_id}", response_model=CitacionOut)
async def obtener_citacion(citacion_id: UUID, db: AsyncSession = Depends(get_db)):
    c = await db.get(Citacion, citacion_id)
    if not c:
        raise HTTPException(404, "Citación no encontrada")
    return await _enriquecer(db, c)


@router.patch("/{citacion_id}", response_model=CitacionOut)
async def actualizar_citacion(
    citacion_id: UUID, body: CitacionUpdate, db: AsyncSession = Depends(get_db),
):
    c = await db.get(Citacion, citacion_id)
    if not c:
        raise HTTPException(404, "Citación no encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    await db.commit()
    await db.refresh(c)
    return await _enriquecer(db, c)


@router.delete("/{citacion_id}", status_code=204)
async def eliminar_citacion(citacion_id: UUID, db: AsyncSession = Depends(get_db)):
    c = await db.get(Citacion, citacion_id)
    if not c:
        raise HTTPException(404, "Citación no encontrada")
    await db.delete(c)
    await db.commit()


async def _enriquecer(db: AsyncSession, c: Citacion) -> CitacionOut:
    out = CitacionOut.model_validate(c)
    est = await db.get(Estudiante, c.estudiante_id)
    if est:
        out.estudiante_nombre = f"{est.nombres} {est.apellido_paterno}"
    if c.apoderado_id:
        apo = await db.get(Apoderado, c.apoderado_id)
        if apo:
            out.apoderado_nombre = f"{apo.nombres} {apo.apellido_paterno}"
    return out
