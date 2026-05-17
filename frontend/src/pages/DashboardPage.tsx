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

  const colegioSel = colegios.find((c) => c.id === colegioId);

  return (
    <div className="space-y-5">
      {/* Selector de colegio estilizado */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <select
            value={colegioId}
            onChange={(e) => setColegioId(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 cursor-pointer"
          >
            {colegios.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5"/></svg>
        </div>
        {colegioSel && (
          <span className="text-xs text-slate-400">{colegioSel.direccion || ""}</span>
        )}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Cargando…
        </div>
      ) : resumen ? (
        <>
          {/* KPIs — fila única con iconos, sin arcoíris */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi label="Estudiantes" value={resumen.total_estudiantes} icon={<UsersIcon />} />
            <Kpi label="Docentes" value={resumen.total_docentes} icon={<TeacherIcon />} />
            <Kpi label="Cursos" value={resumen.total_cursos} icon={<BookIcon />} />
            <Kpi label="Evaluaciones" value={resumen.evaluaciones_este_mes} icon={<DocIcon />} />
            <Kpi 
              label="Promedio" 
              value={resumen.promedio_general != null ? resumen.promedio_general.toFixed(1) : "—"} 
              icon={<StarIcon />}
              alert={resumen.promedio_general != null && resumen.promedio_general < 4}
            />
            <Kpi 
              label="Asistencia" 
              value={resumen.asistencia_promedio_30d != null ? `${resumen.asistencia_promedio_30d.toFixed(1)}%` : "—"} 
              icon={<CheckIcon />}
              alert={resumen.asistencia_promedio_30d != null && resumen.asistencia_promedio_30d < 70}
            />
          </div>

          {/* Alertas */}
          {alertas && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <AlertaCard
                titulo="Alertas académicas"
                subtitulo="Promedio < 4.0"
                icon={<AlertIcon />}
                color="red"
                items={alertas.academicas.map((a) => ({ id: a.estudiante_id, nombre: a.nombre, metrica: a.promedio != null ? a.promedio.toFixed(1) : undefined }))}
                empty="¡Todos los estudiantes van bien! 🎉"
              />
              <AlertaCard
                titulo="Asistencia baja"
                subtitulo="< 70% últimos 30 días"
                icon={<AlertIcon />}
                color="orange"
                items={alertas.asistencia.map((a) => ({ id: a.estudiante_id, nombre: a.nombre, metrica: `${a.porcentaje_asistencia?.toFixed(1)}%` }))}
                empty="Buena asistencia general 👍"
              />
              <AlertaCard
                titulo="Conducta"
                subtitulo="Anotaciones negativas recientes"
                icon={<AlertIcon />}
                color="amber"
                items={alertas.conducta.map((a) => ({ id: a.estudiante_id, nombre: a.nombre, metrica: a.total_negativas ?? 0 }))}
                empty="Sin problemas de conducta ✨"
                suffix=" negativas"
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

/* ── KPI compacto con icono ── */
function Kpi({ label, value, icon, alert }: {
  label: string; value: string | number; icon: React.ReactNode; alert?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
        {icon}
      </div>
      <div>
        <div className={`text-xl font-bold ${alert ? "text-red-500" : "text-slate-800"}`}>{value}</div>
        <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

/* ── Card de alerta ── */
function AlertaCard({ titulo, subtitulo, icon, color, items, empty, suffix = "" }: {
  titulo: string; subtitulo: string; icon: React.ReactNode;
  color: "red" | "orange" | "amber";
  items: { id: string; nombre: string; metrica?: string | number }[];
  empty: string;
  suffix?: string;
}) {
  const colorMap = {
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100", badge: "bg-red-100 text-red-700" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100", badge: "bg-orange-100 text-orange-700" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", badge: "bg-amber-100 text-amber-700" },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className={`px-4 py-3 ${c.bg} border-b ${c.border}`}>
        <div className="flex items-center gap-2">
          <span className={c.text}>{icon}</span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{titulo}</h3>
            <p className="text-[11px] text-slate-500">{subtitulo}</p>
          </div>
          {items.length > 0 && (
            <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{items.length}</span>
          )}
        </div>
      </div>
      <div className="p-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">{empty}</p>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <Link 
                key={item.id} 
                to={`/estudiantes/${item.id}`}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700">{item.nombre}</span>
                {item.metrica != null && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${c.badge}`}>
                    {item.metrica}{suffix}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Iconos ── */
function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function TeacherIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function BookIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
function DocIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function StarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function CheckIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function AlertIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
