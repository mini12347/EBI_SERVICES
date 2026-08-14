import React, { useState } from "react";
import { Building2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { post } from "../api/client";
import { clientDb } from "../clientDb";

interface LoginViewProps {
  onLogin: (user: any, jwtToken: string) => void;
  onNavigate: (tab: string) => void;
}

export default function LoginView({ onLogin, onNavigate }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return;

    try {
      const data = await post<{ access_token: string; _id: string; email: string; fullname: string; role: string }>("/auth/login", { email, password });
      if (data && data.access_token) {
        const mappedUser = {
          id: data._id,
          email: data.email,
          name: data.fullname,
          role: data.role === "admin" ? "admin" : "client",
          companyId: "EBI Services",
          createdAt: new Date().toISOString(),
        };
        onLogin(mappedUser, data.access_token);
        clientDb.addActivityLog(data._id, data.fullname, "User logged in successfully (API)");
        setEmail("");
        setPassword("");
        return;
      }
    } catch (err: any) {
      if (err?.status === 403) {
        setError("Please verify your email address before logging in. Check your inbox for the verification link.");
        return;
      }
      // Backend unavailable or other error, fall back to clientDb
    }

    try {
      const users = clientDb.getUsers();
      const passwords = clientDb.getPasswords();
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (user && passwords[user.email] === password) {
        onLogin(user, "");
        clientDb.addActivityLog(user.id, user.name, "User logged in successfully (offline)");
        setEmail("");
        setPassword("");
        return;
      } else {
        setError("Invalid email or password.");
      }
    } catch (e) {
      setError("Failed to authenticate.");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await post("/auth/forgot-password", { email: forgotEmail });
      setForgotStatus("A dynamic password recovery link has been compiled and dispatched to your email address!");
      setForgotEmail("");
    } catch {
      setForgotStatus("Unable to process your request at this time. Please try again later.");
    } finally {
      setForgotLoading(false);
    }
    setTimeout(() => setForgotStatus(""), 5000);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-left space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white shadow-md">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">EBI Services Login</h1>
        <p className="text-xs text-gray-500">Enter your credentials to access your secure client portal.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Corporate Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. client@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase text-gray-500">Secure Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-950 text-white rounded-lg py-2.5 text-xs font-semibold shadow-md transition cursor-pointer"
          >
            Sign In Securely
          </button>
        </form>

        <div className="pt-4 border-t border-gray-150 space-y-2">
          <span className="block text-[10px] text-gray-400 font-bold uppercase text-center">Forgot Password?</span>
          <form onSubmit={handleForgotSubmit} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Enter email..."
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="flex-1 rounded border border-gray-200 p-1.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={forgotLoading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded transition cursor-pointer"
            >
              Reset
            </button>
          </form>
          {forgotStatus && (
            <span className="block text-[10px] text-green-700 font-semibold bg-green-50 p-2 rounded text-center border border-green-100">
              {forgotStatus}
            </span>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-gray-500">
        New to EBI?{" "}
        <button onClick={() => onNavigate("register")} className="text-blue-900 font-bold hover:underline">
          Register as Member
        </button>
      </div>
    </div>
  );
}
