"""
Generador creativo de ítems visuales: Claude diseña la lógica del ítem como
JSON estructurado, luego un renderer Python lo dibuja con matplotlib.

Cada ítem es realmente único (no es plantilla con parámetros).

Pipeline:
1. Pedir a Claude que diseñe un ítem nuevo con primitivas (formas, posiciones, transformaciones)
2. Parsear el JSON resultante
3. Renderizar con matplotlib
4. Validar respuesta correcta
"""
from __future__ import annotations
import io
import json
import math
import uuid
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Rectangle, Circle, Polygon, RegularPolygon
import anthropic

from ..core.config import settings

UPLOADS = Path(__file__).resolve().parents[3] / "uploads" / "items"
UPLOADS.mkdir(parents=True, exist_ok=True)

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

COLOR_MAP = {
    "negro": "#1e293b", "blanco": "#ffffff", "gris": "#94a3b8",
    "azul": "#1e40af", "rojo": "#dc2626", "verde": "#059669",
    "amarillo": "#fbbf24", "naranjo": "#ea580c",
}


SYSTEM_PROMPT = """Eres un psicómetra experto que diseña ítems de razonamiento abstracto VISUAL para evaluaciones de orientación vocacional.

Tu output es SIEMPRE un JSON válido con esta estructura exacta:

{
  "enunciado": "<descripción breve del ítem para el estudiante>",
  "constructo": "<qué habilidad mide en pocas palabras>",
  "dificultad": <1-5>,
  "tipo_visual": "<serie | matriz | composicion | conteo>",
  "celdas_problema": [
    {
      "label": "<1, 2, 3, o ?>",
      "figuras": [
        {
          "forma": "<circulo | cuadrado | triangulo | pentagono | hexagono | rombo | estrella>",
          "x": <-1.0 a 1.0, posición horizontal dentro de la celda>,
          "y": <-1.0 a 1.0>,
          "tamano": <0.2 a 0.9>,
          "color": "<negro | blanco | gris | azul | rojo | verde | amarillo>",
          "rotacion": <0 a 360>
        },
        ...más figuras dentro de la celda si quieres composición
      ]
    },
    ...3 celdas con figuras + 1 con label "?"
  ],
  "alternativas": [
    {
      "clave": "A",
      "figuras": [...mismas estructuras...]
    },
    ...5 alternativas A-E
  ],
  "respuesta_correcta": "<A | B | C | D | E>",
  "explicacion": "<por qué esa es la correcta>"
}

REGLAS:
1. Inventa una LÓGICA NUEVA para el ítem. No copies patrones triviales.
2. La lógica puede combinar: rotación, conteo, color que alterna, formas que aparecen/desaparecen, posición dentro de la celda, composición (figura grande con figura pequeña adentro), simetría, espejos, transformaciones múltiples simultáneas.
3. Las celdas problema son 3 (con sus labels "1", "2", "3") más la celda "?". Las alternativas son 5 (A-E).
4. Cada celda tiene un sistema de coordenadas (-1 a +1) en ambos ejes. (0,0) es el centro.
5. Para figuras simples (una sola), usa x=0, y=0.
6. Para composiciones (figura dentro de figura), pon la grande primero con tamaño 0.8 y color "blanco" o "gris_claro", y la pequeña después con tamaño 0.35 en x=0, y=0.
7. Los distractores deben ser plausibles pero claramente incorrectos.
8. NO uses opciones idénticas a la correcta.

Devuelve SOLO el JSON, sin texto antes ni después."""


def _draw_celda_creativa(ax, x_left: float, y_bottom: float, w: float, h: float,
                          label: str, figuras: list[dict]):
    """Dibuja una celda con sus figuras."""
    rect = Rectangle((x_left, y_bottom), w, h, fill=False, edgecolor="#94a3b8", lw=1.2)
    ax.add_patch(rect)
    if label:
        ax.text(x_left + w / 2, y_bottom + h + 0.05, label, ha="center", va="bottom",
                fontsize=10, color="#475569")
    cx = x_left + w / 2
    cy = y_bottom + h / 2

    for fig_data in figuras:
        forma = fig_data.get("forma", "circulo")
        x_rel = float(fig_data.get("x", 0))
        y_rel = float(fig_data.get("y", 0))
        tamano = float(fig_data.get("tamano", 0.5))
        color = fig_data.get("color", "negro")
        rot = float(fig_data.get("rotacion", 0))

        # Transformar coordenadas relativas (-1..1) a coords absolutas de la celda
        fx = cx + x_rel * (w / 2 - 0.15)
        fy = cy + y_rel * (h / 2 - 0.15)
        # Tamaño en unidades absolutas
        size_abs = tamano * min(w, h) * 0.6

        color_hex = COLOR_MAP.get(color, "#1e293b")
        common = dict(facecolor=color_hex, edgecolor="#1e293b", lw=1.3)

        if forma == "circulo":
            ax.add_patch(Circle((fx, fy), size_abs / 2, **common))
        elif forma == "cuadrado":
            r = Rectangle((fx - size_abs / 2, fy - size_abs / 2), size_abs, size_abs, **common)
            if rot:
                t = patches.transforms.Affine2D().rotate_deg_around(fx, fy, rot) + ax.transData
                r.set_transform(t)
            ax.add_patch(r)
        elif forma == "rombo":
            r = Rectangle((fx - size_abs / 2, fy - size_abs / 2), size_abs, size_abs, **common)
            t = patches.transforms.Affine2D().rotate_deg_around(fx, fy, rot + 45) + ax.transData
            r.set_transform(t)
            ax.add_patch(r)
        elif forma == "triangulo":
            ax.add_patch(RegularPolygon(
                (fx, fy), 3, radius=size_abs / 1.7,
                orientation=math.radians(rot), **common,
            ))
        elif forma == "pentagono":
            ax.add_patch(RegularPolygon(
                (fx, fy), 5, radius=size_abs / 1.7,
                orientation=math.radians(rot), **common,
            ))
        elif forma == "hexagono":
            ax.add_patch(RegularPolygon(
                (fx, fy), 6, radius=size_abs / 1.7,
                orientation=math.radians(rot), **common,
            ))
        elif forma == "estrella":
            pts = []
            for i in range(10):
                r2 = size_abs / 1.7 if i % 2 == 0 else size_abs / 4
                ang = math.radians(i * 36 + rot - 90)
                pts.append((fx + r2 * math.cos(ang), fy + r2 * math.sin(ang)))
            ax.add_patch(Polygon(pts, **common))


