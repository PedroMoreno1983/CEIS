"""PIE — Programa de Integración Escolar (diagnósticos e intervenciones)."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Docente, Estudiante, PIEDiagnostico, PIEIntervencion
from ..schemas.gestion import (
    PIEDiagnosticoCreate, PIEDiagnosticoOut, PIEDiagnosticoUpdate,
    PIEIntervencionCreate, PIEIntervencionOut,
)

router = APIRouter(prefix="/pie", tags=["gestion: pie"])


@router.post("/diagnosticos", response_model=PIEDiagnosticoOut, status_code=201)
async def crear_diagnostico(body: PIEDiagnosticoCreate, db: AsyncSession = Depends(get_db)):
    est = await db.get(Estudiante, body.estudiante_id)
    if not est:
        raise HTTPException(404, "Estudiante no encontrado")

    diag = PIEDiagnostico(**body.model_dump())
    db.add(diag)
    await db.commit()
    await db.refresh(diag)
    return await _enriquecer_diagnostico(db, diag)


@router.get("/diagnosticos", response_model=list[PIEDiagnosticoOut])
async def listar_diagnosticos(
    estudiante_id: UUID | None = Query(None),
    estado: str | None = Query(None),
    tipo: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(PIEDiagnostico)
    if estudiante_id:
        query = query.where(PIEDiagnostico.estudiante_id == estudiante_id)
    if estado:
        query = query.where(PIEDiagnostico.estado == estado)
    if tipo:
        query = query.where(PIEDiagnostico.tipo == tipo)
    query = query.order_by(PIEDiagnostico.fecha_diagnostico.desc())
    rows = (await db.execute(query)).scalars().all()
    return [await _enriquecer_diagnostico(db, d) for d in rows]


@router.get("/diagnosticos/{diagnostico_id}", response_model=PIEDiagnosticoOut)
async def obtener_diagnostico(diagnostico_id: UUID, db: AsyncSession = Depends(get_db)):
    diag = await db.get(PIEDiagnostico, diagnostico_id)
    if not diag:
        raise HTTPException(404, "Diagnóstico no encontrado")
    return await _enriquecer_diagnostico(db, diag)


@router.patch("/diagnosticos/{diagnostico_id}", response_model=PIEDiagnosticoOut)
async def actualizar_diagnostico(
    diagnostico_id: UUID, body: PIEDiagnosticoUpdate, db: AsyncSession = Depends(get_db),
):
    diag = await db.get(PIEDiagnostico, diagnostico_id)
    if not diag:
        raise HTTPException(404, "Diagnóstico no encontrado")
    cambios = body.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(diag, k, v)
    await db.commit()
    await db.refresh(diag)
    return await _enriquecer_diagnostico(db, diag)


@router.delete("/diagnosticos/{diagnostico_id}", status_code=204)
async def eliminar_diagnostico(diagnostico_id: UUID, db: AsyncSession = Depends(get_db)):
    diag = await db.get(PIEDiagnostico, diagnostico_id)
    if not diag:
        raise HTTPException(404, "Diagnóstico no encontrado")
    await db.delete(diag)
    await db.commit()


# ------------------------------------------------------------
# Intervenciones
# ------------------------------------------------------------

@router.post("/diagnosticos/{diagnostico_id}/intervenciones", response_model=PIEIntervencionOut, status_code=201)
async def crear_intervencion(
    diagnostico_id: UUID, body: PIEIntervencionCreate, db: AsyncSession = Depends(get_db),
):
    diag = await db.get(PIEDiagnostico, diagnostico_id)
    if not diag:
        raise HTTPException(404, "Diagnóstico no encontrado")
    if body.diagnostico_id != diagnostico_id:
        raise HTTPException(400, "El diagnostico_id del body no coincide con la URL")

    inter = PIEIntervencion(**body.model_dump())
    db.add(inter)
    await db.commit()
    await db.refresh(inter)
    return PIEIntervencionOut.model_validate(inter)


@router.get("/diagnosticos/{diagnostico_id}/intervenciones", response_model=list[PIEIntervencionOut])
async def listar_intervenciones(diagnostico_id: UUID, db: AsyncSession = Depends(get_db)):
    diag = await db.get(PIEDiagnostico, diagnostico_id)
    if not diag:
        raise HTTPException(404, "Diagnóstico no encontrado")
    rows = (
        await db.execute(
            select(PIEIntervencion)
            .where(PIEIntervencion.diagnostico_id == diagnostico_id)
            .order_by(PIEIntervencion.fecha.desc())
        )
    ).scalars().all()
    return [PIEIntervencionOut.model_validate(i) for i in rows]


@router.delete("/intervenciones/{intervencion_id}", status_code=204)
async def eliminar_intervencion(intervencion_id: UUID, db: AsyncSession = Depends(get_db)):
    inter = await db.get(PIEIntervencion, intervencion_id)
    if not inter:
        raise HTTPException(404, "Intervención no encontrada")
    await db.delete(inter)
    await db.commit()


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------

async def _enriquecer_diagnostico(db: AsyncSession, diag: PIEDiagnostico) -> PIEDiagnosticoOut:
    out = PIEDiagnosticoOut.model_validate(diag)
    est = await db.get(Estudiante, diag.estudiante_id)
    if est:
        out.estudiante_nombre = f"{est.nombres} {est.apellido_paterno}"
    num_int = await db.scalar(
        select(func.count())
        .select_from(PIEIntervencion)
        .where(PIEIntervencion.diagnostico_id == diag.id)
    )
    out.num_intervenciones = int(num_int or 0)
    return out
