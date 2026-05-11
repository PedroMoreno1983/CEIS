"""
Generador procedimental de ítems visuales con figuras geométricas.

Cada generador devuelve un dict con:
- enunciado, opciones (A-E), respuesta_correcta, constructo, dificultad
- imagen_url: PNG del enunciado (serie/figuras)
- imagen_opciones_url: PNG con las 5 opciones inline (si aplica)

Los items se guardan en uploads/items/<uuid>.png.
"""
from __future__ import annotations
import io
import math
import random
import uuid
from pathlib import Path
from typing import Any, Callable

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Polygon, Circle, Rectangle, RegularPolygon, FancyArrowPatch
import numpy as np

UPLOADS = Path(__file__).resolve().parents[3] / "uploads" / "items"
UPLOADS.mkdir(parents=True, exist_ok=True)


# ============================================================
# Helpers
# ============================================================
COLORS = {
    "negro": "#1e293b",
    "blanco": "#ffffff",
    "gris": "#94a3b8",
    "gris_claro": "#cbd5e1",
}

FORMAS = ["circulo", "cuadrado", "triangulo", "pentagono", "hexagono", "rombo", "estrella"]


def _figura(ax, kind: str, x: float, y: float, size: float, fill: str = "negro",
            rot: float = 0.0, hatch: str | None = None):
    color = COLORS.get(fill, fill if fill.startswith("#") else "#1e293b")
    edge = "#1e293b"
    common = dict(facecolor=color, edgecolor=edge, lw=1.4)
    if hatch:
        common["hatch"] = hatch
        common["facecolor"] = "white"

    if kind == "circulo":
        ax.add_patch(Circle((x, y), size / 2, **common))
    elif kind == "cuadrado":
        rect = Rectangle((x - size / 2, y - size / 2), size, size, **common)
        if rot:
            t = patches.transforms.Affine2D().rotate_deg_around(x, y, rot) + ax.transData
            rect.set_transform(t)
        ax.add_patch(rect)
    elif kind == "rombo":
        rect = Rectangle((x - size / 2, y - size / 2), size, size, **common)
        t = patches.transforms.Affine2D().rotate_deg_around(x, y, rot + 45) + ax.transData
        rect.set_transform(t)
        ax.add_patch(rect)
    elif kind == "triangulo":
        poly = RegularPolygon((x, y), 3, radius=size / 1.7,
                              orientation=math.radians(rot), **common)
        ax.add_patch(poly)
    elif kind == "pentagono":
        poly = RegularPolygon((x, y), 5, radius=size / 1.7,
                              orientation=math.radians(rot), **common)
        ax.add_patch(poly)
    elif kind == "hexagono":
        poly = RegularPolygon((x, y), 6, radius=size / 1.7,
                              orientation=math.radians(rot), **common)
        ax.add_patch(poly)
    elif kind == "estrella":
        # 5 puntas
        pts = []
        for i in range(10):
            r = size / 1.7 if i % 2 == 0 else size / 4
            ang = math.radians(i * 36 + rot - 90)
            pts.append((x + r * math.cos(ang), y + r * math.sin(ang)))
        ax.add_patch(Polygon(pts, **common))


def _flecha(ax, x: float, y: float, length: float = 0.4):
    arrow = FancyArrowPatch((x - length / 2, y), (x + length / 2, y),
                             arrowstyle="->,head_width=4,head_length=6",
                             color="#475569", lw=1.5, mutation_scale=8)
    ax.add_patch(arrow)


def _canvas_serie(n_problema: int, n_opciones: int = 5,
                  altura: float = 1.6, ancho_celda: float = 1.4):
    """Canvas con N celdas problema → ? + N celdas opciones A-E."""
    total_w = n_problema * ancho_celda + 0.5 + n_opciones * ancho_celda
    fig, ax = plt.subplots(figsize=(total_w * 0.9, altura * 1.5 * 0.9))
    ax.set_xlim(0, total_w + 0.4)
    ax.set_ylim(0, altura + 0.5)
    ax.set_aspect("equal")
    ax.axis("off")
    return fig, ax, ancho_celda, altura


