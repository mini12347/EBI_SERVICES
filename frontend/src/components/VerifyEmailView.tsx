import React, { useState, useEffect } from "react";
import { MailCheck, AlertCircle, Loader2 } from "lucide-react";
import { post } from "../api/client";

interface VerifyEmailViewProps {
  token: string;
  onNavigate: (tab: string) => void;
}

export default function VerifyEmailView({ token, onNavigate }: VerifyEmailViewProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      const res = await post<{ message: string }>("/auth/verify-email", { token });
      setStatus("success");
      setMessage(res.message);
      setTimeout(() => onNavigate("login"), 4000);
    } catch {
      setStatus("error");
      setMessage("Invalid or expired verification link. Please register again.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-left space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white shadow-md">
          {status === "loading" ? <Loader2 className="h-6 w-6 animate-spin" /> : <MailCheck className="h-6 w-6" />}
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Email Verification</h1>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 text-center">
        {status === "loading" && (
          <p className="text-xs text-gray-500">Verifying your email address...</p>
        )}
        {status === "success" && (
          <div className="space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
              <MailCheck className="h-5 w-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-green-900">Email Verified Successfully</h3>
            <p className="text-xs text-green-800">{message}</p>
            <p className="text-[10px] text-gray-400">Redirecting to login...</p>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-red-900">Verification Failed</h3>
            <p className="text-xs text-red-800">{message}</p>
            <button
              onClick={() => onNavigate("login")}
              className="text-blue-900 font-bold text-xs hover:underline"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
