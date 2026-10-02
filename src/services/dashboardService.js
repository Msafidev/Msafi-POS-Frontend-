import apiClient from "./apiClient";

export const dashboardService = {
  getSummary: () => apiClient.get("/dashboard/summary/").then((r) => r.data),
};