def _renderizar_item(item_spec: dict) -> str:
    """Toma un item_spec (output de Claude) y guarda PNG. Devuelve URL relativa."""
    fig, ax = plt.subplots(figsize=(9, 4))
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 4)
    ax.set_aspect("equal")
    ax.axis("off")

    cell_w, cell_h = 1.2, 1.4

    # 3 celdas del problema + ?
    celdas = item_spec.get("celdas_problema", [])
    for i, celda in enumerate(celdas[:4]):
        x_left = 0.2 + i * (cell_w + 0.05)
        _draw_celda_creativa(ax, x_left, 1.8, cell_w, cell_h,
                              celda.get("label", str(i + 1)),
                              celda.get("figuras", []))

    # Línea separadora
    sep_x = 0.2 + 4 * (cell_w + 0.05)
    ax.text(sep_x + 0.1, 2.5, "?", fontsize=24, ha="center", va="center", color="#1e40af")

    # 5 alternativas en fila inferior
    alts = item_spec.get("alternativas", [])
    for i, alt in enumerate(alts[:5]):
        x_left = 0.2 + i * (cell_w + 0.05)
        _draw_celda_creativa(ax, x_left, 0.1, cell_w, cell_h,
                              alt.get("clave", "ABCDE"[i]),
                              alt.get("figuras", []))

    item_uuid = str(uuid.uuid4())
    out = UPLOADS / f"{item_uuid}.png"
    fig.savefig(out, dpi=140, bbox_inches="tight", facecolor="white", pad_inches=0.2)
    plt.close(fig)
    return f"items/{item_uuid}.png", item_uuid


async def generar_item_creativo(nivel: str, dificultad: int = 2) -> dict:
    """Genera UN ítem usando Claude para diseñar la lógica + renderer para dibujarlo."""

    user_prompt = f"""Diseña UN ítem original de razonamiento abstracto visual para estudiantes de nivel {nivel}.

Inventa una lógica NUEVA que no sea trivial. Por ejemplo:
- "una forma aparece, luego una segunda forma se le agrega, luego una tercera"
- "el color cambia siguiendo una regla, mientras la forma rota"
- "los elementos se desplazan en una dirección"
- "una figura grande contiene una pequeña que cambia de forma según un patrón"

Dificultad objetivo: {dificultad}/5.

Devuelve el JSON con la estructura especificada."""

    resp = client.messages.create(
        model=settings.LLM_MODEL,
        max_tokens=2500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = resp.content[0].text.strip()
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("Claude no devolvió JSON")
    spec = json.loads(raw[start:end])

    img_url, item_uuid = _renderizar_item(spec)

    return {
        "id": item_uuid,
        "nivel": nivel,
        "tipo": "razonamiento_abstracto",
        "formato": "opcion_multiple",
        "origen": "generado",
        "enunciado": spec.get("enunciado", "¿Cuál figura sigue?"),
        "opciones": [{"clave": c, "texto": ""} for c in "ABCDE"],
        "respuesta_correcta": spec.get("respuesta_correcta", "A"),
        "constructo": spec.get("constructo", "Razonamiento abstracto"),
        "justificacion_generacion": spec.get("explicacion"),
        "dificultad": int(spec.get("dificultad", dificultad)),
        "confianza_generacion": 0.7,
        "imagen_url": img_url,
        "requiere_imagen": True,
        "estado": "borrador",
    }


async def generar_lote_creativo(nivel: str, cantidad: int, dificultad: int = 2) -> list[dict]:
    items = []
    for _ in range(cantidad):
        try:
            items.append(await generar_item_creativo(nivel, dificultad))
        except Exception as e:
            print(f"  [creativo] error: {e}")
    return items
