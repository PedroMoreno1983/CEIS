from uuid import UUID
import random
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..core.database import get_db
from ..models.item import ItemBanco, InstrumentoGenerado
from ..models.instrumento_item import InstrumentoItem
from ..schemas.instrumento import InstrumentoCreate, InstrumentoOut
from ..schemas.item import ItemOut

router = APIRouter(prefix="/instrumentos", tags=["instrumentos"])

INSTRUCCIONES_POR_TIPO = {
    "razonamiento_verbal": "A continuación encontrarás analogías. Cada una establece una relación entre dos palabras y debes encontrar la palabra que completa la segunda parte. Marca la alternativa correcta.",
    "vocabulario": "En cada ítem aparece una palabra en mayúsculas. Debes elegir la alternativa que mejor refleje su significado.",
    "razonamiento_numerico": "Las siguientes son series numéricas. Debes descubrir el patrón y elegir el número que continúa la serie.",
    "habilidad_numerica": "Resuelve cada operación de izquierda a derecha (sin aplicar prioridad de operaciones). Marca la alternativa correcta.",
    "inteligencia_practica": "Lee con atención cada situación y escoge la alternativa que consideres más adecuada para resolverla.",
    "comprension_lectora": "Lee atentamente cada texto y responde las preguntas a continuación.",
    "rapidez_lectora": "Lee el texto lo más rápido que puedas, comprendiendo lo que lees. Cuando termines, levanta la mano.",
    "habitos_estudio": "Lee cada afirmación y responde Sí o No según corresponda a tu propia experiencia. No hay respuestas correctas o incorrectas.",
    "intereses": "Indica cuánto te gusta cada actividad. No hay respuestas correctas o incorrectas; expresa tu opinión sincera.",
    "personalidad": "Lee cada pregunta y responde con la opción que más se acerque a tu forma de ser. No hay respuestas correctas o incorrectas.",
    "adaptacion_motivacion": "Lee cada afirmación y responde con la opción que mejor refleje tu situación actual. No hay respuestas correctas o incorrectas.",
}

TIEMPO_ESTIMADO_POR_ITEM = {
    "razonamiento_verbal": 30,
    "vocabulario": 20,
    "razonamiento_numerico": 45,
    "habilidad_numerica": 30,
    "inteligencia_practica": 60,
    "comprension_lectora": 90,
    "rapidez_lectora": 120,
    "habitos_estudio": 15,
    "intereses": 12,
    "personalidad": 12,
    "adaptacion_motivacion": 12,
}


class EnsamblarAutoRequest(BaseModel):
    nombre: str
    nivel: str
    tipo: str
    cantidad: int = 10
    solo_aprobados: bool = False
    creado_por: str | None = None


class EnsamblarMixtaRequest(BaseModel):
    nombre: str
    nivel: str
    items_por_tipo: dict[str, int]  # {tipo: cantidad}
    solo_aprobados: bool = False
    aleatorizar: bool = False  # si false, agrupa por subprueba
    creado_por: str | None = None


async def _items_de_instrumento(db: AsyncSession, instrumento_id: UUID) -> list[ItemBanco]:
    q = (
        select(ItemBanco, InstrumentoItem.orden)
        .join(InstrumentoItem, InstrumentoItem.item_id == ItemBanco.id)
        .where(InstrumentoItem.instrumento_id == instrumento_id)
        .order_by(InstrumentoItem.orden)
    )
    rows = (await db.execute(q)).all()
    return [r[0] for r in rows]


