import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import authReducer from "../store/slices/authSlice";

/**
 * Every page component expects Redux + Router + React Query context.
 * This wraps a component the same way main.jsx does, with a fresh store/
 * query client per test and no cross-test state leakage.
 */
export function renderWithProviders(ui, { preloadedState } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
