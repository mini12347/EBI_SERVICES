import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  TrendingUp,
  HandCoins,
  CalendarRange,
  Search,
  ShieldAlert,
  BadgeHelp,
  CheckCircle2,
  Trash2,
  FileDown,
  RefreshCw,
  Sliders,
  PlayCircle,
  Lock,
  Save,
  Mail,
  MessageCircle,
  BarChart3,
  Send,
  CalendarDays,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  User,
  Lead,
  Appointment,
  QuoteRequest,
  Quote,
  ActivityLog,
  SystemSettings,
  Message,
  Conversation,
} from "../types";
import { clientDb } from "../clientDb";
import { apiGetUsers, apiGetUsersByRole } from "../api/auth";
import {
  apiGetDemandes,
  apiGetDevis,
  apiUpdateDemande,
  apiCreateDevis,
  apiUpdateDevis,
} from "../api/quotes";
import {
  apiGetMessages,
  apiGetMessagesByClient,
  apiCreateMessage,
  ApiMessage,
} from "../api/messages";
import {
  apiGetLeads,
  apiUpdateLead,
  apiDeleteLead,
} from "../api/leads";
import { apiGetAllAppointments, apiUpdateAppointmentStatus } from "../api/appointments";

interface AdminViewProps {
  currentUser: User;
  token: string;
}

