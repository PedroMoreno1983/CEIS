"""Mensajes del colegio hacia apoderados."""
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Apoderado, Colegio, Curso, Docente, Mensaje, MensajeDestinatario
from ..schemas.gestion import MensajeCreate, MensajeOut, MensajeUpdate, MensajeDestinatarioOut

router = APIRouter(prefix="/mensajes", tags=["gestion: mensajes"])


@router.post("", response_model=MensajeOut, status_code=201)
async def crear_mensaje(body: MensajeCreate, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, body.colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")

    if body.autor_docente_id:
        doc = await db.get(Docente, body.autor_docente_id)
        if not doc or doc.colegio_id != body.colegio_id:
            raise HTTPException(400, "Docente autor inválido")

    if body.curso_id:
        curso = await db.get(Curso, body.curso_id)
        if not curso or curso.colegio_id != body.colegio_id:
            raise HTTPException(400, "Curso inválido para este colegio")

    data = body.model_dump(exclude={"destinatarios"})
    mensaje = Mensaje(**data)
    db.add(mensaje)
    await db.commit()
    await db.refresh(mensaje)

    # Crear destinatarios si se enviaron
    if body.destinatarios:
        for apo_id in body.destinatarios:
            db.add(MensajeDestinatario(mensaje_id=mensaje.id, apoderado_id=apo_id))
        await db.commit()

    return await _enriquecer_mensaje(db, mensaje)


@router.get("", response_model=list[MensajeOut])
async def listar_mensajes(
    colegio_id: UUID | None = Query(None),
    tipo: str | None = Query(None),
    curso_id: UUID | None = Query(None),
    importante: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Mensaje)
    if colegio_id:
        query = query.where(Mensaje.colegio_id == colegio_id)
    if tipo:
        query = query.where(Mensaje.tipo == tipo)
    if curso_id:
        query = query.where(Mensaje.curso_id == curso_id)
    if importante is not None:
        query = query.where(Mensaje.importante.is_(importante))
    query = query.order_by(Mensaje.creado_en.desc())
    rows = (await db.execute(query)).scalars().all()
    return [await _enriquecer_mensaje(db, m) for m in rows]


@router.get("/{mensaje_id}", response_model=MensajeOut)
async def obtener_mensaje(mensaje_id: UUID, db: AsyncSession = Depends(get_db)):
    mensaje = await db.get(Mensaje, mensaje_id)
    if not mensaje:
        raise HTTPException(404, "Mensaje no encontrado")
    return await _enriquecer_mensaje(db, mensaje)


@router.patch("/{mensaje_id}", response_model=MensajeOut)
async def actualizar_mensaje(
    mensaje_id: UUID, body: MensajeUpdate, db: AsyncSession = Depends(get_db),
):
    mensaje = await db.get(Mensaje, mensaje_id)
    if not mensaje:
        raise HTTPException(404, "Mensaje no encontrado")
    cambios = body.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(mensaje, k, v)
    await db.commit()
    await db.refresh(mensaje)
    return await _enriquecer_mensaje(db, mensaje)


@router.delete("/{mensaje_id}", status_code=204)
async def eliminar_mensaje(mensaje_id: UUID, db: AsyncSession = Depends(get_db)):
    mensaje = await db.get(Mensaje, mensaje_id)
    if not mensaje:
        raise HTTPException(404, "Mensaje no encontrado")
    await db.delete(mensaje)
    await db.commit()


@router.post("/{mensaje_id}/leer", response_model=MensajeDestinatarioOut)
async def marcar_leido(
    mensaje_id: UUID,
    apoderado_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    row = await db.scalar(
        select(MensajeDestinatario).where(
            MensajeDestinatario.mensaje_id == mensaje_id,
            MensajeDestinatario.apoderado_id == apoderado_id,
        )
    )
    if not row:
        raise HTTPException(404, "Destinatario no encontrado para este mensaje")
    row.leido_en = datetime.utcnow()
    await db.commit()
    await db.refresh(row)
    return MensajeDestinatarioOut.model_validate(row)


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------

async def _enriquecer_mensaje(db: AsyncSession, mensaje: Mensaje) -> MensajeOut:
    out = MensajeOut.model_validate(mensaje)
    if mensaje.autor_docente_id:
        d = await db.get(Docente, mensaje.autor_docente_id)
        if d:
            out.autor_nombre = f"{d.nombres} {d.apellido_paterno}"

    num_dest = await db.scalar(
        select(func.count())
        .select_from(MensajeDestinatario)
        .where(MensajeDestinatario.mensaje_id == mensaje.id)
    )
    num_leidos = await db.scalar(
        select(func.count())
        .select_from(MensajeDestinatario)
        .where(
            MensajeDestinatario.mensaje_id == mensaje.id,
            MensajeDestinatario.leido_en.is_not(None),
        )
    )
    out.num_destinatarios = int(num_dest or 0)
    out.num_leidos = int(num_leidos or 0)
    return out
