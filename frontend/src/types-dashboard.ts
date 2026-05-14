export interface Resumen {
  colegio_id: string;
  colegio_nombre: string;
  total_estudiantes: number;
  total_docentes: number;
  total_cursos: number;
  promedio_general: number | null;
  evaluaciones_este_mes: number;
  asistencia_promedio_30d: number | null;
}

export interface AlertaItem {
  estudiante_id: string;
  nombre: string;
  promedio?: number | null;
  porcentaje_asistencia?: number | null;
  total_negativas?: number | null;
}

export interface Alertas {
  academicas: AlertaItem[];
  asistencia: AlertaItem[];
  conducta: AlertaItem[];
}
