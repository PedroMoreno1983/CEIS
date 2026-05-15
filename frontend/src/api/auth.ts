import apiClient from "../api-client";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombres: string;
  apellido_paterno: string;
  rol: string;
  colegio_id: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

export const AuthAPI = {
  login: (cred: LoginCredentials) =>
    apiClient
      .post<LoginResponse>("/auth/login", new URLSearchParams({ username: cred.username, password: cred.password }), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((r) => r.data),

  me: () => apiClient.get<Usuario>("/auth/me").then((r) => r.data),
};
