import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-slate-900">Bienvenido a CEIS</h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto">
          Plataforma integral de gestión escolar para el Instituto Marista. Selecciona un módulo para comenzar.
        </p>
      </div>

      {/* Cards de módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Instrumentos */}
        <ModuloCard
          color="blue"
          icon={<InstrumentsIcon />}
          title="Instrumentos"
          description="Genera bancos de ítems, pruebas de orientación vocacional y aplica evaluaciones con apoyo de IA."
          links={[
            { to: "/", label: "Banco de Ítems" },
            { to: "/generar", label: "Generador IA" },
            { to: "/pruebas", label: "Pruebas" },
            { to: "/aplicaciones", label: "Aplicaciones" },
          ]}
        />

        {/* Gestión Escolar */}
        <ModuloCard
          color="slate"
          icon={<SchoolIcon />}
          title="Gestión Escolar"
          description="Administra estudiantes, cursos, notas, asistencia, comunicaciones y seguimiento académico."
          links={[
            { to: "/gestion", label: "Dashboard" },
            { to: "/libro", label: "Libro de Clases" },
            { to: "/estudiantes", label: "Estudiantes" },
            { to: "/cursos", label: "Cursos" },
            { to: "/mensajes", label: "Comunicaciones" },
          ]}
        />

        {/* Predicción */}
        <ModuloCard
          color="violet"
          icon={<PredictionIcon />}
          title="Predicción"
          description="Análisis predictivo de resultados académicos, alertas tempranas y tendencias institucionales."
          badge="Próximamente"
          links={[]}
        />
      </div>

      {/* Stats rápidas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickLink to="/libro" icon={<BookIcon />} label="Libro de Clases" />
          <QuickLink to="/estudiantes" icon={<UsersIcon />} label="Estudiantes" />
          <QuickLink to="/generar" icon={<SparkIcon />} label="Generador IA" />
          <QuickLink to="/mensajes" icon={<ChatIcon />} label="Comunicaciones" />
        </div>
      </div>
    </div>
  );
}

function ModuloCard({ color, icon, title, description, links, badge }: {
  color: "blue" | "slate" | "violet";
  icon: React.ReactNode;
  title: string;
  description: string;
  links: { to: string; label: string }[];
  badge?: string;
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-700",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      hover: "hover:border-blue-300 hover:shadow-blue-100",
      linkHover: "hover:bg-blue-50 hover:text-blue-700",
    },
    slate: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-700",
      iconBg: "bg-slate-100",
      iconText: "text-slate-600",
      hover: "hover:border-slate-300 hover:shadow-slate-100",
      linkHover: "hover:bg-slate-50 hover:text-slate-700",
    },
    violet: {
      bg: "bg-violet-50",
      border: "border-violet-100",
      text: "text-violet-700",
      iconBg: "bg-violet-100",
      iconText: "text-violet-600",
      hover: "hover:border-violet-300 hover:shadow-violet-100",
      linkHover: "hover:bg-violet-50 hover:text-violet-700",
    },
  };
  const c = colorMap[color];

  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-6 transition-all hover:shadow-lg ${c.hover}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl ${c.iconBg} ${c.iconText} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${c.text}`}>{title}</h3>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {badge}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-4 leading-relaxed">{description}</p>
      {links.length > 0 && (
        <div className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 transition-colors ${c.linkHover}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all group"
    >
      <span className="text-slate-400 group-hover:text-blue-500 transition-colors">{icon}</span>
      <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{label}</span>
    </Link>
  );
}

/* ── Iconos ── */
function InstrumentsIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
}
function SchoolIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>;
}
function PredictionIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function BookIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function SparkIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function ChatIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
