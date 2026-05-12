"""CRUD de asignaturas + asignación de carga académica (curso × asignatura × docente)."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Colegio, Curso, Docente
from ..models.libro import Asignatura, CursoAsignaturaDocente
from ..schemas.libro import (
    AsignaturaCreate, AsignaturaOut, AsignaturaUpdate,
    CargaCreate, CargaOut,
)

router = APIRouter(prefix="/asignaturas", tags=["libro: asignaturas"])


@router.post("", response_model=AsignaturaOut, status_code=201)
async def crear_asignatura(body: AsignaturaCreate, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, body.colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")

    asignatura = Asignatura(**body.model_dump())
    db.add(asignatura)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        if "asignatura_colegio_codigo_uk" in str(e).lower():
            raise HTTPException(409, "Ya existe una asignatura con ese código en este colegio")
        raise
    await db.refresh(asignatura)
    return AsignaturaOut.model_validate(asignatura)


@router.get("", response_model=list[AsignaturaOut])
async def listar_asignaturas(
    colegio_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Asignatura)
    if colegio_id:
        q = q.where(Asignatura.colegio_id == colegio_id)
    q = q.order_by(Asignatura.nombre)
    rows = (await db.execute(q)).scalars().all()
    return [AsignaturaOut.model_validate(a) for a in rows]


@router.get("/{asignatura_id}", response_model=AsignaturaOut)
async def obtener_asignatura(asignatura_id: UUID, db: AsyncSession = Depends(get_db)):
    a = await db.get(Asignatura, asignatura_id)
    if not a:
        raise HTTPException(404, "Asignatura no encontrada")
    return AsignaturaOut.model_validate(a)


@router.patch("/{asignatura_id}", response_model=AsignaturaOut)
async def actualizar_asignatura(
    asignatura_id: UUID, body: AsignaturaUpdate, db: AsyncSession = Depends(get_db),
):
    a = await db.get(Asignatura, asignatura_id)
    if not a:
        raise HTTPException(404, "Asignatura no encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    await db.commit()
    await db.refresh(a)
    return AsignaturaOut.model_validate(a)


@router.delete("/{asignatura_id}", status_code=204)
async def eliminar_asignatura(asignatura_id: UUID, db: AsyncSession = Depends(get_db)):
    a = await db.get(Asignatura, asignatura_id)
    if not a:
        raise HTTPException(404, "Asignatura no encontrada")
    await db.delete(a)
    await db.commit()


# ------------------------------------------------------------
# Carga académica
# ------------------------------------------------------------

async def _enriquecer_carga(db: AsyncSession, carga: CursoAsignaturaDocente) -> CargaOut:
    out = CargaOut.model_validate(carga)
    a = await db.get(Asignatura, carga.asignatura_id)
    d = await db.get(Docente, carga.docente_id)
    if a:
        out.asignatura_codigo = a.codigo
        out.asignatura_nombre = a.nombre
    if d:
        out.docente_nombre = f"{d.nombres} {d.apellido_paterno}"
    return out


@router.post("/carga", response_model=CargaOut, status_code=201)
async def crear_carga(body: CargaCreate, db: AsyncSession = Depends(get_db)):
    curso = await db.get(Curso, body.curso_id)
    asignatura = await db.get(Asignatura, body.asignatura_id)
    docente = await db.get(Docente, body.docente_id)
    if not curso or not asignatura or not docente:
        raise HTTPException(404, "Curso, asignatura o docente no encontrado")
    if asignatura.colegio_id != curso.colegio_id or docente.colegio_id != curso.colegio_id:
        raise HTTPException(400, "Asignatura y docente deben pertenecer al mismo colegio del curso")

    carga = CursoAsignaturaDocente(**body.model_dump())
    db.add(carga)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        if "carga_curso_asignatura_uk" in str(e).lower():
            raise HTTPException(409, "Esta asignatura ya tiene docente asignado en este curso")
        raise
    await db.refresh(carga)
    return await _enriquecer_carga(db, carga)


@router.get("/carga/curso/{curso_id}", response_model=list[CargaOut])
async def listar_carga_de_curso(curso_id: UUID, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(CursoAsignaturaDocente).where(CursoAsignaturaDocente.curso_id == curso_id)
    )).scalars().all()
    return [await _enriquecer_carga(db, c) for c in rows]


@router.delete("/carga/{carga_id}", status_code=204)
async def eliminar_carga(carga_id: UUID, db: AsyncSession = Depends(get_db)):
    c = await db.get(CursoAsignaturaDocente, carga_id)
    if not c:
        raise HTTPException(404, "Carga no encontrada")
    await db.delete(c)
    await db.commit()
