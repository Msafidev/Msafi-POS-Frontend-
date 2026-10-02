import apiClient from "./apiClient";

export const paymentsService = {
  listProviders: () => apiClient.get("/payments/providers/").then((r) => r.data),
  listActiveProviders: () => apiClient.get("/payments/providers/active/").then((r) => r.data),
  createProvider: (payload) => apiClient.post("/payments/providers/", payload).then((r) => r.data),
  updateProvider: (id, payload) => apiClient.patch(`/payments/providers/${id}/`, payload).then((r) => r.data),
  deleteProvider: (id) => apiClient.delete(`/payments/providers/${id}/`).then((r) => r.data),

  listTransactions: (params) => apiClient.get("/payments/transactions/", { params }).then((r) => r.data),
  initiate: (payload) => apiClient.post("/payments/transactions/initiate/", payload).then((r) => r.data),
  refreshStatus: (id) => apiClient.post(`/payments/transactions/${id}/refresh/`).then((r) => r.data),
  confirmTerminal: (id, provider_reference) =>
    apiClient.post(`/payments/transactions/${id}/confirm-terminal/`, { provider_reference }).then((r) => r.data),
};
