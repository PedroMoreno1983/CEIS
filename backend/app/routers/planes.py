"""Planes de mejora, objetivos y seguimientos."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Docente, Estudiante, ObjetivoPlan, PlanMejora, SeguimientoPlan
from ..schemas.gestion import (
    ObjetivoPlanCreate, ObjetivoPlanOut, ObjetivoPlanUpdate,
    PlanMejoraCreate, PlanMejoraOut, PlanMejoraUpdate,
    SeguimientoPlanCreate, SeguimientoPlanOut,
)

router = APIRouter(prefix="/planes", tags=["gestion: planes de mejora"])


@router.post("", response_model=PlanMejoraOut, status_code=201)
async def crear_plan(body: PlanMejoraCreate, db: AsyncSession = Depends(get_db)):
    est = await db.get(Estudiante, body.estudiante_id)
    if not est:
        raise HTTPException(404, "Estudiante no encontrado")
    if body.autor_docente_id:
        d = await db.get(Docente, body.autor_docente_id)
        if not d or d.colegio_id != est.colegio_id:
            raise HTTPException(400, "Docente autor inválido")

    plan = PlanMejora(**body.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return await _enriquecer_plan(db, plan)


@router.get("", response_model=list[PlanMejoraOut])
async def listar_planes(
    estudiante_id: UUID | None = Query(None),
    estado: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(PlanMejora)
    if estudiante_id:
        query = query.where(PlanMejora.estudiante_id == estudiante_id)
    if estado:
        query = query.where(PlanMejora.estado == estado)
    query = query.order_by(PlanMejora.creado_en.desc())
    rows = (await db.execute(query)).scalars().all()
    return [await _enriquecer_plan(db, p) for p in rows]


@router.get("/{plan_id}", response_model=PlanMejoraOut)
async def obtener_plan(plan_id: UUID, db: AsyncSession = Depends(get_db)):
    plan = await db.get(PlanMejora, plan_id)
    if not plan:
        raise HTTPException(404, "Plan de mejora no encontrado")
    return await _enriquecer_plan(db, plan)


@router.patch("/{plan_id}", response_model=PlanMejoraOut)
async def actualizar_plan(
    plan_id: UUID, body: PlanMejoraUpdate, db: AsyncSession = Depends(get_db),
):
    plan = await db.get(PlanMejora, plan_id)
    if not plan:
        raise HTTPException(404, "Plan de mejora no encontrado")
    cambios = body.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(plan, k, v)
    await db.commit()
    await db.refresh(plan)
    return await _enriquecer_plan(db, plan)


@router.delete("/{plan_id}", status_code=204)
async def eliminar_plan(plan_id: UUID, db: AsyncSession = Depends(get_db)):
    plan = await db.get(PlanMejora, plan_id)
    if not plan:
        raise HTTPException(404, "Plan de mejora no encontrado")
    await db.delete(plan)
    await db.commit()


# ------------------------------------------------------------
# Objetivos
# ------------------------------------------------------------

@router.post("/{plan_id}/objetivos", response_model=ObjetivoPlanOut, status_code=201)
async def crear_objetivo(plan_id: UUID, body: ObjetivoPlanCreate, db: AsyncSession = Depends(get_db)):
    plan = await db.get(PlanMejora, plan_id)
    if not plan:
        raise HTTPException(404, "Plan de mejora no encontrado")
    if body.plan_id != plan_id:
        raise HTTPException(400, "El plan_id del body no coincide con la URL")

    obj = ObjetivoPlan(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return ObjetivoPlanOut.model_validate(obj)


@router.get("/{plan_id}/objetivos", response_model=list[ObjetivoPlanOut])
async def listar_objetivos(plan_id: UUID, db: AsyncSession = Depends(get_db)):
    plan = await db.get(PlanMejora, plan_id)
    if not plan:
        raise HTTPException(404, "Plan de mejora no encontrado")
    rows = (
        await db.execute(
            select(ObjetivoPlan)
            .where(ObjetivoPlan.plan_id == plan_id)
            .order_by(ObjetivoPlan.prioridad, ObjetivoPlan.creado_en)
        )
    ).scalars().all()
    return [ObjetivoPlanOut.model_validate(o) for o in rows]


@router.patch("/objetivos/{objetivo_id}", response_model=ObjetivoPlanOut)
async def actualizar_objetivo(
    objetivo_id: UUID, body: ObjetivoPlanUpdate, db: AsyncSession = Depends(get_db),
):
    obj = await db.get(ObjetivoPlan, objetivo_id)
    if not obj:
        raise HTTPException(404, "Objetivo no encontrado")
    cambios = body.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(obj, k, v)
    await db.commit()
    await db.refresh(obj)
    return ObjetivoPlanOut.model_validate(obj)


@router.delete("/objetivos/{objetivo_id}", status_code=204)
async def eliminar_objetivo(objetivo_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await db.get(ObjetivoPlan, objetivo_id)
    if not obj:
        raise HTTPException(404, "Objetivo no encontrado")
    await db.delete(obj)
    await db.commit()


# ------------------------------------------------------------
# Seguimientos
# ------------------------------------------------------------

@router.post("/{plan_id}/seguimientos", response_model=SeguimientoPlanOut, status_code=201)
async def crear_seguimiento(plan_id: UUID, body: SeguimientoPlanCreate, db: AsyncSession = Depends(get_db)):
    plan = await db.get(PlanMejora, plan_id)
    if not plan:
        raise HTTPException(404, "Plan de mejora no encontrado")
    if body.plan_id != plan_id:
        raise HTTPException(400, "El plan_id del body no coincide con la URL")
    if body.autor_docente_id:
        d = await db.get(Docente, body.autor_docente_id)
        if not d:
            raise HTTPException(400, "Docente autor inválido")

    seg = SeguimientoPlan(**body.model_dump())
    db.add(seg)
    await db.commit()
    await db.refresh(seg)
    return await _enriquecer_seguimiento(db, seg)


@router.get("/{plan_id}/seguimientos", response_model=list[SeguimientoPlanOut])
async def listar_seguimientos(plan_id: UUID, db: AsyncSession = Depends(get_db)):
    plan = await db.get(PlanMejora, plan_id)
    if not plan:
        raise HTTPException(404, "Plan de mejora no encontrado")
    rows = (
        await db.execute(
            select(SeguimientoPlan)
            .where(SeguimientoPlan.plan_id == plan_id)
            .order_by(SeguimientoPlan.fecha.desc())
        )
    ).scalars().all()
    return [await _enriquecer_seguimiento(db, s) for s in rows]


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------

async def _enriquecer_plan(db: AsyncSession, plan: PlanMejora) -> PlanMejoraOut:
    out = PlanMejoraOut.model_validate(plan)
    est = await db.get(Estudiante, plan.estudiante_id)
    if est:
        out.estudiante_nombre = f"{est.nombres} {est.apellido_paterno}"
    if plan.autor_docente_id:
        d = await db.get(Docente, plan.autor_docente_id)
        if d:
            out.autor_nombre = f"{d.nombres} {d.apellido_paterno}"
    num_obj = await db.scalar(
        select(func.count()).select_from(ObjetivoPlan).where(ObjetivoPlan.plan_id == plan.id)
    )
    out.num_objetivos = int(num_obj or 0)
    return out


async def _enriquecer_seguimiento(db: AsyncSession, seg: SeguimientoPlan) -> SeguimientoPlanOut:
    out = SeguimientoPlanOut.model_validate(seg)
    if seg.autor_docente_id:
        d = await db.get(Docente, seg.autor_docente_id)
        if d:
            out.autor_nombre = f"{d.nombres} {d.apellido_paterno}"
    return out
