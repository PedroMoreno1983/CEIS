import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import Button from "../components/ui/Button";
import apiClient from "../api-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupMsg, setSetupMsg] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSetupMsg("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setSetupLoading(true);
    setSetupMsg("");
    setError("");
    try {
      const res = await apiClient.post("/auth/setup");
      setSetupMsg(res.data.message || "Usuario admin creado");
      setEmail("admin@ceis.cl");
      setPassword("ceis2026");
    } catch (err: any) {
      const detail = err.response?.data?.detail || "No se pudo crear el usuario";
      setSetupMsg(detail);
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">CEIS Maristas</h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ceis.cl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {setupMsg && (
            <div className={`text-sm px-3 py-2 rounded-lg ${setupMsg.includes("creado") ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"}`}>
              {setupMsg}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={handleSetup}
            disabled={setupLoading}
            className="w-full text-xs text-slate-500 hover:text-slate-700 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {setupLoading ? "Creando..." : "¿Primera vez? Crear usuario admin inicial"}
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          CEIS 2026 · Sistema de Instrumentos y Gestión Escolar
        </div>
      </div>
    </div>
  );
}
