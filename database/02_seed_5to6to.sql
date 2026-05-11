-- ============================================================
-- Datos semilla: Ítems originales 5°-6° Básico
-- Extraídos de las baterías CEIS Maristas
-- ============================================================

-- ------------------------------------------------------------
-- RAZONAMIENTO VERBAL (Analogías)
-- ------------------------------------------------------------
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('5_6_basico','razonamiento_verbal','opcion_multiple','original',
 'Blanco es a negro, como día es a...',
 '[{"clave":"A","texto":"noche"},{"clave":"B","texto":"sol"},{"clave":"C","texto":"luz"},{"clave":"D","texto":"tarde"},{"clave":"E","texto":"hora"}]',
 'A','Relación de opuestos',1),
('5_6_basico','razonamiento_verbal','opcion_multiple','original',
 'Pestaña es a ojo, como uña es a...',
 '[{"clave":"A","texto":"pie"},{"clave":"B","texto":"mano"},{"clave":"C","texto":"pelo"},{"clave":"D","texto":"dedo"},{"clave":"E","texto":"piel"}]',
 'D','Relación parte-todo',2),
('5_6_basico','razonamiento_verbal','opcion_multiple','original',
 'Farol es a luz, como señal es a...',
 '[{"clave":"A","texto":"peligro"},{"clave":"B","texto":"aviso"},{"clave":"C","texto":"color"},{"clave":"D","texto":"calle"},{"clave":"E","texto":"indicar"}]',
 'E','Relación función',2);

-- ------------------------------------------------------------
-- VOCABULARIO (Sinónimos)
-- ------------------------------------------------------------
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('5_6_basico','vocabulario','opcion_multiple','original',
 'ELABORAR',
 '[{"clave":"A","texto":"ayudar"},{"clave":"B","texto":"hacer"},{"clave":"C","texto":"traducir"},{"clave":"D","texto":"tener"},{"clave":"E","texto":"imitar"}]',
 'B','Significado de palabras',1),
('5_6_basico','vocabulario','opcion_multiple','original',
 'EXTENSO',
 '[{"clave":"A","texto":"grande"},{"clave":"B","texto":"terreno"},{"clave":"C","texto":"distancia"},{"clave":"D","texto":"tenso"},{"clave":"E","texto":"llanura"}]',
 'A','Significado de palabras',1),
('5_6_basico','vocabulario','opcion_multiple','original',
 'DUELO',
 '[{"clave":"A","texto":"golpe"},{"clave":"B","texto":"pistola"},{"clave":"C","texto":"desempate"},{"clave":"D","texto":"carrera"},{"clave":"E","texto":"combate"}]',
 'E','Significado de palabras',3);

-- ------------------------------------------------------------
-- RAZONAMIENTO NUMÉRICO (Series)
-- ------------------------------------------------------------
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('5_6_basico','razonamiento_numerico','opcion_multiple','original',
 '12, 10, 8, 6, ...',
 '[{"clave":"A","texto":"3"},{"clave":"B","texto":"4"},{"clave":"C","texto":"5"},{"clave":"D","texto":"2"},{"clave":"E","texto":"1"}]',
 'B','Serie descendente de 2 en 2',1),
('5_6_basico','razonamiento_numerico','opcion_multiple','original',
 '1, 10, 3, 9, 5, ...',
 '[{"clave":"A","texto":"7"},{"clave":"B","texto":"6"},{"clave":"C","texto":"8"},{"clave":"D","texto":"4"},{"clave":"E","texto":"9"}]',
 'C','Series intercaladas',3),
('5_6_basico','razonamiento_numerico','opcion_multiple','original',
 '19, 18, 16, 13, 9, ...',
 '[{"clave":"A","texto":"6"},{"clave":"B","texto":"5"},{"clave":"C","texto":"4"},{"clave":"D","texto":"3"},{"clave":"E","texto":"2"}]',
 'C','Diferencias crecientes',4);

-- ------------------------------------------------------------
-- HABILIDAD NUMÉRICA (Operaciones de izquierda a derecha)
-- ------------------------------------------------------------
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('5_6_basico','habilidad_numerica','opcion_multiple','original',
 '2 × 3 + 4 =',
 '[{"clave":"A","texto":"8"},{"clave":"B","texto":"9"},{"clave":"C","texto":"11"},{"clave":"D","texto":"10"},{"clave":"E","texto":"12"}]',
 'D','Cálculo mental izquierda-derecha',1),
('5_6_basico','habilidad_numerica','opcion_multiple','original',
 '24 ÷ 3 - 3 =',
 '[{"clave":"A","texto":"4"},{"clave":"B","texto":"5"},{"clave":"C","texto":"6"},{"clave":"D","texto":"7"},{"clave":"E","texto":"8"}]',
 'B','Cálculo mental izquierda-derecha',2),
