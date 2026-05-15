import { useLocation } from "react-router-dom";

const CEIS_ROUTES = ["/", "/generar", "/pruebas", "/aplicaciones"];

export default function ModuleHeader() {
  const { pathname } = useLocation();
  const isCeis = CEIS_ROUTES.includes(pathname);

  if (isCeis) {
    return (
      <div className="mb-6 flex items-center gap-3">
        <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-blue-700">
            Módulo CEIS
          </h2>
          <p className="text-xs text-slate-500">
            Instrumentos de Orientación Vocacional
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="w-1.5 h-8 bg-emerald-600 rounded-full" />
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Gestión Escolar
        </h2>
        <p className="text-xs text-slate-500">
          Administración de colegios, cursos, estudiantes y familias
        </p>
      </div>
    </div>
  );
}
