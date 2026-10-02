import apiClient from "./apiClient";

export const authService = {
  login: (username, password) =>
    apiClient.post("/auth/login/", { username, password }).then((r) => r.data),

  registerBusiness: (payload) =>
    apiClient.post("/auth/register-business/", payload).then((r) => r.data),

  me: () => apiClient.get("/auth/me/").then((r) => r.data),

  requestPasswordReset: (email) =>
    apiClient.post("/auth/password-reset/", { email }).then((r) => r.data),

  confirmPasswordReset: (payload) =>
    apiClient.post("/auth/password-reset/confirm/", payload).then((r) => r.data),
};
