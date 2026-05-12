"""CRUD de períodos académicos (semestres / trimestres del colegio)."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Colegio
from ..models.libro import Periodo
from ..schemas.libro import PeriodoCreate, PeriodoOut, PeriodoUpdate

router = APIRouter(prefix="/periodos", tags=["libro: períodos"])


@router.post("", response_model=PeriodoOut, status_code=201)
async def crear_periodo(body: PeriodoCreate, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, body.colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")
    if body.fecha_termino <= body.fecha_inicio:
        raise HTTPException(400, "La fecha de término debe ser posterior a la de inicio")

    p = Periodo(**body.model_dump())
    db.add(p)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        if "periodo_uk" in str(e).lower():
            raise HTTPException(409, "Ya existe un período con ese año y número en este colegio")
        raise
    await db.refresh(p)
    return PeriodoOut.model_validate(p)


@router.get("", response_model=list[PeriodoOut])
async def listar_periodos(
    colegio_id: UUID | None = Query(None),
    ano: int | None = Query(None),
    activo: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Periodo)
    if colegio_id:
        q = q.where(Periodo.colegio_id == colegio_id)
    if ano:
        q = q.where(Periodo.ano == ano)
    if activo is not None:
        q = q.where(Periodo.activo.is_(activo))
    q = q.order_by(Periodo.ano.desc(), Periodo.numero)
    rows = (await db.execute(q)).scalars().all()
    return [PeriodoOut.model_validate(p) for p in rows]


@router.get("/{periodo_id}", response_model=PeriodoOut)
async def obtener_periodo(periodo_id: UUID, db: AsyncSession = Depends(get_db)):
    p = await db.get(Periodo, periodo_id)
    if not p:
        raise HTTPException(404, "Período no encontrado")
    return PeriodoOut.model_validate(p)


@router.patch("/{periodo_id}", response_model=PeriodoOut)
async def actualizar_periodo(
    periodo_id: UUID, body: PeriodoUpdate, db: AsyncSession = Depends(get_db),
):
    p = await db.get(Periodo, periodo_id)
    if not p:
        raise HTTPException(404, "Período no encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    if p.fecha_termino <= p.fecha_inicio:
        raise HTTPException(400, "La fecha de término debe ser posterior a la de inicio")
    await db.commit()
    await db.refresh(p)
    return PeriodoOut.model_validate(p)


@router.delete("/{periodo_id}", status_code=204)
async def eliminar_periodo(periodo_id: UUID, db: AsyncSession = Depends(get_db)):
    p = await db.get(Periodo, periodo_id)
    if not p:
        raise HTTPException(404, "Período no encontrado")
    await db.delete(p)
    await db.commit()
