import apiClient from "./apiClient";

export const expensesService = {
  list: (params) => apiClient.get("/expenses/", { params }).then((r) => r.data),
  create: (payload) => apiClient.post("/expenses/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/expenses/${id}/`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/expenses/${id}/`).then((r) => r.data),
  categories: {
    list: (params) => apiClient.get("/expense-categories/", { params }).then((r) => r.data),
    create: (payload) => apiClient.post("/expense-categories/", payload).then((r) => r.data),
  },
};
