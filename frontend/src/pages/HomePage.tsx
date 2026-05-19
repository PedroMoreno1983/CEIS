import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl">
        {/* Tiles principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Tile
            to="/"
            color="blue"
            icon={<InstrumentsIcon />}
            title="Instrumentos"
            desc="Banco de ítems, generador IA, pruebas y aplicaciones"
          />
          <Tile
            to="/gestion"
            color="slate"
            icon={<SchoolIcon />}
            title="Gestión Escolar"
            desc="Estudiantes, cursos, notas, asistencia y comunicaciones"
          />
          <Tile
            to="/prediccion"
            color="violet"
            icon={<ChartIcon />}
            title="Predicción"
            desc="Análisis predictivo y alertas tempranas"
            badge="Próximamente"
          />
        </div>
      </div>
    </div>
  );
}

function Tile({ to, color, icon, title, desc, badge }: {
  to: string; color: "blue" | "slate" | "violet";
  icon: React.ReactNode; title: string; desc: string;
  badge?: string;
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-600",
      hover: "hover:bg-blue-700",
      ring: "ring-blue-200",
      text: "text-blue-600",
      lightBg: "bg-blue-50",
    },
    slate: {
      bg: "bg-slate-700",
      hover: "hover:bg-slate-800",
      ring: "ring-slate-200",
      text: "text-slate-700",
      lightBg: "bg-slate-50",
    },
    violet: {
      bg: "bg-violet-600",
      hover: "hover:bg-violet-700",
      ring: "ring-violet-200",
      text: "text-violet-600",
      lightBg: "bg-violet-50",
    },
  };
  const c = colorMap[color];

  return (
    <Link
      to={to}
      className={`group relative flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:ring-4 ${c.ring}`}
    >
      {/* Icono grande */}
      <div className={`w-20 h-20 rounded-2xl ${c.bg} ${c.hover} flex items-center justify-center text-white shadow-lg mb-5 transition-colors`}>
        {icon}
      </div>

      {/* Badge */}
      {badge && (
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
          {badge}
        </span>
      )}

      {/* Título */}
      <h2 className={`text-xl font-bold ${c.text} mb-2`}>{title}</h2>

      {/* Descripción */}
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>

      {/* Flecha abajo */}
      <div className={`mt-5 w-10 h-10 rounded-full ${c.lightBg} ${c.text} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </Link>
  );
}

/* ── Iconos ── */
function InstrumentsIcon() {
  return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
}
function SchoolIcon() {
  return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>;
}
function ChartIcon() {
  return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
