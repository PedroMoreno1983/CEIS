import apiClient from "./api-client";
import type {
  Colegio, Curso, Docente, Estudiante, EstudianteCursoLink,
  Apoderado, Mensaje, PlanMejora, ObjetivoPlan, SeguimientoPlan,
  PIEDiagnostico, PIEIntervencion,
} from "./types-gestion";

const api = apiClient;

// ---------- Colegios ----------

export const ColegiosAPI = {
  list: (params: { estado?: string; dependencia?: string; q?: string } = {}) =>
    api.get<Colegio[]>("/colegios", { params }).then((r) => r.data),
  get: (id: string) => api.get<Colegio>(`/colegios/${id}`).then((r) => r.data),
  create: (data: Partial<Colegio>) =>
    api.post<Colegio>("/colegios", data).then((r) => r.data),
  update: (id: string, data: Partial<Colegio>) =>
    api.patch<Colegio>(`/colegios/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/colegios/${id}`),
};

// ---------- Docentes ----------

export const DocentesAPI = {
  list: (params: { colegio_id?: string; estado?: string; rol?: string; q?: string } = {}) =>
    api.get<Docente[]>("/docentes", { params }).then((r) => r.data),
  get: (id: string) => api.get<Docente>(`/docentes/${id}`).then((r) => r.data),
  create: (data: Partial<Docente>) =>
    api.post<Docente>("/docentes", data).then((r) => r.data),
  update: (id: string, data: Partial<Docente>) =>
    api.patch<Docente>(`/docentes/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/docentes/${id}`),
};

// ---------- Cursos ----------

export const CursosAPI = {
  list: (params: { colegio_id?: string; ano?: number; nivel?: string } = {}) =>
    api.get<Curso[]>("/cursos", { params }).then((r) => r.data),
  get: (id: string) => api.get<Curso>(`/cursos/${id}`).then((r) => r.data),
  create: (data: Partial<Curso>) =>
    api.post<Curso>("/cursos", data).then((r) => r.data),
  update: (id: string, data: Partial<Curso>) =>
    api.patch<Curso>(`/cursos/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/cursos/${id}`),
  estudiantes: (id: string, incluir_inactivos = false) =>
    api.get<Estudiante[]>(`/cursos/${id}/estudiantes`, { params: { incluir_inactivos } })
      .then((r) => r.data),
};

// ---------- Estudiantes ----------

export const EstudiantesAPI = {
  list: (params: { colegio_id?: string; estado?: string; q?: string; skip?: number; limit?: number } = {}) =>
    api.get<Estudiante[]>("/estudiantes", { params }).then((r) => r.data),
  get: (id: string) => api.get<Estudiante>(`/estudiantes/${id}`).then((r) => r.data),
  create: (data: Partial<Estudiante> & { curso_id?: string; numero_lista?: number }) =>
    api.post<Estudiante>("/estudiantes", data).then((r) => r.data),
  update: (id: string, data: Partial<Estudiante>) =>
    api.patch<Estudiante>(`/estudiantes/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/estudiantes/${id}`),
  matricular: (data: { estudiante_id: string; curso_id: string; fecha_inicio?: string; numero_lista?: number }) =>
    api.post<EstudianteCursoLink>("/estudiantes/matricular", data).then((r) => r.data),
  desmatricular: (vinculo_id: string) =>
    api.delete(`/estudiantes/matricular/${vinculo_id}`),
};

// ---------- Apoderados ----------

export const ApoderadosAPI = {
  list: (params: { colegio_id?: string; estado?: string; q?: string } = {}) =>
    api.get<Apoderado[]>("/apoderados", { params }).then((r) => r.data),
  get: (id: string) => api.get<Apoderado>(`/apoderados/${id}`).then((r) => r.data),
  create: (data: Partial<Apoderado>) =>
    api.post<Apoderado>("/apoderados", data).then((r) => r.data),
  update: (id: string, data: Partial<Apoderado>) =>
    api.patch<Apoderado>(`/apoderados/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/apoderados/${id}`),
  vincular: (data: { estudiante_id: string; apoderado_id: string; tipo?: string; es_principal?: boolean; vive_con?: boolean; retira_estudiante?: boolean }) =>
    api.post("/apoderados/vincular", data).then((r) => r.data),
  desvincular: (vinculo_id: string) => api.delete(`/apoderados/vincular/${vinculo_id}`),
  deEstudiante: (estudiante_id: string) =>
    api.get(`/apoderados/estudiante/${estudiante_id}`).then((r) => r.data),
};

