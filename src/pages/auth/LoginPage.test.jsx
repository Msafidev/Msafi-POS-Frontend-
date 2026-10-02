import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils";
import LoginPage from "./LoginPage";
import { authService } from "../../services/authService";

vi.mock("../../services/authService", () => ({
  authService: { login: vi.fn() },
}));

describe("LoginPage", () => {
  it("shows validation errors when submitted empty", async () => {
    renderWithProviders(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("shows a server error message when login fails", async () => {
    authService.login.mockRejectedValueOnce({ response: { data: { detail: "Invalid credentials." } } });
    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("e.g. admin1"), { target: { value: "baduser" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "badpass" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid credentials.")).toBeInTheDocument();
  });

  it("calls authService.login with the entered credentials", async () => {
    authService.login.mockResolvedValueOnce({
      user: { username: "admin1", role: "admin" }, access: "tok", refresh: "ref",
    });
    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("e.g. admin1"), { target: { value: "admin1" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "StrongPass123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith("admin1", "StrongPass123"));
  });
});
