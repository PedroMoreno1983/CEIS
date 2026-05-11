"""
Recortar páginas de baterías en sub-imágenes por ítem usando OpenCV.

Estrategia:
- Para cada item con imagen_url que apunte a una página completa,
  detectamos filas horizontales con contenido (proyección horizontal).
- Cada "fila" se considera un ítem separado.
- El número del ítem en la página se cuenta de arriba a abajo.
- Re-asignamos imagen_url a la imagen recortada de la fila correspondiente.

Esto es heurístico pero funciona muy bien para baterías como CEIS donde
los ítems están en filas horizontales con espacios en blanco entre ellos.
"""
from __future__ import annotations
import argparse
import asyncio
import sys
import uuid
from pathlib import Path

import cv2
import numpy as np
import asyncpg

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
UPLOADS = ROOT / "uploads" / "items"

sys.path.insert(0, str(ROOT / "backend"))
from app.core.config import settings  # noqa: E402


def detectar_filas(img: np.ndarray, debug: bool = False) -> list[tuple[int, int]]:
    """
    Devuelve lista de (y_start, y_end) de cada fila/ítem detectado.
    """
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # Binarizar: contenido oscuro = 1, blanco = 0
    _, bin_img = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY_INV)

    h, w = bin_img.shape
    # Recortar márgenes (10% arriba/abajo y 5% laterales) para ignorar headers
    y_min = int(h * 0.06)
    y_max = int(h * 0.97)
    x_min = int(w * 0.05)
    x_max = int(w * 0.95)
    bin_img = bin_img[y_min:y_max, x_min:x_max]

    # Proyección horizontal: cuántos píxeles oscuros por fila
    proy = np.sum(bin_img > 0, axis=1)

    # Suavizar
    kernel = np.ones(5) / 5
    proy_smooth = np.convolve(proy, kernel, mode="same")

    # Una fila se considera "con contenido" si tiene > umbral píxeles oscuros
    umbral = max(10, proy_smooth.max() * 0.05)
    hay_contenido = proy_smooth > umbral

    # Encontrar bloques contiguos
    filas = []
    inicio = None
    for i, c in enumerate(hay_contenido):
        if c and inicio is None:
            inicio = i
        elif not c and inicio is not None:
            if i - inicio > 20:  # ignorar bloques < 20 px
                filas.append((inicio + y_min, i + y_min))
            inicio = None
    if inicio is not None:
        filas.append((inicio + y_min, h - 1))

    # Combinar filas muy cercanas (gap < 15 px) — pueden ser un ítem alto
    combinadas = []
    for f in filas:
        if combinadas and f[0] - combinadas[-1][1] < 15:
            combinadas[-1] = (combinadas[-1][0], f[1])
        else:
            combinadas.append(f)

    # Filtrar filas muy pequeñas (< 60 px de alto)
    combinadas = [f for f in combinadas if f[1] - f[0] >= 60]

    if debug:
        print(f"  Filas detectadas: {len(combinadas)}, "
              f"alturas: {[f[1]-f[0] for f in combinadas]}")
    return combinadas


def recortar_filas(img: np.ndarray, filas: list[tuple[int, int]],
                    padding: int = 8) -> list[np.ndarray]:
    h, w = img.shape[:2]
    crops = []
    for (y0, y1) in filas:
        y0 = max(0, y0 - padding)
        y1 = min(h, y1 + padding)
        crops.append(img[y0:y1, :])
    return crops


async def procesar(dry_run: bool = False, limit: int | None = None,
                    cuadernillo: str | None = None):
    conn = await asyncpg.connect(
        host=settings.DB_HOST, port=settings.DB_PORT,
        user=settings.DB_USER, password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )

    # Agrupar ítems por página de origen
    where = "WHERE imagen_url IS NOT NULL AND requiere_imagen = TRUE"
    if cuadernillo:
        where += f" AND cuadernillo_origen = '{cuadernillo}'"

    rows = await conn.fetch(f"""
        SELECT id, nivel, tipo, imagen_url, pagina_origen, cuadernillo_origen, enunciado
        FROM item_banco
        {where}
        ORDER BY cuadernillo_origen, pagina_origen, creado_en
    """)

    print(f"Items con imagen: {len(rows)}")

    # Agrupar por (cuadernillo, pagina)
    grupos: dict[tuple[str, int], list] = {}
    for r in rows:
        key = (r["cuadernillo_origen"], r["pagina_origen"])
        grupos.setdefault(key, []).append(r)

    print(f"Grupos página: {len(grupos)}\n")

    procesados = 0
    for (cuad, pag), items in grupos.items():
        if limit and procesados >= limit:
            break
        # Tomar la imagen de cualquier item del grupo (todas apuntan a la misma)
        img_path = UPLOADS.parent / items[0]["imagen_url"]
        if not img_path.exists():
            print(f"[SKIP] {cuad} pág.{pag}: no existe {img_path}")
            continue

        img = cv2.imread(str(img_path))
        if img is None:
            print(f"[SKIP] {cuad} pág.{pag}: no se pudo leer imagen")
            continue

        filas = detectar_filas(img)
        print(f"{cuad} · pág.{pag}: {len(filas)} filas, {len(items)} items")

        # Si la cantidad coincide aprox, asignar fila a item
        if len(filas) == 0:
            continue

        crops = recortar_filas(img, filas)

        # Si más items que filas: agrupar items extras a la última fila
        # Si más filas que items: tomar primeras N filas
        n = min(len(items), len(crops))

        for i in range(n):
            item = items[i]
            crop = crops[i]
            new_uuid = str(uuid.uuid4())
            new_path = UPLOADS / f"{new_uuid}.png"
            if not dry_run:
                cv2.imwrite(str(new_path), crop)
                await conn.execute(
                    "UPDATE item_banco SET imagen_url=$1, enunciado=$2 WHERE id=$3",
                    f"items/{new_uuid}.png",
                    item["enunciado"] if item["enunciado"] and not item["enunciado"].startswith("Ítem ") else f"Resuelve el problema {i+1}.",
                    item["id"],
                )
            procesados += 1

        # Items extras (si los hay): ponerles enunciado especial
        for i in range(n, len(items)):
            if not dry_run:
                await conn.execute(
                    "UPDATE item_banco SET enunciado=$1 WHERE id=$2",
                    f"(Sin recorte automático — ítem {i+1} de la página {pag})",
                    items[i]["id"],
                )

    print(f"\n✓ Procesados: {procesados} items")
    await conn.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--cuadernillo", help="filtrar por nombre de cuadernillo")
    args = parser.parse_args()
    asyncio.run(procesar(dry_run=args.dry_run, limit=args.limit, cuadernillo=args.cuadernillo))


if __name__ == "__main__":
    main()
