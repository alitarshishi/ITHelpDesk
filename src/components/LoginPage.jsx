// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { Mail, Lock, LayoutDashboard } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";

// const API_BASE_URL =
//   process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

// const ROLE_REDIRECTS = {
//   Admin: "/admin",
//   Employee: "/employee",
//   Manager: "/manager",
//   ITAgent: "/itagent",
// };

// export default function LoginPage() {
//   const navigate = useNavigate();
//   const [serverError, setServerError] = useState(
//     sessionStorage.getItem("loginNotice") || "",
//   );
//   useEffect(() => {
//     sessionStorage.removeItem("loginNotice");
//   }, []);
//   const [loading, setLoading] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({ defaultValues: { email: "", password: "" } });

//   const onSubmit = async (values) => {
//     setLoading(true);
//     setServerError("");
//     try {
//       const res = await fetch(`${API_BASE_URL}/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(values),
//       });

//       if (!res.ok) {
//         const d = await res.json().catch(() => null);
//         throw new Error(d?.message || "Invalid email or password.");
//       }

//       const data = await res.json();
//       localStorage.setItem("token", data.token);
//       localStorage.setItem("user", JSON.stringify(data.user));
//       localStorage.setItem("role", data.role);

//       navigate(ROLE_REDIRECTS[data.role] || "/");
//     } catch (err) {
//       setServerError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
//       <div className="w-full max-w-sm">
//         <div className="mb-6 flex flex-col items-center text-center">
//           <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
//             <LayoutDashboard className="h-6 w-6" />
//           </div>
//           <h1 className="text-xl font-bold tracking-tight">IT Help Desk</h1>
//           <p className="text-sm text-muted-foreground">
//             Sign in to access the ticketing system
//           </p>
//         </div>

//         <Card>
//           <CardHeader>
//             <h2 className="text-base font-semibold">Welcome back</h2>
//             <p className="text-sm text-muted-foreground">
//               Enter your credentials to continue
//             </p>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//               {serverError && (
//                 <p className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
//                   {serverError}
//                 </p>
//               )}

//               <div className="space-y-1.5">
//                 <Label htmlFor="email">Email</Label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder="you@example.com"
//                     className="bg-red px-3 !pl-10 text-red!"
//                     {...register("email", { required: "Email is required." })}
//                   />
//                 </div>
//                 {errors.email && (
//                   <p className="text-sm text-destructive">
//                     {errors.email.message}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-1.5">
//                 <Label htmlFor="password">Password</Label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                   <Input
//                     id="password"
//                     type="password"
//                     placeholder="••••••••"
//                     className="px-3 !pl-10 text-red!"
//                     {...register("password", {
//                       required: "Password is required.",
//                     })}
//                   />
//                 </div>
//                 {errors.password && (
//                   <p className="text-sm text-destructive">
//                     {errors.password.message}
//                   </p>
//                 )}
//               </div>

//               <Button type="submit" className="w-full" disabled={loading}>
//                 {loading ? "Signing in..." : "Sign in"}
//               </Button>
//             </form>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, LayoutDashboard, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

const ROLE_REDIRECTS = {
  Admin: "/admin",
  Employee: "/employee",
  Manager: "/manager",
  ITAgent: "/itagent",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "forgot"
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "" } });

  useEffect(() => {
    const notice = sessionStorage.getItem("loginNotice");
    if (notice) {
      setServerError(notice);
      sessionStorage.removeItem("loginNotice");
    }
  }, []);

  const switchMode = (next) => {
    setMode(next);
    setServerError("");
    setSuccessMsg("");
    reset();
  };

  const handleLogin = async (values) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Invalid email or password.");
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.role);
      navigate(ROLE_REDIRECTS[data.role] || "/");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (values) => {
    setLoading(true);
    setServerError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const d = await res.json().catch(() => null);
      setSuccessMsg(
        d?.message ||
          "If that email is registered, a reset link has been sent.",
      );
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = mode === "login" ? handleLogin : handleForgot;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      {/* ── Logo ── */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">IT Help Desk</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access the ticketing system
        </p>
      </div>

      {/* ── Card ── */}
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">
            {mode === "login" ? "Welcome back" : "Reset your password"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Enter your credentials to continue"
              : "Enter your email and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ── Alerts ── */}
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            {successMsg && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{successMsg}</AlertDescription>
              </Alert>
            )}

            {/* ── Email ── */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="!pl-10"
                  {...register("email", { required: "Email is required." })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ── Password (login mode only) ── */}
            {mode === "login" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-normal"
                    onClick={() => switchMode("forgot")}
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="!pl-10"
                    {...register("password", {
                      required: "Password is required.",
                    })}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            {/* ── Submit ── */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === "login"
                  ? "Signing in..."
                  : "Sending..."
                : mode === "login"
                  ? "Sign in"
                  : "Send Reset Link"}
            </Button>

            {/* ── Back to login (forgot mode) ── */}
            {mode === "forgot" && (
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-1.5"
                onClick={() => switchMode("login")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
