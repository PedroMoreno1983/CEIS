"""
Pipeline de extracción de ítems desde los PDFs de las baterías CEIS.

- Rasteriza cada página a PNG con pypdfium2.
- Detecta secciones (subpruebas) por header "| <Nombre>".
- Para cada subprueba, manda chunks de páginas a Claude (vision)
  para extraer ítems estructurados.
- Para subpruebas visuales, recorta cada ítem como PNG y lo guarda
  en uploads/items/.
- Inserta en BD con origen='original'.

Uso:
    python extraer_baterias.py            # procesa todo
    python extraer_baterias.py --dry-run  # no inserta en BD, solo imprime
    python extraer_baterias.py --pdf "5° y 6° Básico Cuadernillo 1.pdf"
"""
from __future__ import annotations
import argparse
import base64
import io
import json
import re
import sys
import unicodedata
import uuid
from pathlib import Path
from typing import Any

import pypdfium2 as pdfium
from PIL import Image
import anthropic
import asyncio
import asyncpg

sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)

LOG_FILE = Path(__file__).parent / "extraccion.log"


def log(msg: str):
    print(msg, flush=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")

ROOT = Path(__file__).resolve().parents[1]
PDFS_DIR = Path(r"C:\Users\pedro.moreno\Desktop\Instru_Ceis\BATERIAS FINAL")
UPLOADS_DIR = ROOT / "uploads" / "items"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(ROOT / "backend"))
from app.core.config import settings  # type: ignore  # noqa: E402

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# ------------------------------------------------------------
# Mapping de niveles
# ------------------------------------------------------------
NIVEL_POR_PDF = {
    "5° y 6° Básico Cuadernillo 1.pdf": "5_6_basico",
    "5° y 6° Básico Cuadernillo 2.pdf": "5_6_basico",
    "8° Básico Cuadernillo 1.pdf": "8_basico",
    "8° Básico Cuadernillo 2.pdf": "8_basico",
    "2do_medio-Nro1 Media carta.pdf": "2_medio",
    "2do medio-Nro2 Media carta.pdf": "2_medio",
    "4° Medio Cuadernillo 1.pdf": "4_medio",
    "4° Medio Cuadernillo 2.pdf": "4_medio",
}

# ------------------------------------------------------------
# Mapping nombre subprueba → tipo enum
# ------------------------------------------------------------
def normalizar(s: str) -> str:
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z]", "", s)

TIPO_MAP = {
    "razonamientoabstracto": "razonamiento_abstracto",
    "razonamientoverbal": "razonamiento_verbal",
    "razonamientonumerico": "razonamiento_numerico",
    "razonamientoespacial": "razonamiento_espacial",
    "razonamientomecanico": "razonamiento_mecanico",
    "razonamiento": "razonamiento_verbal",  # 8° básico genérico
    "vocabulario": "vocabulario",
    "habilidadnumerica": "habilidad_numerica",
    "calculoaritmetico": "calculo_aritmetico",
    "calculonumerico": "calculo_numerico",
    "estrategiasdeaprendizaje": "estrategias_aprendizaje",
    "aptitudespacial": "aptitud_espacial",
    "comprensionlectora": "comprension_lectora",
    "atencion": "atencion",
    "inteligenciapractica": "inteligencia_practica",
    "habitosdeestudio": "habitos_estudio",
    "habitosdeestudios": "habitos_estudio",
    "memoriavisual": "memoria_visual",
    "memoriavisualrealizacion": "memoria_visual",
    "memoriaauditiva": "memoria_auditiva",
    "intereses": "intereses",
    "interesesvocacionales": "intereses",
    "personalidad": "personalidad",
    "adaptacion": "adaptacion_motivacion",
    "adaptacionymotivacion": "adaptacion_motivacion",
    "rapidezperceptiva": "rapidez_perceptiva",
    "eleccionesprofesionales": "elecciones_profesionales",
}

# Subpruebas que requieren imagen
TIPOS_VISUALES = {
    "razonamiento_abstracto", "razonamiento_espacial", "razonamiento_mecanico",
    "aptitud_espacial", "atencion", "memoria_visual", "rapidez_perceptiva",
}

