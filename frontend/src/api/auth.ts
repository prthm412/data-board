import apiClient from "./client";

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export async function register(email: string, password: string) {
  const res = await apiClient.post("/auth/register", { email, password });
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return res.data;
}