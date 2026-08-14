import React, { useState, useEffect } from "react";
import { Lock, UserCheck, AlertCircle } from "lucide-react";
import { post } from "../api/client";

interface ResetPasswordViewProps {
  onNavigate: (tab: string) => void;
}

export default function ResetPasswordView({ onNavigate }: ResetPasswordViewProps) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("reset_token");
    if (resetToken) {
      setToken(resetToken);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    try {
      await post("/auth/reset-password", { token, password });
      setSuccess("Password reset successful! You can now log in.");
      setPassword("");
      setConfirm("");
      setTimeout(() => onNavigate("login"), 3000);
    } catch {
      setError("Invalid or expired reset token. Please request a new one.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-left space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white shadow-md">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Reset Password</h1>
        <p className="text-xs text-gray-500">Enter your new password below.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        {success ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-green-900">Password Reset Successful</h3>
            <p className="text-xs text-green-800">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">New Password *</label>
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-950 text-white rounded-lg py-2.5 text-xs font-semibold shadow-md transition cursor-pointer"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-gray-500">
        <button onClick={() => onNavigate("login")} className="text-blue-900 font-bold hover:underline">
          Back to Login
        </button>
      </div>
    </div>
  );
}
