import secrets
from collections import defaultdict
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.item import ItemBanco, InstrumentoGenerado
from ..models.instrumento_item import InstrumentoItem
from ..models.aplicacion import Aplicacion, Respuesta
from ..schemas.item import ItemOut
from ..schemas.aplicacion import (
    AplicacionCreate, AplicacionOut, AplicacionParaResponder,
    RespuestaIn, IdentidadEstudiante, ResultadosOut, SiguienteItemResponse,
)
from ..services.cat import (
    actualizar_eap, seleccionar_siguiente_item, items_calibracion,
    actualizar_calibracion,
)
from sqlalchemy import text as sql_text

router = APIRouter(tags=["aplicaciones"])

# Tipos sin respuesta correcta (escalas Likert / Sí-No descriptivas)
TIPOS_SIN_RESPUESTA = {
    "intereses", "personalidad", "adaptacion_motivacion",
    "habitos_estudio", "estrategias_aprendizaje",
}


def generar_codigo() -> str:
    """Código corto fácil de tipear: 6 caracteres alfanuméricos sin ambigüedades."""
    alfa = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alfa) for _ in range(6))


async def _items_de_instrumento(db: AsyncSession, instrumento_id: UUID) -> list[ItemBanco]:
    q = (
        select(ItemBanco)
        .join(InstrumentoItem, InstrumentoItem.item_id == ItemBanco.id)
        .where(InstrumentoItem.instrumento_id == instrumento_id)
        .order_by(InstrumentoItem.orden)
    )
    return list((await db.execute(q)).scalars().all())


