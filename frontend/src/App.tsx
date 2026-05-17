import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import BankPage from "./pages/BankPage";
import GeneratorPage from "./pages/GeneratorPage";
import TestsPage from "./pages/TestsPage";
import AplicacionesPage from "./pages/AplicacionesPage";
import AplicarPage from "./pages/AplicarPage";
import LoginPage from "./pages/LoginPage";

import DashboardPage from "./pages/DashboardPage";
import ColegiosPage from "./pages/ColegiosPage";
import DocentesPage from "./pages/DocentesPage";
import CursosPage from "./pages/CursosPage";
import EstudiantesPage from "./pages/EstudiantesPage";
import EstudiantePerfilPage from "./pages/EstudiantePerfilPage";
import AsignaturasPage from "./pages/AsignaturasPage";
import PeriodosPage from "./pages/PeriodosPage";
import LibroClasesPage from "./pages/LibroClasesPage";
import ApoderadosPage from "./pages/ApoderadosPage";
import MensajesPage from "./pages/MensajesPage";
import PlanesMejoraPage from "./pages/PlanesMejoraPage";
import PIEPage from "./pages/PIEPage";

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <Sidebar />
      <div className="flex-1 ml-56">
        <main className="max-w-7xl mx-auto px-6 py-6">
          <Routes>
            {/* Módulo CEIS — Instrumentos */}
            <Route path="/" element={<BankPage />} />
            <Route path="/generar" element={<GeneratorPage />} />
            <Route path="/pruebas" element={<TestsPage />} />
            <Route path="/aplicaciones" element={<AplicacionesPage />} />

            {/* Módulo Gestión Escolar */}
            <Route path="/gestion" element={<DashboardPage />} />
            <Route path="/colegios" element={<ColegiosPage />} />
            <Route path="/cursos" element={<CursosPage />} />
            <Route path="/estudiantes" element={<EstudiantesPage />} />
            <Route path="/estudiantes/:id" element={<EstudiantePerfilPage />} />
            <Route path="/docentes" element={<DocentesPage />} />
            <Route path="/apoderados" element={<ApoderadosPage />} />
            <Route path="/mensajes" element={<MensajesPage />} />
            <Route path="/planes" element={<PlanesMejoraPage />} />
            <Route path="/pie" element={<PIEPage />} />
            <Route path="/libro" element={<LibroClasesPage />} />
            <Route path="/asignaturas" element={<AsignaturasPage />} />
            <Route path="/periodos" element={<PeriodosPage />} />
          </Routes>
        </main>
        <footer className="px-6 py-3 text-center text-[11px] text-slate-400 border-t border-slate-200">
          CEIS Maristas · Gestión Escolar
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const esModoEstudiante = location.pathname.startsWith("/aplicar/");
  const esLogin = location.pathname === "/login";

  if (esModoEstudiante) {
    return (
      <Routes>
        <Route path="/aplicar/:codigo" element={<AplicarPage />} />
      </Routes>
    );
  }

  if (esLogin) {
    return (
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    </AuthProvider>
  );
}