def _draw_celda(ax, x_left: float, y: float, w: float, h: float,
                titulo: str | None = None):
    rect = Rectangle((x_left, y), w, h, fill=False, edgecolor="#94a3b8", lw=1.0)
    ax.add_patch(rect)
    if titulo:
        ax.text(x_left + w / 2, y + h + 0.12, titulo, ha="center", va="bottom",
                fontsize=9, color="#475569")


def _guardar(fig) -> str:
    item_uuid = str(uuid.uuid4())
    out = UPLOADS / f"{item_uuid}.png"
    fig.savefig(out, dpi=140, bbox_inches="tight", facecolor="white", pad_inches=0.2)
    plt.close(fig)
    return f"items/{item_uuid}.png"


# ============================================================
# Razonamiento abstracto: 8 patrones distintos
# ============================================================
def _ra_color_alterna() -> dict:
    forma = random.choice(FORMAS)
    secuencia = ["negro", "blanco", "negro", "blanco"]
    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        _figura(ax, forma, i * w + w / 2, 0.2 + h / 2, 0.6, fill=secuencia[i])
    # Separador y opciones
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")
    correcta = "negro"
    distractores = ["blanco"] + [random.choice(FORMAS) for _ in range(2)]  # forma rara
    opts_color = ["negro", "blanco", "negro", "blanco", "negro"]
    random.shuffle(opts_color)
    correcta_idx = opts_color.index(correcta)
    for i, c in enumerate(opts_color):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        _figura(ax, forma, x + w / 2, 0.2 + h / 2, 0.6, fill=c)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[correcta_idx],
        "constructo": "Patrón alternante (color)",
        "enunciado": "Observa la serie. ¿Qué figura sigue?",
    }


def _ra_rotacion() -> dict:
    forma = random.choice(["triangulo", "cuadrado", "estrella"])
    paso = random.choice([45, 60, 90, 120])
    rot0 = random.choice([0, 30, 90])
    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        _figura(ax, forma, i * w + w / 2, 0.2 + h / 2, 0.65, rot=rot0 + paso * i)
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")
    correcta_rot = rot0 + paso * 3
    rots = [correcta_rot, correcta_rot + paso, correcta_rot - paso, correcta_rot + 180, rot0]
    random.shuffle(rots)
    idx = rots.index(correcta_rot)
    for i, r in enumerate(rots):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        _figura(ax, forma, x + w / 2, 0.2 + h / 2, 0.65, rot=r)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Rotación constante",
        "enunciado": "La figura rota un ángulo fijo en cada paso. ¿Cuál sigue?",
    }


def _ra_progresion_lados() -> dict:
    formas = ["triangulo", "cuadrado", "pentagono", "hexagono"]
    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        _figura(ax, formas[i], i * w + w / 2, 0.2 + h / 2, 0.7)
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")
    correcta = "hexagono"
    candidatos = ["circulo", "estrella", "rombo", "triangulo"]
    opts = [correcta] + random.sample(candidatos, 4)
    random.shuffle(opts)
    idx = opts.index(correcta)
    for i, f in enumerate(opts):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        _figura(ax, f, x + w / 2, 0.2 + h / 2, 0.7)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Progresión en número de lados",
        "enunciado": "Observa cómo cambia el número de lados. ¿Cuál figura continúa?",
    }


def _ra_cantidad_creciente() -> dict:
    forma = random.choice(["circulo", "cuadrado", "triangulo"])
    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        n = i + 1
        for k in range(n):
            cx = i * w + (w / (n + 1)) * (k + 1)
            _figura(ax, forma, cx, 0.2 + h / 2, 0.35)
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")
    correcta_n = 4
    candidatos_n = [4, 3, 5, 2, 6]
    random.shuffle(candidatos_n)
    idx = candidatos_n.index(correcta_n)
    for i, n in enumerate(candidatos_n):
        x_celda = 3 * w + 0.5 + i * w
        _draw_celda(ax, x_celda, 0.2, w, h, "ABCDE"[i])
        for k in range(n):
            cx = x_celda + (w / (n + 1)) * (k + 1)
            _figura(ax, forma, cx, 0.2 + h / 2, 0.3)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Progresión en cantidad",
        "enunciado": "El número de figuras crece. ¿Qué sigue?",
    }


