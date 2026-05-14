"""Dashboard directivo — resúmenes y alertas por colegio."""
from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Colegio, Curso, Docente, Estudiante
from ..models.libro import Anotacion, Asistencia, Calificacion

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/resumen/{colegio_id}")
async def resumen_colegio(colegio_id: UUID, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")

    # Conteos básicos
    total_estudiantes = await db.scalar(
        select(func.count()).select_from(Estudiante).where(Estudiante.colegio_id == colegio_id)
    )
    total_docentes = await db.scalar(
        select(func.count()).select_from(Docente).where(Docente.colegio_id == colegio_id)
    )
    total_cursos = await db.scalar(
        select(func.count()).select_from(Curso).where(Curso.colegio_id == colegio_id)
    )

    # Promedio general del colegio (media de promedios individuales ponderados)
    promedio_result = await db.execute(
        text("""
            SELECT AVG(sub.promedio) FROM (
                SELECT SUM(c.nota * c.ponderacion) / SUM(c.ponderacion) AS promedio
                FROM gestion.calificacion c
                JOIN gestion.estudiante e ON e.id = c.estudiante_id
                WHERE e.colegio_id = :colegio_id AND c.nota IS NOT NULL
                GROUP BY c.estudiante_id
                HAVING SUM(c.ponderacion) > 0
            ) sub
        """),
        {"colegio_id": str(colegio_id)},
    )
    promedio_general = promedio_result.scalar()

    # Total evaluaciones este mes
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)
    evaluaciones_mes = await db.scalar(
        select(func.count())
        .select_from(Calificacion)
        .join(Estudiante, Estudiante.id == Calificacion.estudiante_id)
        .where(
            Estudiante.colegio_id == colegio_id,
            Calificacion.fecha >= inicio_mes,
        )
    )

    # Asistencia promedio del colegio (últimos 30 días)
    desde = hoy - timedelta(days=30)
    asist_result = await db.execute(
        text("""
            SELECT COUNT(*) FILTER (WHERE a.estado IN ('presente','atrasado','justificado')) * 100.0 / NULLIF(COUNT(*), 0)
            FROM gestion.asistencia a
            JOIN gestion.estudiante e ON e.id = a.estudiante_id
            WHERE e.colegio_id = :colegio_id AND a.fecha >= :desde
        """),
        {"colegio_id": str(colegio_id), "desde": desde},
    )
    asistencia_promedio = asist_result.scalar()

    return {
        "colegio_id": str(colegio_id),
        "colegio_nombre": colegio.nombre,
        "total_estudiantes": total_estudiantes or 0,
        "total_docentes": total_docentes or 0,
        "total_cursos": total_cursos or 0,
        "promedio_general": round(float(promedio_general), 2) if promedio_general else None,
        "evaluaciones_este_mes": evaluaciones_mes or 0,
        "asistencia_promedio_30d": round(float(asistencia_promedio), 1) if asistencia_promedio else None,
    }


@router.get("/alertas/{colegio_id}")
async def alertas_colegio(colegio_id: UUID, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")

    hoy = date.today()
    desde_30d = hoy - timedelta(days=30)

    # 1. Alertas académicas: promedio < 4.0
    academicas = await db.execute(
        text("""
            SELECT
                e.id AS estudiante_id,
                e.nombres,
                e.apellido_paterno,
                e.apellido_materno,
                ROUND((SUM(c.nota * c.ponderacion) / SUM(c.ponderacion))::numeric, 2) AS promedio
            FROM gestion.calificacion c
            JOIN gestion.estudiante e ON e.id = c.estudiante_id
            WHERE e.colegio_id = :colegio_id AND c.nota IS NOT NULL
            GROUP BY e.id, e.nombres, e.apellido_paterno, e.apellido_materno
            HAVING SUM(c.ponderacion) > 0 AND SUM(c.nota * c.ponderacion) / SUM(c.ponderacion) < 4.0
            ORDER BY promedio ASC
            LIMIT 50
        """),
        {"colegio_id": str(colegio_id)},
    )

    # 2. Alertas asistencia: < 70% en últimos 30 días
    asistencias = await db.execute(
        text("""
            SELECT
                e.id AS estudiante_id,
                e.nombres,
                e.apellido_paterno,
                e.apellido_materno,
                COUNT(*) FILTER (WHERE a.estado IN ('presente','atrasado','justificado')) * 100.0 / NULLIF(COUNT(*), 0) AS pct
            FROM gestion.estudiante e
            LEFT JOIN gestion.asistencia a ON a.estudiante_id = e.id AND a.fecha >= :desde
            WHERE e.colegio_id = :colegio_id
            GROUP BY e.id, e.nombres, e.apellido_paterno, e.apellido_materno
            HAVING COUNT(*) > 0 AND COUNT(*) FILTER (WHERE a.estado IN ('presente','atrasado','justificado')) * 100.0 / COUNT(*) < 70
            ORDER BY pct ASC
            LIMIT 50
        """),
        {"colegio_id": str(colegio_id), "desde": desde_30d},
    )

    # 3. Alertas conducta: anotaciones negativas en últimos 30 días
    conducta = await db.execute(
        text("""
            SELECT
                e.id AS estudiante_id,
                e.nombres,
                e.apellido_paterno,
                e.apellido_materno,
                COUNT(*) AS total_negativas
            FROM gestion.anotacion an
            JOIN gestion.estudiante e ON e.id = an.estudiante_id
            WHERE e.colegio_id = :colegio_id AND an.tipo = 'negativa' AND an.fecha >= :desde
            GROUP BY e.id, e.nombres, e.apellido_paterno, e.apellido_materno
            ORDER BY total_negativas DESC
            LIMIT 50
        """),
        {"colegio_id": str(colegio_id), "desde": desde_30d},
    )

    def _row_to_dict(row):
        return {
            "estudiante_id": str(row.estudiante_id),
            "nombre": f"{row.nombres} {row.apellido_paterno} {row.apellido_materno or ''}".strip(),
            "promedio": float(row.promedio) if hasattr(row, "promedio") else None,
            "porcentaje_asistencia": round(float(row.pct), 1) if hasattr(row, "pct") else None,
            "total_negativas": int(row.total_negativas) if hasattr(row, "total_negativas") else None,
        }

    return {
        "academicas": [_row_to_dict(r) for r in academicas.mappings().all()],
        "asistencia": [_row_to_dict(r) for r in asistencias.mappings().all()],
        "conducta": [_row_to_dict(r) for r in conducta.mappings().all()],
    }