('5_6_basico','habilidad_numerica','opcion_multiple','original',
 '72 ÷ 9 × 5 =',
 '[{"clave":"A","texto":"30"},{"clave":"B","texto":"35"},{"clave":"C","texto":"45"},{"clave":"D","texto":"50"},{"clave":"E","texto":"40"}]',
 'E','Cálculo mental izquierda-derecha',3);

-- ------------------------------------------------------------
-- INTELIGENCIA PRÁCTICA (Escenarios cotidianos)
-- ------------------------------------------------------------
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, respuesta_correcta, constructo, dificultad) VALUES
('5_6_basico','inteligencia_practica','opcion_multiple','original',
 'Estoy con un grupo de amigos escalando una montaña y uno de ellos se rompe una pierna.',
 '[{"clave":"A","texto":"Me siento con él y le hago compañía"},{"clave":"B","texto":"Entablillo la pierna con palos y cuerdas"},{"clave":"C","texto":"Llamo a la familia para que me diga qué debo hacer"},{"clave":"D","texto":"Le llevo a cuestas hasta el pueblo"}]',
 'B','Resolución práctica de problemas',3),
('5_6_basico','inteligencia_practica','opcion_multiple','original',
 'Llueve mucho y estoy en la calle, sin paraguas, lejos de mi casa.',
 '[{"clave":"A","texto":"Me vuelvo a casa"},{"clave":"B","texto":"No me preocupo y sigo más deprisa"},{"clave":"C","texto":"Espero en un portal hasta que deje de llover"},{"clave":"D","texto":"Me quito la chaqueta y me tapo con ella la cabeza"}]',
 'C','Resolución práctica de problemas',2);

-- ------------------------------------------------------------
-- INTERESES (Escala Likert gusto)
-- ------------------------------------------------------------
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('5_6_basico','intereses','likert_gusto','original',
 'Participar en concursos',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés por actividades competitivas',2),
('5_6_basico','intereses','likert_gusto','original',
 'Ayudar a personas enfermas o necesitadas',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés social/asistencial',2),
('5_6_basico','intereses','likert_gusto','original',
 'Hacer experimentos en el laboratorio',
 '[{"clave":"A","texto":"Me gusta mucho"},{"clave":"B","texto":"Me gusta"},{"clave":"C","texto":"Me es indiferente"},{"clave":"D","texto":"Me desagrada"},{"clave":"E","texto":"Me desagrada mucho"}]',
 'Interés científico',2);

-- ------------------------------------------------------------
-- PERSONALIDAD (Likert frecuencia)
-- ------------------------------------------------------------
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('5_6_basico','personalidad','likert_5','original',
 '¿Sueles ser puntual en la entrega de tus trabajos?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Bastantes veces"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Alguna vez"},{"clave":"E","texto":"Nunca"}]',
 'Responsabilidad',2),
('5_6_basico','personalidad','likert_5','original',
 '¿Cambias con frecuencia de opinión?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Bastantes veces"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Alguna vez"},{"clave":"E","texto":"Nunca"}]',
 'Estabilidad emocional',2);

-- ------------------------------------------------------------
-- ADAPTACIÓN Y MOTIVACIÓN
-- ------------------------------------------------------------
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('5_6_basico','adaptacion_motivacion','likert_5','original',
 '¿Invento fácilmente excusas para no trabajar?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Frecuentemente"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Pocas veces"},{"clave":"E","texto":"Nunca"}]',
 'Motivación escolar',2),
('5_6_basico','adaptacion_motivacion','likert_5','original',
 '¿Mis padres me castigan sin merecerlo?',
 '[{"clave":"A","texto":"Siempre"},{"clave":"B","texto":"Frecuentemente"},{"clave":"C","texto":"Regularmente"},{"clave":"D","texto":"Pocas veces"},{"clave":"E","texto":"Nunca"}]',
 'Adaptación familiar',2);

-- ------------------------------------------------------------
-- HÁBITOS DE ESTUDIO
-- ------------------------------------------------------------
INSERT INTO item_banco (nivel, tipo, formato, origen, enunciado, opciones, constructo, dificultad) VALUES
('5_6_basico','habitos_estudio','si_no','original',
 'Estudio todos los días aunque no tenga prueba al día siguiente.',
 '[{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]',
 'Constancia en el estudio',2),
('5_6_basico','habitos_estudio','si_no','original',
 'Cuando estudio, apago la televisión y el celular para no distraerme.',
 '[{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]',
 'Gestión de distracciones',2),
('5_6_basico','habitos_estudio','si_no','original',
 'Antes de estudiar organizo los materiales que voy a necesitar.',
 '[{"clave":"S","texto":"Sí"},{"clave":"N","texto":"No"}]',
 'Organización del estudio',2);
