-- ============================================================
-- Datos semilla: Ítems originales 8° Básico
-- ============================================================

-- RAZONAMIENTO VERBAL
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('8_basico','razonamiento_verbal','opcion_multiple','original',
 'Médico es a hospital, como profesor es a...',
 '[{"clave":"A","texto":"alumno"},{"clave":"B","texto":"libro"},{"clave":"C","texto":"escuela"},{"clave":"D","texto":"clase"},{"clave":"E","texto":"pizarra"}]',
 'C','Relación lugar de trabajo',2),
('8_basico','razonamiento_verbal','opcion_multiple','original',
 'Hambre es a comer, como sed es a...',
 '[{"clave":"A","texto":"agua"},{"clave":"B","texto":"vaso"},{"clave":"C","texto":"saciar"},{"clave":"D","texto":"beber"},{"clave":"E","texto":"sediento"}]',
 'D','Relación necesidad-acción',2),
('8_basico','razonamiento_verbal','opcion_multiple','original',
 'Triángulo es a tres, como hexágono es a...',
 '[{"clave":"A","texto":"cuatro"},{"clave":"B","texto":"cinco"},{"clave":"C","texto":"seis"},{"clave":"D","texto":"siete"},{"clave":"E","texto":"ocho"}]',
 'C','Relación cantidad de lados',1);

-- VOCABULARIO
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('8_basico','vocabulario','opcion_multiple','original',
 'PERSPICAZ',
 '[{"clave":"A","texto":"agudo"},{"clave":"B","texto":"distante"},{"clave":"C","texto":"obstinado"},{"clave":"D","texto":"perezoso"},{"clave":"E","texto":"impulsivo"}]',
 'A','Significado de palabras',3),
('8_basico','vocabulario','opcion_multiple','original',
 'CONTUNDENTE',
 '[{"clave":"A","texto":"dudoso"},{"clave":"B","texto":"firme"},{"clave":"C","texto":"sutil"},{"clave":"D","texto":"frágil"},{"clave":"E","texto":"ambiguo"}]',
 'B','Significado de palabras',3);

-- RAZONAMIENTO NUMÉRICO
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('8_basico','razonamiento_numerico','opcion_multiple','original',
 '2, 4, 8, 16, 32, ...',
 '[{"clave":"A","texto":"48"},{"clave":"B","texto":"64"},{"clave":"C","texto":"60"},{"clave":"D","texto":"52"},{"clave":"E","texto":"56"}]',
 'B','Progresión geométrica x2',2),
('8_basico','razonamiento_numerico','opcion_multiple','original',
 '1, 4, 9, 16, 25, ...',
 '[{"clave":"A","texto":"30"},{"clave":"B","texto":"32"},{"clave":"C","texto":"36"},{"clave":"D","texto":"40"},{"clave":"E","texto":"42"}]',
 'C','Cuadrados perfectos',3);

-- HABILIDAD NUMÉRICA
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('8_basico','habilidad_numerica','opcion_multiple','original',
 '15 + 8 - 6 × 2 =',
 '[{"clave":"A","texto":"34"},{"clave":"B","texto":"32"},{"clave":"C","texto":"30"},{"clave":"D","texto":"28"},{"clave":"E","texto":"26"}]',
 'A','Cálculo izquierda-derecha',2),
('8_basico','habilidad_numerica','opcion_multiple','original',
 '64 ÷ 8 + 12 ÷ 3 =',
 '[{"clave":"A","texto":"10"},{"clave":"B","texto":"12"},{"clave":"C","texto":"4"},{"clave":"D","texto":"8"},{"clave":"E","texto":"6"}]',
 'C','Cálculo izquierda-derecha',3);

-- INTELIGENCIA PRÁCTICA
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('8_basico','inteligencia_practica','opcion_multiple','original',
 'Vas caminando por la calle y ves a una persona mayor que se cae al suelo. ¿Qué haces?',
 '[{"clave":"A","texto":"Sigo caminando para no incomodar"},{"clave":"B","texto":"Me acerco con cuidado para ayudarla a levantarse y veo si necesita asistencia"},{"clave":"C","texto":"Saco el celular para grabar"},{"clave":"D","texto":"Llamo solamente a un familiar"}]',
 'B','Resolución práctica',2);

-- INTERESES
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('8_basico','intereses','likert_gusto','original',
 'Resolver problemas matemáticos complejos',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés lógico-matemático',2),
('8_basico','intereses','likert_gusto','original',
 'Diseñar o construir cosas con mis manos',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés técnico/manual',2),
('8_basico','intereses','likert_gusto','original',
 'Escribir cuentos, poemas o relatos',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés literario',2);

-- PERSONALIDAD
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('8_basico','personalidad','likert_5','original',
 '¿Te cuesta tomar decisiones cuando hay varias alternativas?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Bastantes veces"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Alguna vez"},{"clave":"E","texto":"Nunca"}]',
 'Decisión',2),
('8_basico','personalidad','likert_5','original',
 '¿Disfrutas conociendo personas nuevas?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Bastantes veces"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Alguna vez"},{"clave":"E","texto":"Nunca"}]',
 'Sociabilidad',2);

-- ADAPTACIÓN Y MOTIVACIÓN
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('8_basico','adaptacion_motivacion','likert_5','original',
 '¿Te sientes a gusto en tu colegio?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Frecuentemente"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Pocas veces"},{"clave":"E","texto":"Nunca"}]',
 'Adaptación escolar',2),
('8_basico','adaptacion_motivacion','likert_5','original',
 '¿Sientes que tus padres te comprenden?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Frecuentemente"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Pocas veces"},{"clave":"E","texto":"Nunca"}]',
 'Adaptación familiar',2);

-- HÁBITOS DE ESTUDIO
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('8_basico','habitos_estudio','si_no','original',
 'Hago resúmenes o esquemas cuando estudio.',
 '[{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]',
 'Técnicas de estudio',2),
('8_basico','habitos_estudio','si_no','original',
 'Reviso mis materias el mismo día que las pasamos en clases.',
 '[{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]',
 'Constancia en el estudio',2);