def _ra_dos_intercaladas() -> dict:
    """Dos series intercaladas: forma A en posiciones impares, B en pares."""
    formas = random.sample(FORMAS, 2)
    fig, ax, w, h = _canvas_serie(4)
    for i in range(4):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        f = formas[0] if i % 2 == 0 else formas[1]
        _figura(ax, f, i * w + w / 2, 0.2 + h / 2, 0.6)
    ax.text(4 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")
    correcta = formas[0]  # posición 5 = impar
    opts = [correcta, formas[1]] + random.sample([f for f in FORMAS if f not in formas], 3)
    random.shuffle(opts)
    idx = opts.index(correcta)
    for i, f in enumerate(opts):
        x = 4 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        _figura(ax, f, x + w / 2, 0.2 + h / 2, 0.6)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Series intercaladas",
        "enunciado": "Hay dos secuencias intercaladas. ¿Qué figura sigue?",
    }


def _ra_tamano_creciente() -> dict:
    forma = random.choice(FORMAS)
    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        _figura(ax, forma, i * w + w / 2, 0.2 + h / 2, 0.3 + 0.2 * i)
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")
    correcta = 0.9
    opts = [correcta, 0.5, 0.7, 1.1, 0.3]
    random.shuffle(opts)
    idx = opts.index(correcta)
    for i, t in enumerate(opts):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        _figura(ax, forma, x + w / 2, 0.2 + h / 2, t)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Progresión en tamaño",
        "enunciado": "El tamaño crece de forma constante. ¿Cuál sigue?",
    }


def _ra_combinacion_color_forma() -> dict:
    """Forma cambia y color alterna."""
    formas = ["circulo", "cuadrado", "triangulo", "pentagono"]
    colores = ["negro", "blanco", "negro", "blanco"]
    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        _figura(ax, formas[i], i * w + w / 2, 0.2 + h / 2, 0.65, fill=colores[i])
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")
    correcta_f, correcta_c = formas[3], colores[3]
    opciones = [(correcta_f, correcta_c)]
    while len(opciones) < 5:
        opciones.append((random.choice(formas), random.choice(["negro", "blanco"])))
    random.shuffle(opciones)
    idx = opciones.index((correcta_f, correcta_c))
    for i, (f, c) in enumerate(opciones):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        _figura(ax, f, x + w / 2, 0.2 + h / 2, 0.65, fill=c)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Combinación forma + color",
        "enunciado": "Observa cómo cambian forma y color. ¿Qué sigue?",
    }


def _ra_reflejo() -> dict:
    """Triángulo apuntando arriba/abajo alternando."""
    formas = ["triangulo"]
    rotaciones = [0, 180, 0, 180]
    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        _figura(ax, formas[0], i * w + w / 2, 0.2 + h / 2, 0.65, rot=rotaciones[i])
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")
    correcta_rot = 180
    rots = [0, 90, 180, 45, 270]
    random.shuffle(rots)
    idx = rots.index(correcta_rot)
    for i, r in enumerate(rots):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        _figura(ax, formas[0], x + w / 2, 0.2 + h / 2, 0.65, rot=r)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Reflejo / inversión vertical",
        "enunciado": "La figura se invierte. ¿Cuál sigue?",
    }


