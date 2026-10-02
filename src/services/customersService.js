import apiClient from "./apiClient";

export const customersService = {
  list: (params) => apiClient.get("/customers/", { params }).then((r) => r.data),
  create: (payload) => apiClient.post("/customers/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/customers/${id}/`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/customers/${id}/`).then((r) => r.data),
  groups: {
    list: (params) => apiClient.get("/customer-groups/", { params }).then((r) => r.data),
    create: (payload) => apiClient.post("/customer-groups/", payload).then((r) => r.data),
  },
};
