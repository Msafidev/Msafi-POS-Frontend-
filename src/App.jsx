import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import InventoryLayout from "./layouts/InventoryLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

// Route-level code splitting: each page ships as its own chunk instead of
// one ~800KB bundle. Auth pages stay eager (they're the very first thing
// an unauthenticated visitor needs — no point lazy-loading the front door),
// everything behind the login wall is lazy so the initial load only pays
// for the login screen, not the entire POS/Inventory/Reports surface.
import LoginPage from "./pages/auth/LoginPage";
import RegisterBusinessPage from "./pages/auth/RegisterBusinessPage";

const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const ProductsPage = lazy(() => import("./pages/inventory/ProductsPage"));
const CategoriesBrandsPage = lazy(() => import("./pages/inventory/CategoriesBrandsPage"));
const StockMovementsPage = lazy(() => import("./pages/inventory/StockMovementsPage"));
const PurchaseOrdersPage = lazy(() => import("./pages/inventory/PurchaseOrdersPage"));
const SuppliersPage = lazy(() => import("./pages/suppliers/SuppliersPage"));
const CustomersPage = lazy(() => import("./pages/customers/CustomersPage"));
const POSPage = lazy(() => import("./pages/pos/POSPage"));
const SalesHistoryPage = lazy(() => import("./pages/sales/SalesHistoryPage"));
const ExpensesPage = lazy(() => import("./pages/expenses/ExpensesPage"));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const AddonsPage = lazy(() => import("./pages/addons/AddonsPage"));
const AddonVerificationsPage = lazy(() => import("./pages/addons/AddonVerificationsPage"));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 rounded-full border-2 border-till-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterBusinessPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={<Suspense fallback={<RouteFallback />}><DashboardPage /></Suspense>}
          />
          <Route path="/pos" element={<Suspense fallback={<RouteFallback />}><POSPage /></Suspense>} />
          <Route path="/sales" element={<Suspense fallback={<RouteFallback />}><SalesHistoryPage /></Suspense>} />

          <Route path="/inventory" element={<InventoryLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<Suspense fallback={<RouteFallback />}><ProductsPage /></Suspense>} />
            <Route path="categories" element={<Suspense fallback={<RouteFallback />}><CategoriesBrandsPage /></Suspense>} />
            <Route path="stock-movements" element={<Suspense fallback={<RouteFallback />}><StockMovementsPage /></Suspense>} />
            <Route path="purchase-orders" element={<Suspense fallback={<RouteFallback />}><PurchaseOrdersPage /></Suspense>} />
          </Route>

          <Route path="/customers" element={<Suspense fallback={<RouteFallback />}><CustomersPage /></Suspense>} />
          <Route path="/suppliers" element={<Suspense fallback={<RouteFallback />}><SuppliersPage /></Suspense>} />
          <Route path="/expenses" element={<Suspense fallback={<RouteFallback />}><ExpensesPage /></Suspense>} />
          <Route path="/reports" element={<Suspense fallback={<RouteFallback />}><ReportsPage /></Suspense>} />
          <Route path="/branches" element={<Navigate to="/settings" replace />} />
          <Route path="/settings" element={<Suspense fallback={<RouteFallback />}><SettingsPage /></Suspense>} />
          <Route path="/addons" element={<Suspense fallback={<RouteFallback />}><AddonsPage /></Suspense>} />

          <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
            <Route
              path="/addon-verifications"
              element={<Suspense fallback={<RouteFallback />}><AddonVerificationsPage /></Suspense>}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
