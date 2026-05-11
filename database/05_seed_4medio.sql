-- ============================================================
-- Datos semilla: Ítems originales 4° Medio
-- ============================================================

-- RAZONAMIENTO VERBAL
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('4_medio','razonamiento_verbal','opcion_multiple','original',
 'Ostentoso es a discreto, como prolijo es a...',
 '[{"clave":"A","texto":"meticuloso"},{"clave":"B","texto":"escueto"},{"clave":"C","texto":"desordenado"},{"clave":"D","texto":"profuso"},{"clave":"E","texto":"sintético"}]',
 'C','Antonimia compleja',4),
('4_medio','razonamiento_verbal','opcion_multiple','original',
 'Premisa es a conclusión, como hipótesis es a...',
 '[{"clave":"A","texto":"conjetura"},{"clave":"B","texto":"método"},{"clave":"C","texto":"experimento"},{"clave":"D","texto":"comprobación"},{"clave":"E","texto":"teoría"}]',
 'D','Relación lógica',4);

-- VOCABULARIO
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('4_medio','vocabulario','opcion_multiple','original',
 'IDIOSINCRASIA',
 '[{"clave":"A","texto":"costumbre"},{"clave":"B","texto":"carácter propio"},{"clave":"C","texto":"defecto"},{"clave":"D","texto":"dialecto"},{"clave":"E","texto":"creencia"}]',
 'B','Significado de palabras',4),
('4_medio','vocabulario','opcion_multiple','original',
 'PROCRASTINAR',
 '[{"clave":"A","texto":"acelerar"},{"clave":"B","texto":"posponer"},{"clave":"C","texto":"olvidar"},{"clave":"D","texto":"renunciar"},{"clave":"E","texto":"insistir"}]',
 'B','Significado de palabras',3);

-- RAZONAMIENTO NUMÉRICO
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('4_medio','razonamiento_numerico','opcion_multiple','original',
 '3, 6, 11, 18, 27, ...',
 '[{"clave":"A","texto":"36"},{"clave":"B","texto":"38"},{"clave":"C","texto":"40"},{"clave":"D","texto":"42"},{"clave":"E","texto":"44"}]',
 'B','Diferencias impares (+3,+5,+7,+9,+11)',4);

-- HABILIDAD NUMÉRICA
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('4_medio','habilidad_numerica','opcion_multiple','original',
 '256 ÷ 4 ÷ 8 × 5 =',
 '[{"clave":"A","texto":"35"},{"clave":"B","texto":"40"},{"clave":"C","texto":"45"},{"clave":"D","texto":"50"},{"clave":"E","texto":"30"}]',
 'B','Cálculo izquierda-derecha',4);

-- COMPRENSIÓN LECTORA
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, texto_base, opciones, respuesta_correcta, constructo, dificultad) VALUES
('4_medio','comprension_lectora','opcion_multiple','original',
 '¿Cuál es la postura del autor frente al uso de IA en educación?',
 'El uso de inteligencia artificial en el aula no es ni una panacea ni una amenaza inminente. Quienes la abrazan sin reservas suelen ignorar que la herramienta más sofisticada no reemplaza el vínculo pedagógico, que es donde ocurre realmente el aprendizaje significativo. Sin embargo, quienes la rechazan de plano olvidan que la educación se ha transformado siempre con cada nueva tecnología disponible. La pregunta no es si usarla, sino cómo integrarla manteniendo el centro en el estudiante.',
 '[{"clave":"A","texto":"Defiende su uso sin restricciones"},{"clave":"B","texto":"La rechaza por considerarla peligrosa"},{"clave":"C","texto":"Adopta una postura matizada centrada en la integración pedagógica"},{"clave":"D","texto":"Considera que es indiferente para el aprendizaje"}]',
 'C','Inferencia de postura del autor',4);

-- INTERESES
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('4_medio','intereses','likert_gusto','original',
 'Trabajar como profesional de la salud atendiendo pacientes',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés sanitario',2),
('4_medio','intereses','likert_gusto','original',
 'Realizar análisis de datos o estadísticas',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés analítico/cuantitativo',2),
('4_medio','intereses','likert_gusto','original',
 'Defender causas sociales o derechos humanos',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés sociopolítico',2);

-- PERSONALIDAD
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('4_medio','personalidad','likert_5','original',
 '¿Te adaptas con facilidad a cambios imprevistos en tus planes?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Bastantes veces"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Alguna vez"},{"clave":"E","texto":"Nunca"}]',
 'Flexibilidad/Adaptabilidad',3),
('4_medio','personalidad','likert_5','original',
 '¿Reflexionas sobre tus errores para no repetirlos?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Bastantes veces"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Alguna vez"},{"clave":"E","texto":"Nunca"}]',
 'Autoconocimiento',2);

-- ADAPTACIÓN Y MOTIVACIÓN
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('4_medio','adaptacion_motivacion','likert_5','original',
 '¿Tienes claridad respecto a lo que quieres estudiar al egresar?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Frecuentemente"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Pocas veces"},{"clave":"E","texto":"Nunca"}]',
 'Claridad vocacional',3),
('4_medio','adaptacion_motivacion','likert_5','original',
 '¿Te sientes preparado emocionalmente para la transición universidad/trabajo?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Frecuentemente"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Pocas veces"},{"clave":"E","texto":"Nunca"}]',
 'Preparación para la transición',3);

-- HÁBITOS DE ESTUDIO
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('4_medio','habitos_estudio','si_no','original',
 'Sé identificar cuáles son mis técnicas de estudio más eficaces.',
 '[{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]',
 'Metacognición del estudio',3),
('4_medio','habitos_estudio','si_no','original',
 'Distribuyo el tiempo de estudio antes de pruebas importantes en lugar de estudiar todo el día previo.',
 '[{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]',
 'Distribución del estudio',3);
