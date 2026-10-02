import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/slices/authSlice";
import ProtectedRoute from "./ProtectedRoute";

function renderAt(path, { auth }) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard content</div>} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
            <Route path="/addon-verifications" element={<div>Addon verifications content</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

const adminUser = { username: "admin1", role: "admin", business: { id: "biz-1" } };
const superAdminUser = { username: "super1", role: "super_admin", business: null };

describe("ProtectedRoute", () => {
  it("redirects to /login when not authenticated", () => {
    renderAt("/dashboard", { auth: { user: null, accessToken: null } });
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("lets an authenticated admin through to a normal page", () => {
    renderAt("/dashboard", { auth: { user: adminUser, accessToken: "tok" } });
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });

  it("lets an authenticated Super Admin through to a normal page", () => {
    renderAt("/dashboard", { auth: { user: superAdminUser, accessToken: "tok" } });
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });

  it("blocks a non-super-admin from a super-admin-only route", () => {
    renderAt("/addon-verifications", { auth: { user: adminUser, accessToken: "tok" } });
    expect(screen.queryByText("Addon verifications content")).not.toBeInTheDocument();
  });

  it("lets a Super Admin into a super-admin-only route", () => {
    renderAt("/addon-verifications", { auth: { user: superAdminUser, accessToken: "tok" } });
    expect(screen.getByText("Addon verifications content")).toBeInTheDocument();
  });
});
