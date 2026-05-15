import apiClient from "./api-client";
import type { Alertas, Resumen } from "./types-dashboard";

const api = apiClient;

export const DashboardAPI = {
  resumen: (colegio_id: string) =>
    api.get<Resumen>(`/dashboard/resumen/${colegio_id}`).then((r) => r.data),
  alertas: (colegio_id: string) =>
    api.get<Alertas>(`/dashboard/alertas/${colegio_id}`).then((r) => r.data),
};
