import apiClient from "./apiClient";

/**
 * Every report endpoint shares this shape: JSON by default, a CSV file
 * when { export: "csv" } is passed. downloadCsv triggers a real browser
 * download rather than returning the blob to the caller.
 */
const reportGet = (path) => (params) => apiClient.get(`/reports/${path}/`, { params }).then((r) => r.data);

async function downloadCsv(path, params, filename) {
  const response = await apiClient.get(`/reports/${path}/`, { params: { ...params, export: "csv" }, responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const reportsService = {
  sales: reportGet("sales"),
  profitLoss: reportGet("profit-loss"),
  expenses: reportGet("expenses"),
  inventory: reportGet("inventory"),
  cashFlow: reportGet("cash-flow"),
  topCustomers: reportGet("top-customers"),
  topProducts: reportGet("top-products"),
  employeePerformance: reportGet("employee-performance"),
  tax: reportGet("tax"),
  downloadCsv,
};
