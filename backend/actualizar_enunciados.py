"""
Actualiza enunciados de items extraídos que tienen 'Ítem N (visual)' por
algo más útil al estudiante.
"""
import asyncio
import sys
import asyncpg
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from app.core.config import settings  # noqa: E402

ENUNCIADOS = {
    "razonamiento_abstracto": "Observa la serie de figuras. ¿Cuál de las alternativas A, B, C, D o E continúa la serie?",
    "razonamiento_espacial": "Observa la figura. ¿Cuál alternativa corresponde según el patrón espacial?",
    "razonamiento_mecanico": "Observa la situación. ¿Cuál alternativa describe correctamente lo que ocurriría?",
    "atencion": "Observa con atención. ¿Cuál de las alternativas A, B, C, D o E corresponde?",
    "memoria_visual": "Observa la figura por unos segundos. Luego identifica la alternativa que coincide.",
    "rapidez_perceptiva": "Observa rápidamente. Identifica la alternativa que coincide con el modelo.",
    "aptitud_espacial": "Observa la figura plegada. ¿Cuál alternativa muestra cómo queda al desplegarla?",
}


async def main():
    conn = await asyncpg.connect(
        host=settings.DB_HOST, port=settings.DB_PORT,
        user=settings.DB_USER, password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )
    total = 0
    for tipo, enunciado in ENUNCIADOS.items():
        result = await conn.execute(
            """
            UPDATE item_banco
            SET enunciado = $1
            WHERE tipo = $2::tipo_instrumento
              AND requiere_imagen = TRUE
              AND (enunciado LIKE 'Ítem%' OR enunciado IS NULL OR length(trim(enunciado))=0)
            """,
            enunciado, tipo,
        )
        n = int(result.split()[-1])
        total += n
        print(f"  {tipo}: {n} items actualizados")
    print(f"\nTotal: {total}")
    await conn.close()


asyncio.run(main())
