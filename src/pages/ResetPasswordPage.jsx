import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Lock, LayoutDashboard, CheckCircle2, ArrowLeft } from "lucide-react";

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

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { newPassword: "", confirmPassword: "" } });

  const newPassword = watch("newPassword");

  useEffect(() => {
    if (!token) navigate("/", { replace: true });
  }, [token, navigate]);

  const onSubmit = async (values) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: values.newPassword }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        setServerError(
          d?.message || "Failed to reset password. The link may have expired.",
        );
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 3000);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      {/* ── Logo ── */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">IT Help Desk</h1>
        <p className="text-sm text-muted-foreground">
          Set a new password for your account
        </p>
      </div>

      {/* ── Card ── */}
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">
            {success ? "Password reset!" : "Create new password"}
          </CardTitle>
          <CardDescription>
            {success
              ? "Redirecting you to sign in..."
              : "Must be at least 8 characters"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Success state ── */}
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Your password has been reset successfully. You'll be redirected
                to sign in shortly.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/", { replace: true })}
              >
                Sign in now
              </Button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              {/* ── New password ── */}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    className="!pl-10"
                    {...register("newPassword", {
                      required: "New password is required.",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters.",
                      },
                    })}
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* ── Confirm password ── */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="!pl-10"
                    {...register("confirmPassword", {
                      required: "Please confirm your password.",
                      validate: (v) =>
                        v === newPassword || "Passwords do not match.",
                    })}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* ── Submit ── */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>

              {/* ── Back to login ── */}
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-1.5"
                onClick={() => navigate("/", { replace: true })}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