# Formato por tipo
FORMATO_POR_TIPO = {
    "razonamiento_verbal": "opcion_multiple",
    "vocabulario": "opcion_multiple",
    "razonamiento_numerico": "opcion_multiple",
    "habilidad_numerica": "opcion_multiple",
    "calculo_aritmetico": "opcion_multiple",
    "calculo_numerico": "opcion_multiple",
    "razonamiento_abstracto": "opcion_multiple",
    "razonamiento_espacial": "opcion_multiple",
    "razonamiento_mecanico": "opcion_multiple",
    "aptitud_espacial": "opcion_multiple",
    "atencion": "opcion_multiple",
    "memoria_visual": "opcion_multiple",
    "memoria_auditiva": "opcion_multiple",
    "rapidez_perceptiva": "opcion_multiple",
    "comprension_lectora": "opcion_multiple",
    "inteligencia_practica": "opcion_multiple",
    "estrategias_aprendizaje": "likert_5",
    "elecciones_profesionales": "opcion_multiple",
    "habitos_estudio": "si_no",
    "intereses": "likert_gusto",
    "personalidad": "likert_5",
    "adaptacion_motivacion": "likert_5",
}


# ------------------------------------------------------------
# Rasterizar páginas
# ------------------------------------------------------------
def rasterizar(pdf_path: Path, escala: float = 2.0) -> list[Image.Image]:
    pdf = pdfium.PdfDocument(str(pdf_path))
    imgs = []
    for page in pdf:
        pil = page.render(scale=escala).to_pil()
        imgs.append(pil)
    return imgs


def page_text(pdf_path: Path) -> list[str]:
    pdf = pdfium.PdfDocument(str(pdf_path))
    out = []
    for page in pdf:
        tp = page.get_textpage()
        out.append(tp.get_text_range() or "")
    return out


def detectar_secciones(textos: list[str]) -> list[tuple[int, str]]:
    """Devuelve [(pagina_idx_0, nombre_subprueba)]."""
    secciones: list[tuple[int, str]] = []
    last = None
    for i, t in enumerate(textos):
        m = re.match(r"^\s*\|\s*([^\n]+)", t)
        if not m:
            continue
        nombre = re.sub(r"\d+$", "", m.group(1).strip()).strip()
        if not nombre or "instrucciones generales" in nombre.lower():
            continue
        # Normalizar pequeñas variantes ("RRazonamiento", "ntereses", etc.)
        norm = normalizar(nombre)
        if norm.startswith("r") and norm[1:].startswith("r"):
            nombre = nombre[1:]
        if last and normalizar(last) == normalizar(nombre):
            continue
        secciones.append((i, nombre))
        last = nombre
    return secciones


def imagen_a_b64(img: Image.Image, max_w: int = 1200) -> str:
    if img.width > max_w:
        ratio = max_w / img.width
        img = img.resize((max_w, int(img.height * ratio)))
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


# ------------------------------------------------------------
# Llamada a Claude visión
# ------------------------------------------------------------
PROMPT_PARSER = """Eres un experto extrayendo ítems de pruebas psicoeducacionales desde imágenes de PDF.

Estoy procesando la subprueba "{subprueba}" de la batería CEIS Maristas (nivel {nivel}).
Te paso las páginas que contienen los ítems de esta subprueba.

Devuelve un JSON array donde cada elemento es un ítem con esta estructura exacta:

{{
  "numero": <int, número del ítem en la subprueba>,
  "pagina": <int, número de página donde aparece>,
  "enunciado": "<texto del enunciado, o '' si es puramente visual>",
  "texto_base": "<texto de lectura si existe (comprensión lectora), o null>",
  "opciones": [
    {{"clave": "A", "texto": "<texto de la opción, o '' si es figura>"}},
    {{"clave": "B", "texto": "..."}},
    {{"clave": "C", "texto": "..."}},
    {{"clave": "D", "texto": "..."}},
    {{"clave": "E", "texto": "..."}}
  ],
  "es_visual": <bool, true si el ítem o sus opciones son figuras/dibujos>,
  "constructo": "<qué mide, en pocas palabras>"
}}

Reglas importantes:
- NO inventes ítems. Solo extrae los que aparecen en las imágenes.
- Si la opción es Sí/No, usa claves "S" y "N".
- Si es escala Likert (Siempre/Nunca, Me gusta mucho/desagrada), usa A-E.
- Si la subprueba es de respuesta libre (rapidez lectora, etc.), pon opciones: null.
- "es_visual" debe ser true si entender el ítem requiere ver la figura. Si el enunciado es solo texto pero las opciones son figuras, también es true.
- Ignora páginas de instrucciones, solo extrae los ítems numerados.
- No incluyas ejemplos (E1, E2, etc.), solo los ítems reales numerados.

Devuelve SOLO el JSON array, sin texto antes ni después."""