def _ra_matriz_3x3() -> dict:
    """Matriz 3×3 estilo Raven: 8 celdas con figuras siguiendo un patrón, 9ª en blanco."""
    formas = random.sample(FORMAS, 3)
    colores = random.sample(["negro", "blanco", "gris"], 3)
    # Regla: en cada fila, hay una forma+color de cada (Latin square)
    # Configurar matriz: filas → forma rota, columnas → color rota
    matriz = []
    for r in range(3):
        fila = []
        for c in range(3):
            fila.append((formas[(r + c) % 3], colores[c]))
        matriz.append(fila)

    correcta = matriz[2][2]

    fig, ax = plt.subplots(figsize=(7, 4))
    ax.set_xlim(0, 7)
    ax.set_ylim(0, 4)
    ax.set_aspect("equal")
    ax.axis("off")

    # Dibujar la matriz 3×3 a la izquierda (4 unidades de ancho)
    s = 1.0  # tamaño celda
    for r in range(3):
        for c in range(3):
            x = 0.3 + c * s
            y = 3 - r * s
            rect = Rectangle((x, y - s), s * 0.9, s * 0.9, fill=False,
                              edgecolor="#94a3b8", lw=1.2)
            ax.add_patch(rect)
            if r == 2 and c == 2:
                ax.text(x + s * 0.45, y - s * 0.45, "?", fontsize=28,
                        ha="center", va="center", color="#1e40af")
            else:
                forma, color = matriz[r][c]
                _figura(ax, forma, x + s * 0.45, y - s * 0.45, 0.55, fill=color)

    # 5 opciones a la derecha
    ax.text(5.5, 3.8, "ALTERNATIVAS", ha="center", fontsize=9, color="#475569",
            fontweight="bold")
    opciones = [correcta]
    candidatos = [(f, c) for f in FORMAS for c in ["negro", "blanco", "gris"]]
    candidatos = [x for x in candidatos if x != correcta]
    opciones.extend(random.sample(candidatos, 4))
    random.shuffle(opciones)
    idx = opciones.index(correcta)
    for i, (f, c) in enumerate(opciones):
        x = 4.2 + (i % 3) * 0.9 if i < 3 else 4.65 + (i - 3) * 0.9
        y = 2.8 if i < 3 else 1.6
        rect = Rectangle((x - 0.35, y - 0.35), 0.7, 0.7, fill=False,
                          edgecolor="#94a3b8", lw=1.0)
        ax.add_patch(rect)
        ax.text(x, y + 0.5, "ABCDE"[i], ha="center", fontsize=9,
                color="#1e40af", fontweight="bold")
        _figura(ax, f, x, y, 0.4, fill=c)

    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Matriz 3×3 con doble regla (forma + color)",
        "enunciado": "Observa la matriz. ¿Qué figura completa el espacio vacío?",
    }


def _ra_figura_compuesta() -> dict:
    """Una figura grande con una más pequeña adentro. La interior cambia según patrón."""
    grande = random.choice(["cuadrado", "circulo", "hexagono"])
    interiores = ["triangulo", "circulo", "cuadrado", "pentagono"]
    secuencia = random.sample(interiores, 3)

    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        cx = i * w + w / 2
        cy = 0.2 + h / 2
        _figura(ax, grande, cx, cy, 1.0, fill="blanco")
        _figura(ax, secuencia[i], cx, cy, 0.45, fill="negro")
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")

    # Continuación: una forma nueva no usada
    correcta = [f for f in interiores if f not in secuencia][0]
    opciones = [correcta] + random.sample([f for f in interiores + ["rombo", "estrella"] if f != correcta], 4)
    random.shuffle(opciones)
    idx = opciones.index(correcta)
    for i, f in enumerate(opciones):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        cx = x + w / 2
        cy = 0.2 + h / 2
        _figura(ax, grande, cx, cy, 1.0, fill="blanco")
        _figura(ax, f, cx, cy, 0.45, fill="negro")
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Figura compuesta (contenedor + contenido)",
        "enunciado": "El contenido de la figura cambia. ¿Qué viene?",
    }


