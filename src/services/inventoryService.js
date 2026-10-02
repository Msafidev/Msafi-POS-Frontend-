import apiClient from "./apiClient";

const list = (path) => (params) => apiClient.get(`/${path}/`, { params }).then((r) => r.data);
const create = (path) => (payload) => apiClient.post(`/${path}/`, payload).then((r) => r.data);
const update = (path) => (id, payload) => apiClient.patch(`/${path}/${id}/`, payload).then((r) => r.data);
const remove = (path) => (id) => apiClient.delete(`/${path}/${id}/`).then((r) => r.data);

export const categoriesService = {
  list: list("categories"),
  create: create("categories"),
  update: update("categories"),
  remove: remove("categories"),
};

export const brandsService = {
  list: list("brands"),
  create: create("brands"),
  update: update("brands"),
  remove: remove("brands"),
};

function toFormData(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, value);
  });
  return formData;
}

export const productsService = {
  list: list("products"),
  create: (payload) =>
    apiClient.post("/products/", toFormData(payload), { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data),
  update: (id, payload) =>
    apiClient.patch(`/products/${id}/`, toFormData(payload), { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data),
  remove: remove("products"),
  lowStock: () => apiClient.get("/products/low_stock/").then((r) => r.data),
};

export const stockMovementsService = {
  list: list("stock-movements"),
  create: create("stock-movements"),
};

export const purchaseOrdersService = {
  list: list("purchase-orders"),
  create: create("purchase-orders"),
  receive: (id) => apiClient.post(`/purchase-orders/${id}/receive/`).then((r) => r.data),
};
