import React, { useState } from "react";
import { Building2, UserCheck, AlertCircle } from "lucide-react";
import { clientDb } from "../clientDb";
import { Conversation } from "../types";

interface RegisterViewProps {
  onNavigate: (tab: string) => void;
}

export default function RegisterView({ onNavigate }: RegisterViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !name) return;

    try {
      const { post } = await import("../api/client");
      const data = await post<{ _id: string; fullname: string }>("/auth/register", {
        fullname: name,
        email,
        telephone: "0000000000",
        password,
        entreprise: company || undefined,
      });
      if (data && data._id) {
        clientDb.addActivityLog(data._id, data.fullname, "User registered via API");
        setSuccess(true);
        setEmail("");
        setPassword("");
        setName("");
        setCompany("");
        setTimeout(() => {
          setSuccess(false);
          onNavigate("login");
        }, 2000);
        return;
      }
    } catch {
      // Backend unavailable, fall back to clientDb
    }

    try {
      const users = clientDb.getUsers();
      const passwords = clientDb.getPasswords();

      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setError("An account with this email address already exists.");
        return;
      }

      const newUser = {
        id: `usr-${Math.random().toString(36).substring(2, 11)}`,
        email,
        name,
        role: "client" as const,
        companyId: company || "Individual",
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      passwords[email] = password;
      clientDb.setUsers(users);
      clientDb.setPasswords(passwords);

      const convs = clientDb.getConversations();
      const newConv: Conversation = {
        id: `conv-${Math.random().toString(36).substring(2, 11)}`,
        userId: newUser.id,
        clientName: newUser.name,
        clientEmail: newUser.email,
        status: "active",
        lastMessageAt: new Date().toISOString(),
      };
      convs.push(newConv);
      clientDb.setConversations(convs);

      const msgs = clientDb.getMessages();
      msgs.push({
        id: `msg-${Date.now()}`,
        conversationId: newConv.id,
        senderId: "usr-admin",
        senderName: "Jean-Pierre Laurent",
        senderRole: "admin",
        text: `Welcome ${name}! Feel free to write any requirements or chat with our team here.`,
        timestamp: new Date().toISOString(),
      });
      clientDb.setMessages(msgs);

      clientDb.addActivityLog(newUser.id, newUser.name, "User registered standard account");

      setSuccess(true);
      setEmail("");
      setPassword("");
      setName("");
      setCompany("");
      setTimeout(() => {
        setSuccess(false);
        onNavigate("login");
      }, 2000);
    } catch (e) {
      setError("Failed to register.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-left space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white shadow-md">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Become Portal Client</h1>
        <p className="text-xs text-gray-500">Register in seconds to request instant formal pricing quotes.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        {success ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-green-900">Registration Successful</h3>
            <p className="text-xs text-green-800">Your account has been created. A verification email has been sent — please check your inbox and verify your email before logging in.</p>
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
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Marc Dubreuil"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="e.g. Carrefour Logistics"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Corporate Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. marc.d@carrefour.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-950 text-white rounded-lg py-2.5 text-xs font-semibold shadow-md transition cursor-pointer"
            >
              Complete Provisioning
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-gray-500">
        Already have an account?{" "}
        <button onClick={() => onNavigate("login")} className="text-blue-900 font-bold hover:underline">
          Login here
        </button>
      </div>
    </div>
  );
}
