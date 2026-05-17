import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CEIS_ROUTES = ["/", "/generar", "/pruebas", "/aplicaciones"];

function useActiveModule(): "ceis" | "gestion" {
  const { pathname } = useLocation();
  return CEIS_ROUTES.includes(pathname) ? "ceis" : "gestion";
}

function SidebarLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: string;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors",
          isActive
            ? "bg-white/15 text-white font-semibold"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        ].join(" ")
      }
    >
      <span className="text-base opacity-80">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

const CEIS_LINKS = [
  { to: "/", label: "Banco de Ítems", icon: "🗂️" },
  { to: "/generar", label: "Generador IA", icon: "⚡" },
  { to: "/pruebas", label: "Pruebas", icon: "📝" },
  { to: "/aplicaciones", label: "Aplicaciones", icon: "📋" },
];

const GESTION_LINKS = [
  { to: "/gestion", label: "Inicio", icon: "🏠", roles: ["admin", "directivo", "orientador", "docente", "apoderado"] },
  { to: "/libro", label: "Libro de Clases", icon: "📖", roles: ["admin", "directivo", "orientador", "docente"] },
  { to: "/estudiantes", label: "Estudiantes", icon: "🎓", roles: ["admin", "directivo", "orientador", "docente"] },
  { to: "/cursos", label: "Cursos", icon: "👥", roles: ["admin", "directivo", "docente"] },
  { to: "/mensajes", label: "Comunicaciones", icon: "💬", roles: ["admin", "directivo", "orientador", "docente", "apoderado"] },
  { to: "/colegios", label: "Colegios", icon: "🏫", roles: ["admin", "directivo"] },
  { to: "/docentes", label: "Docentes", icon: "👨‍🏫", roles: ["admin", "directivo"] },
  { to: "/apoderados", label: "Apoderados", icon: "🤝", roles: ["admin", "directivo", "orientador"] },
  { to: "/planes", label: "Planes de Mejora", icon: "🎯", roles: ["admin", "directivo", "orientador"] },
  { to: "/pie", label: "PIE", icon: "♿", roles: ["admin", "directivo", "orientador"] },
  { to: "/asignaturas", label: "Asignaturas", icon: "📚", roles: ["admin", "directivo", "docente"] },
  { to: "/periodos", label: "Períodos", icon: "📅", roles: ["admin", "directivo", "docente"] },
];

export default function Sidebar() {
  const module = useActiveModule();
  const { usuario } = useAuth();
  const rol = usuario?.rol || "";

  const verCeis = ["admin", "orientador"].includes(rol);
  const linksGestion = GESTION_LINKS.filter((l) => l.roles.includes(rol));

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#1a2b4a] text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="text-lg font-bold tracking-tight leading-tight">
          CEIS Maristas
        </div>
        <div className="text-[11px] text-white/50 mt-0.5">
          Gestión Escolar
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {/* Módulo CEIS */}
        {verCeis && (
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
              Orientación Vocacional
            </div>
            <div className="space-y-0.5">
              {CEIS_LINKS.map((l) => (
                <SidebarLink key={l.to} to={l.to} label={l.label} icon={l.icon} />
              ))}
            </div>
          </div>
        )}

        {/* Módulo Gestión */}
        {linksGestion.length > 0 && (
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
              Gestión Escolar
            </div>
            <div className="space-y-0.5">
              {linksGestion.map((l) => (
                <SidebarLink key={l.to} to={l.to} label={l.label} icon={l.icon} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Usuario + Logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <UserBar />
      </div>
    </aside>
  );
}

function UserBar() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <div className="text-xs font-medium text-white truncate">
          {usuario.nombres} {usuario.apellido_paterno}
        </div>
        <div className="text-[10px] text-white/50 capitalize truncate">{usuario.rol}</div>
      </div>
      <button
        onClick={logout}
        className="ml-2 text-xs text-white/40 hover:text-white transition-colors shrink-0"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  );
}
