"""CRUD de docentes (personal del colegio)."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.gestion import Colegio, Docente
from ..schemas.gestion import DocenteCreate, DocenteOut, DocenteUpdate

router = APIRouter(prefix="/docentes", tags=["gestion: docentes"])


@router.post("", response_model=DocenteOut, status_code=201)
async def crear_docente(body: DocenteCreate, db: AsyncSession = Depends(get_db)):
    colegio = await db.get(Colegio, body.colegio_id)
    if not colegio:
        raise HTTPException(404, "Colegio no encontrado")

    data = body.model_dump()
    docente = Docente(**data)
    db.add(docente)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        msg = str(e).lower()
        if "docente_colegio_rut_uk" in msg:
            raise HTTPException(409, "Ya existe un docente con ese RUT en este colegio")
        if "docente_colegio_email_uk" in msg:
            raise HTTPException(409, "Ya existe un docente con ese email en este colegio")
        raise
    await db.refresh(docente)
    return DocenteOut.model_validate(docente)


@router.get("", response_model=list[DocenteOut])
async def listar_docentes(
    colegio_id: UUID | None = Query(None),
    estado: str | None = Query(None),
    rol: str | None = Query(None, description="Filtra docentes que tengan ese rol"),
    q: str | None = Query(None, description="Buscar por nombre o apellido"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Docente)
    if colegio_id:
        query = query.where(Docente.colegio_id == colegio_id)
    if estado:
        query = query.where(Docente.estado == estado)
    if rol:
        query = query.where(Docente.roles.any(rol))
    if q:
        like = f"%{q}%"
        query = query.where(
            (Docente.nombres.ilike(like))
            | (Docente.apellido_paterno.ilike(like))
            | (Docente.apellido_materno.ilike(like))
        )
    query = query.order_by(Docente.apellido_paterno, Docente.nombres)
    rows = (await db.execute(query)).scalars().all()
    return [DocenteOut.model_validate(d) for d in rows]


@router.get("/{docente_id}", response_model=DocenteOut)
async def obtener_docente(docente_id: UUID, db: AsyncSession = Depends(get_db)):
    docente = await db.get(Docente, docente_id)
    if not docente:
        raise HTTPException(404, "Docente no encontrado")
    return DocenteOut.model_validate(docente)


@router.patch("/{docente_id}", response_model=DocenteOut)
async def actualizar_docente(
    docente_id: UUID, body: DocenteUpdate, db: AsyncSession = Depends(get_db),
):
    docente = await db.get(Docente, docente_id)
    if not docente:
        raise HTTPException(404, "Docente no encontrado")

    cambios = body.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(docente, k, v)
    await db.commit()
    await db.refresh(docente)
    return DocenteOut.model_validate(docente)


@router.delete("/{docente_id}", status_code=204)
async def eliminar_docente(docente_id: UUID, db: AsyncSession = Depends(get_db)):
    docente = await db.get(Docente, docente_id)
    if not docente:
        raise HTTPException(404, "Docente no encontrado")
    await db.delete(docente)
    await db.commit()