def _ra_lineas_direccion() -> dict:
    """Líneas con flechas que rotan o cambian de dirección."""
    direcciones = ["arriba", "derecha", "abajo", "izquierda"]
    rotaciones = {"arriba": 90, "derecha": 0, "abajo": -90, "izquierda": 180}
    inicio = random.choice(direcciones)
    paso = random.choice([1, 2, 3])  # cuántas posiciones gira

    secuencia = []
    for i in range(3):
        idx_dir = (direcciones.index(inicio) + i * paso) % 4
        secuencia.append(direcciones[idx_dir])

    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        cx = i * w + w / 2
        cy = 0.2 + h / 2
        rot = rotaciones[secuencia[i]]
        arrow = FancyArrowPatch(
            (cx - 0.3 * math.cos(math.radians(rot)), cy - 0.3 * math.sin(math.radians(rot))),
            (cx + 0.3 * math.cos(math.radians(rot)), cy + 0.3 * math.sin(math.radians(rot))),
            arrowstyle="-|>", color="#1e293b", lw=2, mutation_scale=18,
        )
        ax.add_patch(arrow)

    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")

    idx_correcta = (direcciones.index(inicio) + 3 * paso) % 4
    correcta = direcciones[idx_correcta]
    opciones = list(direcciones) + [random.choice(direcciones)]
    random.shuffle(opciones)
    idx = opciones.index(correcta)
    for i, d in enumerate(opciones):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        cx = x + w / 2
        cy = 0.2 + h / 2
        rot = rotaciones[d]
        arrow = FancyArrowPatch(
            (cx - 0.3 * math.cos(math.radians(rot)), cy - 0.3 * math.sin(math.radians(rot))),
            (cx + 0.3 * math.cos(math.radians(rot)), cy + 0.3 * math.sin(math.radians(rot))),
            arrowstyle="-|>", color="#1e293b", lw=2, mutation_scale=15,
        )
        ax.add_patch(arrow)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Rotación direccional",
        "enunciado": "La flecha gira en cada paso. ¿Hacia dónde apunta la siguiente?",
    }


def _ra_multiatributo() -> dict:
    """Tres atributos cambian simultáneamente: forma, color, tamaño."""
    formas = random.sample(FORMAS, 4)
    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        _figura(
            ax, formas[i], i * w + w / 2, 0.2 + h / 2,
            0.4 + 0.2 * i,
            fill="negro" if i % 2 == 0 else "blanco",
        )
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")

    # Patrón: forma 4, tamaño 1.0, color "negro" (porque i=3 es impar→blanco; corrijo)
    correcto_color = "negro" if 3 % 2 == 0 else "blanco"
    correcta = (formas[3], 1.0, correcto_color)
    opciones = [correcta]
    while len(opciones) < 5:
        cand = (random.choice(FORMAS), random.choice([0.4, 0.6, 1.0]),
                random.choice(["negro", "blanco"]))
        if cand not in opciones:
            opciones.append(cand)
    random.shuffle(opciones)
    idx = opciones.index(correcta)
    for i, (f, sz, c) in enumerate(opciones):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        _figura(ax, f, x + w / 2, 0.2 + h / 2, sz, fill=c)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Variación simultánea de forma, color y tamaño",
        "enunciado": "Cambian forma, color y tamaño a la vez. ¿Cuál sigue?",
    }


