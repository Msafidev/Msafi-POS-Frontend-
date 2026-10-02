import apiClient from "./apiClient";

export const usersService = {
  list: (params) => apiClient.get("/auth/users/", { params }).then((r) => r.data),
  create: (payload) => apiClient.post("/auth/users/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/auth/users/${id}/`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/auth/users/${id}/`).then((r) => r.data),
};

export const activityLogsService = {
  list: (params) => apiClient.get("/auth/activity-logs/", { params }).then((r) => r.data),
};