def _llamar_claude(content: list[dict[str, Any]]) -> str:
    resp = client.messages.create(
        model=settings.LLM_MODEL,
        max_tokens=16000,
        messages=[{"role": "user", "content": content}],
    )
    return resp.content[0].text.strip()


def _extraer_json(raw: str) -> list[dict] | None:
    raw = raw.strip()
    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end == 0:
        return None
    try:
        return json.loads(raw[start:end])
    except json.JSONDecodeError:
        return None


def parsear_subprueba(
    subprueba: str,
    nivel: str,
    paginas: list[Image.Image],
    paginas_idx: list[int],
) -> list[dict[str, Any]]:
    """Manda las páginas en chunks y agrega los ítems."""
    CHUNK = 6  # páginas por llamada (controla longitud del JSON)
    items: list[dict[str, Any]] = []

    pares = list(zip(paginas, paginas_idx))
    chunks = [pares[i:i + CHUNK] for i in range(0, len(pares), CHUNK)] or [[]]

    for ci, chunk in enumerate(chunks):
        if not chunk:
            continue
        content: list[dict[str, Any]] = [
            {"type": "text", "text": PROMPT_PARSER.format(subprueba=subprueba, nivel=nivel)}
        ]
        for img, idx in chunk:
            content.append({"type": "text", "text": f"--- Página {idx + 1} ---"})
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/png", "data": imagen_a_b64(img)},
            })
        try:
            raw = _llamar_claude(content)
        except Exception as e:
            print(f"    [API ERROR] chunk {ci+1}/{len(chunks)}: {e}")
            continue
        parsed = _extraer_json(raw)
        if parsed is None:
            print(f"    [WARN] {subprueba} chunk {ci+1}/{len(chunks)}: JSON inválido, intento reparar...")
            try:
                fix = client.messages.create(
                    model=settings.LLM_MODEL,
                    max_tokens=2000,
                    messages=[{"role": "user", "content": (
                        "Repara este JSON array para que sea válido. "
                        "Devuelve SOLO el JSON, sin explicación.\n\n" + raw[-3000:]
                    )}],
                )
                parsed = _extraer_json(fix.content[0].text)
            except Exception:
                parsed = None
        if parsed:
            items.extend(parsed)

    return items


# ------------------------------------------------------------
# Recortar y guardar imágenes
# ------------------------------------------------------------
def guardar_imagen_pagina(img: Image.Image, item_uuid: str) -> str:
    """Guarda la página completa como imagen del ítem."""
    fname = f"{item_uuid}.png"
    out = UPLOADS_DIR / fname
    if img.width > 1400:
        ratio = 1400 / img.width
        img = img.resize((1400, int(img.height * ratio)))
    img.save(out, format="PNG", optimize=True)
    return f"items/{fname}"


