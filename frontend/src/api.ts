import apiClient from "./api-client";
import type {
  Item, ItemList, GeneracionRequest, GeneracionResponse,
  Nivel, Tipo, Estado, Origen, Instrumento, EnsamblarAutoRequest,
  Aplicacion, AplicacionParaResponder, ResultadosAplicacion,
  SiguienteItemResponse,
} from "./types";

const api = apiClient;

export interface InventarioRow {
  nivel: Nivel;
  tipo: Tipo;
  total: number;
  con_imagen: number;
}

export const ItemsAPI = {
  inventario: () => api.get<InventarioRow[]>("/items/inventario").then((r) => r.data),

  list: (params: {
    nivel?: Nivel;
    tipo?: Tipo;
    estado?: Estado;
    origen?: Origen;
    skip?: number;
    limit?: number;
  }) => api.get<ItemList>("/items", { params }).then((r) => r.data),

  get: (id: string) => api.get<Item>(`/items/${id}`).then((r) => r.data),

  update: (id: string, data: Partial<Item>) =>
    api.patch<Item>(`/items/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/items/${id}`),
};

export const GeneracionAPI = {
  generar: (req: GeneracionRequest) =>
    api.post<GeneracionResponse>("/generar", req).then((r) => r.data),
  generarVisual: (req: GeneracionRequest) =>
    api.post<GeneracionResponse>("/generar-visual", req).then((r) => r.data),
  generarCreativo: (req: GeneracionRequest) =>
    api.post<GeneracionResponse>("/generar-creativo", req).then((r) => r.data),
};

export const AplicacionesAPI = {
  crear: (instrumento_id: string, datos: Partial<Aplicacion> & {
    es_adaptativa?: boolean; max_items?: number; se_objetivo?: number;
  } = {}) =>
    api.post<Aplicacion>("/aplicaciones", { instrumento_id, ...datos }).then((r) => r.data),
  siguienteItem: (codigo: string) =>
    api.get<SiguienteItemResponse>(`/aplicar/${codigo}/siguiente-item`).then((r) => r.data),
  list: (params: { instrumento_id?: string; estado?: string } = {}) =>
    api.get<Aplicacion[]>("/aplicaciones", { params }).then((r) => r.data),
  remove: (id: string) => api.delete(`/aplicaciones/${id}`),
  cargar: (codigo: string) =>
    api.get<AplicacionParaResponder>(`/aplicar/${codigo}`).then((r) => r.data),
  iniciar: (codigo: string, body: { estudiante_nombre: string; estudiante_curso?: string; estudiante_rut?: string }) =>
    api.post<Aplicacion>(`/aplicar/${codigo}/iniciar`, body).then((r) => r.data),
  responder: (codigo: string, body: { item_id: string; respuesta: string; tiempo_segundos?: number }) =>
    api.post<{ theta_actual: number; se_actual: number }>(`/aplicar/${codigo}/respuesta`, body),
  finalizar: (codigo: string) =>
    api.post<ResultadosAplicacion>(`/aplicar/${codigo}/finalizar`).then((r) => r.data),
  resultados: (aplicacion_id: string) =>
    api.get<ResultadosAplicacion>(`/aplicaciones/${aplicacion_id}/resultados`).then((r) => r.data),
};

export const InstrumentosAPI = {
  list: (params: { nivel?: Nivel; tipo?: Tipo } = {}) =>
    api.get<Instrumento[]>("/instrumentos", { params }).then((r) => r.data),
  get: (id: string) =>
    api.get<Instrumento>(`/instrumentos/${id}`).then((r) => r.data),
  ensamblarAuto: (req: EnsamblarAutoRequest) =>
    api.post<Instrumento>("/instrumentos/auto", req).then((r) => r.data),
  ensamblarMixta: (req: {
    nombre: string;
    nivel: Nivel;
    items_por_tipo: Record<string, number>;
    solo_aprobados?: boolean;
    aleatorizar?: boolean;
  }) => api.post<Instrumento>("/instrumentos/mixta", req).then((r) => r.data),
  remove: (id: string) => api.delete(`/instrumentos/${id}`),
};
