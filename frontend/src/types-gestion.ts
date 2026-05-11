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
