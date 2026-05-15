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
  const module = useActiveModule();
  const activeBg = module === "ceis" ? "bg-blue-600" : "bg-emerald-600";

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? `${activeBg} text-white`
            : "text-slate-300 hover:bg-slate-800 hover:text-white",
        ].join(" ")
      }
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const module = useActiveModule();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 z-40">
      {/* Top accent bar */}
      <div className={`h-1 w-full ${module === "ceis" ? "bg-blue-600" : "bg-emerald-600"}`} />

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="text-lg font-bold tracking-tight leading-tight">
          CEIS Maristas
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Orientación Vocacional y Gestión Escolar
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Módulo CEIS */}
        <div>
          <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider ${module === "ceis" ? "text-blue-400" : "text-slate-500"}`}>
            Módulo CEIS
          </div>
          <div className="space-y-1">
            <SidebarLink to="/" label="Banco de Ítems" icon="🗂️" />
            <SidebarLink to="/generar" label="Generador IA" icon="⚡" />
            <SidebarLink to="/pruebas" label="Pruebas" icon="📝" />
            <SidebarLink to="/aplicaciones" label="Aplicaciones" icon="📋" />
          </div>
        </div>

        {/* Módulo Gestión */}
        <div>
          <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider ${module === "gestion" ? "text-emerald-400" : "text-slate-500"}`}>
            Gestión Escolar
          </div>
          <div className="space-y-1">
            <SidebarLink to="/gestion" label="Dashboard" icon="📊" />
            <SidebarLink to="/colegios" label="Colegios" icon="🏫" />
            <SidebarLink to="/cursos" label="Cursos" icon="👥" />
            <SidebarLink to="/estudiantes" label="Estudiantes" icon="🎓" />
            <SidebarLink to="/docentes" label="Docentes" icon="👨‍🏫" />
            <SidebarLink to="/libro" label="Libro de Clases" icon="📖" />
            <SidebarLink to="/apoderados" label="Apoderados" icon="🤝" />
            <SidebarLink to="/mensajes" label="Mensajes" icon="💬" />
            <SidebarLink to="/planes" label="Planes de Mejora" icon="🎯" />
            <SidebarLink to="/pie" label="PIE" icon="♿" />
            <SidebarLink to="/asignaturas" label="Asignaturas" icon="📚" />
            <SidebarLink to="/periodos" label="Períodos" icon="📅" />
          </div>
        </div>
      </nav>

      {/* Usuario + Logout */}
      <div className="px-4 py-3 border-t border-slate-800">
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
        <div className="text-[10px] text-slate-400 capitalize truncate">{usuario.rol}</div>
      </div>
      <button
        onClick={logout}
        className="ml-2 text-xs text-slate-400 hover:text-white transition-colors shrink-0"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  );
}