@router.get("", response_model=list[InstrumentoOut])
async def listar_instrumentos(
    nivel: str | None = None,
    tipo: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(InstrumentoGenerado)
    if nivel:
        q = q.where(InstrumentoGenerado.nivel == nivel)
    if tipo:
        q = q.where(InstrumentoGenerado.tipo == tipo)
    q = q.order_by(InstrumentoGenerado.creado_en.desc())
    rows = (await db.execute(q)).scalars().all()
    return [InstrumentoOut.model_validate(r) for r in rows]


@router.post("", response_model=InstrumentoOut, status_code=201)
async def crear_instrumento(body: InstrumentoCreate, db: AsyncSession = Depends(get_db)):
    instrumento = InstrumentoGenerado(
        nombre=body.nombre,
        nivel=body.nivel,
        tipo=body.tipo,
        descripcion=body.descripcion,
        instrucciones=body.instrucciones or INSTRUCCIONES_POR_TIPO.get(body.tipo),
        tiempo_minutos=body.tiempo_minutos,
        num_items=len(body.item_ids),
        creado_por=body.creado_por,
    )
    db.add(instrumento)
    await db.flush()

    for orden, item_id in enumerate(body.item_ids, start=1):
        db.add(InstrumentoItem(instrumento_id=instrumento.id, item_id=item_id, orden=orden))

    await db.commit()
    await db.refresh(instrumento)

    items = await _items_de_instrumento(db, instrumento.id)
    out = InstrumentoOut.model_validate(instrumento)
    out.items = [ItemOut.model_validate(i) for i in items]
    return out


@router.post("/auto", response_model=InstrumentoOut, status_code=201)
async def ensamblar_auto(body: EnsamblarAutoRequest, db: AsyncSession = Depends(get_db)):
    """Ensambla automáticamente una prueba escogiendo ítems del banco."""
    q = select(ItemBanco).where(
        ItemBanco.nivel == body.nivel, ItemBanco.tipo == body.tipo
    )
    if body.solo_aprobados:
        q = q.where(ItemBanco.estado == "aprobado")
    candidatos = (await db.execute(q)).scalars().all()

    if len(candidatos) < body.cantidad:
        raise HTTPException(
            status_code=400,
            detail=f"Solo hay {len(candidatos)} ítems disponibles para {body.nivel}/{body.tipo}"
            + (" aprobados" if body.solo_aprobados else "")
            + f"; se solicitaron {body.cantidad}.",
        )

    candidatos = sorted(candidatos, key=lambda i: (i.dificultad or 3))
    seleccionados = []
    paso = max(1, len(candidatos) // body.cantidad)
    for k in range(body.cantidad):
        idx = min(k * paso, len(candidatos) - 1)
        seleccionados.append(candidatos[idx])
    if len(seleccionados) < body.cantidad:
        for it in candidatos:
            if it not in seleccionados and len(seleccionados) < body.cantidad:
                seleccionados.append(it)

    tiempo_min = max(
        5,
        round(body.cantidad * TIEMPO_ESTIMADO_POR_ITEM.get(body.tipo, 30) / 60) + 2,
    )

    instrumento = InstrumentoGenerado(
        nombre=body.nombre,
        nivel=body.nivel,
        tipo=body.tipo,
        instrucciones=INSTRUCCIONES_POR_TIPO.get(body.tipo),
        tiempo_minutos=tiempo_min,
        num_items=len(seleccionados),
        creado_por=body.creado_por,
    )
    db.add(instrumento)
    await db.flush()

    for orden, it in enumerate(seleccionados, start=1):
        db.add(InstrumentoItem(instrumento_id=instrumento.id, item_id=it.id, orden=orden))

    await db.commit()
    await db.refresh(instrumento)

    out = InstrumentoOut.model_validate(instrumento)
    out.items = [ItemOut.model_validate(i) for i in seleccionados]
    return out


@router.post("/mixta", response_model=InstrumentoOut, status_code=201)
async def ensamblar_mixta(body: EnsamblarMixtaRequest, db: AsyncSession = Depends(get_db)):
    """Ensambla una prueba mixta combinando ítems de varios tipos del mismo nivel."""
    if not body.items_por_tipo:
        raise HTTPException(status_code=422, detail="Debes especificar al menos un tipo")

    todos_seleccionados: list[tuple[ItemBanco, str]] = []  # (item, tipo) para mantener orden

    for tipo, cantidad in body.items_por_tipo.items():
        if cantidad <= 0:
            continue
        q = select(ItemBanco).where(ItemBanco.nivel == body.nivel, ItemBanco.tipo == tipo)
        if body.solo_aprobados:
            q = q.where(ItemBanco.estado == "aprobado")
        candidatos = (await db.execute(q)).scalars().all()
        if len(candidatos) < cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Solo hay {len(candidatos)} ítems disponibles para {body.nivel}/{tipo}; se solicitaron {cantidad}.",
            )
        # Selección por dificultad escalonada (de menor a mayor)
        candidatos = sorted(candidatos, key=lambda i: (i.dificultad or 3))
        paso = max(1, len(candidatos) // cantidad)
        sel = []
        for k in range(cantidad):
            idx = min(k * paso, len(candidatos) - 1)
            if candidatos[idx] not in sel:
                sel.append(candidatos[idx])
        # rellenar si faltan
        for c in candidatos:
            if c not in sel and len(sel) < cantidad:
                sel.append(c)
        for s in sel:
            todos_seleccionados.append((s, tipo))

    if body.aleatorizar:
        random.shuffle(todos_seleccionados)
    # si no aleatorizar, ya están agrupados por orden de tipos en items_por_tipo

    total_items = len(todos_seleccionados)
    tiempo_min = sum(
        cant * TIEMPO_ESTIMADO_POR_ITEM.get(t, 30) / 60
        for t, cant in body.items_por_tipo.items()
    )
    tiempo_min = max(5, round(tiempo_min) + 2)

    instrumento = InstrumentoGenerado(
        nombre=body.nombre,
        nivel=body.nivel,
        tipo="evaluacion_integral",
        instrucciones=(
            "Esta evaluación contiene preguntas de distintos tipos: "
            + ", ".join(body.items_por_tipo.keys())
            + ". Lee atentamente la instrucción de cada ítem antes de responder."
        ),
        tiempo_minutos=tiempo_min,
        num_items=total_items,
        creado_por=body.creado_por,
    )
    db.add(instrumento)
    await db.flush()

    for orden, (it, _) in enumerate(todos_seleccionados, start=1):
        db.add(InstrumentoItem(instrumento_id=instrumento.id, item_id=it.id, orden=orden))

    await db.commit()
    await db.refresh(instrumento)

    out = InstrumentoOut.model_validate(instrumento)
    out.items = [ItemOut.model_validate(i) for i, _ in todos_seleccionados]
    return out


@router.get("/{instrumento_id}", response_model=InstrumentoOut)
async def obtener_instrumento(instrumento_id: UUID, db: AsyncSession = Depends(get_db)):
    row = await db.get(InstrumentoGenerado, instrumento_id)
    if not row:
        raise HTTPException(status_code=404, detail="Instrumento no encontrado")
    items = await _items_de_instrumento(db, instrumento_id)
    out = InstrumentoOut.model_validate(row)
    out.items = [ItemOut.model_validate(i) for i in items]
    return out


@router.delete("/{instrumento_id}", status_code=204)
async def eliminar_instrumento(instrumento_id: UUID, db: AsyncSession = Depends(get_db)):
    row = await db.get(InstrumentoGenerado, instrumento_id)
    if not row:
        raise HTTPException(status_code=404, detail="Instrumento no encontrado")
    await db.delete(row)
    await db.commit()
