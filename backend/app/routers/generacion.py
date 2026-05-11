import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.item import ItemBanco
from ..schemas.item import GeneracionRequest, GeneracionResponse, ItemOut
from ..services.generacion import generar_items
from ..services.generador_visual import generar_visual
from ..services.generador_creativo import generar_lote_creativo

router = APIRouter(prefix="/generar", tags=["generacion"])

NIVELES_VALIDOS = {"5_6_basico", "8_basico", "2_medio", "4_medio"}
TIPOS_VALIDOS = {
    "razonamiento_verbal", "vocabulario", "razonamiento_numerico",
    "habilidad_numerica", "habitos_estudio", "comprension_lectora",
    "rapidez_lectora", "inteligencia_practica", "intereses",
    "personalidad", "adaptacion_motivacion",
    "estrategias_aprendizaje", "elecciones_profesionales",
    "calculo_aritmetico", "calculo_numerico", "memoria_auditiva",
}

TIPOS_VISUALES = {
    "razonamiento_abstracto", "razonamiento_espacial", "razonamiento_mecanico",
    "aptitud_espacial", "atencion", "memoria_visual", "rapidez_perceptiva",
}


@router.post("", response_model=GeneracionResponse)
async def generar(req: GeneracionRequest, db: AsyncSession = Depends(get_db)):
    if req.nivel not in NIVELES_VALIDOS:
        raise HTTPException(status_code=422, detail=f"nivel inválido: {req.nivel}")
    if req.tipo in TIPOS_VISUALES:
        raise HTTPException(
            status_code=422,
            detail=f"El tipo '{req.tipo}' es visual y se genera desde /generar-visual, no por LLM textual.",
        )
    if req.tipo not in TIPOS_VALIDOS:
        raise HTTPException(status_code=422, detail=f"tipo inválido: {req.tipo}")
    if req.cantidad < 1 or req.cantidad > 20:
        raise HTTPException(status_code=422, detail="cantidad debe estar entre 1 y 20")

    try:
        return await generar_items(db, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("-creativo", response_model=GeneracionResponse)
async def generar_creativo_endpoint(req: GeneracionRequest, db: AsyncSession = Depends(get_db)):
    """Cada ítem es diseñado por Claude (lógica única) + renderizado por matplotlib.
    Mucho más caro en tokens pero produce ítems realmente distintos."""
    if req.cantidad > 5:
        raise HTTPException(status_code=422, detail="Máximo 5 ítems por llamada creativa")

    items_data = await generar_lote_creativo(req.nivel, req.cantidad, req.dificultad_objetivo or 2)
    if not items_data:
        raise HTTPException(status_code=500, detail="Claude no pudo generar ítems")

    sesion_id = uuid.uuid4()
    inserted = []
    for d in items_data:
        opciones = d.pop("opciones")
        d_id = uuid.UUID(d.pop("id"))
        result = await db.execute(
            insert(ItemBanco).values(id=d_id, opciones=opciones, **d).returning(ItemBanco)
        )
        row = result.fetchone()
        inserted.append(row[0])
    await db.commit()

    return GeneracionResponse(
        sesion_id=sesion_id,
        items_generados=[ItemOut.model_validate(i) for i in inserted],
        num_solicitados=req.cantidad,
        num_generados=len(inserted),
    )


@router.post("-visual", response_model=GeneracionResponse)
async def generar_visual_endpoint(req: GeneracionRequest, db: AsyncSession = Depends(get_db)):
    if req.tipo not in TIPOS_VISUALES:
        raise HTTPException(status_code=422, detail=f"Tipo no visual: {req.tipo}")
    GENERADORES_OK = {
        "razonamiento_abstracto", "atencion", "memoria_visual",
        "razonamiento_espacial", "aptitud_espacial",
    }
    if req.tipo not in GENERADORES_OK:
        raise HTTPException(
            status_code=501,
            detail=f"Generador procedimental aún no implementado para '{req.tipo}'. Disponibles: {sorted(GENERADORES_OK)}"
        )

    items_data = generar_visual(req.tipo, req.nivel, req.cantidad,
                                 req.dificultad_objetivo or 2)
    sesion_id = uuid.uuid4()
    inserted = []
    for d in items_data:
        opciones = d.pop("opciones")
        d_id = uuid.UUID(d.pop("id"))
        result = await db.execute(
            insert(ItemBanco).values(
                id=d_id, opciones=opciones, **d
            ).returning(ItemBanco)
        )
        row = result.fetchone()
        inserted.append(row[0])
    await db.commit()

    return GeneracionResponse(
        sesion_id=sesion_id,
        items_generados=[ItemOut.model_validate(i) for i in inserted],
        num_solicitados=req.cantidad,
        num_generados=len(inserted),
    )
