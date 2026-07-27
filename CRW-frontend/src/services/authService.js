import api from "./api";

export async function login(email, password) {
  const response = await api.post("/auth/login", { email, password });
  localStorage.setItem("accessToken", response.data.accessToken);
  return response.data;
}

export function logout() {
  localStorage.removeItem("accessToken");
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem("accessToken"));
}
