import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

export default function RegisterBusinessPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    setServerError("");
    setLoading(true);
    try {
      await authService.registerBusiness({
        business_name: values.businessName,
        username: values.username,
        email: values.email,
        password: values.password,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      const data = err.response?.data;
      setServerError(
        data ? Object.values(data).flat().join(" ") : "Something went wrong creating your business."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-50 p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-paper-200 p-8">
        <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">Set up your business</h1>
        <p className="text-ink-700/60 text-sm mb-6">
          Creates your MsafiPOS workspace, main branch, and admin account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Business name" error={errors.businessName?.message}>
            <input
              {...register("businessName", { required: "Business name is required" })}
              className="input"
              placeholder="e.g. Msafi Retail Ltd"
            />
          </Field>
          <Field label="Admin username" error={errors.username?.message}>
            <input {...register("username", { required: "Username is required" })} className="input" />
          </Field>
          <Field label="Admin email" error={errors.email?.message}>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="input"
            />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input
              type="password"
              {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })}
              className="input"
            />
          </Field>

          {serverError && <p className="text-rose-500 text-sm">{serverError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-600 transition-colors disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create business account"}
          </button>
        </form>

        <p className="text-center text-sm text-ink-700/60 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-till-600 hover:text-till-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs text-ink-700/70 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
