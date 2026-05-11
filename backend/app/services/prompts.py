"""
Prompts de generación por tipo de instrumento y nivel educativo.
Cada prompt produce un JSON array de ítems listos para insertar en item_banco.
"""

NIVEL_LABELS = {
    "5_6_basico": "5° y 6° Básico (10-12 años)",
    "8_basico": "8° Básico (13-14 años)",
    "2_medio": "2° Medio (15-16 años)",
    "4_medio": "4° Medio (17-18 años)",
}

FORMATO_POR_TIPO = {
    "razonamiento_verbal": "opcion_multiple",
    "vocabulario": "opcion_multiple",
    "razonamiento_numerico": "opcion_multiple",
    "habilidad_numerica": "opcion_multiple",
    "inteligencia_practica": "opcion_multiple",
    "comprension_lectora": "texto_libre",
    "rapidez_lectora": "texto_libre",
    "habitos_estudio": "si_no",
    "intereses": "likert_gusto",
    "personalidad": "likert_5",
    "adaptacion_motivacion": "likert_5",
}

INSTRUCCIONES_POR_TIPO = {
    "razonamiento_verbal": """Genera analogías verbales con relación clara (opuestos, parte-todo, función, sinonimia, causa-efecto).
Estructura: "X es a Y, como Z es a..."
5 opciones A-E. Solo una correcta. El distractores deben ser plausibles pero inequívocos.
Incluye en "constructo" el tipo de relación (ej: "Relación de opuestos").""",

    "vocabulario": """Genera ítems de vocabulario tipo "¿qué significa X?".
Presenta la palabra en mayúsculas como enunciado.
5 opciones A-E con sinónimos o definiciones breves. Solo una correcta.
Los distractores deben ser palabras de campo semántico cercano, no absurdos.
Incluye en "constructo" el campo semántico o categoría (ej: "Significado de palabras").""",

    "razonamiento_numerico": """Genera series numéricas donde el estudiante debe encontrar el siguiente número.
Ejemplos de patrones: suma/resta constante, multiplicación, dos series intercaladas, diferencias crecientes.
5 opciones A-E. Solo una correcta.
En "constructo" describe el patrón (ej: "Diferencias crecientes").""",

    "habilidad_numerica": """Genera operaciones aritméticas que se resuelven de izquierda a derecha (sin jerarquía de operaciones).
Ejemplo: "12 ÷ 4 + 3 ="
Usa: +, -, ×, ÷. Resultados siempre enteros positivos.
5 opciones A-E. Solo una correcta.
En "constructo": "Cálculo mental izquierda-derecha".""",

    "inteligencia_practica": """Genera situaciones cotidianas con 4 opciones de respuesta (A-D).
La situación debe ser realista para estudiantes chilenos.
Una opción es claramente la más práctica/eficaz. Las otras son razonables pero subóptimas o inadecuadas.
En "constructo": "Resolución práctica de problemas".""",

    "habitos_estudio": """Genera afirmaciones sobre hábitos de estudio en primera persona ("Cuando estudio...", "Antes de una prueba...").
Respuesta Sí/No.
opciones: [{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]
No incluir "respuesta_correcta" (son descriptivas, no tienen respuesta correcta).
En "constructo": el hábito específico (ej: "Gestión del tiempo", "Organización del estudio").""",

    "intereses": """Genera afirmaciones de actividades o profesiones sobre las que el estudiante expresa su nivel de gusto.
Escala: Me gusta mucho / Me gusta / Me es indiferente / Me desagrada / Me desagrada mucho
opciones: [{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]
No incluir "respuesta_correcta". En "constructo": área de interés (ej: "Interés científico", "Interés artístico").""",

    "personalidad": """Genera preguntas sobre rasgos de personalidad en segunda persona ("¿Sueles...?", "¿Te cuesta...?").
Escala: Siempre / Bastantes veces / Regularmente / Alguna vez / Nunca
opciones: [{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Bastantes veces"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Alguna vez"},{"clave":"E","texto":"Nunca"}]
No incluir "respuesta_correcta". En "constructo": rasgo (ej: "Responsabilidad", "Sociabilidad", "Autocontrol").""",

    "adaptacion_motivacion": """Genera afirmaciones sobre adaptación escolar/familiar/social en primera persona.
Escala: Siempre / Frecuentemente / Regularmente / Pocas veces / Nunca
opciones: [{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Frecuentemente"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Pocas veces"},{"clave":"E","texto":"Nunca"}]
No incluir "respuesta_correcta". En "constructo": dimensión (ej: "Adaptación familiar", "Motivación escolar").""",
}

SYSTEM_PROMPT = """Eres un psicólogo educacional experto en psicometría y construcción de instrumentos de evaluación para orientación vocacional en el sistema educativo chileno.
Generates test items siguiendo estrictamente las instrucciones. Tu output es SIEMPRE un JSON array válido, sin texto adicional."""


def build_generation_prompt(
    nivel: str,
    tipo: str,
    cantidad: int,
    dificultad_objetivo: int | None,
    constructo: str | None,
    instrucciones_extra: str | None,
) -> str:
    nivel_label = NIVEL_LABELS.get(nivel, nivel)
    formato = FORMATO_POR_TIPO.get(tipo, "opcion_multiple")
    instrucciones_tipo = INSTRUCCIONES_POR_TIPO.get(tipo, "")

    dif_texto = ""
    if dificultad_objetivo:
        dif_texto = f"\nNivel de dificultad objetivo: {dificultad_objetivo}/5 (1=muy fácil, 5=muy difícil)."

    constructo_texto = ""
    if constructo:
        constructo_texto = f"\nConstructo específico a medir: {constructo}."

    extra_texto = ""
    if instrucciones_extra:
        extra_texto = f"\nInstrucciones adicionales: {instrucciones_extra}"

    tiene_respuesta = tipo not in ("habitos_estudio", "intereses", "personalidad", "adaptacion_motivacion")

    respuesta_field = '"respuesta_correcta": "<clave>",' if tiene_respuesta else ""

    return f"""Genera exactamente {cantidad} ítems de tipo "{tipo}" para estudiantes de {nivel_label}.

{instrucciones_tipo}{dif_texto}{constructo_texto}{extra_texto}

IMPORTANTE:
- Los ítems deben ser originales, no copiar los de la batería original.
- Usa lenguaje apropiado para el nivel educativo.
- Todos los enunciados deben ser distintos entre sí.
- No repitas constructos ya generados si puedes evitarlo.

Devuelve SOLO un JSON array con esta estructura exacta:
[
  {{
    "enunciado": "<texto del ítem>",
    "opciones": [{{"clave": "A", "texto": "..."}}, ...],
    {respuesta_field}
    "constructo": "<qué mide>",
    "dificultad": <1-5>,
    "confianza": <0.0-1.0>,
    "justificacion": "<por qué es un buen ítem>"
  }},
  ...
]

No incluyas ningún texto fuera del JSON array."""