# ------------------------------------------------------------
# Vista del docente / aplicador
# ------------------------------------------------------------
@router.post("/aplicaciones", response_model=AplicacionOut, status_code=201)
async def crear_aplicacion(body: AplicacionCreate, db: AsyncSession = Depends(get_db)):
    inst = await db.get(InstrumentoGenerado, body.instrumento_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Instrumento no encontrado")

    # Generar código único
    for _ in range(20):
        codigo = generar_codigo()
        existe = await db.scalar(select(Aplicacion).where(Aplicacion.codigo == codigo))
        if not existe:
            break
    else:
        raise HTTPException(status_code=500, detail="No se pudo generar código único")

    aplicacion = Aplicacion(
        instrumento_id=body.instrumento_id,
        codigo=codigo,
        estudiante_nombre=body.estudiante_nombre,
        estudiante_curso=body.estudiante_curso,
        estudiante_rut=body.estudiante_rut,
        creado_por=body.creado_por,
        es_adaptativa=body.es_adaptativa,
        max_items=body.max_items or 30,
        se_objetivo=body.se_objetivo or 0.30,
    )
    db.add(aplicacion)
    await db.commit()
    await db.refresh(aplicacion)
    return AplicacionOut.model_validate(aplicacion)


@router.get("/aplicaciones", response_model=list[AplicacionOut])
async def listar_aplicaciones(
    instrumento_id: UUID | None = None,
    estado: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Aplicacion)
    if instrumento_id:
        q = q.where(Aplicacion.instrumento_id == instrumento_id)
    if estado:
        q = q.where(Aplicacion.estado == estado)
    q = q.order_by(Aplicacion.creado_en.desc())
    rows = (await db.execute(q)).scalars().all()
    return [AplicacionOut.model_validate(r) for r in rows]


@router.delete("/aplicaciones/{aplicacion_id}", status_code=204)
async def eliminar_aplicacion(aplicacion_id: UUID, db: AsyncSession = Depends(get_db)):
    row = await db.get(Aplicacion, aplicacion_id)
    if not row:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    await db.delete(row)
    await db.commit()


# ------------------------------------------------------------
# Vista del estudiante
# ------------------------------------------------------------
@router.get("/aplicar/{codigo}", response_model=AplicacionParaResponder)
async def cargar_aplicacion(codigo: str, db: AsyncSession = Depends(get_db)):
    codigo = codigo.upper().strip()
    aplicacion = await db.scalar(select(Aplicacion).where(Aplicacion.codigo == codigo))
    if not aplicacion:
        raise HTTPException(status_code=404, detail="Código no válido")

    inst = await db.get(InstrumentoGenerado, aplicacion.instrumento_id)
    items = await _items_de_instrumento(db, aplicacion.instrumento_id)

    # Cargar respuestas previas (autoguardado)
    rs = (await db.execute(
        select(Respuesta).where(Respuesta.aplicacion_id == aplicacion.id)
    )).scalars().all()
    previas = {str(r.item_id): r.respuesta for r in rs if r.respuesta}

    return AplicacionParaResponder(
        codigo=codigo,
        estado=aplicacion.estado,
        instrumento_nombre=inst.nombre,
        instrumento_tipo=inst.tipo,
        instrumento_nivel=inst.nivel,
        instrucciones=inst.instrucciones,
        tiempo_minutos=inst.tiempo_minutos,
        items=[ItemOut.model_validate(i) for i in items],
        estudiante_nombre=aplicacion.estudiante_nombre,
        estudiante_curso=aplicacion.estudiante_curso,
        respuestas_previas=previas,
    )


@router.post("/aplicar/{codigo}/iniciar", response_model=AplicacionOut)
async def iniciar_aplicacion(
    codigo: str, body: IdentidadEstudiante, db: AsyncSession = Depends(get_db),
):
    codigo = codigo.upper().strip()
    aplicacion = await db.scalar(select(Aplicacion).where(Aplicacion.codigo == codigo))
    if not aplicacion:
        raise HTTPException(status_code=404, detail="Código no válido")
    if aplicacion.estado == "finalizada":
        raise HTTPException(status_code=400, detail="Esta aplicación ya fue finalizada")

    aplicacion.estudiante_nombre = body.estudiante_nombre
    aplicacion.estudiante_curso = body.estudiante_curso
    aplicacion.estudiante_rut = body.estudiante_rut
    if aplicacion.estado == "pendiente":
        aplicacion.estado = "en_curso"
        aplicacion.iniciada_en = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(aplicacion)
    return AplicacionOut.model_validate(aplicacion)


@router.post("/aplicar/{codigo}/respuesta")
async def guardar_respuesta(
    codigo: str, body: RespuestaIn, db: AsyncSession = Depends(get_db),
):
    codigo = codigo.upper().strip()
    aplicacion = await db.scalar(select(Aplicacion).where(Aplicacion.codigo == codigo))
    if not aplicacion:
        raise HTTPException(status_code=404, detail="Código no válido")
    if aplicacion.estado == "finalizada":
        raise HTTPException(status_code=400, detail="Aplicación ya finalizada")

    item = await db.get(ItemBanco, body.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")

    correcta = None
    if item.tipo not in TIPOS_SIN_RESPUESTA and item.respuesta_correcta:
        correcta = body.respuesta == item.respuesta_correcta

    existente = await db.scalar(select(Respuesta).where(
        Respuesta.aplicacion_id == aplicacion.id,
        Respuesta.item_id == body.item_id,
    ))
    nueva_respuesta = existente is None
    if existente:
        existente.respuesta = body.respuesta
        existente.tiempo_segundos = body.tiempo_segundos
        existente.correcta = correcta
        respuesta_obj = existente
    else:
        respuesta_obj = Respuesta(
            aplicacion_id=aplicacion.id,
            item_id=body.item_id,
            respuesta=body.respuesta,
            tiempo_segundos=body.tiempo_segundos,
            correcta=correcta,
        )
        db.add(respuesta_obj)

    if aplicacion.estado == "pendiente":
        aplicacion.estado = "en_curso"
        aplicacion.iniciada_en = datetime.now(timezone.utc)

    # Si es CAT, actualizar θ y SE
    if aplicacion.es_adaptativa and correcta is not None:
        respondidas = (await db.execute(
            select(Respuesta).where(Respuesta.aplicacion_id == aplicacion.id)
        )).scalars().all()
        # Incluir la respuesta actual si es nueva
        if nueva_respuesta:
            respondidas = list(respondidas) + [respuesta_obj]
        ids = [r.item_id for r in respondidas]
        calib = await items_calibracion(db, ids)
        bs = [calib.get(r.item_id, (0.0, 1.0))[0] for r in respondidas]
        correctas = [bool(r.correcta) for r in respondidas]
        theta, se = actualizar_eap(bs, correctas)
        aplicacion.theta_actual = theta
        aplicacion.se_actual = se
        respuesta_obj.theta_post = theta
        respuesta_obj.se_post = se

        # Actualizar calibración del ítem
        await actualizar_calibracion(db, item.id, correcta)

    await db.commit()
    return {
        "theta_actual": float(aplicacion.theta_actual or 0),
        "se_actual": float(aplicacion.se_actual or 1),
    }


@router.get("/aplicar/{codigo}/siguiente-item", response_model=SiguienteItemResponse)
async def siguiente_item(codigo: str, db: AsyncSession = Depends(get_db)):
    """CAT: devuelve el próximo ítem más informativo dado el θ actual del estudiante."""
    codigo = codigo.upper().strip()
    aplicacion = await db.scalar(select(Aplicacion).where(Aplicacion.codigo == codigo))
    if not aplicacion:
        raise HTTPException(status_code=404, detail="Código no válido")
    if not aplicacion.es_adaptativa:
        raise HTTPException(status_code=400, detail="Esta aplicación no es adaptativa")

    inst = await db.get(InstrumentoGenerado, aplicacion.instrumento_id)

    respondidas = (await db.execute(
        select(Respuesta).where(Respuesta.aplicacion_id == aplicacion.id)
    )).scalars().all()
    n_resp = len(respondidas)
    items_usados = {r.item_id for r in respondidas}

    theta = float(aplicacion.theta_actual or 0)
    se = float(aplicacion.se_actual or 1)

    # Criterios de parada
    if n_resp >= (aplicacion.max_items or 30):
        return SiguienteItemResponse(
            item=None, theta_actual=theta, se_actual=se,
            n_respondidos=n_resp, motivo_termino="max_items",
        )
    if n_resp >= 5 and se < float(aplicacion.se_objetivo or 0.30):
        return SiguienteItemResponse(
            item=None, theta_actual=theta, se_actual=se,
            n_respondidos=n_resp, motivo_termino="se_alcanzado",
        )

    siguiente = await seleccionar_siguiente_item(
        db, aplicacion, inst.nivel, inst.tipo, items_usados, theta,
    )
    if not siguiente:
        return SiguienteItemResponse(
            item=None, theta_actual=theta, se_actual=se,
            n_respondidos=n_resp, motivo_termino="sin_items",
        )

    return SiguienteItemResponse(
        item=ItemOut.model_validate(siguiente).model_dump(mode="json"),
        theta_actual=theta, se_actual=se, n_respondidos=n_resp,
    )


@router.post("/aplicar/{codigo}/finalizar", response_model=ResultadosOut)
async def finalizar_aplicacion(codigo: str, db: AsyncSession = Depends(get_db)):
    codigo = codigo.upper().strip()
    aplicacion = await db.scalar(select(Aplicacion).where(Aplicacion.codigo == codigo))
    if not aplicacion:
        raise HTTPException(status_code=404, detail="Código no válido")

    if aplicacion.estado != "finalizada":
        aplicacion.estado = "finalizada"
        aplicacion.finalizada_en = datetime.now(timezone.utc)
        if aplicacion.iniciada_en:
            delta = aplicacion.finalizada_en - aplicacion.iniciada_en
            aplicacion.tiempo_total_segundos = int(delta.total_seconds())

    items = await _items_de_instrumento(db, aplicacion.instrumento_id)
    total = len(items)

    rs = (await db.execute(
        select(Respuesta).where(Respuesta.aplicacion_id == aplicacion.id)
    )).scalars().all()
    rmap = {r.item_id: r for r in rs}

    correctas = sum(1 for r in rs if r.correcta is True)
    items_corregibles = [i for i in items if i.tipo not in TIPOS_SIN_RESPUESTA and i.respuesta_correcta]
    n_corregibles = len(items_corregibles)
    pct = round(100 * correctas / n_corregibles, 1) if n_corregibles else None

    aplicacion.puntaje_correctas = correctas if n_corregibles else None
    aplicacion.puntaje_total = n_corregibles or None
    await db.commit()

    inst = await db.get(InstrumentoGenerado, aplicacion.instrumento_id)

    # Agrupar por constructo (cuántas correctas / cuántas elegidas en escalas)
    por_constructo: dict[str, dict] = defaultdict(lambda: {"total": 0, "respondidas": 0, "correctas": 0, "es_likert": False})
    for it in items:
        c = it.constructo or "Sin clasificar"
        por_constructo[c]["total"] += 1
        if it.tipo in TIPOS_SIN_RESPUESTA:
            por_constructo[c]["es_likert"] = True
        r = rmap.get(it.id)
        if r:
            por_constructo[c]["respondidas"] += 1
            if r.correcta is True:
                por_constructo[c]["correctas"] += 1

    pc_list = [
        {"constructo": k, **v} for k, v in sorted(por_constructo.items())
    ]

    detalle = []
    for it in items:
        r = rmap.get(it.id)
        detalle.append({
            "item_id": str(it.id),
            "enunciado": it.enunciado,
            "imagen_url": it.imagen_url,
            "tipo": it.tipo,
            "constructo": it.constructo,
            "respuesta": r.respuesta if r else None,
            "respuesta_correcta": it.respuesta_correcta if it.tipo not in TIPOS_SIN_RESPUESTA else None,
            "correcta": r.correcta if r else None,
            "tiempo_segundos": r.tiempo_segundos if r else None,
        })

    return ResultadosOut(
        aplicacion_id=aplicacion.id,
        instrumento_nombre=inst.nombre,
        instrumento_tipo=inst.tipo,
        estudiante={
            "nombre": aplicacion.estudiante_nombre,
            "curso": aplicacion.estudiante_curso,
            "rut": aplicacion.estudiante_rut,
        },
        total_items=total,
        items_respondidos=len(rs),
        correctas=correctas if n_corregibles else None,
        porcentaje=pct,
        tiempo_total_segundos=aplicacion.tiempo_total_segundos,
        por_constructo=pc_list,
        detalle=detalle,
    )


@router.get("/aplicaciones/{aplicacion_id}/resultados", response_model=ResultadosOut)
async def resultados_por_id(aplicacion_id: UUID, db: AsyncSession = Depends(get_db)):
    aplicacion = await db.get(Aplicacion, aplicacion_id)
    if not aplicacion:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    return await finalizar_aplicacion(aplicacion.codigo, db)
