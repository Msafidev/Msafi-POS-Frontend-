import apiClient from "./apiClient";

export const businessesService = {
  get: (id) => apiClient.get(`/businesses/${id}/`).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/businesses/${id}/`, payload).then((r) => r.data),
};

export const branchesService = {
  list: (params) => apiClient.get("/branches/", { params }).then((r) => r.data),
  create: (payload) => apiClient.post("/branches/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/branches/${id}/`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/branches/${id}/`).then((r) => r.data),
};
