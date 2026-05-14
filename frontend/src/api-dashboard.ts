import axios from "axios";
import type { Alertas, Resumen } from "./types-dashboard";

const api = axios.create({ baseURL: "/api" });

export const DashboardAPI = {
  resumen: (colegio_id: string) =>
    api.get<Resumen>(`/dashboard/resumen/${colegio_id}`).then((r) => r.data),
  alertas: (colegio_id: string) =>
    api.get<Alertas>(`/dashboard/alertas/${colegio_id}`).then((r) => r.data),
};