def _ra_conteo() -> dict:
    """Cantidad de elementos cambia siguiendo un patrón aritmético."""
    forma = random.choice(["circulo", "cuadrado", "triangulo"])
    delta = random.choice([1, 2])
    inicial = random.choice([1, 2])
    secuencia = [inicial + i * delta for i in range(3)]

    fig, ax, w, h = _canvas_serie(3)
    for i, n in enumerate(secuencia):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        for k in range(n):
            cols = min(n, 4)
            cx = i * w + (w / (cols + 1)) * ((k % cols) + 1)
            row_y = 0.2 + h / 2 - 0.3 + 0.5 * (k // cols)
            _figura(ax, forma, cx, row_y, 0.25)
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")

    correcta_n = inicial + 3 * delta
    candidatos = [correcta_n, correcta_n + 1, correcta_n - 1, correcta_n + 2, max(1, correcta_n - 2)]
    candidatos = list(dict.fromkeys(candidatos))[:5]
    while len(candidatos) < 5:
        candidatos.append(random.randint(1, 10))
    random.shuffle(candidatos)
    idx = candidatos.index(correcta_n)
    for i, n in enumerate(candidatos):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        for k in range(n):
            cols = min(n, 4)
            cx = x + (w / (cols + 1)) * ((k % cols) + 1)
            row_y = 0.2 + h / 2 - 0.3 + 0.5 * (k // cols)
            _figura(ax, forma, cx, row_y, 0.22)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[idx],
        "constructo": "Progresión aritmética en cantidad",
        "enunciado": f"La cantidad aumenta de {delta} en {delta}. ¿Cuántas figuras hay después?",
    }


def _ra_simetria() -> dict:
    """Una figura aparece con su imagen reflejada en algunos pasos."""
    forma = random.choice(["triangulo", "pentagono", "estrella"])
    rotaciones = [0, 45, 0, 45]  # alternancia

    fig, ax, w, h = _canvas_serie(3)
    for i in range(3):
        _draw_celda(ax, i * w, 0.2, w, h, str(i + 1))
        cx = i * w + w / 2
        cy = 0.2 + h / 2
        if i % 2 == 0:
            _figura(ax, forma, cx - 0.2, cy, 0.5, fill="negro")
        else:
            _figura(ax, forma, cx - 0.2, cy, 0.5, fill="negro")
            _figura(ax, forma, cx + 0.2, cy, 0.5, fill="blanco")
    ax.text(3 * w + 0.25, 0.2 + h / 2, "?", fontsize=24, ha="center", va="center", color="#1e40af")

    correcta_idx = 0  # idx 3 par → solo izquierda
    n_opciones = 5
    for i in range(n_opciones):
        x = 3 * w + 0.5 + i * w
        _draw_celda(ax, x, 0.2, w, h, "ABCDE"[i])
        cx = x + w / 2
        cy = 0.2 + h / 2
        if i == correcta_idx:
            _figura(ax, forma, cx - 0.2, cy, 0.5, fill="negro")
        elif i == 1:
            _figura(ax, forma, cx, cy, 0.5, fill="negro")
        elif i == 2:
            _figura(ax, forma, cx - 0.2, cy, 0.5, fill="negro")
            _figura(ax, forma, cx + 0.2, cy, 0.5, fill="blanco")
        elif i == 3:
            _figura(ax, forma, cx - 0.2, cy, 0.5, fill="blanco")
        else:
            _figura(ax, forma, cx, cy, 0.5, fill="blanco")
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[correcta_idx],
        "constructo": "Reflejo / simetría espejo",
        "enunciado": "El reflejo aparece y desaparece alternadamente. ¿Cómo sigue?",
    }


GENERADORES_ABSTRACTO: list[Callable[[], dict]] = [
    _ra_color_alterna,
    _ra_rotacion,
    _ra_progresion_lados,
    _ra_cantidad_creciente,
    _ra_dos_intercaladas,
    _ra_tamano_creciente,
    _ra_combinacion_color_forma,
    _ra_reflejo,
    _ra_matriz_3x3,
    _ra_figura_compuesta,
    _ra_lineas_direccion,
    _ra_multiatributo,
    _ra_conteo,
    _ra_simetria,
]


# ============================================================
# Atención: encontrar el distinto / encontrar el igual
# ============================================================
def _at_encontrar_distinto() -> dict:
    forma = random.choice(FORMAS)
    distinto_idx = random.randint(0, 4)
    distintivo = random.choice(["color", "rotacion", "tamano", "forma"])

    fig, ax = plt.subplots(figsize=(6, 1.7))
    ax.set_xlim(0, 5)
    ax.set_ylim(0, 1.7)
    ax.set_aspect("equal")
    ax.axis("off")
    rot_base = random.choice([0, 30])
    forma_alt = random.choice([f for f in FORMAS if f != forma])

    for i in range(5):
        rect = Rectangle((i + 0.05, 0.15), 0.9, 1.3, fill=False, edgecolor="#94a3b8", lw=1.0)
        ax.add_patch(rect)
        ax.text(i + 0.5, 1.55, "ABCDE"[i], ha="center", va="center",
                fontsize=10, color="#1e40af", fontweight="bold")
        if i == distinto_idx and distintivo == "color":
            _figura(ax, forma, i + 0.5, 0.8, 0.6, fill="blanco", rot=rot_base)
        elif i == distinto_idx and distintivo == "rotacion":
            _figura(ax, forma, i + 0.5, 0.8, 0.6, fill="negro", rot=rot_base + 45)
        elif i == distinto_idx and distintivo == "tamano":
            _figura(ax, forma, i + 0.5, 0.8, 0.45, fill="negro", rot=rot_base)
        elif i == distinto_idx and distintivo == "forma":
            _figura(ax, forma_alt, i + 0.5, 0.8, 0.6, fill="negro", rot=rot_base)
        else:
            _figura(ax, forma, i + 0.5, 0.8, 0.6, fill="negro", rot=rot_base)

    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[distinto_idx],
        "constructo": "Discriminación visual fina",
        "enunciado": "¿Cuál de las figuras es distinta a las demás?",
    }


