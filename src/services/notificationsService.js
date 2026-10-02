import apiClient from "./apiClient";

export const notificationsService = {
  list: (params) => apiClient.get("/notifications/", { params }).then((r) => r.data),
  unreadCount: () => apiClient.get("/notifications/unread_count/").then((r) => r.data),
  markRead: (id) => apiClient.post(`/notifications/${id}/mark_read/`).then((r) => r.data),
  markAllRead: () => apiClient.post("/notifications/mark_all_read/").then((r) => r.data),
};
