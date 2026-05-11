export type Nivel = "5_6_basico" | "8_basico" | "2_medio" | "4_medio";

export type Tipo =
  | "razonamiento_verbal"
  | "vocabulario"
  | "razonamiento_numerico"
  | "habilidad_numerica"
  | "habitos_estudio"
  | "comprension_lectora"
  | "rapidez_lectora"
  | "inteligencia_practica"
  | "intereses"
  | "personalidad"
  | "adaptacion_motivacion"
  | "razonamiento_abstracto"
  | "razonamiento_espacial"
  | "razonamiento_mecanico"
  | "aptitud_espacial"
  | "atencion"
  | "memoria_visual"
  | "memoria_auditiva"
  | "rapidez_perceptiva"
  | "estrategias_aprendizaje"
  | "elecciones_profesionales"
  | "calculo_aritmetico"
  | "calculo_numerico"
  | "evaluacion_integral";

export type Estado = "borrador" | "revision" | "aprobado" | "rechazado";
export type Origen = "original" | "generado";
export type Formato = "opcion_multiple" | "likert_5" | "likert_gusto" | "si_no" | "texto_libre";

export interface Opcion {
  clave: string;
  texto: string;
}

export interface Item {
  id: string;
  nivel: Nivel;
  tipo: Tipo;
  formato: Formato;
  origen: Origen;
  enunciado: string;
  instruccion?: string | null;
  texto_base?: string | null;
  opciones?: Opcion[] | null;
  respuesta_correcta?: string | null;
  dificultad?: number | null;
  constructo?: string | null;
  tiempo_segundos?: number | null;
  estado: Estado;
  confianza_generacion?: number | null;
  justificacion_generacion?: string | null;
  imagen_url?: string | null;
  imagen_opciones_url?: string | null;
  requiere_imagen?: boolean;
  pagina_origen?: number | null;
  cuadernillo_origen?: string | null;
  creado_en: string;
  revisado_en?: string | null;
  revisado_por?: string | null;
}

export interface ItemList {
  total: number;
  items: Item[];
}

export interface Instrumento {
  id: string;
  nombre: string;
  nivel: Nivel;
  tipo: Tipo;
  descripcion?: string | null;
  instrucciones?: string | null;
  tiempo_minutos?: number | null;
  num_items?: number | null;
  estado: Estado;
  creado_en: string;
  creado_por?: string | null;
  items: Item[];
}

export interface EnsamblarAutoRequest {
  nombre: string;
  nivel: Nivel;
  tipo: Tipo;
  cantidad: number;
  solo_aprobados?: boolean;
  creado_por?: string;
}

export interface Aplicacion {
  id: string;
  instrumento_id: string;
  codigo: string;
  estudiante_nombre?: string | null;
  estudiante_curso?: string | null;
  estudiante_rut?: string | null;
  estado: "pendiente" | "en_curso" | "finalizada" | "cancelada";
  iniciada_en?: string | null;
  finalizada_en?: string | null;
  tiempo_total_segundos?: number | null;
  puntaje_correctas?: number | null;
  puntaje_total?: number | null;
  creado_en: string;
}

export interface AplicacionParaResponder {
  codigo: string;
  estado: string;
  instrumento_nombre: string;
  instrumento_tipo: Tipo;
  instrumento_nivel: Nivel;
  instrucciones?: string | null;
  tiempo_minutos?: number | null;
  items: Item[];
  estudiante_nombre?: string | null;
  estudiante_curso?: string | null;
  respuestas_previas: Record<string, string>;
}

export interface SiguienteItemResponse {
  item: Item | null;
  theta_actual: number;
  se_actual: number;
  n_respondidos: number;
  motivo_termino?: string | null;
}

export interface ResultadosAplicacion {
  aplicacion_id: string;
  instrumento_nombre: string;
  instrumento_tipo: Tipo;
  estudiante: { nombre: string | null; curso: string | null; rut: string | null };
  total_items: number;
  items_respondidos: number;
  correctas: number | null;
  porcentaje: number | null;
  tiempo_total_segundos: number | null;
  por_constructo: Array<{
    constructo: string;
    total: number;
    respondidas: number;
    correctas: number;
    es_likert: boolean;
  }>;
  detalle: Array<{
    item_id: string;
    enunciado: string;
    imagen_url?: string | null;
    tipo: Tipo;
    constructo?: string | null;
    respuesta?: string | null;
    respuesta_correcta?: string | null;
    correcta?: boolean | null;
    tiempo_segundos?: number | null;
  }>;
}

export interface GeneracionRequest {
  nivel: Nivel;
  tipo: Tipo;
  cantidad: number;
  dificultad_objetivo?: number;
  constructo?: string;
  instrucciones_extra?: string;
}

export interface GeneracionResponse {
  sesion_id: string;
  items_generados: Item[];
  tokens_usados?: number;
  duracion_ms?: number;
  num_solicitados: number;
  num_generados: number;
}

export const NIVEL_LABELS: Record<Nivel, string> = {
  "5_6_basico": "5° y 6° Básico",
  "8_basico": "8° Básico",
  "2_medio": "2° Medio",
  "4_medio": "4° Medio",
};

export const TIPO_LABELS: Record<Tipo, string> = {
  razonamiento_verbal: "Razonamiento Verbal (Analogías)",
  vocabulario: "Vocabulario (Sinónimos)",
  razonamiento_numerico: "Razonamiento Numérico (Series)",
  habilidad_numerica: "Habilidad Numérica (Cálculo)",
  habitos_estudio: "Hábitos de Estudio",
  comprension_lectora: "Comprensión Lectora",
  rapidez_lectora: "Rapidez Lectora",
  inteligencia_practica: "Inteligencia Práctica",
  intereses: "Intereses",
  personalidad: "Personalidad",
  adaptacion_motivacion: "Adaptación y Motivación",
  razonamiento_abstracto: "Razonamiento Abstracto",
  razonamiento_espacial: "Razonamiento Espacial",
  razonamiento_mecanico: "Razonamiento Mecánico",
  aptitud_espacial: "Aptitud Espacial",
  atencion: "Atención",
  memoria_visual: "Memoria Visual",
  memoria_auditiva: "Memoria Auditiva",
  rapidez_perceptiva: "Rapidez Perceptiva",
  estrategias_aprendizaje: "Estrategias de Aprendizaje",
  elecciones_profesionales: "Elecciones Profesionales",
  calculo_aritmetico: "Cálculo Aritmético",
  calculo_numerico: "Cálculo Numérico",
  evaluacion_integral: "Evaluación Integral (Mixta)" as any,
};

export const TIPOS_VISUALES: Tipo[] = [
  "razonamiento_abstracto", "razonamiento_espacial", "razonamiento_mecanico",
  "aptitud_espacial", "atencion", "memoria_visual", "rapidez_perceptiva",
];
