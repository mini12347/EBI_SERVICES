import React from "react";
import {
  Building2,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Bell,
  FileText,
  CalendarRange,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  notifications: any[];
  onOpenNotifications: () => void;
}

export default function Navbar({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  notifications,
  onOpenNotifications,
}: NavbarProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {}
        <div
          className="flex cursor-pointer items-center space-x-2"
          onClick={() => setActiveTab("home")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 text-white shadow-md">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-blue-950">
              EBI Services
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-blue-600">
              Solutions pour les entreprises
            </span>
          </div>
        </div>

        {}
        <nav className="hidden md:flex space-x-8">
          {[
            { id: "home", label: "Accueil" },
            { id: "services", label: "Nos services" },
            { id: "about", label: "À propos" },
            { id: "contact", label: "Contact" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-2 text-sm font-medium transition-colors duration-200 hover:text-blue-900 ${
                activeTab === tab.id
                  ? "text-blue-900 font-semibold"
                  : "text-gray-500"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-900 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {}
        <div className="flex items-center space-x-4">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              {}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {}
              {currentUser.role === "admin" ? (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all border ${
                    activeTab === "admin"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Administration</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab("portal")}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all border ${
                    activeTab === "portal"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Espace client</span>
                </button>
              )}

              {}
              <div className="hidden lg:block text-right">
                <span className="block text-xs font-semibold text-gray-800">
                  {currentUser.name}
                </span>
                <span className="block text-[10px] text-gray-500 capitalize">
                  {currentUser.role}
                </span>
              </div>

              {}
              <button
                onClick={onLogout}
                className="p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-full transition-all"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab("login")}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:text-blue-900 transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-950 transition-colors"
              >
                Devenir client
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
