// Tipos del módulo Libro de clases

export type TipoPeriodo = "semestral" | "trimestral" | "cuatrimestral" | "anual";
export type EstadoAsistencia = "presente" | "ausente" | "atrasado" | "justificado" | "retirado";
export type TipoAnotacion = "positiva" | "negativa" | "neutra";

export interface Asignatura {
  id: string;
  colegio_id: string;
  codigo: string;
  nombre: string;
  categoria?: string | null;
  color?: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Carga {
  id: string;
  curso_id: string;
  asignatura_id: string;
  docente_id: string;
  horas_semanales?: number | null;
  creado_en: string;
  asignatura_codigo?: string | null;
  asignatura_nombre?: string | null;
  docente_nombre?: string | null;
}

export interface Periodo {
  id: string;
  colegio_id: string;
  ano: number;
  tipo: TipoPeriodo;
  numero: number;
  nombre: string;
  fecha_inicio: string;
  fecha_termino: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Calificacion {
  id: string;
  estudiante_id: string;
  asignatura_id: string;
  periodo_id: string;
  docente_id?: string | null;
  nota?: string | null;  // viene como decimal string
  ponderacion: number;
  tipo?: string | null;
  descripcion: string;
  fecha: string;
  creado_en: string;
  actualizado_en: string;
  estudiante_nombre?: string | null;
  asignatura_codigo?: string | null;
}

export interface Asistencia {
  id: string;
  estudiante_id: string;
  curso_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  observacion?: string | null;
  registrada_por_id?: string | null;
  creado_en: string;
  actualizado_en: string;
  estudiante_nombre?: string | null;
}

export interface AsistenciaResumen {
  estudiante_id: string;
  total_dias: number;
  presentes: number;
  ausentes: number;
  atrasados: number;
  justificados: number;
  porcentaje_asistencia: number | null;
}

export interface Anotacion {
  id: string;
  estudiante_id: string;
  docente_id?: string | null;
  asignatura_id?: string | null;
  fecha: string;
  tipo: TipoAnotacion;
  categoria?: string | null;
  descripcion: string;
  creado_en: string;
  estudiante_nombre?: string | null;
  docente_nombre?: string | null;
  asignatura_nombre?: string | null;
}

// ---------- Labels ----------

export const TIPO_PERIODO_LABELS: Record<TipoPeriodo, string> = {
  semestral: "Semestral",
  trimestral: "Trimestral",
  cuatrimestral: "Cuatrimestral",
  anual: "Anual",
};

export const ESTADO_ASISTENCIA_LABELS: Record<EstadoAsistencia, string> = {
  presente: "Presente",
  ausente: "Ausente",
  atrasado: "Atrasado",
  justificado: "Justificado",
  retirado: "Retirado",
};

export const ESTADO_ASISTENCIA_COLOR: Record<EstadoAsistencia, string> = {
  presente: "bg-emerald-100 text-emerald-800",
  ausente: "bg-rose-100 text-rose-800",
  atrasado: "bg-amber-100 text-amber-800",
  justificado: "bg-sky-100 text-sky-800",
  retirado: "bg-slate-200 text-slate-700",
};

export const ESTADO_ASISTENCIA_LETRA: Record<EstadoAsistencia, string> = {
  presente: "P",
  ausente: "A",
  atrasado: "T",
  justificado: "J",
  retirado: "R",
};

export const TIPO_ANOTACION_LABELS: Record<TipoAnotacion, string> = {
  positiva: "Positiva",
  negativa: "Negativa",
  neutra: "Neutra",
};

export const TIPO_ANOTACION_COLOR: Record<TipoAnotacion, string> = {
  positiva: "bg-emerald-100 text-emerald-800 border-emerald-200",
  negativa: "bg-rose-100 text-rose-800 border-rose-200",
  neutra:   "bg-slate-100 text-slate-700 border-slate-200",
};

export type EstadoCitacion = "pendiente" | "confirmada" | "cumplida" | "cancelada" | "no_asiste";

export interface Citacion {
  id: string;
  estudiante_id: string;
  apoderado_id?: string | null;
  motivo: string;
  fecha_citacion: string;
  hora?: string | null;
  lugar?: string | null;
  estado: EstadoCitacion;
  resultado?: string | null;
  creado_en: string;
  actualizado_en: string;
  estudiante_nombre?: string | null;
  apoderado_nombre?: string | null;
}

export const ESTADO_CITACION_LABELS: Record<EstadoCitacion, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cumplida: "Cumplida",
  cancelada: "Cancelada",
  no_asiste: "No asistió",
};

export const ESTADO_CITACION_COLOR: Record<EstadoCitacion, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmada: "bg-blue-100 text-blue-800",
  cumplida: "bg-emerald-100 text-emerald-800",
  cancelada: "bg-slate-100 text-slate-600",
  no_asiste: "bg-rose-100 text-rose-800",
};
