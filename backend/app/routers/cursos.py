"""CRUD de cursos + listado de estudiantes matriculados."""
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Colegio, Curso, Docente, Estudiante, EstudianteCurso
from ..schemas.gestion import (
    CursoCreate, CursoOut, CursoUpdate,
    EstudianteOut,
)

router = APIRouter(prefix="/cursos", tags=["gestion: cursos"])


async def _enriquecer_curso(db: AsyncSession, curso: Curso) -> CursoOut:
    out = CursoOut.model_validate(curso)

    if curso.profesor_jefe_id:
        d = await db.get(Docente, curso.profesor_jefe_id)
        if d:
            out.profesor_jefe_nombre = f"{d.nombres} {d.apellido_paterno}"

    count = await db.scalar(
        select(func.count()).select_from(EstudianteCurso).where(
            EstudianteCurso.curso_id == curso.id,
            EstudianteCurso.activo.is_(True),
        )
    )
    out.num_estudiantes = int(count or 0)
    return out


@router.post("", response_model=CursoOut, status_code=201)
async def crear_curso(body: CursoCreate, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, body.colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")

    if body.profesor_jefe_id:
        pj = await db.get(Docente, body.profesor_jefe_id)
        if not pj or pj.colegio_id != body.colegio_id:
            raise HTTPException(400, "Profesor jefe inválido para este colegio")

    curso = Curso(**body.model_dump())
    db.add(curso)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        if "curso_uk" in str(e).lower():
            raise HTTPException(409, "Ya existe un curso con ese año, nivel y letra en este colegio")
        raise
    await db.refresh(curso)
    return await _enriquecer_curso(db, curso)


@router.get("", response_model=list[CursoOut])
async def listar_cursos(
    colegio_id: UUID | None = Query(None),
    ano: int | None = Query(None),
    nivel: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Curso)
    if colegio_id:
        query = query.where(Curso.colegio_id == colegio_id)
    if ano:
        query = query.where(Curso.ano == ano)
    if nivel:
        query = query.where(Curso.nivel == nivel)
    query = query.order_by(Curso.ano.desc(), Curso.nivel, Curso.letra)
    rows = (await db.execute(query)).scalars().all()
    return [await _enriquecer_curso(db, c) for c in rows]


@router.get("/{curso_id}", response_model=CursoOut)
async def obtener_curso(curso_id: UUID, db: AsyncSession = Depends(get_db)):
    curso = await db.get(Curso, curso_id)
    if not curso:
        raise HTTPException(404, "Curso no encontrado")
    return await _enriquecer_curso(db, curso)


@router.patch("/{curso_id}", response_model=CursoOut)
async def actualizar_curso(
    curso_id: UUID, body: CursoUpdate, db: AsyncSession = Depends(get_db),
):
    curso = await db.get(Curso, curso_id)
    if not curso:
        raise HTTPException(404, "Curso no encontrado")

    if body.profesor_jefe_id is not None:
        pj = await db.get(Docente, body.profesor_jefe_id)
        if not pj or pj.colegio_id != curso.colegio_id:
            raise HTTPException(400, "Profesor jefe inválido para este colegio")

    cambios = body.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(curso, k, v)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        if "curso_uk" in str(e).lower():
            raise HTTPException(409, "Conflicto de unicidad: año + nivel + letra ya existe")
        raise
    await db.refresh(curso)
    return await _enriquecer_curso(db, curso)


@router.delete("/{curso_id}", status_code=204)
async def eliminar_curso(curso_id: UUID, db: AsyncSession = Depends(get_db)):
    curso = await db.get(Curso, curso_id)
    if not curso:
        raise HTTPException(404, "Curso no encontrado")
    await db.delete(curso)
    await db.commit()


@router.get("/{curso_id}/estudiantes", response_model=list[EstudianteOut])
async def listar_estudiantes_del_curso(
    curso_id: UUID,
    incluir_inactivos: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    curso = await db.get(Curso, curso_id)
    if not curso:
        raise HTTPException(404, "Curso no encontrado")

    query = (
        select(Estudiante, EstudianteCurso.numero_lista)
        .join(EstudianteCurso, EstudianteCurso.estudiante_id == Estudiante.id)
        .where(EstudianteCurso.curso_id == curso_id)
    )
    if not incluir_inactivos:
        query = query.where(EstudianteCurso.activo.is_(True))
    query = query.order_by(EstudianteCurso.numero_lista.nulls_last(), Estudiante.apellido_paterno)
    rows = (await db.execute(query)).all()

    label = f"{curso.nivel} {curso.letra} · {curso.ano}"
    out = []
    for est, _ in rows:
        e = EstudianteOut.model_validate(est)
        e.curso_actual_id = curso.id
        e.curso_actual_label = label
        out.append(e)
    return out
