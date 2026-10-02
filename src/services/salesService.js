import apiClient from "./apiClient";

export const salesService = {
  list: (params) => apiClient.get("/sales/", { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/sales/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/sales/", payload).then((r) => r.data),
  complete: (id, payload) => apiClient.post(`/sales/${id}/complete/`, payload).then((r) => r.data),
  refund: (id, payload) => apiClient.post(`/sales/${id}/refund/`, payload).then((r) => r.data),
  receipt: (id) => apiClient.get(`/sales/${id}/receipt/`).then((r) => r.data),
};
