import axios from "axios";

const apiClient = axios.create({ baseURL: "/api" });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ceis_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ceis_token");
      localStorage.removeItem("ceis_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