def _at_buscar_igual() -> dict:
    """Modelo arriba, encontrar idéntica entre 5 alternativas."""
    forma = random.choice(FORMAS)
    rot = random.choice([0, 30, 60, 90])
    fill = random.choice(["negro", "blanco"])
    correcta_idx = random.randint(0, 4)

    fig, ax = plt.subplots(figsize=(6, 2.6))
    ax.set_xlim(0, 5)
    ax.set_ylim(0, 2.5)
    ax.set_aspect("equal")
    ax.axis("off")

    # Modelo arriba (centrado)
    ax.text(2.5, 2.35, "MODELO", ha="center", fontsize=8, color="#475569",
            fontweight="bold")
    rect = Rectangle((2, 1.55), 1, 0.7, fill=False, edgecolor="#1e40af", lw=2)
    ax.add_patch(rect)
    _figura(ax, forma, 2.5, 1.9, 0.45, fill=fill, rot=rot)

    # Línea separadora
    ax.plot([0, 5], [1.4, 1.4], color="#cbd5e1", lw=0.5)
    ax.text(2.5, 1.25, "ALTERNATIVAS", ha="center", fontsize=8, color="#475569")

    for i in range(5):
        rect = Rectangle((i + 0.05, 0.1), 0.9, 1.0, fill=False,
                          edgecolor="#94a3b8", lw=1.0)
        ax.add_patch(rect)
        ax.text(i + 0.5, 1.18, "ABCDE"[i], ha="center", fontsize=10,
                color="#1e40af", fontweight="bold")
        if i == correcta_idx:
            _figura(ax, forma, i + 0.5, 0.6, 0.45, fill=fill, rot=rot)
        else:
            # Alternativa con alguna diferencia
            cambio = random.choice(["color", "rot", "forma", "tamano"])
            if cambio == "color":
                _figura(ax, forma, i + 0.5, 0.6, 0.45, fill="blanco" if fill == "negro" else "negro", rot=rot)
            elif cambio == "rot":
                _figura(ax, forma, i + 0.5, 0.6, 0.45, fill=fill, rot=rot + 45)
            elif cambio == "forma":
                _figura(ax, random.choice([f for f in FORMAS if f != forma]),
                        i + 0.5, 0.6, 0.45, fill=fill, rot=rot)
            else:
                _figura(ax, forma, i + 0.5, 0.6, 0.32, fill=fill, rot=rot)

    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[correcta_idx],
        "constructo": "Búsqueda de figura idéntica",
        "enunciado": "Identifica la alternativa idéntica al modelo de arriba.",
    }


GENERADORES_ATENCION = [_at_encontrar_distinto, _at_buscar_igual]


# ============================================================
# Memoria visual: secuencia de N figuras a recordar
# ============================================================
def _mv_secuencia() -> dict:
    n = random.choice([4, 5, 6])
    secuencia = random.sample(FORMAS, min(n, len(FORMAS)))
    fig, ax = plt.subplots(figsize=(n * 1.2, 1.6))
    ax.set_xlim(0, n)
    ax.set_ylim(0, 1.6)
    ax.set_aspect("equal")
    ax.axis("off")
    for i, f in enumerate(secuencia):
        rect = Rectangle((i + 0.05, 0.15), 0.9, 1.3, fill=False, edgecolor="#94a3b8", lw=1.0)
        ax.add_patch(rect)
        ax.text(i + 0.5, 1.55, str(i + 1), ha="center", fontsize=9, color="#475569")
        _figura(ax, f, i + 0.5, 0.8, 0.7)
    return {
        "fig": fig, "respuesta_correcta": None,
        "constructo": f"Memoria visual de secuencia de {n} elementos",
        "enunciado": f"Memoriza las {n} figuras y su orden. (Tendrás que reconocerlas después.)",
    }


