import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ColegiosAPI } from "../api-gestion";
import { DashboardAPI } from "../api-dashboard";
import type { Colegio } from "../types-gestion";
import type { Alertas, Resumen } from "../types-dashboard";

export default function DashboardPage() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [colegioId, setColegioId] = useState<string>("");
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [alertas, setAlertas] = useState<Alertas | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    ColegiosAPI.list().then((cs) => {
      setColegios(cs);
      if (cs.length && !colegioId) setColegioId(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!colegioId) return;
    setCargando(true);
    Promise.all([
      DashboardAPI.resumen(colegioId),
      DashboardAPI.alertas(colegioId),
    ]).then(([r, a]) => {
      setResumen(r);
      setAlertas(a);
      setCargando(false);
    });
  }, [colegioId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <select
          value={colegioId}
          onChange={(e) => setColegioId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          {colegios.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando…</div>
      ) : resumen ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Estudiantes" value={resumen.total_estudiantes} color="blue" />
            <KpiCard label="Docentes" value={resumen.total_docentes} color="emerald" />
            <KpiCard label="Cursos" value={resumen.total_cursos} color="amber" />
            <KpiCard label="Evaluaciones este mes" value={resumen.evaluaciones_este_mes} color="violet" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KpiCard
              label="Promedio general"
              value={resumen.promedio_general != null ? resumen.promedio_general.toFixed(1) : "—"}
              color={resumen.promedio_general != null && resumen.promedio_general < 4 ? "rose" : "emerald"}
              suffix=""
            />
            <KpiCard
              label="Asistencia promedio (30d)"
              value={resumen.asistencia_promedio_30d != null ? resumen.asistencia_promedio_30d.toFixed(1) : "—"}
              color={resumen.asistencia_promedio_30d != null && resumen.asistencia_promedio_30d < 70 ? "rose" : "emerald"}
              suffix="%"
            />
          </div>

          {/* Alertas */}
          {alertas && (
            <div className="space-y-6">
              <AlertaSection
                titulo="Alertas académicas"
                subtitulo="Estudiantes con promedio general < 4.0"
                color="rose"
                items={alertas.academicas.map((a) => ({
                  id: a.estudiante_id,
                  nombre: a.nombre,
                  metrica: `Prom. ${a.promedio?.toFixed(1)}`,
                }))}
              />
              <AlertaSection
                titulo="Alertas de asistencia"
                subtitulo="Estudiantes con asistencia < 70% en los últimos 30 días"
                color="amber"
                items={alertas.asistencia.map((a) => ({
                  id: a.estudiante_id,
                  nombre: a.nombre,
                  metrica: `${a.porcentaje_asistencia?.toFixed(1)}%`,
                }))}
              />
              <AlertaSection
                titulo="Alertas de conducta"
                subtitulo="Estudiantes con anotaciones negativas recientes"
                color="orange"
                items={alertas.conducta.map((a) => ({
                  id: a.estudiante_id,
                  nombre: a.nombre,
                  metrica: `${a.total_negativas} negativas`,
                }))}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-slate-400">Selecciona un colegio.</div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color, suffix = "" }: {
  label: string; value: string | number; color: string; suffix?: string;
}) {
  const map: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    violet: "bg-violet-50 border-violet-200 text-violet-800",
    rose: "bg-rose-50 border-rose-200 text-rose-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
  };
  return (
    <div className={`p-5 rounded-lg border ${map[color] || map.blue}`}>
      <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}{suffix}</div>
    </div>
  );
}

function AlertaSection({ titulo, subtitulo, color, items }: {
  titulo: string; subtitulo: string; color: string;
  items: { id: string; nombre: string; metrica: string }[];
}) {
  const borderMap: Record<string, string> = {
    rose: "border-rose-200",
    amber: "border-amber-200",
    orange: "border-orange-200",
  };
  const badgeMap: Record<string, string> = {
    rose: "bg-rose-100 text-rose-800",
    amber: "bg-amber-100 text-amber-800",
    orange: "bg-orange-100 text-orange-800",
  };
  return (
    <div className={`bg-white rounded-lg border ${borderMap[color]} p-5`}>
      <h2 className="font-bold text-slate-900">{titulo}</h2>
      <p className="text-sm text-slate-500 mb-4">{subtitulo}</p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Sin alertas en esta categoría. 🎉</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded border border-slate-100 hover:bg-slate-50">
              <Link to={`/estudiantes/${item.id}`} className="font-medium text-slate-800 hover:text-ceis-primary">
                {item.nombre}
              </Link>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeMap[color]}`}>{item.metrica}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
