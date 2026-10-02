import apiClient from "./apiClient";

export const taxService = {
  getProfile: () => apiClient.get("/tax/profile/").then((r) => r.data),
  updateProfile: (payload) => apiClient.patch("/tax/profile/", payload).then((r) => r.data),

  getSummary: (params) => apiClient.get("/tax/summary/", { params }).then((r) => r.data),
  getEtimsStatus: () => apiClient.get("/tax/etims/status/").then((r) => r.data),

  listRecords: (params) => apiClient.get("/tax/records/", { params }).then((r) => r.data),
  createRecord: (payload) => apiClient.post("/tax/records/", payload).then((r) => r.data),
  estimateRecord: (payload) => apiClient.post("/tax/records/estimate/", payload).then((r) => r.data),

  listETIMSInvoices: (params) => apiClient.get("/tax/etims-invoices/", { params }).then((r) => r.data),
  submitETIMSInvoice: (saleId) =>
    apiClient.post("/tax/etims-invoices/submit/", { sale_id: saleId }).then((r) => r.data),
};
