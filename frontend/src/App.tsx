import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AIChatbot from "./components/AIChatbot";
import HomeView from "./components/HomeView";
import AboutView from "./components/AboutView";
import ServicesView from "./components/ServicesView";
import ContactView from "./components/ContactView";
import PortalView from "./components/PortalView";
import AdminView from "./components/AdminView";
import LoginView from "./components/LoginView";
import RegisterView from "./components/RegisterView";
import ResetPasswordView from "./components/ResetPasswordView";
import PrivacyView from "./components/PrivacyView";
import TermsView from "./components/TermsView";
import NotificationsModal from "./components/NotificationsModal";
import { User } from "./types";
import { clientDb } from "./clientDb";
import { apiGetMe } from "./api/auth";
import { apiGetNotifications } from "./api/notifications";
import { post } from "./api/client";
import VerifyEmailView from "./components/VerifyEmailView";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [pendingBooking, setPendingBooking] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState(false);
  const [pendingQuotes, setPendingQuotes] = useState(false);
  const [pendingChatDept, setPendingChatDept] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("reset_token");
    if (resetToken) {
      setActiveTab("reset-password");
    }
    const emailVerifyToken = params.get("verify_token");
    if (emailVerifyToken) {
      setVerifyToken(emailVerifyToken);
      setActiveTab("verify-email");
    }
  }, []);

  useEffect(() => {
    const savedUserId = localStorage.getItem("ebi_session_token");
    if (savedUserId) {
      loadSession(savedUserId, localStorage.getItem("ebi_auth_mode"));
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const loadSession = async (sessionToken: string, authMode: string | null) => {
    if (authMode === "demo") {
      const found = clientDb.getUsers().find((user) => user.id === sessionToken);
      if (found) {
        setCurrentUser(found);
        setToken(sessionToken);
        return;
      }
      handleLogout();
      return;
    }

    try {
      const me = await apiGetMe();
      if (me && me._id) {
        const mappedUser: User = {
          id: me._id,
          email: me.email,
          name: me.fullname,
          role: me.role === "admin" ? "admin" : "client",
          companyId: me.entreprise || "Individual",
          createdAt: me.createdAt || new Date().toISOString(),
        };
        setCurrentUser(mappedUser);
        setToken(me._id);
        localStorage.setItem("ebi_session_token", me._id);
        localStorage.setItem("ebi_auth_mode", "api");
        return;
      }
    } catch {
      // Invalid or expired API sessions must sign in again.
    }
    handleLogout();
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const apiNotifs = await apiGetNotifications();
      const mapped = apiNotifs.map((n: any) => ({
        id: n._id,
        userId: typeof n.destinataire === "object" ? n.destinataire._id : n.destinataire,
        title: n.type,
        message: n.contenu,
        read: n.lu,
        createdAt: n.createdAt,
      }));
      const userNotifs = currentUser.role === "admin" ? mapped : mapped.filter((n: any) => n.userId === currentUser.id);
      setNotifications(userNotifs);
      return;
    } catch {
      // Fall back to clientDb
    }
    try {
      const allNotifs = clientDb.getNotifications();
      const userNotifs = currentUser.role === "admin" ? allNotifs : allNotifs.filter((n) => n.userId === currentUser.id);
      setNotifications(userNotifs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (user: User, jwtToken: string, refreshToken?: string) => {
    setCurrentUser(user);
    setToken(user.id);
    localStorage.setItem("ebi_session_token", user.id);
    if (jwtToken) {
      localStorage.setItem("ebi_api_token", jwtToken);
      if (refreshToken) localStorage.setItem("ebi_refresh_token", refreshToken);
      localStorage.setItem("ebi_auth_mode", "api");
    } else {
      localStorage.removeItem("ebi_api_token");
      localStorage.removeItem("ebi_refresh_token");
      localStorage.setItem("ebi_auth_mode", "demo");
    }
    if (user.role === "admin") {
      setActiveTab("admin");
    } else {
      setActiveTab("portal");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setNotifications([]);
    localStorage.removeItem("ebi_session_token");
    localStorage.removeItem("ebi_api_token");
    localStorage.removeItem("ebi_refresh_token");
    localStorage.removeItem("ebi_auth_mode");
    setActiveTab("home");
  };

  useEffect(() => {
    const handleExpiredSession = () => handleLogout();
    window.addEventListener("ebi:session-expired", handleExpiredSession);
    return () => window.removeEventListener("ebi:session-expired", handleExpiredSession);
  }, []);

  const triggerChatOpen = () => {
    const launcher = document.querySelector(".fixed.bottom-6.right-6.z-50 button") as HTMLButtonElement;
    if (launcher) launcher.click();
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        notifications={notifications}
        onOpenNotifications={() => setShowNotificationsModal(true)}
      />

      <main className="flex-grow">
        {activeTab === "home" && <HomeView setActiveTab={setActiveTab} onOpenChat={triggerChatOpen} />}
        {activeTab === "services" && <ServicesView setActiveTab={setActiveTab} />}
        {activeTab === "about" && <AboutView />}
        {activeTab === "contact" && <ContactView onLeadSubmitSuccess={fetchNotifications} />}
        {activeTab === "portal" && currentUser && token && (
          <PortalView
            currentUser={currentUser}
            token={token}
            pendingBooking={pendingBooking}
            pendingAppointments={pendingAppointments}
            pendingQuotes={pendingQuotes}
            pendingChatDept={pendingChatDept}
            onBookingOpened={() => {
              setPendingBooking(false);
              setPendingAppointments(false);
              setPendingQuotes(false);
              setPendingChatDept(null);
            }}
          />
        )}
        {activeTab === "admin" && currentUser?.role === "admin" && token && (
          <AdminView currentUser={currentUser} token={token} />
        )}
        {activeTab === "login" && <LoginView onLogin={handleLogin} onNavigate={setActiveTab} />}
        {activeTab === "register" && <RegisterView onNavigate={setActiveTab} />}
        {activeTab === "reset-password" && <ResetPasswordView onNavigate={setActiveTab} />}
        {activeTab === "verify-email" && verifyToken && <VerifyEmailView token={verifyToken} onNavigate={setActiveTab} />}
        {activeTab === "privacy" && <PrivacyView />}
        {activeTab === "terms" && <TermsView />}
      </main>

      <Footer setActiveTab={setActiveTab} />

      <AIChatbot
        currentUser={currentUser}
        onLeadSubmitSuccess={fetchNotifications}
        onOpenForm={() => setActiveTab("contact")}
        onOpenPortal={() => setActiveTab("portal")}
        onOpenBooking={() => { setActiveTab("portal"); setPendingBooking(true); }}
        onOpenAppointments={() => { setActiveTab("portal"); setPendingAppointments(true); }}
        onOpenQuotes={() => { setActiveTab("portal"); setPendingQuotes(true); }}
        onOpenDepartmentChat={(deptKey) => {
          if (currentUser) {
            setActiveTab("portal");
            setPendingChatDept(deptKey);
          }
        }}
        onOpenLogin={() => setActiveTab("login")}
      />

      {showNotificationsModal && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onRefresh={fetchNotifications}
        />
      )}
    </div>
  );
}
