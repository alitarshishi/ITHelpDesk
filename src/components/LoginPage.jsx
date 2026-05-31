import { useState } from "react";
import { login, getRole } from "../services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await login({ email, password });
      const role = data?.role || getRole();
      // redirect by role
      if (role === "Admin" || role === "Administrator" || role === "admin") {
        window.location.href = "/admin";
      } else if (role === "ITAgent" || role === "IT" || role === "itagent") {
        window.location.href = "/itagent";
      } else if (role === "Manager" || role === "manager") {
        window.location.href = "/manager";
      } else {
        window.location.href = "/employee";
      }
    } catch (err) {
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div
        className="card login-card shadow-sm rounded-4 overflow-hidden"
        style={{ maxWidth: 420, width: "100%" }}
      >
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div
              className="rounded-circle bg-dark d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: 74, height: 74 }}
            >
              <span className="text-white fs-4">IT</span>
            </div>
            <h2 className="h4 fw-bold mb-1">IT Help Desk</h2>
            <p className="text-muted mb-0">
              Sign in to access the ticketing system
            </p>
          </div>

          <div className="mb-4">
            <h5 className="fw-bold">Welcome back</h5>
            <p className="text-muted mb-0">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label small fw-semibold">
                Email
              </label>
              <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-envelope-fill"></i>
                </span>
                <input
                  id="email"
                  type="email"
                  className="form-control border-start-0"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label
                htmlFor="password"
                className="form-label small fw-semibold"
              >
                Password
              </label>
              <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  id="password"
                  type="password"
                  className="form-control border-start-0"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger rounded-3 py-2" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-dark btn-lg w-100 rounded-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
