"""CRUD de apoderados y vínculos estudiante-apoderado."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Apoderado, Colegio, Estudiante, EstudianteApoderado
from ..schemas.gestion import (
    ApoderadoCreate, ApoderadoOut, ApoderadoUpdate,
    EstudianteApoderadoCreate, EstudianteApoderadoOut,
)

router = APIRouter(prefix="/apoderados", tags=["gestion: apoderados"])


@router.post("", response_model=ApoderadoOut, status_code=201)
async def crear_apoderado(body: ApoderadoCreate, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, body.colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")

    apoderado = Apoderado(**body.model_dump())
    db.add(apoderado)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        if "apoderado_colegio_rut_uk" in str(e).lower():
            raise HTTPException(409, "Ya existe un apoderado con ese RUT en este colegio")
        raise
    await db.refresh(apoderado)
    return ApoderadoOut.model_validate(apoderado)


@router.get("", response_model=list[ApoderadoOut])
async def listar_apoderados(
    colegio_id: UUID | None = Query(None),
    estado: str | None = Query(None),
    q: str | None = Query(None, description="Buscar por nombre o RUT"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Apoderado)
    if colegio_id:
        query = query.where(Apoderado.colegio_id == colegio_id)
    if estado:
        query = query.where(Apoderado.estado == estado)
    if q:
        like = f"%{q}%"
        query = query.where(
            (Apoderado.nombres.ilike(like))
            | (Apoderado.apellido_paterno.ilike(like))
            | (Apoderado.apellido_materno.ilike(like))
            | (Apoderado.rut.ilike(like))
        )
    query = query.order_by(Apoderado.apellido_paterno, Apoderado.nombres)
    rows = (await db.execute(query)).scalars().all()
    return [ApoderadoOut.model_validate(a) for a in rows]


@router.get("/{apoderado_id}", response_model=ApoderadoOut)
async def obtener_apoderado(apoderado_id: UUID, db: AsyncSession = Depends(get_db)):
    apoderado = await db.get(Apoderado, apoderado_id)
    if not apoderado:
        raise HTTPException(404, "Apoderado no encontrado")
    return ApoderadoOut.model_validate(apoderado)


@router.patch("/{apoderado_id}", response_model=ApoderadoOut)
async def actualizar_apoderado(
    apoderado_id: UUID, body: ApoderadoUpdate, db: AsyncSession = Depends(get_db),
):
    apoderado = await db.get(Apoderado, apoderado_id)
    if not apoderado:
        raise HTTPException(404, "Apoderado no encontrado")

    cambios = body.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(apoderado, k, v)
    await db.commit()
    await db.refresh(apoderado)
    return ApoderadoOut.model_validate(apoderado)


@router.delete("/{apoderado_id}", status_code=204)
async def eliminar_apoderado(apoderado_id: UUID, db: AsyncSession = Depends(get_db)):
    apoderado = await db.get(Apoderado, apoderado_id)
    if not apoderado:
        raise HTTPException(404, "Apoderado no encontrado")
    await db.delete(apoderado)
    await db.commit()


# ------------------------------------------------------------
# Vínculos estudiante ↔ apoderado
# ------------------------------------------------------------

@router.post("/vincular", response_model=EstudianteApoderadoOut, status_code=201)
async def vincular_apoderado(body: EstudianteApoderadoCreate, db: AsyncSession = Depends(get_db)):
    est = await db.get(Estudiante, body.estudiante_id)
    if not est:
        raise HTTPException(404, "Estudiante no encontrado")
    apo = await db.get(Apoderado, body.apoderado_id)
    if not apo:
        raise HTTPException(404, "Apoderado no encontrado")
    if apo.colegio_id != est.colegio_id:
        raise HTTPException(400, "El apoderado y el estudiante pertenecen a distintos colegios")

    link = EstudianteApoderado(**body.model_dump())
    db.add(link)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        if "estudiante_apoderado_uk" in str(e).lower():
            raise HTTPException(409, "Este vínculo ya existe")
        raise
    await db.refresh(link)
    return EstudianteApoderadoOut.model_validate(link)


@router.delete("/vincular/{vinculo_id}", status_code=204)
async def desvincular_apoderado(vinculo_id: UUID, db: AsyncSession = Depends(get_db)):
    link = await db.get(EstudianteApoderado, vinculo_id)
    if not link:
        raise HTTPException(404, "Vínculo no encontrado")
    await db.delete(link)
    await db.commit()


@router.get("/estudiante/{estudiante_id}", response_model=list[EstudianteApoderadoOut])
async def listar_apoderados_de_estudiante(estudiante_id: UUID, db: AsyncSession = Depends(get_db)):
    est = await db.get(Estudiante, estudiante_id)
    if not est:
        raise HTTPException(404, "Estudiante no encontrado")

    query = select(EstudianteApoderado).where(EstudianteApoderado.estudiante_id == estudiante_id)
    rows = (await db.execute(query)).scalars().all()
    return [EstudianteApoderadoOut.model_validate(r) for r in rows]
