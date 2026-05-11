-- ============================================================
-- Datos semilla: Ítems originales 2° Medio
-- ============================================================

-- RAZONAMIENTO VERBAL
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('2_medio','razonamiento_verbal','opcion_multiple','original',
 'Estatua es a escultor, como sinfonía es a...',
 '[{"clave":"A","texto":"director"},{"clave":"B","texto":"intérprete"},{"clave":"C","texto":"compositor"},{"clave":"D","texto":"orquesta"},{"clave":"E","texto":"partitura"}]',
 'C','Relación obra-creador',3),
('2_medio','razonamiento_verbal','opcion_multiple','original',
 'Cobardía es a temerario, como tacañería es a...',
 '[{"clave":"A","texto":"avaro"},{"clave":"B","texto":"generoso"},{"clave":"C","texto":"derrochador"},{"clave":"D","texto":"dadivoso"},{"clave":"E","texto":"pródigo"}]',
 'E','Relación opuestos extremos',4);

-- VOCABULARIO
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('2_medio','vocabulario','opcion_multiple','original',
 'EFÍMERO',
 '[{"clave":"A","texto":"eterno"},{"clave":"B","texto":"breve"},{"clave":"C","texto":"intenso"},{"clave":"D","texto":"transparente"},{"clave":"E","texto":"esencial"}]',
 'B','Significado de palabras',3),
('2_medio','vocabulario','opcion_multiple','original',
 'EXACERBAR',
 '[{"clave":"A","texto":"calmar"},{"clave":"B","texto":"agravar"},{"clave":"C","texto":"explicar"},{"clave":"D","texto":"omitir"},{"clave":"E","texto":"resumir"}]',
 'B','Significado de palabras',4);

-- RAZONAMIENTO NUMÉRICO
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('2_medio','razonamiento_numerico','opcion_multiple','original',
 '2, 3, 5, 8, 13, 21, ...',
 '[{"clave":"A","texto":"28"},{"clave":"B","texto":"30"},{"clave":"C","texto":"34"},{"clave":"D","texto":"35"},{"clave":"E","texto":"32"}]',
 'C','Sucesión de Fibonacci',4),
('2_medio','razonamiento_numerico','opcion_multiple','original',
 '100, 50, 25, 12.5, ...',
 '[{"clave":"A","texto":"6"},{"clave":"B","texto":"6.25"},{"clave":"C","texto":"5.5"},{"clave":"D","texto":"7"},{"clave":"E","texto":"5"}]',
 'B','Progresión geométrica /2',3);

-- HABILIDAD NUMÉRICA
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('2_medio','habilidad_numerica','opcion_multiple','original',
 '120 ÷ 4 × 3 - 50 =',
 '[{"clave":"A","texto":"40"},{"clave":"B","texto":"30"},{"clave":"C","texto":"50"},{"clave":"D","texto":"60"},{"clave":"E","texto":"70"}]',
 'A','Cálculo izquierda-derecha',3);

-- COMPRENSIÓN LECTORA
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, texto_base, opciones, respuesta_correcta, constructo, dificultad) VALUES
('2_medio','comprension_lectora','opcion_multiple','original',
 '¿Cuál es la idea principal del texto?',
 'La economía circular es un modelo que busca reducir el desperdicio mediante la reutilización, reparación y reciclaje de productos. A diferencia de la economía lineal —que extrae, produce, consume y desecha—, la circular concibe los residuos como recursos. En países nórdicos, este modelo ha permitido reducir las emisiones de CO2 en más de un 30% en sectores como construcción y manufactura.',
 '[{"clave":"A","texto":"Los países nórdicos son los más eficientes del mundo"},{"clave":"B","texto":"La economía circular reduce desperdicios reutilizando recursos"},{"clave":"C","texto":"Construcción y manufactura son los sectores más contaminantes"},{"clave":"D","texto":"La economía lineal es más rentable que la circular"}]',
 'B','Identificación de idea principal',3);

-- INTERESES
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('2_medio','intereses','likert_gusto','original',
 'Investigar fenómenos científicos en un laboratorio',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés científico',2),
('2_medio','intereses','likert_gusto','original',
 'Liderar un proyecto o equipo de trabajo',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés directivo/organizacional',2);

-- PERSONALIDAD
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('2_medio','personalidad','likert_5','original',
 '¿Mantienes la calma en situaciones de presión?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Bastantes veces"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Alguna vez"},{"clave":"E","texto":"Nunca"}]',
 'Estabilidad emocional',3),
('2_medio','personalidad','likert_5','original',
 '¿Asumes la responsabilidad cuando algo sale mal por tu causa?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Bastantes veces"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Alguna vez"},{"clave":"E","texto":"Nunca"}]',
 'Responsabilidad',2);

-- ADAPTACIÓN Y MOTIVACIÓN
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('2_medio','adaptacion_motivacion','likert_5','original',
 '¿Te interesa lo que aprendes en el colegio?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Frecuentemente"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Pocas veces"},{"clave":"E","texto":"Nunca"}]',
 'Motivación escolar',2);

-- HÁBITOS DE ESTUDIO
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('2_medio','habitos_estudio','si_no','original',
 'Planifico semanalmente cuándo estudiar cada asignatura.',
 '[{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]',
 'Planificación del estudio',3),
('2_medio','habitos_estudio','si_no','original',
 'Cuando no entiendo algo, busco fuentes adicionales (videos, libros, profesores).',
 '[{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]',
 'Autonomía en el aprendizaje',2);
