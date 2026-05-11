import { Routes, Route, Link, NavLink, useLocation } from "react-router-dom";
import BankPage from "./pages/BankPage";
import GeneratorPage from "./pages/GeneratorPage";
import TestsPage from "./pages/TestsPage";
import AplicacionesPage from "./pages/AplicacionesPage";
import AplicarPage from "./pages/AplicarPage";

export default function App() {
  const location = useLocation();
  const esModoEstudiante = location.pathname.startsWith("/aplicar/");

  if (esModoEstudiante) {
    return (
      <Routes>
        <Route path="/aplicar/:codigo" element={<AplicarPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-ceis-dark text-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            CEIS · Generador de Instrumentos
          </Link>
          <nav className="flex gap-6 text-sm">
            <NavLink to="/" end className={navClass}>Banco</NavLink>
            <NavLink to="/generar" className={navClass}>Generar</NavLink>
            <NavLink to="/pruebas" className={navClass}>Pruebas</NavLink>
            <NavLink to="/aplicaciones" className={navClass}>Aplicaciones</NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<BankPage />} />
          <Route path="/generar" element={<GeneratorPage />} />
          <Route path="/pruebas" element={<TestsPage />} />
          <Route path="/aplicaciones" element={<AplicacionesPage />} />
        </Routes>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        CEIS Maristas · Sistema generador automático de baterías de orientación vocacional
      </footer>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? "text-ceis-accent font-medium" : "text-slate-300 hover:text-white";
}
