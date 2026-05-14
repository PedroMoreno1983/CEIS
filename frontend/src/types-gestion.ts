// Tipos del módulo de gestión escolar (schema `gestion` en backend)

export type NivelCurso =
  | "nt1" | "nt2"
  | "1_basico" | "2_basico" | "3_basico" | "4_basico"
  | "5_basico" | "6_basico" | "7_basico" | "8_basico"
  | "1_medio" | "2_medio" | "3_medio" | "4_medio";

export type Dependencia =
  | "municipal"
  | "particular_subvencionado"
  | "particular_pagado"
  | "corporacion_municipal"
  | "servicio_local_educacion"
  | "administracion_delegada";

export type EstadoEstudiante = "activo" | "retirado" | "egresado" | "congelado";
export type Genero = "masculino" | "femenino" | "otro" | "sin_informar";
export type EstadoPersona = "activo" | "inactivo";
export type RolDocente =
  | "docente"
  | "profesor_jefe"
  | "orientador"
  | "ute"
  | "inspector"
  | "direccion"
  | "admin_colegio"
  | "psicologo";

export interface Colegio {
  id: string;
  rbd?: string | null;
  nombre: string;
  razon_social?: string | null;
  rut?: string | null;
  dependencia?: Dependencia | null;
  direccion?: string | null;
  comuna?: string | null;
  region?: string | null;
  telefono?: string | null;
  email?: string | null;
  sitio_web?: string | null;
  logo_url?: string | null;
  estado: EstadoPersona;
  creado_en: string;
  actualizado_en: string;
}

export interface Docente {
  id: string;
  colegio_id: string;
  rut?: string | null;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  email?: string | null;
  telefono?: string | null;
  roles: RolDocente[];
  estado: EstadoPersona;
  creado_en: string;
  actualizado_en: string;
}

