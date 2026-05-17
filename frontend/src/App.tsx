import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
  const { usuario } = useAuth();
  const nombre = usuario ? `${usuario.nombres?.split(" ")[0] || ""} ${usuario.apellido_paterno || ""}`.trim() : "";
  const hoy = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-0">
        {/* Header global */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Hola{ nombre ? `, ${nombre}` : ""}
            </h1>
            <p className="text-xs text-slate-400 capitalize">{hoy}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
              {nombre ? nombre.split(" ").map(n => n[0]).join("").toUpperCase() : "U"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Routes>
              <Route path="/" element={<BankPage />} />
              <Route path="/generar" element={<GeneratorPage />} />
              <Route path="/pruebas" element={<TestsPage />} />
              <Route path="/aplicaciones" element={<AplicacionesPage />} />
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
          </div>
        </main>
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
