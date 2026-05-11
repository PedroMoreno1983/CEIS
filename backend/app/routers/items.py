from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, Integer

from ..core.database import get_db
from ..models.item import ItemBanco
from ..schemas.item import ItemOut, ItemUpdate, ItemListResponse

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/inventario")
async def inventario(db: AsyncSession = Depends(get_db)):
    """Cuenta de ítems por nivel, tipo y si tiene imagen. Para que la UI sepa qué hay disponible."""
    from ..models.item import ItemBanco
    q = select(
        ItemBanco.nivel, ItemBanco.tipo,
        func.count().label("total"),
        func.sum(func.cast(ItemBanco.imagen_url.is_not(None), Integer)).label("con_imagen"),
    ).group_by(ItemBanco.nivel, ItemBanco.tipo).order_by(ItemBanco.nivel, ItemBanco.tipo)
    rows = (await db.execute(q)).all()
    return [
        {"nivel": r.nivel, "tipo": r.tipo, "total": r.total, "con_imagen": int(r.con_imagen or 0)}
        for r in rows
    ]


@router.get("", response_model=ItemListResponse)
async def listar_items(
    nivel: str | None = None,
    tipo: str | None = None,
    estado: str | None = None,
    origen: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(ItemBanco)
    if nivel:
        q = q.where(ItemBanco.nivel == nivel)
    if tipo:
        q = q.where(ItemBanco.tipo == tipo)
    if estado:
        q = q.where(ItemBanco.estado == estado)
    if origen:
        q = q.where(ItemBanco.origen == origen)

    total_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(total_q)).scalar()

    q = q.order_by(ItemBanco.creado_en.desc()).offset(skip).limit(limit)
    rows = (await db.execute(q)).scalars().all()

    return ItemListResponse(total=total, items=[ItemOut.model_validate(r) for r in rows])


@router.get("/{item_id}", response_model=ItemOut)
async def obtener_item(item_id: UUID, db: AsyncSession = Depends(get_db)):
    row = await db.get(ItemBanco, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    return ItemOut.model_validate(row)


@router.patch("/{item_id}", response_model=ItemOut)
async def actualizar_item(item_id: UUID, body: ItemUpdate, db: AsyncSession = Depends(get_db)):
    row = await db.get(ItemBanco, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    datos = body.model_dump(exclude_none=True)
    for k, v in datos.items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return ItemOut.model_validate(row)


@router.delete("/{item_id}", status_code=204)
async def eliminar_item(item_id: UUID, db: AsyncSession = Depends(get_db)):
    row = await db.get(ItemBanco, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    await db.delete(row)
    await db.commit()
