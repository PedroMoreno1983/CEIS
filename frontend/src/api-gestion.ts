import axios from "axios";
import type {
  Colegio, Curso, Docente, Estudiante, EstudianteCursoLink,
} from "./types-gestion";

const api = axios.create({ baseURL: "/api" });

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
