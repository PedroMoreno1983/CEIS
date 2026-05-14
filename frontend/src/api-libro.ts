import axios from "axios";
import type {
  Anotacion, Asignatura, Asistencia, AsistenciaResumen,
  Calificacion, Carga, Periodo, Citacion,
} from "./types-libro";

const api = axios.create({ baseURL: "/api" });

// ---------- Asignaturas + carga académica ----------

export const AsignaturasAPI = {
  list: (params: { colegio_id?: string } = {}) =>
    api.get<Asignatura[]>("/asignaturas", { params }).then((r) => r.data),
  get: (id: string) => api.get<Asignatura>(`/asignaturas/${id}`).then((r) => r.data),
  create: (data: Partial<Asignatura>) =>
    api.post<Asignatura>("/asignaturas", data).then((r) => r.data),
  update: (id: string, data: Partial<Asignatura>) =>
    api.patch<Asignatura>(`/asignaturas/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/asignaturas/${id}`),
};

export const CargaAPI = {
  porCurso: (curso_id: string) =>
    api.get<Carga[]>(`/asignaturas/carga/curso/${curso_id}`).then((r) => r.data),
  create: (data: { curso_id: string; asignatura_id: string; docente_id: string; horas_semanales?: number }) =>
    api.post<Carga>("/asignaturas/carga", data).then((r) => r.data),
  remove: (id: string) => api.delete(`/asignaturas/carga/${id}`),
};

// ---------- Períodos ----------

export const PeriodosAPI = {
  list: (params: { colegio_id?: string; ano?: number; activo?: boolean } = {}) =>
    api.get<Periodo[]>("/periodos", { params }).then((r) => r.data),
  get: (id: string) => api.get<Periodo>(`/periodos/${id}`).then((r) => r.data),
  create: (data: Partial<Periodo>) =>
    api.post<Periodo>("/periodos", data).then((r) => r.data),
  update: (id: string, data: Partial<Periodo>) =>
    api.patch<Periodo>(`/periodos/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/periodos/${id}`),
};

// ---------- Calificaciones ----------

export const CalificacionesAPI = {
  list: (params: { estudiante_id?: string; asignatura_id?: string; periodo_id?: string; curso_id?: string } = {}) =>
    api.get<Calificacion[]>("/calificaciones", { params }).then((r) => r.data),
  create: (data: Partial<Calificacion>) =>
    api.post<Calificacion>("/calificaciones", data).then((r) => r.data),
  bulk: (data: {
    asignatura_id: string;
    periodo_id: string;
    docente_id?: string;
    descripcion: string;
    fecha: string;
    ponderacion?: number;
    tipo?: string;
    notas: { estudiante_id: string; nota?: number | null }[];
  }) =>
    api.post<Calificacion[]>("/calificaciones/bulk", data).then((r) => r.data),
  update: (id: string, data: Partial<Calificacion>) =>
    api.patch<Calificacion>(`/calificaciones/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/calificaciones/${id}`),
};

// ---------- Asistencia ----------

export const AsistenciaAPI = {
  delDia: (curso_id: string, fecha: string) =>
    api.get<Asistencia[]>(`/asistencia/curso/${curso_id}`, { params: { fecha } }).then((r) => r.data),
  registrarCurso: (data: {
    curso_id: string;
    fecha: string;
    registros: { estudiante_id: string; estado: string; observacion?: string }[];
    registrada_por_id?: string;
  }) =>
    api.post<Asistencia[]>("/asistencia/curso", data).then((r) => r.data),
  delEstudiante: (estudiante_id: string, desde?: string, hasta?: string) =>
    api.get<Asistencia[]>(`/asistencia/estudiante/${estudiante_id}`, { params: { desde, hasta } }).then((r) => r.data),
  resumen: (estudiante_id: string, desde?: string, hasta?: string) =>
    api.get<AsistenciaResumen>(`/asistencia/estudiante/${estudiante_id}/resumen`, { params: { desde, hasta } }).then((r) => r.data),
};

// ---------- Anotaciones ----------

export const AnotacionesAPI = {
  list: (params: { estudiante_id?: string; curso_id?: string; tipo?: string; desde?: string; hasta?: string } = {}) =>
    api.get<Anotacion[]>("/anotaciones", { params }).then((r) => r.data),
  create: (data: Partial<Anotacion>) =>
    api.post<Anotacion>("/anotaciones", data).then((r) => r.data),
  update: (id: string, data: Partial<Anotacion>) =>
    api.patch<Anotacion>(`/anotaciones/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/anotaciones/${id}`),
};

// ---------- Citaciones ----------

export const CitacionesAPI = {
  list: (params: { estudiante_id?: string; apoderado_id?: string; estado?: string } = {}) =>
    api.get<Citacion[]>("/citaciones", { params }).then((r) => r.data),
  create: (data: Partial<Citacion>) =>
    api.post<Citacion>("/citaciones", data).then((r) => r.data),
  update: (id: string, data: Partial<Citacion>) =>
    api.patch<Citacion>(`/citaciones/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/citaciones/${id}`),
};
