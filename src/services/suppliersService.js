import apiClient from "./apiClient";

export const suppliersService = {
  list: (params) => apiClient.get("/suppliers/", { params }).then((r) => r.data),
  create: (payload) => apiClient.post("/suppliers/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/suppliers/${id}/`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/suppliers/${id}/`).then((r) => r.data),
};
