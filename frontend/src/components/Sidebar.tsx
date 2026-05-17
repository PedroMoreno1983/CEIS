import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type SectionColor = "blue" | "slate" | "violet";

const SECTION_COLORS: Record<SectionColor, { active: string; inactive: string }> = {
  blue: {
    active: "bg-blue-50 text-blue-700 font-semibold shadow-sm",
    inactive: "text-slate-500 hover:bg-blue-50/50 hover:text-blue-600",
  },
  slate: {
    active: "bg-slate-100 text-slate-800 font-semibold shadow-sm",
    inactive: "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
  },
  violet: {
    active: "bg-violet-50 text-violet-700 font-semibold shadow-sm",
    inactive: "text-slate-500 hover:bg-violet-50/50 hover:text-violet-600",
  },
};

function SidebarLink({
  to,
  label,
  icon,
  color = "slate",
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  color?: SectionColor;
}) {
  const colors = SECTION_COLORS[color];
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200",
          isActive ? colors.active : colors.inactive,
        ].join(" ")
      }
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

const INSTRUMENTOS_LINKS = [
  { to: "/", label: "Banco de Ítems", icon: <BankIcon /> },
  { to: "/generar", label: "Generador IA", icon: <SparkIcon /> },
  { to: "/pruebas", label: "Pruebas", icon: <DocIcon /> },
  { to: "/aplicaciones", label: "Aplicaciones", icon: <ClipboardIcon /> },
];

const GESTION_LINKS = [
  { to: "/gestion", label: "Dashboard", icon: <HomeIcon />, roles: ["admin", "directivo", "orientador", "docente", "apoderado"] },
  { to: "/libro", label: "Libro de Clases", icon: <BookIcon />, roles: ["admin", "directivo", "orientador", "docente"] },
  { to: "/estudiantes", label: "Estudiantes", icon: <GraduationIcon />, roles: ["admin", "directivo", "orientador", "docente"] },
  { to: "/cursos", label: "Cursos", icon: <UsersIcon />, roles: ["admin", "directivo", "docente"] },
  { to: "/mensajes", label: "Comunicaciones", icon: <ChatIcon />, roles: ["admin", "directivo", "orientador", "docente", "apoderado"] },
  { to: "/colegios", label: "Colegios", icon: <SchoolIcon />, roles: ["admin", "directivo"] },
  { to: "/docentes", label: "Docentes", icon: <TeacherIcon />, roles: ["admin", "directivo"] },
  { to: "/apoderados", label: "Apoderados", icon: <HandshakeIcon />, roles: ["admin", "directivo", "orientador"] },
  { to: "/planes", label: "Planes de Mejora", icon: <TargetIcon />, roles: ["admin", "directivo", "orientador"] },
  { to: "/pie", label: "PIE", icon: <HeartIcon />, roles: ["admin", "directivo", "orientador"] },
  { to: "/asignaturas", label: "Asignaturas", icon: <BooksIcon />, roles: ["admin", "directivo", "docente"] },
  { to: "/periodos", label: "Períodos", icon: <CalendarIcon />, roles: ["admin", "directivo", "docente"] },
];

const PREDICCION_LINKS = [
  { to: "/prediccion", label: "Análisis y predicción", icon: <ChartIcon /> },
];

export default function Sidebar() {
  const { usuario } = useAuth();
  const rol = usuario?.rol || "";

  const verInstrumentos = ["admin", "orientador"].includes(rol);
  const linksGestion = GESTION_LINKS.filter((l) => l.roles.includes(rol));

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 flex flex-col z-40">
      {/* Logo */}
      <Link to="/" className="px-5 py-6 block">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-200">
            C
          </div>
          <div>
            <div className="text-[15px] font-bold text-slate-900 leading-tight">
              CEIS Maristas
            </div>
            <div className="text-[11px] text-slate-400">
              Gestión Escolar
            </div>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-hide">
        {/* Instrumentos */}
        {verInstrumentos && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Instrumentos
            </div>
            <div className="space-y-0.5">
              {INSTRUMENTOS_LINKS.map((l) => (
                <SidebarLink key={l.to} to={l.to} label={l.label} icon={l.icon} color="blue" />
              ))}
            </div>
          </div>
        )}

        {/* Gestión Escolar */}
        {linksGestion.length > 0 && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Gestión Escolar
            </div>
            <div className="space-y-0.5">
              {linksGestion.map((l) => (
                <SidebarLink key={l.to} to={l.to} label={l.label} icon={l.icon} color="slate" />
              ))}
            </div>
          </div>
        )}

        {/* Predicción */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Predicción
          </div>
          <div className="space-y-0.5">
            {PREDICCION_LINKS.map((l) => (
              <SidebarLink key={l.to} to={l.to} label={l.label} icon={l.icon} color="violet" />
            ))}
          </div>
        </div>
      </nav>

      {/* Usuario */}
      <div className="px-4 py-4 border-t border-slate-100">
        <UserBar />
      </div>
    </aside>
  );
}

function UserBar() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;
  const iniciales = `${usuario.nombres?.[0] || ""}${usuario.apellido_paterno?.[0] || ""}`.toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
        {iniciales || "U"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-slate-800 truncate">
          {usuario.nombres} {usuario.apellido_paterno}
        </div>
        <div className="text-[11px] text-slate-400 capitalize">{usuario.rol}</div>
      </div>
      <button
        onClick={logout}
        className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
        title="Cerrar sesión"
      >
        <LogoutIcon />
      </button>
    </div>
  );
}

/* ── Iconos outline ── */
function HomeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function BookIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
function GraduationIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>;
}
function UsersIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function ChatIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function SchoolIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>;
}
function TeacherIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function HandshakeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>;
}
function TargetIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
function HeartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function BooksIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
function CalendarIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function BankIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
}
function SparkIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function DocIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function ClipboardIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
}
function ChartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
