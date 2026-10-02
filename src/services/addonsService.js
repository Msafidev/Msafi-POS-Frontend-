import apiClient from "./apiClient";

export const addonsService = {
  getPlans: () => apiClient.get("/addons/plans/").then((r) => r.data),
  getMyAddons: () => apiClient.get("/addons/mine/").then((r) => r.data),
  listPayments: (params) => apiClient.get("/addons/payments/", { params }).then((r) => r.data),

  // Auto-verified purchase flow: sends an STK push to the phone, then the
  // frontend polls checkStatus until Safaricom confirms (or the callback
  // beats the poll to it) — no manual Super Admin step in the normal path.
  initiatePurchase: (payload) => apiClient.post("/addons/stk/initiate/", payload).then((r) => r.data),
  checkStatus: (id) => apiClient.get(`/addons/stk/status/${id}/`).then((r) => r.data),

  // Manual verify/reject stays available to Super Admins as a fallback
  // for edge cases (e.g. a callback that never arrived).
  verifyPayment: (id) => apiClient.post(`/addons/payments/${id}/verify/`).then((r) => r.data),
  rejectPayment: (id, rejection_reason) =>
    apiClient.post(`/addons/payments/${id}/reject/`, { rejection_reason }).then((r) => r.data),
};
