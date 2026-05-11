"""
Motor de Computerized Adaptive Testing (CAT) - Modelo Rasch 1PL.

Conceptos:
- θ (theta): habilidad latente del estudiante. En logits.
- b: dificultad del ítem. En logits.
- P(correcto | θ, b) = 1 / (1 + exp(-(θ - b)))
- Información de Fisher I(θ, b) = P(1-P). Máxima cuando b ≈ θ.
- Estimador EAP: media de la posterior θ después de cada respuesta.

Pipeline:
1. θ_0 = 0, varianza prior = 1.
2. Seleccionar el ítem con max I(θ, b) entre los no respondidos.
3. Estudiante responde.
4. Actualizar θ y SE con cuadratura numérica sobre la posterior.
5. Repetir hasta SE < umbral o max_items.
"""
from __future__ import annotations
import math
import uuid
from typing import Iterable
import numpy as np
from sqlalchemy import select, and_, not_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.item import ItemBanco
from ..models.aplicacion import Aplicacion, Respuesta


# Cuadratura: rejilla de puntos θ para integración numérica de la posterior
THETA_GRID = np.linspace(-4.0, 4.0, 81)  # 81 puntos -4..4 cada 0.1
PRIOR = np.exp(-0.5 * THETA_GRID ** 2) / math.sqrt(2 * math.pi)  # N(0, 1)


def proba_correcto(theta: float, b: float, a: float = 1.0) -> float:
    """Modelo Rasch / 2PL."""
    z = a * (theta - b)
    return 1.0 / (1.0 + math.exp(-z))


def informacion_fisher(theta: float, b: float, a: float = 1.0) -> float:
    """I(θ) = a² · P · (1-P). Para Rasch: a=1."""
    p = proba_correcto(theta, b, a)
    return (a ** 2) * p * (1 - p)


def actualizar_eap(
    bs_respondidos: list[float],
    correctas: list[bool],
    a: float = 1.0,
) -> tuple[float, float]:
    """
    Calcula θ EAP y su error estándar usando cuadratura sobre la posterior.
    Devuelve (theta, se).
    """
    posterior = PRIOR.copy()
    for b, correcto in zip(bs_respondidos, correctas):
        p = 1.0 / (1.0 + np.exp(-a * (THETA_GRID - b)))
        likel = p if correcto else (1 - p)
        posterior = posterior * likel

    s = posterior.sum()
    if s <= 0:
        return 0.0, 1.0
    posterior = posterior / s

    theta = float(np.sum(THETA_GRID * posterior))
    var = float(np.sum((THETA_GRID - theta) ** 2 * posterior))
    se = math.sqrt(max(var, 1e-9))
    return theta, se


async def items_calibracion(db: AsyncSession, item_ids: list[uuid.UUID]) -> dict[uuid.UUID, tuple[float, float]]:
    """item_id -> (b, a)."""
    if not item_ids:
        return {}
    from sqlalchemy import text
    # Construir IN clause manualmente con UUIDs como strings (asyncpg + casting)
    ids_str = ",".join(f"'{i}'" for i in item_ids)
    sql = text(f"SELECT item_id, b, a FROM item_calibracion WHERE item_id IN ({ids_str})")
    res = await db.execute(sql)
    out = {}
    for row in res:
        out[row.item_id] = (float(row.b), float(row.a))
    return out


async def seleccionar_siguiente_item(
    db: AsyncSession,
    aplicacion: Aplicacion,
    nivel: str,
    tipo: str,
    items_usados: set[uuid.UUID],
    theta_actual: float,
) -> ItemBanco | None:
    """
    Devuelve el ítem (no usado) del banco con mayor información a θ_actual.
    Solo considera items con respuesta_correcta (autocorregibles).
    """
    q = (
        select(ItemBanco)
        .where(ItemBanco.nivel == nivel)
        .where(ItemBanco.tipo == tipo)
        .where(ItemBanco.respuesta_correcta.is_not(None))
    )
    if items_usados:
        q = q.where(not_(ItemBanco.id.in_(items_usados)))

    candidatos = (await db.execute(q)).scalars().all()
    if not candidatos:
        return None

    # Cargar calibración
    ids = [c.id for c in candidatos]
    calib = await items_calibracion(db, ids)

    mejor = None
    mejor_info = -1.0
    for it in candidatos:
        b, a = calib.get(it.id, (0.0, 1.0))
        info = informacion_fisher(theta_actual, b, a)
        if info > mejor_info:
            mejor_info = info
            mejor = it
    return mejor


async def actualizar_calibracion(
    db: AsyncSession, item_id: uuid.UUID, correcta: bool,
):
    """Actualiza n_respuestas y n_correctas. Re-estima b si tenemos suficientes datos."""
    from sqlalchemy import text
    await db.execute(
        text(
            "UPDATE item_calibracion "
            "SET n_respuestas = n_respuestas + 1, "
            "    n_correctas = n_correctas + :delta, "
            "    actualizado_en = NOW() "
            "WHERE item_id = :id"
        ),
        {"delta": 1 if correcta else 0, "id": item_id},
    )
    # Re-estimar b si hay suficientes respuestas (≥ 30)
    row = await db.execute(
        text("SELECT n_respuestas, n_correctas FROM item_calibracion WHERE item_id = :id"),
        {"id": item_id},
    )
    r = row.fetchone()
    if r and r.n_respuestas >= 30:
        # Estimación clásica (proporción de aciertos → logit invertido)
        p = max(0.05, min(0.95, r.n_correctas / r.n_respuestas))
        # b = -logit(p) en escala logit (asumiendo θ medio = 0)
        b_emp = -math.log(p / (1 - p))
        await db.execute(
            text("UPDATE item_calibracion SET b = :b, fuente = 'empirica' WHERE item_id = :id"),
            {"b": b_emp, "id": item_id},
        )
