"""Operación diaria del libro de clases: calificaciones, asistencia, anotaciones."""
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Curso, Docente, Estudiante, EstudianteCurso
from ..models.libro import Anotacion, Asignatura, Asistencia, Calificacion, Periodo
from ..schemas.libro import (
    AnotacionCreate, AnotacionOut, AnotacionUpdate,
    AsistenciaCursoFecha, AsistenciaOut, AsistenciaResumen,
    CalificacionBulkCreate, CalificacionCreate, CalificacionOut, CalificacionUpdate,
)

router = APIRouter(tags=["libro: operación diaria"])


# ============================================================
# Calificaciones
# ============================================================

async def _enriquecer_calificacion(db: AsyncSession, c: Calificacion) -> CalificacionOut:
    out = CalificacionOut.model_validate(c)
    est = await db.get(Estudiante, c.estudiante_id)
    asig = await db.get(Asignatura, c.asignatura_id)
    if est:
        out.estudiante_nombre = f"{est.apellido_paterno} {est.apellido_materno or ''}, {est.nombres}".strip()
    if asig:
        out.asignatura_codigo = asig.codigo
    return out


@router.post("/calificaciones", response_model=CalificacionOut, status_code=201)
async def crear_calificacion(body: CalificacionCreate, db: AsyncSession = Depends(get_db)):
    if not await db.get(Estudiante, body.estudiante_id):
        raise HTTPException(404, "Estudiante no encontrado")
    if not await db.get(Asignatura, body.asignatura_id):
        raise HTTPException(404, "Asignatura no encontrada")
    if not await db.get(Periodo, body.periodo_id):
        raise HTTPException(404, "Período no encontrado")

    c = Calificacion(**body.model_dump())
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return await _enriquecer_calificacion(db, c)


@router.post("/calificaciones/bulk", response_model=list[CalificacionOut], status_code=201)
async def crear_calificaciones_bulk(
    body: CalificacionBulkCreate, db: AsyncSession = Depends(get_db),
):
    """Crea una misma evaluación para varios estudiantes en una sola llamada.
    Cada uno con su nota (puede ser null para pendientes)."""
    if not await db.get(Asignatura, body.asignatura_id):
        raise HTTPException(404, "Asignatura no encontrada")
    if not await db.get(Periodo, body.periodo_id):
        raise HTTPException(404, "Período no encontrado")

    creadas: list[Calificacion] = []
    for item in body.notas:
        c = Calificacion(
            estudiante_id=item.estudiante_id,
            asignatura_id=body.asignatura_id,
            periodo_id=body.periodo_id,
            docente_id=body.docente_id,
            nota=item.nota,
            ponderacion=body.ponderacion,
            tipo=body.tipo,
            descripcion=body.descripcion,
            fecha=body.fecha,
        )
        db.add(c)
        creadas.append(c)
    await db.commit()
    for c in creadas:
        await db.refresh(c)
    return [await _enriquecer_calificacion(db, c) for c in creadas]


@router.get("/calificaciones", response_model=list[CalificacionOut])
async def listar_calificaciones(
    estudiante_id: UUID | None = Query(None),
    asignatura_id: UUID | None = Query(None),
    periodo_id: UUID | None = Query(None),
    curso_id: UUID | None = Query(None, description="Filtra por estudiantes matriculados en el curso"),
    db: AsyncSession = Depends(get_db),
):
    q = select(Calificacion)
    if estudiante_id:
        q = q.where(Calificacion.estudiante_id == estudiante_id)
    if asignatura_id:
        q = q.where(Calificacion.asignatura_id == asignatura_id)
    if periodo_id:
        q = q.where(Calificacion.periodo_id == periodo_id)
    if curso_id:
        sub = select(EstudianteCurso.estudiante_id).where(
            EstudianteCurso.curso_id == curso_id,
            EstudianteCurso.activo.is_(True),
        )
        q = q.where(Calificacion.estudiante_id.in_(sub))
    q = q.order_by(Calificacion.fecha.desc(), Calificacion.creado_en.desc())
    rows = (await db.execute(q)).scalars().all()
    return [await _enriquecer_calificacion(db, c) for c in rows]