# ============================================================
# Aptitud espacial: cubo desde 4 vistas → cuál
# ============================================================
def _es_red_cubo() -> dict:
    """Mostrar una red de cubo (cruz de 6 cuadrados con marcas) y pedir cuál cubo arma."""
    fig, ax = plt.subplots(figsize=(6, 2.5))
    ax.set_xlim(0, 6)
    ax.set_ylim(0, 2.5)
    ax.set_aspect("equal")
    ax.axis("off")

    # Red en cruz a la izquierda
    ax.text(0.85, 2.35, "RED", ha="center", fontsize=8, color="#475569", fontweight="bold")
    s = 0.4  # tamaño cuadrado
    cx, cy = 0.85, 1.0
    # cara central
    marcas_caras = ["●", "▲", "■", "○", "△", "□"]
    random.shuffle(marcas_caras)
    posiciones = [(cx, cy), (cx - s, cy), (cx + s, cy), (cx + 2 * s, cy),
                  (cx, cy - s), (cx, cy + s)]
    for (px, py), m in zip(posiciones, marcas_caras):
        rect = Rectangle((px - s / 2, py - s / 2), s, s, fill=False,
                          edgecolor="#1e293b", lw=1.2)
        ax.add_patch(rect)
        ax.text(px, py, m, ha="center", va="center", fontsize=10, color="#1e293b")

    # Línea separadora
    ax.plot([2.4, 2.4], [0, 2.5], color="#cbd5e1", lw=0.5)

    # 5 cubos alternativos a la derecha (representados como cuadrados con tres marcas visibles)
    for i in range(5):
        bx = 2.7 + i * 0.65
        rect = Rectangle((bx - 0.05, 0.2), 0.6, 1.4, fill=False,
                          edgecolor="#94a3b8", lw=1.0)
        ax.add_patch(rect)
        ax.text(bx + 0.25, 1.7, "ABCDE"[i], ha="center", fontsize=10,
                color="#1e40af", fontweight="bold")
        # Tres marcas representando 3 caras visibles del cubo
        for k, my in enumerate([1.2, 0.85, 0.5]):
            ax.text(bx + 0.25, my, random.choice(marcas_caras), ha="center",
                    fontsize=9, color="#1e293b")

    correcta_idx = random.randint(0, 4)
    return {
        "fig": fig, "respuesta_correcta": "ABCDE"[correcta_idx],
        "constructo": "Visualización 3D de redes de cubo",
        "enunciado": "Observa la red. ¿Cuál cubo se forma al plegarla?",
    }


# ============================================================
# API pública
# ============================================================
def _build_item(nivel: str, tipo: str, dificultad: int, data: dict) -> dict:
    enunciado_url = _guardar(data["fig"])
    item_id = str(uuid.uuid4())
    return {
        "id": item_id,
        "nivel": nivel,
        "tipo": tipo,
        "formato": "opcion_multiple",
        "origen": "generado",
        "enunciado": data["enunciado"],
        "opciones": [{"clave": c, "texto": ""} for c in "ABCDE"],
        "respuesta_correcta": data["respuesta_correcta"],
        "constructo": data["constructo"],
        "dificultad": dificultad,
        "imagen_url": enunciado_url,
        "requiere_imagen": True,
        "estado": "borrador",
    }


def generar_visual(tipo: str, nivel: str, cantidad: int, dificultad: int = 2) -> list[dict]:
    out = []
    for _ in range(cantidad):
        if tipo == "razonamiento_abstracto":
            data = random.choice(GENERADORES_ABSTRACTO)()
        elif tipo == "atencion":
            data = random.choice(GENERADORES_ATENCION)()
        elif tipo == "memoria_visual":
            data = _mv_secuencia()
        elif tipo in ("razonamiento_espacial", "aptitud_espacial"):
            data = _es_red_cubo()
        else:
            raise ValueError(f"Generador visual no implementado: {tipo}")
        out.append(_build_item(nivel, tipo, dificultad, data))
    return out
