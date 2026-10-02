import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authService } from "../../services/authService";
import { setCredentials } from "../../store/slices/authSlice";

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (values) => {
    setServerError("");
    setLoading(true);
    try {
      const data = await authService.login(values.username, values.password);
      dispatch(setCredentials({ user: data.user, access: data.access, refresh: data.refresh }));
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.detail || "Couldn't sign you in — check your username and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-950">
      {/* Signature panel: an oversized till receipt as the visual anchor */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-till-600/20 via-transparent to-transparent" />
        <div className="relative bg-paper-50 text-ink-900 w-80 rounded-sm shadow-2xl p-6 font-mono text-sm rotate-[-2deg]">
          <p className="text-center font-display font-bold text-lg mb-1">MsafiPOS</p>
          <p className="text-center text-xs text-ink-700 mb-4">Nairobi · Main Branch</p>
          <div className="border-t border-dashed border-ink-700/40 my-2" />
          {["Espresso x2", "Croissant x1", "Iced Tea x1"].map((line) => (
            <div key={line} className="flex justify-between py-0.5 text-xs">
              <span>{line}</span><span>—</span>
            </div>
          ))}
          <div className="border-t border-dashed border-ink-700/40 my-2" />
          <div className="flex justify-between font-semibold">
            <span>TOTAL</span><span>KES 950</span>
          </div>
          <p className="text-center text-[10px] text-ink-700/60 mt-4">Thank you for shopping with us</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-paper-50 mb-1">Welcome back</h1>
          <p className="text-paper-200/60 text-sm mb-8">Sign in to your MsafiPOS account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs text-paper-200/70 mb-1.5">Username</label>
              <input
                {...register("username", { required: "Username is required" })}
                className="w-full px-3 py-2.5 rounded-lg bg-ink-900 border border-ink-700 text-paper-50 text-sm focus:outline-none focus:ring-2 focus:ring-till-500/50"
                placeholder="e.g. admin1"
              />
              {errors.username && <p className="text-rose-400 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-xs text-paper-200/70 mb-1.5">Password</label>
              <input
                type="password"
                {...register("password", { required: "Password is required" })}
                className="w-full px-3 py-2.5 rounded-lg bg-ink-900 border border-ink-700 text-paper-50 text-sm focus:outline-none focus:ring-2 focus:ring-till-500/50"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {serverError && <p className="text-rose-400 text-sm">{serverError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-400 transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-paper-200/60 mt-6">
            New business?{" "}
            <Link to="/register" className="text-till-500 hover:text-till-400 font-medium">
              Create your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