// ---------- Mensajes ----------

export const MensajesAPI = {
  list: (params: { colegio_id?: string; tipo?: string; curso_id?: string; importante?: boolean } = {}) =>
    api.get<Mensaje[]>("/mensajes", { params }).then((r) => r.data),
  get: (id: string) => api.get<Mensaje>(`/mensajes/${id}`).then((r) => r.data),
  create: (data: Partial<Mensaje> & { destinatarios?: string[] }) =>
    api.post<Mensaje>("/mensajes", data).then((r) => r.data),
  update: (id: string, data: Partial<Mensaje>) =>
    api.patch<Mensaje>(`/mensajes/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/mensajes/${id}`),
  leer: (mensaje_id: string, apoderado_id: string) =>
    api.post(`/mensajes/${mensaje_id}/leer`, null, { params: { apoderado_id } }).then((r) => r.data),
};

// ---------- Planes de mejora ----------

export const PlanesAPI = {
  list: (params: { estudiante_id?: string; estado?: string } = {}) =>
    api.get<PlanMejora[]>("/planes", { params }).then((r) => r.data),
  get: (id: string) => api.get<PlanMejora>(`/planes/${id}`).then((r) => r.data),
  create: (data: Partial<PlanMejora>) =>
    api.post<PlanMejora>("/planes", data).then((r) => r.data),
  update: (id: string, data: Partial<PlanMejora>) =>
    api.patch<PlanMejora>(`/planes/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/planes/${id}`),
  // Objetivos
  objetivos: (plan_id: string) =>
    api.get<ObjetivoPlan[]>(`/planes/${plan_id}/objetivos`).then((r) => r.data),
  crearObjetivo: (plan_id: string, data: Partial<ObjetivoPlan>) =>
    api.post<ObjetivoPlan>(`/planes/${plan_id}/objetivos`, data).then((r) => r.data),
  actualizarObjetivo: (objetivo_id: string, data: Partial<ObjetivoPlan>) =>
    api.patch<ObjetivoPlan>(`/planes/objetivos/${objetivo_id}`, data).then((r) => r.data),
  eliminarObjetivo: (objetivo_id: string) => api.delete(`/planes/objetivos/${objetivo_id}`),
  // Seguimientos
  seguimientos: (plan_id: string) =>
    api.get<SeguimientoPlan[]>(`/planes/${plan_id}/seguimientos`).then((r) => r.data),
  crearSeguimiento: (plan_id: string, data: Partial<SeguimientoPlan>) =>
    api.post<SeguimientoPlan>(`/planes/${plan_id}/seguimientos`, data).then((r) => r.data),
};

// ---------- PIE ----------

export const PieAPI = {
  diagnosticos: (params: { estudiante_id?: string; estado?: string; tipo?: string } = {}) =>
    api.get<PIEDiagnostico[]>("/pie/diagnosticos", { params }).then((r) => r.data),
  getDiagnostico: (id: string) => api.get<PIEDiagnostico>(`/pie/diagnosticos/${id}`).then((r) => r.data),
  createDiagnostico: (data: Partial<PIEDiagnostico>) =>
    api.post<PIEDiagnostico>("/pie/diagnosticos", data).then((r) => r.data),
  updateDiagnostico: (id: string, data: Partial<PIEDiagnostico>) =>
    api.patch<PIEDiagnostico>(`/pie/diagnosticos/${id}`, data).then((r) => r.data),
  removeDiagnostico: (id: string) => api.delete(`/pie/diagnosticos/${id}`),
  // Intervenciones
  intervenciones: (diagnostico_id: string) =>
    api.get<PIEIntervencion[]>(`/pie/diagnosticos/${diagnostico_id}/intervenciones`).then((r) => r.data),
  createIntervencion: (diagnostico_id: string, data: Partial<PIEIntervencion>) =>
    api.post<PIEIntervencion>(`/pie/diagnosticos/${diagnostico_id}/intervenciones`, data).then((r) => r.data),
  removeIntervencion: (id: string) => api.delete(`/pie/intervenciones/${id}`),
};