export interface Curso {
  id: string;
  colegio_id: string;
  ano: number;
  nivel: NivelCurso;
  letra: string;
  profesor_jefe_id?: string | null;
  profesor_jefe_nombre?: string | null;
  num_estudiantes?: number | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Estudiante {
  id: string;
  colegio_id: string;
  rut: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  fecha_nacimiento?: string | null;
  genero?: Genero | null;
  direccion?: string | null;
  comuna?: string | null;
  email_personal?: string | null;
  estado: EstadoEstudiante;
  fecha_ingreso?: string | null;
  fecha_retiro?: string | null;
  observaciones?: string | null;
  curso_actual_id?: string | null;
  curso_actual_label?: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface EstudianteCursoLink {
  id: string;
  estudiante_id: string;
  curso_id: string;
  fecha_inicio: string;
  fecha_termino?: string | null;
  numero_lista?: number | null;
  activo: boolean;
  creado_en: string;
}

// ---------- Labels para UI ----------

export const NIVEL_CURSO_LABELS: Record<NivelCurso, string> = {
  nt1: "NT1 (Pre-Kinder)",
  nt2: "NT2 (Kinder)",
  "1_basico": "1° Básico",
  "2_basico": "2° Básico",
  "3_basico": "3° Básico",
  "4_basico": "4° Básico",
  "5_basico": "5° Básico",
  "6_basico": "6° Básico",
  "7_basico": "7° Básico",
  "8_basico": "8° Básico",
  "1_medio": "1° Medio",
  "2_medio": "2° Medio",
  "3_medio": "3° Medio",
  "4_medio": "4° Medio",
};

export const DEPENDENCIA_LABELS: Record<Dependencia, string> = {
  municipal: "Municipal",
  particular_subvencionado: "Particular subvencionado",
  particular_pagado: "Particular pagado",
  corporacion_municipal: "Corporación municipal",
  servicio_local_educacion: "Servicio local de educación",
  administracion_delegada: "Administración delegada",
};

export const ROL_DOCENTE_LABELS: Record<RolDocente, string> = {
  docente: "Docente",
  profesor_jefe: "Profesor/a jefe",
  orientador: "Orientador/a",
  ute: "UTE",
  inspector: "Inspector/a",
  direccion: "Dirección",
  admin_colegio: "Admin colegio",
  psicologo: "Psicólogo/a",
};

export const GENERO_LABELS: Record<Genero, string> = {
  masculino: "Masculino",
  femenino: "Femenino",
  otro: "Otro",
  sin_informar: "Sin informar",
};

export const ESTADO_ESTUDIANTE_LABELS: Record<EstadoEstudiante, string> = {
  activo: "Activo",
  retirado: "Retirado",
  egresado: "Egresado",
  congelado: "Congelado",
};

export const NIVEL_CURSO_ORDER: NivelCurso[] = [
  "nt1", "nt2",
  "1_basico", "2_basico", "3_basico", "4_basico",
  "5_basico", "6_basico", "7_basico", "8_basico",
  "1_medio", "2_medio", "3_medio", "4_medio",
];


// ------------------------------------------------------------
// Apoderados
// ------------------------------------------------------------

export type TipoApoderado =
  | "padre" | "madre" | "tutor_legal"
  | "abuelo" | "abuela" | "tio" | "tia" | "otro";

export interface Apoderado {
  id: string;
  colegio_id: string;
  rut?: string | null;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  email?: string | null;
  telefono?: string | null;
  telefono_alt?: string | null;
  profesion?: string | null;
  direccion?: string | null;
  comuna?: string | null;
  estado: EstadoPersona;
  creado_en: string;
  actualizado_en: string;
}

export interface EstudianteApoderado {
  id: string;
  estudiante_id: string;
  apoderado_id: string;
  tipo: TipoApoderado;
  es_principal: boolean;
  vive_con: boolean;
  retira_estudiante: boolean;
  observaciones?: string | null;
  creado_en: string;
}

export const TIPO_APODERADO_LABELS: Record<TipoApoderado, string> = {
  padre: "Padre",
  madre: "Madre",
  tutor_legal: "Tutor legal",
  abuelo: "Abuelo",
  abuela: "Abuela",
  tio: "Tío",
  tia: "Tía",
  otro: "Otro",
};


// ------------------------------------------------------------
// Mensajes
// ------------------------------------------------------------

export type TipoMensaje = "individual" | "curso" | "general";

export interface Mensaje {
  id: string;
  colegio_id: string;
  autor_docente_id?: string | null;
  tipo: TipoMensaje;
  asunto: string;
  contenido: string;
  importante: boolean;
  curso_id?: string | null;
  creado_en: string;
  // Enriquecidos
  autor_nombre?: string | null;
  num_destinatarios?: number | null;
  num_leidos?: number | null;
}

export interface MensajeDestinatario {
  id: string;
  mensaje_id: string;
  apoderado_id: string;
  estudiante_id?: string | null;
  leido_en?: string | null;
  creado_en: string;
}

export const TIPO_MENSAJE_LABELS: Record<TipoMensaje, string> = {
  individual: "Individual",
  curso: "Curso",
  general: "General",
};


// ------------------------------------------------------------
// Planes de mejora
// ------------------------------------------------------------

export type EstadoPlan = "borrador" | "activo" | "logrado" | "no_logrado" | "cerrado";
export type PrioridadObjetivo = "alta" | "media" | "baja";
export type EstadoObjetivo = "pendiente" | "en_curso" | "logrado" | "no_logrado";

export interface PlanMejora {
  id: string;
  estudiante_id: string;
  autor_docente_id?: string | null;
  titulo: string;
  descripcion?: string | null;
  estado: EstadoPlan;
  fecha_inicio: string;
  fecha_termino_estim?: string | null;
  fecha_termino_real?: string | null;
  creado_en: string;
  actualizado_en: string;
  // Enriquecidos
  estudiante_nombre?: string | null;
  autor_nombre?: string | null;
  num_objetivos?: number | null;
}

export interface ObjetivoPlan {
  id: string;
  plan_id: string;
  descripcion: string;
  prioridad: PrioridadObjetivo;
  estado: EstadoObjetivo;
  fecha_objetivo?: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface SeguimientoPlan {
  id: string;
  plan_id: string;
  fecha: string;
  autor_docente_id?: string | null;
  descripcion: string;
  creado_en: string;
  // Enriquecido
  autor_nombre?: string | null;
}

export const ESTADO_PLAN_LABELS: Record<EstadoPlan, string> = {
  borrador: "Borrador",
  activo: "Activo",
  logrado: "Logrado",
  no_logrado: "No logrado",
  cerrado: "Cerrado",
};

export const PRIORIDAD_OBJETIVO_LABELS: Record<PrioridadObjetivo, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const ESTADO_OBJETIVO_LABELS: Record<EstadoObjetivo, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  logrado: "Logrado",
  no_logrado: "No logrado",
};


// ------------------------------------------------------------
// PIE
// ------------------------------------------------------------

export type TipoPie = "permanente" | "transitorio";
export type EstadoPie = "activo" | "egresado" | "derivado" | "cerrado";

export interface PIEDiagnostico {
  id: string;
  estudiante_id: string;
  tipo: TipoPie;
  diagnostico: string;
  fecha_diagnostico: string;
  profesional_responsable?: string | null;
  estado: EstadoPie;
  fecha_ingreso_pie?: string | null;
  fecha_egreso_pie?: string | null;
  observaciones?: string | null;
  creado_en: string;
  actualizado_en: string;
  // Enriquecidos
  estudiante_nombre?: string | null;
  num_intervenciones?: number | null;
}

export interface PIEIntervencion {
  id: string;
  diagnostico_id: string;
  fecha: string;
  profesional: string;
  duracion_minutos?: number | null;
  descripcion: string;
  observaciones?: string | null;
  creado_en: string;
}

export const TIPO_PIE_LABELS: Record<TipoPie, string> = {
  permanente: "Permanente",
  transitorio: "Transitorio",
};

export const ESTADO_PIE_LABELS: Record<EstadoPie, string> = {
  activo: "Activo",
  egresado: "Egresado",
  derivado: "Derivado",
  cerrado: "Cerrado",
};

export const ESTADO_PLAN_COLORS: Record<EstadoPlan, string> = {
  borrador: "bg-slate-100 text-slate-700",
  activo: "bg-blue-100 text-blue-700",
  logrado: "bg-emerald-100 text-emerald-700",
  no_logrado: "bg-rose-100 text-rose-700",
  cerrado: "bg-slate-100 text-slate-500",
};

export const ESTADO_OBJETIVO_COLORS: Record<EstadoObjetivo, string> = {
  pendiente: "bg-slate-100 text-slate-700",
  en_curso: "bg-amber-100 text-amber-700",
  logrado: "bg-emerald-100 text-emerald-700",
  no_logrado: "bg-rose-100 text-rose-700",
};

export const ESTADO_PIE_COLORS: Record<EstadoPie, string> = {
  activo: "bg-blue-100 text-blue-700",
  egresado: "bg-emerald-100 text-emerald-700",
  derivado: "bg-amber-100 text-amber-700",
  cerrado: "bg-slate-100 text-slate-500",
};