# ------------------------------------------------------------
# Procesamiento principal
# ------------------------------------------------------------
async def procesar_pdf(pdf_path: Path, dry_run: bool = False, conn=None) -> list[dict]:
    nombre = pdf_path.name
    nivel = NIVEL_POR_PDF.get(nombre)
    if not nivel:
        print(f"[SKIP] {nombre}: no mapeado a nivel")
        return []

    print(f"\n{'='*70}\nProcesando: {nombre} (nivel: {nivel})\n{'='*70}")

    textos = page_text(pdf_path)
    secciones = detectar_secciones(textos)
    print(f"  → {len(secciones)} secciones detectadas")

    print("  → rasterizando páginas...")
    imagenes = rasterizar(pdf_path, escala=2.0)
    print(f"  → {len(imagenes)} páginas rasterizadas")

    items_total = []
    # Agregar centinela final
    secciones_iter = secciones + [(len(imagenes), "__END__")]

    for k in range(len(secciones)):
        page_start, nombre_sec = secciones_iter[k]
        page_end, _ = secciones_iter[k + 1]
        norm = normalizar(nombre_sec)
        tipo = TIPO_MAP.get(norm)
        if not tipo:
            print(f"  [SKIP] sección sin tipo mapeado: {nombre_sec!r} (norm={norm})")
            continue

        print(f"\n  · {nombre_sec} → {tipo}  (págs. {page_start+1}-{page_end})")
        paginas_sec = imagenes[page_start:page_end]
        paginas_idx = list(range(page_start, page_end))

        try:
            items = parsear_subprueba(nombre_sec, nivel, paginas_sec, paginas_idx)
        except Exception as e:
            print(f"    [ERROR] {e}")
            continue

        print(f"    ← {len(items)} ítems extraídos")
        for it in items:
            num = it.get("numero")
            pag = it.get("pagina") or (page_start + 1)
            es_visual = it.get("es_visual", False) or tipo in TIPOS_VISUALES
            item_uuid = str(uuid.uuid4())
            imagen_url = None
            if es_visual:
                # Buscar la página correspondiente en las imágenes
                pag_idx = max(page_start, min(page_end - 1, pag - 1))
                imagen_url = guardar_imagen_pagina(imagenes[pag_idx], item_uuid)

            row = {
                "id": item_uuid,
                "nivel": nivel,
                "tipo": tipo,
                "formato": FORMATO_POR_TIPO.get(tipo, "opcion_multiple"),
                "origen": "original",
                "enunciado": it.get("enunciado") or f"Ítem {num} (visual)",
                "texto_base": it.get("texto_base"),
                "opciones": json.dumps(it.get("opciones")) if it.get("opciones") else None,
                "constructo": it.get("constructo"),
                "imagen_url": imagen_url,
                "requiere_imagen": es_visual,
                "pagina_origen": pag,
                "cuadernillo_origen": nombre,
                "estado": "borrador",
            }
            items_total.append(row)

    if not dry_run and conn and items_total:
        await insertar_items(conn, items_total)
        print(f"\n  ✓ Insertados {len(items_total)} ítems en BD")

    return items_total


async def insertar_items(conn: asyncpg.Connection, items: list[dict]):
    sql = """
    INSERT INTO item_banco
        (id, nivel, tipo, formato, origen, enunciado, texto_base,
         opciones, constructo, imagen_url, requiere_imagen,
         pagina_origen, cuadernillo_origen, estado)
    VALUES ($1, $2, $3::tipo_instrumento, $4::formato_respuesta, $5::origen_item,
            $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14::estado_item)
    """
    for it in items:
        await conn.execute(
            sql,
            uuid.UUID(it["id"]), it["nivel"], it["tipo"], it["formato"], it["origen"],
            it["enunciado"], it["texto_base"], it["opciones"], it["constructo"],
            it["imagen_url"], it["requiere_imagen"],
            it["pagina_origen"], it["cuadernillo_origen"], it["estado"],
        )


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--pdf", help="nombre exacto de un PDF a procesar")
    parser.add_argument("--limpiar", action="store_true",
                        help="borrar ítems con origen='original' antes de insertar")
    args = parser.parse_args()

    pdfs = [p for p in PDFS_DIR.rglob("*.pdf") if p.name in NIVEL_POR_PDF]
    if args.pdf:
        pdfs = [p for p in pdfs if p.name == args.pdf]
    pdfs.sort()

    conn = None
    if not args.dry_run:
        conn = await asyncpg.connect(
            host=settings.DB_HOST, port=settings.DB_PORT,
            user=settings.DB_USER, password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
        )
        if args.limpiar:
            await conn.execute("DELETE FROM instrumento_item")
            await conn.execute("DELETE FROM instrumento_generado")
            n2 = await conn.execute("DELETE FROM item_banco WHERE origen='original'")
            print(f"[LIMPIAR] {n2}")

    try:
        for pdf in pdfs:
            await procesar_pdf(pdf, dry_run=args.dry_run, conn=conn)
    finally:
        if conn:
            await conn.close()

    print("\n=== Listo ===")


if __name__ == "__main__":
    asyncio.run(main())
