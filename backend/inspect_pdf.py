import sys
from pypdf import PdfReader
from pathlib import Path
import re

sys.stdout.reconfigure(encoding="utf-8")

base = Path(r"C:\Users\pedro.moreno\Desktop\Instru_Ceis\BATERIAS FINAL")
pdfs = sorted(base.rglob("*.pdf"))

for pdf in pdfs:
    if "Manual" in str(pdf) or "Fichas" in str(pdf) or "Portada" in str(pdf):
        continue
    print(f"\n{'='*70}\n{pdf.relative_to(base)}\n{'='*70}")
    reader = PdfReader(str(pdf))
    print(f"Páginas: {len(reader.pages)}")

    secciones = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        # Detectar headers de subpruebas (línea con "| Nombre")
        m = re.match(r"^\s*\|\s*([^\n]+)", text)
        if m:
            sec = m.group(1).strip()
            if not secciones or secciones[-1][0] != sec:
                secciones.append((sec, i + 1))

    for s, p in secciones:
        print(f"  pág. {p:3d}  →  {s}")
