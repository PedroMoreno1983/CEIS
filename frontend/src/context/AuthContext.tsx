import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { AuthAPI, type Usuario } from "../api/auth";

interface AuthContextType {
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("ceis_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const u = await AuthAPI.me();
      setUsuario(u);
      localStorage.setItem("ceis_user", JSON.stringify(u));
    } catch {
      localStorage.removeItem("ceis_token");
      localStorage.removeItem("ceis_user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const data = await AuthAPI.login({ username: email, password });
    localStorage.setItem("ceis_token", data.access_token);
    localStorage.setItem("ceis_user", JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  };

  const logout = () => {
    localStorage.removeItem("ceis_token");
    localStorage.removeItem("ceis_user");
    setUsuario(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
