import json
import time
import uuid
from typing import Any

import anthropic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert

from ..core.config import settings
from ..models.item import ItemBanco, SesionGeneracion
from ..schemas.item import GeneracionRequest, GeneracionResponse, ItemOut
from .prompts import (
    SYSTEM_PROMPT,
    FORMATO_POR_TIPO,
    build_generation_prompt,
)

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


def _parse_items(raw: str, nivel: str, tipo: str) -> list[dict[str, Any]]:
    """Extrae el JSON array de la respuesta del LLM con tolerancia a texto extra."""
    raw = raw.strip()
    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end == 0:
        raise ValueError("El LLM no devolvió un JSON array válido")
    data = json.loads(raw[start:end])

    formato = FORMATO_POR_TIPO.get(tipo, "opcion_multiple")
    parsed = []
    for item in data:
        parsed.append({
            "nivel": nivel,
            "tipo": tipo,
            "formato": formato,
            "origen": "generado",
            "enunciado": item["enunciado"],
            "opciones": item.get("opciones"),
            "respuesta_correcta": item.get("respuesta_correcta"),
            "constructo": item.get("constructo"),
            "dificultad": item.get("dificultad"),
            "confianza_generacion": item.get("confianza"),
            "justificacion_generacion": item.get("justificacion"),
            "estado": "borrador",
        })
    return parsed


async def generar_items(db: AsyncSession, req: GeneracionRequest) -> GeneracionResponse:
    prompt = build_generation_prompt(
        nivel=req.nivel,
        tipo=req.tipo,
        cantidad=req.cantidad,
        dificultad_objetivo=req.dificultad_objetivo,
        constructo=req.constructo,
        instrucciones_extra=req.instrucciones_extra,
    )

    t0 = time.time()
    response = await client.messages.create(
        model=settings.LLM_MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    duracion_ms = int((time.time() - t0) * 1000)

    raw_text = response.content[0].text
    tokens_usados = response.usage.input_tokens + response.usage.output_tokens

    items_data = _parse_items(raw_text, req.nivel, req.tipo)

    sesion_id = uuid.uuid4()
    await db.execute(
        insert(SesionGeneracion).values(
            id=sesion_id,
            nivel=req.nivel,
            tipo=req.tipo,
            num_solicitados=req.cantidad,
            num_generados=len(items_data),
            num_aprobados=0,
            prompt_usado=prompt,
            modelo_llm=settings.LLM_MODEL,
            tokens_usados=tokens_usados,
            duracion_ms=duracion_ms,
        )
    )

    inserted_items = []
    for item_dict in items_data:
        result = await db.execute(
            insert(ItemBanco).values(**item_dict).returning(ItemBanco)
        )
        row = result.fetchone()
        inserted_items.append(row[0])

    await db.commit()

    return GeneracionResponse(
        sesion_id=sesion_id,
        items_generados=[ItemOut.model_validate(i) for i in inserted_items],
        tokens_usados=tokens_usados,
        duracion_ms=duracion_ms,
        num_solicitados=req.cantidad,
        num_generados=len(items_data),
    )