@router.patch("/calificaciones/{calificacion_id}", response_model=CalificacionOut)
async def actualizar_calificacion(
    calificacion_id: UUID, body: CalificacionUpdate, db: AsyncSession = Depends(get_db),
):
    c = await db.get(Calificacion, calificacion_id)
    if not c:
        raise HTTPException(404, "Calificación no encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    await db.commit()
    await db.refresh(c)
    return await _enriquecer_calificacion(db, c)


@router.delete("/calificaciones/{calificacion_id}", status_code=204)
async def eliminar_calificacion(calificacion_id: UUID, db: AsyncSession = Depends(get_db)):
    c = await db.get(Calificacion, calificacion_id)
    if not c:
        raise HTTPException(404, "Calificación no encontrada")
    await db.delete(c)
    await db.commit()


# ============================================================
# Asistencia
# ============================================================

async def _enriquecer_asistencia(db: AsyncSession, a: Asistencia) -> AsistenciaOut:
    out = AsistenciaOut.model_validate(a)
    est = await db.get(Estudiante, a.estudiante_id)
    if est:
        out.estudiante_nombre = f"{est.apellido_paterno} {est.apellido_materno or ''}, {est.nombres}".strip()
    return out


@router.post("/asistencia/curso", response_model=list[AsistenciaOut], status_code=201)
async def registrar_asistencia_curso(
    body: AsistenciaCursoFecha, db: AsyncSession = Depends(get_db),
):
    """Registra/actualiza la asistencia de varios estudiantes de un curso en una fecha.
    Idempotente: si ya existe registro para (estudiante, fecha), actualiza."""
    curso = await db.get(Curso, body.curso_id)
    if not curso:
        raise HTTPException(404, "Curso no encontrado")

    resultados: list[Asistencia] = []
    for item in body.registros:
        existente = await db.scalar(
            select(Asistencia).where(
                Asistencia.estudiante_id == item.estudiante_id,
                Asistencia.fecha == body.fecha,
            )
        )
        if existente:
            existente.estado = item.estado
            existente.observacion = item.observacion
            existente.curso_id = body.curso_id
            existente.registrada_por_id = body.registrada_por_id
            resultados.append(existente)
        else:
            nueva = Asistencia(
                estudiante_id=item.estudiante_id,
                curso_id=body.curso_id,
                fecha=body.fecha,
                estado=item.estado,
                observacion=item.observacion,
                registrada_por_id=body.registrada_por_id,
            )
            db.add(nueva)
            resultados.append(nueva)
    await db.commit()
    for r in resultados:
        await db.refresh(r)
    return [await _enriquecer_asistencia(db, a) for a in resultados]


@router.get("/asistencia/curso/{curso_id}", response_model=list[AsistenciaOut])
async def asistencia_de_curso_en_fecha(
    curso_id: UUID,
    fecha: date = Query(..., description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        select(Asistencia).where(
            Asistencia.curso_id == curso_id,
            Asistencia.fecha == fecha,
        )
    )).scalars().all()
    return [await _enriquecer_asistencia(db, a) for a in rows]


@router.get("/asistencia/estudiante/{estudiante_id}", response_model=list[AsistenciaOut])
async def asistencia_de_estudiante(
    estudiante_id: UUID,
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Asistencia).where(Asistencia.estudiante_id == estudiante_id)
    if desde:
        q = q.where(Asistencia.fecha >= desde)
    if hasta:
        q = q.where(Asistencia.fecha <= hasta)
    q = q.order_by(Asistencia.fecha.desc())
    rows = (await db.execute(q)).scalars().all()
    return [await _enriquecer_asistencia(db, a) for a in rows]


@router.get("/asistencia/estudiante/{estudiante_id}/resumen", response_model=AsistenciaResumen)
async def resumen_asistencia_estudiante(
    estudiante_id: UUID,
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Asistencia.estado, func.count()).where(Asistencia.estudiante_id == estudiante_id)
    if desde:
        q = q.where(Asistencia.fecha >= desde)
    if hasta:
        q = q.where(Asistencia.fecha <= hasta)
    q = q.group_by(Asistencia.estado)
    rows = (await db.execute(q)).all()

    counts = {estado: cnt for estado, cnt in rows}
    presentes = counts.get("presente", 0)
    ausentes = counts.get("ausente", 0)
    atrasados = counts.get("atrasado", 0)
    justificados = counts.get("justificado", 0)
    total = presentes + ausentes + atrasados + justificados + counts.get("retirado", 0)
    pct = round(100 * (presentes + atrasados + justificados) / total, 1) if total else None

    return AsistenciaResumen(
        estudiante_id=estudiante_id,
        total_dias=total,
        presentes=presentes,
        ausentes=ausentes,
        atrasados=atrasados,
        justificados=justificados,
        porcentaje_asistencia=pct,
    )


# ============================================================
# Anotaciones
# ============================================================

async def _enriquecer_anotacion(db: AsyncSession, a: Anotacion) -> AnotacionOut:
    out = AnotacionOut.model_validate(a)
    est = await db.get(Estudiante, a.estudiante_id)
    if est:
        out.estudiante_nombre = f"{est.apellido_paterno} {est.apellido_materno or ''}, {est.nombres}".strip()
    if a.docente_id:
        d = await db.get(Docente, a.docente_id)
        if d:
            out.docente_nombre = f"{d.nombres} {d.apellido_paterno}"
    if a.asignatura_id:
        asig = await db.get(Asignatura, a.asignatura_id)
        if asig:
            out.asignatura_nombre = asig.nombre
    return out


@router.post("/anotaciones", response_model=AnotacionOut, status_code=201)
async def crear_anotacion(body: AnotacionCreate, db: AsyncSession = Depends(get_db)):
    if not await db.get(Estudiante, body.estudiante_id):
        raise HTTPException(404, "Estudiante no encontrado")
    a = Anotacion(**body.model_dump())
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return await _enriquecer_anotacion(db, a)


@router.get("/anotaciones", response_model=list[AnotacionOut])
async def listar_anotaciones(
    estudiante_id: UUID | None = Query(None),
    curso_id: UUID | None = Query(None),
    tipo: str | None = Query(None),
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Anotacion)
    if estudiante_id:
        q = q.where(Anotacion.estudiante_id == estudiante_id)
    if curso_id:
        sub = select(EstudianteCurso.estudiante_id).where(
            EstudianteCurso.curso_id == curso_id,
            EstudianteCurso.activo.is_(True),
        )
        q = q.where(Anotacion.estudiante_id.in_(sub))
    if tipo:
        q = q.where(Anotacion.tipo == tipo)
    if desde:
        q = q.where(Anotacion.fecha >= desde)
    if hasta:
        q = q.where(Anotacion.fecha <= hasta)
    q = q.order_by(Anotacion.fecha.desc(), Anotacion.creado_en.desc())
    rows = (await db.execute(q)).scalars().all()
    return [await _enriquecer_anotacion(db, a) for a in rows]


@router.patch("/anotaciones/{anotacion_id}", response_model=AnotacionOut)
async def actualizar_anotacion(
    anotacion_id: UUID, body: AnotacionUpdate, db: AsyncSession = Depends(get_db),
):
    a = await db.get(Anotacion, anotacion_id)
    if not a:
        raise HTTPException(404, "Anotación no encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    await db.commit()
    await db.refresh(a)
    return await _enriquecer_anotacion(db, a)


@router.delete("/anotaciones/{anotacion_id}", status_code=204)
async def eliminar_anotacion(anotacion_id: UUID, db: AsyncSession = Depends(get_db)):
    a = await db.get(Anotacion, anotacion_id)
    if not a:
        raise HTTPException(404, "Anotación no encontrada")
    await db.delete(a)
    await db.commit()
