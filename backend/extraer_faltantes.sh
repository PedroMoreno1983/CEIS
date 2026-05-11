#!/bin/bash
cd "C:/Users/pedro.moreno/Desktop/Instru_Ceis/sistema/backend"
for pdf in \
    "4° Medio Cuadernillo 2.pdf" \
    "5° y 6° Básico Cuadernillo 1.pdf" \
    "5° y 6° Básico Cuadernillo 2.pdf" \
    "8° Básico Cuadernillo 1.pdf" \
    "8° Básico Cuadernillo 2.pdf"
do
    echo "=== INICIANDO: $pdf ==="
    ./venv/Scripts/python.exe extraer_baterias.py --pdf "$pdf" 2>&1
    echo "=== TERMINADO: $pdf ==="
done
echo "=== TODOS LOS PDF PROCESADOS ==="
