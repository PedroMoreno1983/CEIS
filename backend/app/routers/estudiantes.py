"""CRUD de estudiantes + matrícula/desmatrícula en cursos."""
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Colegio, Curso, Estudiante, EstudianteCurso
from ..schemas.gestion import (
    EstudianteCreate, EstudianteCursoCreate, EstudianteCursoOut,
    EstudianteOut, EstudianteUpdate,
)

router = APIRouter(prefix="/estudiantes", tags=["gestion: estudiantes"])


async def _enriquecer_estudiante(db: AsyncSession, est: Estudiante) -> EstudianteOut:
    out = EstudianteOut.model_validate(est)

    q = (
        select(Curso, EstudianteCurso)
        .join(EstudianteCurso, EstudianteCurso.curso_id == Curso.id)
        .where(
            EstudianteCurso.estudiante_id == est.id,
            EstudianteCurso.activo.is_(True),
        )
        .order_by(EstudianteCurso.fecha_inicio.desc())
        .limit(1)
    )
    row = (await db.execute(q)).first()
    if row:
        curso, _ = row
        out.curso_actual_id = curso.id
        out.curso_actual_label = f"{curso.nivel} {curso.letra} · {curso.ano}"
    return out


@router.post("", response_model=EstudianteOut, status_code=201)
async def crear_estudiante(body: EstudianteCreate, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, body.colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")

    curso_id = body.curso_id
    numero_lista = body.numero_lista

    if curso_id:
        curso = await db.get(Curso, curso_id)
        if not curso or curso.colegio_id != body.colegio_id:
            raise HTTPException(400, "Curso inválido para este colegio")

    data = body.model_dump(exclude={"curso_id", "numero_lista"})
    est = Estudiante(**data)
    db.add(est)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        if "estudiante_colegio_rut_uk" in str(e).lower():
            raise HTTPException(409, "Ya existe un estudiante con ese RUT en este colegio")
        raise
    await db.refresh(est)

    if curso_id:
        link = EstudianteCurso(
            estudiante_id=est.id,
            curso_id=curso_id,
            numero_lista=numero_lista,
        )
        db.add(link)
        await db.commit()

    return await _enriquecer_estudiante(db, est)


@router.get("", response_model=list[EstudianteOut])
async def listar_estudiantes(
    colegio_id: UUID | None = Query(None),
    estado: str | None = Query(None),
    q: str | None = Query(None, description="Buscar por nombre, apellido o RUT"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(Estudiante)
    if colegio_id:
        query = query.where(Estudiante.colegio_id == colegio_id)
    if estado:
        query = query.where(Estudiante.estado == estado)
    if q:
        like = f"%{q}%"
        query = query.where(
            (Estudiante.nombres.ilike(like))
            | (Estudiante.apellido_paterno.ilike(like))
            | (Estudiante.apellido_materno.ilike(like))
            | (Estudiante.rut.ilike(like))
        )
    query = query.order_by(Estudiante.apellido_paterno, Estudiante.nombres).offset(skip).limit(limit)
    rows = (await db.execute(query)).scalars().all()
    return [await _enriquecer_estudiante(db, e) for e in rows]


@router.get("/{estudiante_id}", response_model=EstudianteOut)
async def obtener_estudiante(estudiante_id: UUID, db: AsyncSession = Depends(get_db)):
    est = await db.get(Estudiante, estudiante_id)
    if not est:
        raise HTTPException(404, "Estudiante no encontrado")
    return await _enriquecer_estudiante(db, est)


@router.patch("/{estudiante_id}", response_model=EstudianteOut)
async def actualizar_estudiante(
    estudiante_id: UUID, body: EstudianteUpdate, db: AsyncSession = Depends(get_db),
):
    est = await db.get(Estudiante, estudiante_id)
    if not est:
        raise HTTPException(404, "Estudiante no encontrado")

    cambios = body.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(est, k, v)
    await db.commit()
    await db.refresh(est)
    return await _enriquecer_estudiante(db, est)


@router.delete("/{estudiante_id}", status_code=204)
async def eliminar_estudiante(estudiante_id: UUID, db: AsyncSession = Depends(get_db)):
    est = await db.get(Estudiante, estudiante_id)
    if not est:
        raise HTTPException(404, "Estudiante no encontrado")
    await db.delete(est)
    await db.commit()


# ------------------------------------------------------------
# Matrícula
# ------------------------------------------------------------

@router.post("/matricular", response_model=EstudianteCursoOut, status_code=201)
async def matricular(body: EstudianteCursoCreate, db: AsyncSession = Depends(get_db)):
    """Vincula un estudiante a un curso. Si ya existe matrícula activa
    en otro curso del mismo año/colegio, la cierra automáticamente."""
    est = await db.get(Estudiante, body.estudiante_id)
    if not est:
        raise HTTPException(404, "Estudiante no encontrado")
    curso = await db.get(Curso, body.curso_id)
    if not curso:
        raise HTTPException(404, "Curso no encontrado")
    if curso.colegio_id != est.colegio_id:
        raise HTTPException(400, "El curso pertenece a otro colegio")

    # Cerrar matrículas activas previas en el mismo año
    previas = (await db.execute(
        select(EstudianteCurso)
        .join(Curso, Curso.id == EstudianteCurso.curso_id)
        .where(
            EstudianteCurso.estudiante_id == est.id,
            EstudianteCurso.activo.is_(True),
            Curso.ano == curso.ano,
        )
    )).scalars().all()
    for p in previas:
        p.activo = False
        p.fecha_termino = date.today()

    # ¿Existe ya el vínculo exacto?
    existente = await db.scalar(
        select(EstudianteCurso).where(
            EstudianteCurso.estudiante_id == est.id,
            EstudianteCurso.curso_id == curso.id,
        )
    )
    if existente:
        existente.activo = True
        existente.fecha_termino = None
        if body.numero_lista is not None:
            existente.numero_lista = body.numero_lista
        if body.fecha_inicio:
            existente.fecha_inicio = body.fecha_inicio
        await db.commit()
        await db.refresh(existente)
        return EstudianteCursoOut.model_validate(existente)

    link = EstudianteCurso(
        estudiante_id=est.id,
        curso_id=curso.id,
        numero_lista=body.numero_lista,
        fecha_inicio=body.fecha_inicio or date.today(),
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return EstudianteCursoOut.model_validate(link)


@router.delete("/matricular/{vinculo_id}", status_code=204)
async def desmatricular(vinculo_id: UUID, db: AsyncSession = Depends(get_db)):
    """Desactiva el vínculo (no lo borra — mantiene histórico)."""
    link = await db.get(EstudianteCurso, vinculo_id)
    if not link:
        raise HTTPException(404, "Vínculo no encontrado")
    link.activo = False
    link.fecha_termino = date.today()
    await db.commit()