export default function AdminView({ currentUser, token }: AdminViewProps) {
  const [adminSubTab, setAdminSubTab] = useState<
    "dashboard" | "crm" | "quotes" | "appointments" | "messaging" | "settings" | "logs"
  >("dashboard");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const [leadSearch, setLeadSearch] = useState("");
  const [leadDeptFilter, setLeadDeptFilter] = useState("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");

  const [selectedReq, setSelectedReq] = useState<QuoteRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteTerms, setQuoteTerms] = useState(
    "Net 30. 40% upfront, 30% intermediate milestone, 30% delivery. Includes standard 6-month technical support warranty.",
  );
  const [isIssuingQuote, setIsIssuingQuote] = useState(false);

  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadNoteText, setLeadNoteText] = useState("");

  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [aptNoteText, setAptNoteText] = useState("");

  const [websiteName, setWebsiteName] = useState("");
  const [chatbotPrompt, setChatbotPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [emailTemplateQuote, setEmailTemplateQuote] = useState("");
  const [emailTemplateAppointment, setEmailTemplateAppointment] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const apiLeadsRef = useRef<Lead[]>([]);

  useEffect(() => {
    fetchAdminData();
    fetchMessagingData();
    const interval = setInterval(fetchAdminData, 12000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchAdminData = async () => {
    // Try API for users / demandes / devis
    try {
      const demandes = await apiGetDemandes();
      if (demandes && demandes.length > 0) {
        const mapped: QuoteRequest[] = demandes.map((d: any) => ({
          id: d._id,
          userId: typeof d.client === 'object' ? d.client._id : d.client,
          clientName: typeof d.client === 'object' ? d.client.fullname : '',
          company: '',
          industry: typeof d.service === 'object' ? d.service.nom || '' : '',
          projectType: typeof d.service === 'object' ? d.service.nom || '' : '',
          budget: '',
          deadline: '',
          requirements: d.besoin,
          status: mapStatut(d.statut),
          createdAt: d.createdAt,
        }));
        setQuoteRequests(mapped);
      }
    } catch { /* fallback */ }

    try {
      const devisList = await apiGetDevis();
      if (devisList && devisList.length > 0) {
        const mapped: Quote[] = devisList.map((d: any) => ({
          id: d._id,
          quoteRequestId: typeof d.demande === 'object' ? d.demande._id : d.demande,
          clientName: '',
          projectName: `Devis ${d._id.slice(-6)}`,
          amount: d.montant,
          terms: '',
          expiryDate: '',
          status: mapDevisStatut(d.statut),
          createdAt: d.createdAt,
        }));
        setQuotes(mapped);
      }
    } catch { /* fallback */ }

    // Try backend for leads collected by the chatbot / contact form
    try {
      const apiLeads = await apiGetLeads();
      if (apiLeads && apiLeads.length > 0) {
        apiLeadsRef.current = apiLeads.map((l: any) => ({
          id: l._id,
          name: l.name,
          company: l.company,
          email: l.email,
          phone: l.phone,
          country: l.country,
          projectDescription: l.projectDescription,
          budget: l.budget,
          deadline: l.deadline,
          status: l.status,
          suggestedDepartment: l.suggestedDepartment,
          priority: l.priority,
          conversationSummary: l.source ? `Source: ${l.source}` : undefined,
          notes: l.notes || "",
          createdAt: l.createdAt,
        }));
      }
    } catch {
      apiLeadsRef.current = [];
    }

    // Try clientDb for all data (fills gaps the API doesn't cover)
    try {
      const rLeads = clientDb.getLeads();
      const rApts = clientDb.getAppointments();
      const rReqs = clientDb.getQuoteRequests();
      const rQuotes = clientDb.getQuotes();
      const rLogs = clientDb.getLogs();
      const rSettings = clientDb.getSettings();

      // Merge backend appointments (created from the client portal / chatbot)
      try {
        const apiApts = await apiGetAllAppointments();
        if (apiApts && apiApts.length > 0) {
          const mapped: Appointment[] = apiApts.map((a: any) => ({
            id: a._id,
            userId: a.userId,
            clientName: a.clientName,
            clientEmail: a.clientEmail,
            title: a.title,
            date: a.date,
            timeSlot: a.timeSlot,
            timezone: a.timezone,
            status: a.status,
            adminNotes: a.adminNotes,
            createdAt: a.createdAt,
          }));
          const merged = new Map<string, Appointment>();
          rApts.forEach((a) => merged.set(a.id, a));
          mapped.forEach((a) => merged.set(a.id, a));
          setAppointments(Array.from(merged.values()));
        } else {
          setAppointments(rApts);
        }
      } catch {
        setAppointments(rApts);
      }

      if (rReqs.length > 0) setQuoteRequests(rReqs);
      if (rQuotes.length > 0) setQuotes(rQuotes);
      setLogs(rLogs);

      const mergedLeads = new Map<string, Lead>();
      rLeads.forEach((l) => mergedLeads.set(l.id, l));
      apiLeadsRef.current.forEach((l) => {
        if (!mergedLeads.has(l.id)) mergedLeads.set(l.id, l);
      });
      const leadsAll = Array.from(mergedLeads.values());
      setLeads(leadsAll);

      const totalLeads = leadsAll.length;
      const totalClients = clientDb
        .getUsers()
        .filter((u) => u.role === "client").length;

      const acceptedQuotes = rQuotes.filter((q) => q.status === "accepted");
      const revenue = acceptedQuotes.reduce(
        (acc, curr) => acc + curr.amount,
        0,
      );

      const pendingQuotes = rQuotes.filter((q) => q.status === "sent").length;
      const pendingQuoteAmount = rQuotes
        .filter((q) => q.status === "sent")
        .reduce((acc, curr) => acc + curr.amount, 0);

      const conversionRate =
        rQuotes.length > 0
          ? Math.round((acceptedQuotes.length / rQuotes.length) * 100)
          : 0;

      const requestsByDept: Record<string, number> = {
        Development: 0,
        Recruitment: 0,
        Outsourcing: 0,
      };
      leadsAll.forEach((l) => {
        const dept = l.suggestedDepartment || "Development";
        if (requestsByDept[dept] !== undefined) {
          requestsByDept[dept]++;
        } else {
          requestsByDept[dept] = 1;
        }
      });

      const monthlyRevenue = [
        { name: "Jan", revenue: Math.round(revenue * 0.15) },
        { name: "Feb", revenue: Math.round(revenue * 0.25) },
        { name: "Mar", revenue: Math.round(revenue * 0.4) },
        { name: "Apr", revenue: Math.round(revenue * 0.6) },
        { name: "May", revenue: Math.round(revenue * 0.85) },
        { name: "Jun", revenue: revenue },
      ];

      setAnalytics({
        totalLeads,
        totalClients,
        revenue,
        pendingQuotes,
        pendingQuoteAmount,
        conversionRate,
        requestsByDept,
        monthlyRevenue,
      });

      if (rSettings) {
        setSettings(rSettings);
        setWebsiteName(rSettings.websiteName || "");
        setChatbotPrompt(rSettings.chatbotPrompt || "");
        setWelcomeMessage(rSettings.welcomeMessage || "");
        setEmailTemplateQuote(rSettings.emailTemplateQuote || "");
        setEmailTemplateAppointment(rSettings.emailTemplateAppointment || "");
      }
    } catch (e) {
      console.error("Admin fetch failed:", e);
    }
  };

  const fetchMessagingData = async () => {
    const users = clientDb.getUsers();
    setAllUsers(users);

    const clientUsers = users.filter((u) => u.role === "client");
    const convs = clientDb.getConversations();
    setConversations(convs);

    if (!selectedConversation && convs.length > 0) {
      setSelectedConversation(convs[0]);
    }
  };

  const fetchChatMessages = async (conversationId: string) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    try {
      const apiMessages = await apiGetMessagesByClient(conv.userId);
      if (apiMessages && apiMessages.length > 0) {
        const mapped: Message[] = apiMessages.map((m: ApiMessage) => ({
          id: m._id,
          conversationId: conversationId,
          senderId: typeof m.expediteur === "object" ? m.expediteur._id : m.expediteur,
          senderName: typeof m.expediteur === "object" ? m.expediteur.fullname : "",
          senderRole: (typeof m.expediteur === "object" ? m.expediteur.role : "admin") as "admin" | "client",
          text: m.contenu,
          timestamp: m.createdAt,
        }));
        setChatMessages(mapped);
        return;
      }
    } catch {
      // fallback to clientDb
    }

    const allMsgs = clientDb.getMessages();
    const convMsgs = allMsgs.filter((m) => m.conversationId === conversationId);
    setChatMessages(convMsgs);
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchChatMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedConversation) return;

    const clientUser = allUsers.find((u) => u.id === selectedConversation.userId);

    try {
      await apiCreateMessage({
        client: selectedConversation.userId,
        expediteur: currentUser.id,
        contenu: chatInput,
        client_email: clientUser?.email,
      });
    } catch {
      // fallback to clientDb
    }

    try {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId: selectedConversation.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: "admin",
        text: chatInput,
        timestamp: new Date().toISOString(),
      };

      const allMsgs = clientDb.getMessages();
      allMsgs.push(newMsg);
      clientDb.setMessages(allMsgs);

      const convs = clientDb.getConversations();
      const conv = convs.find((c) => c.id === selectedConversation.id);
      if (conv) {
        conv.lastMessageAt = new Date().toISOString();
        conv.summary = `Last message: ${chatInput.substring(0, 40)}...`;
        clientDb.setConversations(convs);
      }

      clientDb.addNotification(
        selectedConversation.userId,
        "New Message from EBI",
        `New message from ${currentUser.name}: "${chatInput.substring(0, 50)}"`,
      );

      setChatInput("");
      fetchChatMessages(selectedConversation.id);
      fetchMessagingData();
    } catch (err) {
      console.error(err);
    }
  };

  function mapStatut(s: string): QuoteRequest["status"] {
    const map: Record<string, QuoteRequest["status"]> = {
      en_attente: "new",
      en_cours: "in_review",
      devis_envoye: "quoted",
      accepte: "accepted",
      refuse: "rejected",
    };
    return map[s] || "new";
  }

  function mapDevisStatut(s: string): Quote["status"] {
    const map: Record<string, Quote["status"]> = {
      envoye: "sent",
      telecharge: "sent",
      archive: "rejected",
    };
    return map[s] || "sent";
  }

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      if (/^[0-9a-f]{24}$/i.test(leadId)) {
        await apiUpdateLead(leadId, {
          status: updates.status,
          priority: updates.priority,
          suggestedDepartment: updates.suggestedDepartment,
          notes: updates.notes,
        } as any);
      }
    } catch (err) {
      console.error("API lead update failed:", err);
    }
    try {
      const leadsList = clientDb.getLeads();
      const updatedList = leadsList.map((l) => {
        if (l.id === leadId) {
          return { ...l, ...updates };
        }
        return l;
      });
      clientDb.setLeads(updatedList);

      clientDb.addActivityLog(
        currentUser.id,
        currentUser.name,
        `Updated lead ID ${leadId} status/notes`,
      );
      setEditingLeadId(null);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this lead? This action cannot be undone.",
      )
    )
      return;
    try {
      if (/^[0-9a-f]{24}$/i.test(leadId)) {
        await apiDeleteLead(leadId);
      }
    } catch (err) {
      console.error("API lead delete failed:", err);
    }
    try {
      const leadsList = clientDb.getLeads();
      const filtered = leadsList.filter((l) => l.id !== leadId);
      clientDb.setLeads(filtered);

      clientDb.addActivityLog(
        currentUser.id,
        currentUser.name,
        `Deleted lead ID ${leadId}`,
      );
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAppointment = (
    aptId: string,
    status: "pending" | "confirmed" | "cancelled" | "completed",
    customNotes?: string,
  ) => {
    try {
      // Sync to backend when the appointment lives there (Mongo ObjectId)
      try {
        apiUpdateAppointmentStatus(aptId, {
          status,
          ...(customNotes !== undefined ? { adminNotes: customNotes } : {}),
        });
      } catch { /* fallback to clientDb */ }

      const aptsList = clientDb.getAppointments();
      const found = aptsList.find((a) => a.id === aptId);
      if (found) {
        found.status = status;
        if (customNotes !== undefined) found.adminNotes = customNotes;
        clientDb.setAppointments(aptsList);

        clientDb.addNotification(
          found.userId,
          `Appointment ${status.toUpperCase()}`,
          `Your consultation requested on ${found.date} ("${found.title}") is now ${status}.`,
        );

        clientDb.addActivityLog(
          currentUser.id,
          currentUser.name,
          `Updated appointment ${aptId} to ${status}`,
        );
      }

      setEditingAptId(null);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !quoteAmount) return;

    setIsIssuingQuote(true);

    // Persist the quote through the backend API — this auto-generates the PDF
    try {
      await apiCreateDevis({
        demande: selectedReq.id,
        montant: parseFloat(quoteAmount),
      });
      clientDb.addActivityLog(
        currentUser.id,
        currentUser.name,
        `Issued quotation of €${quoteAmount} for "${selectedReq.projectType}"`,
      );
      setSelectedReq(null);
      setQuoteAmount("");
      fetchAdminData();
      return;
    } catch (err) {
      console.error('API quote creation failed, falling back to local:', err);
    }

    try {
      const quotesList = clientDb.getQuotes();
      const newQuote: Quote = {
        id: `q-${Math.random().toString(36).substring(2, 11)}`,
        quoteRequestId: selectedReq.id,
        clientName: selectedReq.clientName,
        projectName: selectedReq.projectType,
        amount: parseFloat(quoteAmount),
        terms: quoteTerms,
        status: "sent",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        createdAt: new Date().toISOString(),
      };
      quotesList.push(newQuote);
      clientDb.setQuotes(quotesList);

      const reqList = clientDb.getQuoteRequests();
      const req = reqList.find((r) => r.id === selectedReq.id);
      if (req) {
        req.status = "quoted";
        clientDb.setQuoteRequests(reqList);
      }

      clientDb.addNotification(
        selectedReq.userId,
        "Formal SLA Pricing Generated",
        `A custom quotation of €${parseFloat(quoteAmount).toLocaleString()} is ready for your project "${selectedReq.projectType}".`,
      );

      clientDb.addActivityLog(
        currentUser.id,
        currentUser.name,
        `Issued quotation of €${quoteAmount} for "${selectedReq.projectType}"`,
      );

      setSelectedReq(null);
      setQuoteAmount("");
      fetchAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsIssuingQuote(false);
    }
  };

  const handleSaveSettings = () => {
    try {
      const newSettings: SystemSettings = {
        websiteName,
        chatbotPrompt,
        welcomeMessage,
        emailTemplateQuote,
        emailTemplateAppointment,
      };
      clientDb.setSettings(newSettings);

      clientDb.addActivityLog(
        currentUser.id,
        currentUser.name,
        `Updated system configurations`,
      );
      alert("EBI System Configurations saved successfully!");
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = (reportType: "leads" | "quotes" | "financials") => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (reportType === "leads") {
      csvContent +=
        "ID,Name,Company,Email,Phone,Department,Priority,Status,Created At\n";
      leads.forEach((l) => {
        csvContent += `"${l.id}","${l.name}","${l.company}","${l.email}","${l.phone}","${l.suggestedDepartment || "Development"}","${l.priority || "medium"}","${l.status}","${l.createdAt}"\n`;
      });
    } else if (reportType === "quotes") {
      csvContent +=
        "QuoteID,Client,Project,Amount,Status,Expiry Date,Created At\n";
      quotes.forEach((q) => {
        csvContent += `"${q.id}","${q.clientName}","${q.projectName}",${q.amount},"${q.status}","${q.expiryDate}","${q.createdAt}"\n`;
      });
    } else {
      csvContent += "Financial Metric,Value\n";
      csvContent += `"Total CRM Leads",${leads.length}\n`;
      csvContent += `"Active Clients",${analytics?.totalClients || 0}\n`;
      csvContent += `"Pending Quote Proposals",${analytics?.pendingQuotes || 0}\n`;
      csvContent += `"Accepted Project Revenue",${analytics?.revenue || 0}\n`;
      csvContent += `"Corporate Conversion Rate",${analytics?.conversionRate || 0}%\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `EBI_Services_CRM_Report_${reportType}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.company.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.email.toLowerCase().includes(leadSearch.toLowerCase()) ||
      (lead.projectDescription || "")
        .toLowerCase()
        .includes(leadSearch.toLowerCase());

    const matchesDept =
      leadDeptFilter === "all" || lead.suggestedDepartment === leadDeptFilter;
    const matchesStatus =
      leadStatusFilter === "all" || lead.status === leadStatusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const revenueChartData = analytics?.monthlyRevenue || [];

  const deptPieData = analytics?.requestsByDept
    ? Object.keys(analytics.requestsByDept).map((key) => ({
        name: key,
        value: analytics.requestsByDept[key],
      }))
    : [];

  const COLORS = ["#1e3a8a", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-100 flex items-center w-fit gap-1.5 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
            Executive CRM Command Center
          </span>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            EBI CRM & SLA Dashboard
          </h1>
          <p className="text-xs text-gray-500">
            Secure admin authorization active: {currentUser.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchAdminData()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-500 shadow-sm bg-white cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleExportCSV("leads")}
            className="rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 bg-white px-3.5 py-2 text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="h-4 w-4" />
            <span>Export Leads</span>
          </button>
          <button
            onClick={() => handleExportCSV("financials")}
            className="rounded-lg bg-blue-900 hover:bg-blue-950 text-white px-3.5 py-2 text-xs font-semibold shadow flex items-center gap-1.5 cursor-pointer"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-xs font-bold tracking-wide uppercase">
          {[
            { id: "dashboard", label: "CRM Analytics" },
            { id: "crm", label: "Manage Leads" },
            { id: "quotes", label: "Quote Proposals" },
            { id: "appointments", label: "Appointments Board" },
            { id: "messaging", label: "Messaging" },
            { id: "settings", label: "System Configs" },
            { id: "logs", label: "Audits Logs" },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setAdminSubTab(sub.id as any)}
              className={`py-2 border-b-2 cursor-pointer transition-all ${
                adminSubTab === sub.id
                  ? "border-blue-900 text-blue-900 font-bold"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </nav>
      </div>

      {}
      {}
      {}
      {adminSubTab === "dashboard" && (
        <div className="space-y-8">
          {}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-left">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">
                Total Leads
              </span>
              <span className="block text-2.5xl font-extrabold text-slate-900 mt-1">
                {analytics?.totalLeads || 0}
              </span>
              <span className="block text-[9px] text-gray-500 mt-1">
                Acquired leads
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-left">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">
                Active Clients
              </span>
              <span className="block text-2.5xl font-extrabold text-slate-900 mt-1">
                {analytics?.totalClients || 0}
              </span>
              <span className="block text-[9px] text-gray-500 mt-1">
                Portal accounts
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-left">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">
                SLA Conversion
              </span>
              <span className="block text-2.5xl font-extrabold text-slate-900 mt-1">
                {analytics?.conversionRate || 0}%
              </span>
              <span className="block text-[9px] text-gray-500 mt-1">
                Acceptance funnel
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-left">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">
                Accepted Revenue
              </span>
              <span className="block text-2.5xl font-extrabold text-emerald-700 mt-1">
                €{(analytics?.revenue || 0).toLocaleString()}
              </span>
              <span className="block text-[9px] text-gray-500 mt-1">
                Contracts signed
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-left">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">
                Pending Estimates
              </span>
              <span className="block text-2.5xl font-extrabold text-amber-600 mt-1">
                €{(analytics?.pendingQuoteAmount || 0).toLocaleString()}
              </span>
              <span className="block text-[9px] text-gray-500 mt-1">
                Quotes awaiting client
              </span>
            </div>
          </div>

          {}
          <div className="bg-gradient-to-r from-blue-900 to-blue-950 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-white" />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-white">
                  Appointments Board
                </h3>
                <p className="text-[10px] text-blue-200">
                  {appointments.length} appointment
                  {appointments.length === 1 ? "" : "s"} — review pending
                  requests, confirm schedules, and add SLA comments.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAdminSubTab("appointments")}
              className="rounded-lg bg-white text-blue-900 px-4 py-2 text-xs font-bold shadow hover:bg-blue-50 transition cursor-pointer flex items-center gap-1.5"
            >
              <CalendarDays className="h-4 w-4" />
              Open Board
            </button>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {}
            <div className="md:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-left space-y-4">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Performance Over Time
                </h3>
                <p className="text-[10px] text-gray-400">
                  Monthly breakdown of contracted revenue against leads
                  ingestion.
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#1e3a8a"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1e3a8a"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} />
                    <YAxis fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1e3a8a"
                      fillOpacity={1}
                      fill="url(#colorRev)"
                      strokeWidth={2.5}
                      name="Revenue (€)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {}
            <div className="md:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-left space-y-4">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Leads by Department
                </h3>
                <p className="text-[10px] text-gray-400">
                  Demand distribution across our three operational pillars.
                </p>
              </div>
              <div className="h-44 relative flex items-center justify-center">
                {deptPieData.length === 0 ? (
                  <span className="text-xs text-gray-400">
                    No department data.
                  </span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deptPieData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {deptPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2 text-[10px] border-t border-gray-100 pt-3">
                {deptPieData.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      ></span>
                      {entry.name}
                    </span>
                    <span className="font-bold text-slate-950">
                      {entry.value} leads
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {}
      {}
      {adminSubTab === "crm" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4 text-left">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-950">
                Acquired CRM Leads
              </h3>
              <p className="text-[10px] text-gray-400">
                Search, filter, and review lead requests classified by AI.
              </p>
            </div>

            {}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-xs w-full sm:w-48 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
              </div>
              <select
                value={leadDeptFilter}
                onChange={(e) => setLeadDeptFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none"
              >
                <option value="all">All Departments</option>
                <option value="Development">Development</option>
                <option value="Recruitment">Recruitment</option>
                <option value="Outsourcing">Outsourcing</option>
              </select>
              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          {}
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No matching leads found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wide">
                    <th className="p-3">Client details</th>
                    <th className="p-3">AI Department</th>
                    <th className="p-3">AI Priority</th>
                    <th className="p-3">Lead Status</th>
                    <th className="p-3">CRM Notes</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50">
                      <td className="p-3 space-y-1 max-w-[200px]">
                        <span className="font-bold text-slate-900 block">
                          {lead.name}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {lead.company} • {lead.country}
                        </span>
                        <span className="text-[10px] text-blue-900 block">
                          {lead.email}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lead.suggestedDepartment === "Development"
                              ? "bg-blue-50 text-blue-700"
                              : lead.suggestedDepartment === "Recruitment"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {lead.suggestedDepartment || "Development"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            lead.priority === "high"
                              ? "text-red-600"
                              : lead.priority === "medium"
                                ? "text-amber-600"
                                : "text-gray-400"
                          }`}
                        >
                          ● {lead.priority || "medium"}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleUpdateLead(lead.id, {
                              status: e.target.value as any,
                            })
                          }
                          className="border border-gray-200 rounded p-1 text-[10px] bg-white font-semibold focus:outline-none"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>
                      <td className="p-3 max-w-xs">
                        {editingLeadId === lead.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={leadNoteText}
                              onChange={(e) => setLeadNoteText(e.target.value)}
                              className="border border-gray-300 rounded p-1 text-[10px] flex-1 focus:outline-none"
                            />
                            <button
                              onClick={() =>
                                handleUpdateLead(lead.id, {
                                  notes: leadNoteText,
                                })
                              }
                              className="p-1 bg-green-600 hover:bg-green-700 text-white rounded"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                              {lead.notes || "No CRM comments yet."}
                            </p>
                            <button
                              onClick={() => {
                                setEditingLeadId(lead.id);
                                setLeadNoteText(lead.notes || "");
                              }}
                              className="text-[9px] text-blue-900 font-bold hover:underline"
                            >
                              Edit Note
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {}
      {}
      {}
      {adminSubTab === "quotes" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {}
          <div className="md:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-950 border-b border-gray-100 pb-3 text-left">
              Quote Requests Pipeline
            </h3>

            {quoteRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No quote requests submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {quoteRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-gray-150 p-4 space-y-2 text-left hover:border-blue-200 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {req.projectType}
                        </span>
                        <span className="text-[9px] text-gray-400 block">
                          {req.clientName} • {req.company}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          ["new", "in_review"].includes(req.status)
                            ? "bg-blue-100 text-blue-700"
                            : req.status === "quoted"
                              ? "bg-amber-100 text-amber-700"
                              : req.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed bg-slate-50 p-2 rounded">
                      {req.requirements}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-400">
                      <div>
                        <span className="font-bold text-slate-900">
                          Budget:
                        </span>{" "}
                        {req.budget}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">
                          Deadline:
                        </span>{" "}
                        {req.deadline}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      {req.attachmentName ? (
                        <a
                          href={req.attachmentUrl}
                          className="text-[10px] font-bold text-blue-900 hover:underline"
                        >
                          📎 Attached: {req.attachmentName}
                        </a>
                      ) : (
                        <span className="text-[9px] text-gray-400">
                          No attachments.
                        </span>
                      )}

                      {["new", "in_review"].includes(req.status) && (
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setQuoteAmount("");
                          }}
                          className="bg-blue-900 text-white text-[10px] font-bold px-3 py-1.5 rounded hover:bg-blue-950 transition cursor-pointer"
                        >
                          Generate Formal Quote
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="md:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-950 border-b border-gray-100 pb-3 text-left font-semibold">
              Pricing Generator
            </h3>

            {selectedReq ? (
              <form onSubmit={handleIssueQuote} className="space-y-4 text-left">
                <div className="bg-slate-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                  <div>
                    <span className="font-bold text-slate-900">Project:</span>{" "}
                    {selectedReq.projectType}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Client:</span>{" "}
                    {selectedReq.clientName} ({selectedReq.company})
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">
                      Stated Budget:
                    </span>{" "}
                    {selectedReq.budget}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Quote Pricing Amount (€) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                    SLA Contract & Payment Terms
                  </label>
                  <textarea
                    rows={4}
                    value={quoteTerms}
                    onChange={(e) => setQuoteTerms(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isIssuingQuote}
                    className="flex-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg py-2 text-xs font-semibold shadow disabled:opacity-45"
                  >
                    {isIssuingQuote ? "Issuing..." : "Issue Formal Quote"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg px-3 py-2 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-16 text-gray-400 text-xs">
                Select an active quote request from the left pipeline to load
                the pricing generator.
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {}
      {}
      {adminSubTab === "appointments" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-display text-sm font-bold text-slate-950 border-b border-gray-100 pb-3 text-left">
            SLA Appointments CMD Board
          </h3>

          {appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No meetings booked.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {appointments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-gray-150 p-4 text-left space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        {a.title}
                      </span>
                      <span className="block text-[10px] text-gray-500">
                        Client: {a.clientName} ({a.clientEmail})
                      </span>
                      <span className="block text-[9px] text-gray-400 mt-1">
                        {a.date} at {a.timeSlot} ({a.timezone})
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        a.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : a.status === "pending"
                            ? "bg-blue-100 text-blue-700"
                            : a.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  {editingAptId === a.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add scheduling comments..."
                        value={aptNoteText}
                        onChange={(e) => setAptNoteText(e.target.value)}
                        className="border border-gray-300 rounded p-1 text-[10px] flex-1 focus:outline-none"
                      />
                      <button
                        onClick={() =>
                          handleUpdateAppointment(a.id, a.status, aptNoteText)
                        }
                        className="p-1 bg-green-600 hover:bg-green-700 text-white rounded"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 bg-slate-50 p-2 rounded">
                        <span className="font-bold text-slate-900 block">
                          SLA Comments:
                        </span>
                        {a.adminNotes || "No supervisor comments yet."}
                      </p>
                      <button
                        onClick={() => {
                          setEditingAptId(a.id);
                          setAptNoteText(a.adminNotes || "");
                        }}
                        className="text-[9px] text-blue-900 font-bold hover:underline"
                      >
                        Edit Comments
                      </button>
                    </div>
                  )}

                  {a.status === "pending" && (
                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                      <button
                        onClick={() =>
                          handleUpdateAppointment(a.id, "confirmed")
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded py-1.5 text-[10px] font-bold cursor-pointer"
                      >
                        Confirm Slot
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateAppointment(a.id, "cancelled")
                        }
                        className="flex-1 bg-white border border-gray-300 text-gray-600 rounded py-1.5 text-[10px] font-bold cursor-pointer hover:bg-gray-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {adminSubTab === "messaging" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
          <div className="flex h-full">
            {/* Left: Conversation List */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-display text-sm font-bold text-slate-950 text-left">Client Conversations</h3>
                <span className="text-[10px] text-gray-400">Select a client to view their chat thread</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 && (
                  <div className="p-6 text-center text-xs text-gray-400">No conversations yet</div>
                )}
                {conversations
                  .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
                  .map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left border-b border-gray-50 hover:bg-slate-50 transition cursor-pointer ${
                        selectedConversation?.id === conv.id ? "bg-blue-50/60 border-l-2 border-l-blue-900" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">{conv.clientName || "Client"}</span>
                        {conv.lastMessageAt && (
                          <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">
                            {new Date(conv.lastMessageAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {(conv.repName || conv.repRole) && (
                        <span className="block text-[9px] font-bold text-blue-900 truncate mt-0.5">
                          {conv.repName} · {conv.repRole}
                        </span>
                      )}
                      {conv.summary && (
                        <span className="block text-[10px] text-gray-400 truncate mt-0.5">{conv.summary}</span>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* Right: Message Thread */}
            <div className="flex-1 flex flex-col">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
                  Select a client conversation to start messaging
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-950 flex items-center justify-center text-white text-[10px] font-bold">
                      {(selectedConversation.clientName || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">{selectedConversation.clientName || "Client"}</span>
                      <span className="block text-[10px] text-gray-400">Direct Support Channel</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-[10px] text-gray-400 py-8">No messages yet. Send the first message below.</div>
                    )}
                    {chatMessages.map((m) => (
                      <div key={m.id} className={`flex items-start space-x-2 ${m.senderId === currentUser.id ? "flex-row-reverse space-x-reverse" : ""}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          m.senderId === currentUser.id ? "bg-blue-600" : "bg-blue-950"
                        }`}>
                          {m.senderId === currentUser.id ? "Me" : "C"}
                        </div>
                        <div className={`max-w-[70%] rounded-xl px-3 py-2 text-xs shadow-sm ${
                          m.senderId === currentUser.id
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-white border border-gray-200 text-gray-800 rounded-tl-none text-left"
                        }`}>
                          <span className="block text-[8px] opacity-60 font-semibold mb-0.5">{m.senderName}</span>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-100 bg-white flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message to this client..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim()}
                      className="h-8 w-8 rounded-xl bg-blue-900 text-white flex items-center justify-center hover:bg-blue-950 transition disabled:opacity-45 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {}
      {}
      {}
      {adminSubTab === "settings" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 text-left">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-display text-sm font-bold text-slate-950">
              EBI Corporate System Tuner
            </h3>
            <p className="text-[10px] text-gray-400">
              Tweak landing pages, backend email logs, and AI chatbot prompts
              dynamically.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                Corporate Platform Name
              </label>
              <input
                type="text"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                AI Chatbot System Prompt (Instruction Context)
              </label>
              <textarea
                rows={4}
                value={chatbotPrompt}
                onChange={(e) => setChatbotPrompt(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none leading-relaxed font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                Chatbot Welcome Greeting Message
              </label>
              <input
                type="text"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Email Quote Template Body
                </label>
                <textarea
                  rows={4}
                  value={emailTemplateQuote}
                  onChange={(e) => setEmailTemplateQuote(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Email Appointment Template Body
                </label>
                <textarea
                  rows={4}
                  value={emailTemplateAppointment}
                  onChange={(e) => setEmailTemplateAppointment(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="rounded-lg bg-blue-900 hover:bg-blue-950 text-white px-5 py-2.5 text-xs font-bold shadow transition cursor-pointer"
            >
              Commit Dynamic Parameters
            </button>
          </div>
        </div>
      )}

      {}
      {}
      {}
      {adminSubTab === "logs" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-display text-sm font-bold text-slate-950 border-b border-gray-100 pb-3 text-left">
            Enterprise Audit Trail Logs
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 rounded-lg border border-gray-150 flex items-center justify-between text-left text-xs"
              >
                <div className="space-y-1">
                  <span className="font-bold text-slate-900">
                    {log.userName} ({log.userId.split("-")[1]})
                  </span>
                  <p className="text-gray-500 leading-none">{log.action}</p>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
