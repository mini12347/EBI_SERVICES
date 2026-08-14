import React, { useState, useEffect, useRef } from "react";
import {
  PlusCircle,
  CalendarDays,
  FileDown,
  Download,
  MessageSquareCode,
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Trash2,
  Bell,
  ShieldAlert,
  Check,
  HelpCircle,
} from "lucide-react";
import {
  User,
  QuoteRequest,
  Quote,
  ClientDocument,
  Message,
  Appointment,
} from "../types";
import { clientDb } from "../clientDb";
import { DEPARTMENTS, GENERAL_REP, getDepartment } from "../departments";
import {
  apiGetDemandesByClient,
  apiGetDevis,
  apiUpdateDevis,
  apiCreateDemande,
  apiDownloadQuotePDF,
} from "../api/quotes";
import { apiGetDocumentsByClient, apiUploadDocument, apiDeleteDocument, apiDownloadDocumentSummaryPDF } from "../api/documents";
import { apiGetMessagesByClient, apiCreateMessage } from "../api/messages";
import { apiGetNotificationsByUser, apiMarkNotificationRead, apiMarkAllNotificationsRead } from "../api/notifications";
import { apiGetMyAppointments, apiGetAvailability, apiCreateAppointment } from "../api/appointments";

interface PortalViewProps {
  currentUser: User;
  token: string;
  pendingBooking?: boolean;
  pendingAppointments?: boolean;
  pendingQuotes?: boolean;
  pendingChatDept?: string | null;
  onBookingOpened?: () => void;
}

export default function PortalView({ currentUser, token, pendingBooking, pendingAppointments, pendingQuotes, pendingChatDept, onBookingOpened }: PortalViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "dashboard" | "quotes" | "appointments" | "chat" | "documents"
  >("dashboard");

  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ date: string }[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [isBooking, setIsBooking] = useState(false);
  const [aptTitle, setAptTitle] = useState("");
  const [aptDate, setAptDate] = useState("");
  const [aptSlot, setAptSlot] = useState("");
  const [aptTimezone, setAptTimezone] = useState("Europe/Paris");

  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  const [quoteIndustry, setQuoteIndustry] = useState("Retail & E-commerce");
  const [quoteType, setQuoteType] = useState("Web SaaS Application");
  const [quoteBudget, setQuoteBudget] = useState("€10,000 - €25,000");
  const [quoteDeadline, setQuoteDeadline] = useState("3 Months");
  const [quoteRequirements, setQuoteRequirements] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    base64: string;
  } | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");

  const [chatMessage, setChatMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatDept, setChatDept] = useState<string>("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPortalData();
    const interval = setInterval(fetchPortalData, 10000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (pendingBooking) {
      setIsBooking(true);
      setActiveSubTab("appointments");
      if (onBookingOpened) onBookingOpened();
    }
  }, [pendingBooking, onBookingOpened]);

  useEffect(() => {
    if (pendingAppointments) {
      setActiveSubTab("appointments");
      if (onBookingOpened) onBookingOpened();
    }
  }, [pendingAppointments, onBookingOpened]);

  useEffect(() => {
    if (pendingQuotes) {
      setActiveSubTab("quotes");
      setIsRequestingQuote(true);
      if (onBookingOpened) onBookingOpened();
    }
  }, [pendingQuotes, onBookingOpened]);

  useEffect(() => {
    if (pendingChatDept) {
      setActiveSubTab("chat");
      setChatDept(pendingChatDept);
      if (onBookingOpened) onBookingOpened();
    }
  }, [pendingChatDept, onBookingOpened]);

  const getOrCreateConversation = (dept: string): string => {
    const rep = getDepartment(dept);
    const convs = clientDb.getConversations();
    const isGeneral = dept === "general";
    let conv = convs.find(
      (c) =>
        c.userId === currentUser.id &&
        (isGeneral
          ? !c.department || c.department === "general"
          : c.department === dept),
    );
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        clientName: currentUser.name,
        clientEmail: currentUser.email,
        status: "active",
        department: dept,
        repName: rep.repName,
        repRole: rep.repRole,
        lastMessageAt: new Date().toISOString(),
      };
      convs.push(conv);
      clientDb.setConversations(convs);
    }
    return conv.id;
  };

  const loadChatForDept = (dept: string) => {
    try {
      const id = getOrCreateConversation(dept);
      setChatId(id);
      const rMsgs = clientDb
        .getMessages()
        .filter((m) => m.conversationId === id);
      setMessages(rMsgs);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadChatForDept(chatDept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatDept, token]);

  const fetchPortalData = async () => {
    let apiUsed = false;
    // Try API first for demandes
    try {
      const demandes = await apiGetDemandesByClient(currentUser.id);
      if (demandes && demandes.length > 0) {
        const mapped: QuoteRequest[] = demandes.map((d: any) => ({
          id: d._id,
          userId: typeof d.client === 'object' ? d.client._id : d.client,
          clientName: currentUser.name,
          company: currentUser.companyId || '',
          industry: typeof d.service === 'object' ? d.service.nom || '' : '',
          projectType: typeof d.service === 'object' ? d.service.nom || '' : '',
          budget: '',
          deadline: '',
          requirements: d.besoin,
          status: mapStatut(d.statut),
          createdAt: d.createdAt,
        }));
        setQuoteRequests(mapped);
        apiUsed = true;
      }
    } catch { /* fallback */ }

    if (!apiUsed) {
      try {
        const rReqs = clientDb
          .getQuoteRequests()
          .filter((q) => q.userId === currentUser.id);
        setQuoteRequests(rReqs);
      } catch { /* ignore */ }
    }

    // Quotes via API
    try {
      const devisList = await apiGetDevis();
      if (devisList && devisList.length > 0) {
        const mapped: Quote[] = devisList.map((d: any) => ({
          id: d._id,
          quoteRequestId: typeof d.demande === 'object' ? d.demande._id : d.demande,
          clientName: currentUser.name,
          projectName: `Quote ${d._id.slice(-6)}`,
          amount: d.montant,
          terms: '',
          expiryDate: '',
          status: mapDevisStatut(d.statut),
          createdAt: d.createdAt,
        }));
        mapDevisToQuoteRequests(mapped);
        setQuotes(mapped);
      }
    } catch {
      try {
        const rQuotes = clientDb
          .getQuotes()
          .filter((q) => q.clientName === currentUser.name);
        setQuotes(rQuotes);
      } catch { /* ignore */ }
    }

    // Appointments (API first, clientDb fallback)
    try {
      const apiApts = await apiGetMyAppointments(currentUser.id);
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
        setAppointments(mapped);
      } else {
        throw new Error("empty");
      }
    } catch {
      try {
        const rApts = clientDb
          .getAppointments()
          .filter((a) => a.userId === currentUser.id);
        setAppointments(rApts);
      } catch { /* ignore */ }
    }

    // Available slots for booking (from shared availability calendar)
    try {
      const slots = await apiGetAvailability();
      if (slots && slots.length > 0) {
        const future = slots
          .filter((s) => new Date(s.date) > new Date())
          .sort((a, b) => a.date.localeCompare(b.date));
        setAvailableSlots(future);
      }
    } catch { /* ignore */ }

    // Documents via API
    try {
      const docs = await apiGetDocumentsByClient(currentUser.id);
      if (docs && docs.length > 0) {
        const mapped: ClientDocument[] = docs.map((d: any) => ({
          id: d._id,
          userId: currentUser.id,
          name: d.nom_fichier,
          type: d.type_mime || 'application/octet-stream',
          size: d.taille ? `${(d.taille / 1024).toFixed(0)} KB` : 'Unknown',
          url: d.lien || '#',
          createdAt: d.createdAt,
        }));
        setDocuments(mapped);
      }
    } catch {
      try {
        const rDocs = clientDb
          .getDocuments()
          .filter((d) => d.userId === currentUser.id);
        setDocuments(rDocs);
      } catch { /* ignore */ }
    }

    // Notifications via API
    try {
      const notifs = await apiGetNotificationsByUser(currentUser.id);
      if (notifs && notifs.length > 0) {
        const mapped = notifs.map((n: any) => ({
          id: n._id,
          userId: currentUser.id,
          title: n.type,
          message: n.contenu,
          read: n.lu,
          createdAt: n.createdAt,
        }));
        setNotifications(mapped);
      }
    } catch {
      try {
        const rNotifs = clientDb
          .getNotifications()
          .filter((n) => n.userId === currentUser.id);
        setNotifications(rNotifs);
      } catch { /* ignore */ }
    }

    // Chat handled separately by loadChatForDept (per department conversation)
  };

  function slotLabel(iso: string): string {
    const d = new Date(iso);
    const h = d.getHours();
    const t = d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${t} - ${String(h + 1).padStart(2, "0")}:00`;
  }

  const FALLBACK_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

  function timeOptionsForDate(date: string): { value: string; label: string }[] {
    const existing = availableSlots
      .filter((s) => s.date.startsWith(date))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (existing.length > 0) {
      return existing.map((s) => ({ value: s.date, label: slotLabel(s.date) }));
    }
    return FALLBACK_HOURS.map((h) => ({
      value: `${date}T${String(h).padStart(2, "0")}:00:00`,
      label: `${String(h).padStart(2, "0")}:00 - ${String(h + 1).padStart(2, "0")}:00`,
    }));
  }

  function groupSlotsByDate(slots: { date: string }[], maxDays = 7) {
    const groups: { date: string; times: string[] }[] = [];
    for (const s of slots) {
      const day = s.date.slice(0, 10);
      const last = groups[groups.length - 1];
      if (last && last.date === day) {
        last.times.push(s.date);
      } else {
        if (groups.length >= maxDays) break;
        groups.push({ date: day, times: [s.date] });
      }
    }
    return groups;
  }

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

  function mapDevisToQuoteRequests(devisList: Quote[]) {
    const reqs = clientDb.getQuoteRequests();
    let changed = false;
    devisList.forEach((d) => {
      const req = reqs.find((r) => r.id === d.quoteRequestId);
      if (req && req.status === "in_review") {
        req.status = "quoted";
        changed = true;
      }
    });
    if (changed) clientDb.setQuoteRequests(reqs);
  }

  const handleQuoteRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteType || !quoteRequirements) return;

    let apiCreated = false;
    try {
      const result = await apiCreateDemande({
        client: currentUser.id,
        service: "000000000000000000000000", // placeholder, backend requires ObjectId
        besoin: `${quoteType}: ${quoteRequirements}`,
      });
      if (result && result.demande) {
        clientDb.addActivityLog(
          currentUser.id,
          currentUser.name,
          `Created scoping request via API: ${quoteType}`,
        );
        apiCreated = true;
      }
    } catch {
      // fallback to clientDb
    }

    if (!apiCreated) {
      try {
        const reqs = clientDb.getQuoteRequests();
        const newReq: QuoteRequest = {
          id: `qr-${Math.random().toString(36).substring(2, 11)}`,
          userId: currentUser.id,
          clientName: currentUser.name,
          company: currentUser.companyId || "Individual",
          industry: quoteIndustry,
          projectType: quoteType,
          budget: quoteBudget,
          deadline: quoteDeadline,
          requirements: quoteRequirements,
          attachmentName: uploadedFile?.name || "",
          attachmentUrl: uploadedFile ? "#" : undefined,
          status: "new",
          createdAt: new Date().toISOString(),
        };
        reqs.push(newReq);
        clientDb.setQuoteRequests(reqs);

        clientDb.addNotification(
          "usr-admin",
          "New Scoping Profile Registered",
          `${currentUser.name} has submitted a new requirements specification: ${quoteType}.`,
        );
        clientDb.addActivityLog(
          currentUser.id,
          currentUser.name,
          `Created scoping request: ${quoteType}`,
        );
      } catch (err) {
        console.error(err);
      }
    }

    setIsRequestingQuote(false);
    setQuoteRequirements("");
    setUploadedFile(null);
    fetchPortalData();
  };

  const handleAppointmentBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptTitle || !aptDate) return;

    const opts = timeOptionsForDate(aptDate);
    const chosen = opts.find((o) => o.value === aptSlot) || opts[0];
    const timeSlot = chosen?.label || "";
    const slotDate = chosen?.value || "";

    try {
      // Save to localStorage
      const apts = clientDb.getAppointments();
      const newApt: Appointment = {
        id: `apt-${Math.random().toString(36).substring(2, 11)}`,
        userId: currentUser.id,
        clientName: currentUser.name,
        clientEmail: currentUser.email,
        title: aptTitle,
        date: aptDate,
        timeSlot,
        timezone: aptTimezone,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      apts.push(newApt);
      clientDb.setAppointments(apts);

      clientDb.addNotification(
        "usr-admin",
        "Consultation Requested",
        `${currentUser.name} requested an appointment: "${aptTitle}" on ${aptDate} at ${timeSlot}.`,
      );
      clientDb.addActivityLog(
        currentUser.id,
        currentUser.name,
        `Requested consultation: "${aptTitle}"`,
      );

      // Save to backend API (sends confirmation email + blocks the slot)
      try {
        await apiCreateAppointment({
          userId: currentUser.id,
          clientName: currentUser.name,
          clientEmail: currentUser.email,
          title: aptTitle,
          date: aptDate,
          timeSlot,
          timezone: aptTimezone,
          slotDate,
        });
      } catch {
        // Backend unavailable — email not sent, but local booking works
      }

      setIsBooking(false);
      setAptTitle("");
      setAptDate("");
      setAptSlot("");
      fetchPortalData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuoteAction = async (
    quoteId: string,
    status: "accepted" | "rejected",
  ) => {
    const backendStatus = status === "accepted" ? "accepte" : "refuse";
    try {
      await apiUpdateDevis(quoteId, { statut: backendStatus } as any);
    } catch {
      // fallback to clientDb
    }

    try {
      const quotesList = clientDb.getQuotes();
      const quote = quotesList.find((q) => q.id === quoteId);
      if (quote) {
        quote.status = status;
        clientDb.setQuotes(quotesList);

        if (quote.quoteRequestId) {
          const rList = clientDb.getQuoteRequests();
          const qReq = rList.find((r) => r.id === quote.quoteRequestId);
          if (qReq) {
            qReq.status = status;
            clientDb.setQuoteRequests(rList);
          }
        }

        clientDb.addNotification(
          "usr-admin",
          `Quote ${status.toUpperCase()}`,
          `${currentUser.name} has ${status} the proposal of €${quote.amount.toLocaleString()} for "${quote.projectName}".`,
        );
        clientDb.addActivityLog(
          currentUser.id,
          currentUser.name,
          `${status} quotation for "${quote.projectName}"`,
        );
      }
      fetchPortalData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploadProgressMsg("Uploading...");

    try {
      await apiUploadDocument("", file); // demandeId optional
      setUploadProgressMsg("Upload Completed!");
      setTimeout(() => setUploadProgressMsg(""), 2000);
      fetchPortalData();
      return;
    } catch {
      // fallback to clientDb
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const docsList = clientDb.getDocuments();
        const newDoc: ClientDocument = {
          id: `doc-${Math.random().toString(36).substring(2, 11)}`,
          userId: currentUser.id,
          name: file.name,
          type: file.type,
          size:
            file.size > 1024 * 1024
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
              : `${(file.size / 1024).toFixed(0)} KB`,
          url: "#",
          createdAt: new Date().toISOString(),
        };
        docsList.push(newDoc);
        clientDb.setDocuments(docsList);

        clientDb.addNotification(
          "usr-admin",
          "Secure Document Uploaded",
          `${currentUser.name} uploaded document "${file.name}" into their Portal Vault.`,
        );
        clientDb.addActivityLog(
          currentUser.id,
          currentUser.name,
          `Uploaded document "${file.name}" to Vault`,
        );

        setUploadProgressMsg("Upload Completed!");
        setTimeout(() => setUploadProgressMsg(""), 2000);
        fetchPortalData();
      } catch (err) {
        console.error(err);
        setUploadProgressMsg("Upload failed.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleQuoteAttachmentInput = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFile({
          name: file.name,
          base64: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !chatId) return;

    try {
      await apiCreateMessage({
        client: currentUser.id,
        expediteur: currentUser.id,
        contenu: chatMessage,
        client_email: currentUser.email,
      });
    } catch {
      // fallback to clientDb
    }

    try {
      const msgs = clientDb.getMessages();
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId: chatId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        text: chatMessage,
        timestamp: new Date().toISOString(),
      };
      msgs.push(newMsg);
      clientDb.setMessages(msgs);

      const convs = clientDb.getConversations();
      const conv = convs.find((c) => c.id === chatId);
      if (conv) {
        conv.lastMessageAt = new Date().toISOString();
        conv.summary = `Last message: ${chatMessage.substring(0, 40)}...`;
        clientDb.setConversations(convs);
      }

      clientDb.addNotification(
        "usr-admin",
        "New Portal Message",
        `New portal message from ${currentUser.name}: "${chatMessage.substring(0, 50)}"`,
      );

      setChatMessage("");
      loadChatForDept(chatDept);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await apiDeleteDocument(id);
    } catch {
      // fallback to clientDb
    }
    try {
      const docsList = clientDb.getDocuments();
      const filtered = docsList.filter((d) => d.id !== id);
      clientDb.setDocuments(filtered);

      clientDb.addActivityLog(
        currentUser.id,
        currentUser.name,
        `Deleted document ID ${id} from Vault`,
      );
      fetchPortalData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadDocumentPDF = async (id: string) => {
    try {
      await apiDownloadDocumentSummaryPDF(id);
    } catch (err) {
      console.error(err);
      alert("Could not generate the PDF for this file.");
    }
  };

  const aptTimeOptions = aptDate ? timeOptionsForDate(aptDate) : [];
  const effectiveAptSlot =
    aptSlot && aptTimeOptions.some((o) => o.value === aptSlot)
      ? aptSlot
      : aptTimeOptions[0]?.value || "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
            Active Client Portal
          </span>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs text-gray-500">
            Track and manage your EBI Custom software, HR, and outsourcing
            requests directly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsRequestingQuote(true)}
            className="rounded-lg bg-blue-900 hover:bg-blue-950 text-white px-3.5 py-2 text-xs font-semibold shadow flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Request Quote</span>
          </button>
          <button
            onClick={() => setIsBooking(true)}
            className="rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 bg-white px-3.5 py-2 text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Book Consultation</span>
          </button>
        </div>
      </div>

      {}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-xs font-bold tracking-wide uppercase">
          {[
            { id: "dashboard", label: "Overview" },
            { id: "quotes", label: "Quotations & Requests" },
            { id: "appointments", label: "Appointments History" },
            { id: "chat", label: "Manager Chat" },
            { id: "documents", label: "Secure Vault" },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`py-2 border-b-2 cursor-pointer transition-all ${
                activeSubTab === sub.id
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
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1 text-left">
              <span className="text-gray-400 text-[10px] uppercase font-bold">
                Total Request Pipelines
              </span>
              <span className="block text-2xl font-extrabold text-blue-950">
                {quoteRequests.length}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                CRM registered requirements
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1 text-left">
              <span className="text-gray-400 text-[10px] uppercase font-bold">
                Issued Quotations
              </span>
              <span className="block text-2xl font-extrabold text-blue-950">
                {quotes.length}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                Ready for review
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1 text-left">
              <span className="text-gray-400 text-[10px] uppercase font-bold">
                Scheduled Meetings
              </span>
              <span className="block text-2xl font-extrabold text-blue-950">
                {
                  appointments.filter(
                    (a) => a.status === "confirmed" || a.status === "pending",
                  ).length
                }
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                Consultations logs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {}
            <div className="md:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-display text-sm font-bold text-slate-950">
                  My Formal Quotations
                </h3>
                <button
                  onClick={() => setActiveSubTab("quotes")}
                  className="text-xs text-blue-900 hover:underline"
                >
                  View all
                </button>
              </div>

              {quotes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No quotes generated yet. Submit a project request to begin.
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-gray-150 p-4 space-y-3 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400">
                            REFERENCE: Q-{q.id.slice(-6).toUpperCase()}
                          </span>
                          <span className="block text-xs font-bold text-slate-900">
                            {q.projectName}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-blue-900">
                          €{q.amount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded">
                        {q.terms}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-gray-400">
                          Expires: {q.expiryDate}
                        </span>

                        {q.status === "sent" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleQuoteAction(q.id, "accepted")
                              }
                              className="rounded bg-blue-900 text-white text-[10px] font-bold px-2.5 py-1 hover:bg-blue-950 transition cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleQuoteAction(q.id, "rejected")
                              }
                              className="rounded border border-gray-300 text-gray-600 text-[10px] font-bold px-2.5 py-1 hover:bg-gray-50 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              q.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {q.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {}
            <div className="md:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="font-display text-sm font-bold text-slate-950 border-b border-gray-100 pb-3 text-left">
                Portal Notifications
              </h3>

              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No active logs or notices.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg border text-left space-y-1 ${
                        notif.read
                          ? "bg-slate-50 border-gray-150"
                          : "bg-blue-50/50 border-blue-100"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="block text-xs font-bold text-gray-900">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={() => {
                              const notifs = clientDb.getNotifications();
                              const found = notifs.find(
                                (n) => n.id === notif.id,
                              );
                              if (found) {
                                found.read = true;
                                clientDb.setNotifications(notifs);
                              }
                              fetchPortalData();
                            }}
                            className="text-[9px] font-semibold text-blue-900 hover:underline"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="block text-[8px] text-gray-400 text-right">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {}
      {}
      {}
      {activeSubTab === "quotes" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {}
          <div className="md:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-950 border-b border-gray-100 pb-3 text-left">
              My Scoping Requests
            </h3>

            {quoteRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No active scoping requests. Click "Request Quote" above to build
                a project requirement profile!
              </div>
            ) : (
              <div className="space-y-4">
                {quoteRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-gray-150 p-4 space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {req.projectType}
                      </span>
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
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {req.requirements}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-400 bg-slate-50 p-2 rounded">
                      <div>
                        <span className="font-bold">Budget Choice:</span>{" "}
                        {req.budget}
                      </div>
                      <div>
                        <span className="font-bold">Deadline Choice:</span>{" "}
                        {req.deadline}
                      </div>
                    </div>
                    {req.attachmentName && (
                      <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-blue-900">
                        <FileText className="h-3.5 w-3.5" />
                        <a href={req.attachmentUrl} className="hover:underline">
                          {req.attachmentName}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="md:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-950 border-b border-gray-100 pb-3 text-left">
              Issued Proposals
            </h3>

            {quotes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                Once managers issue your formal proposal, it will display here
                with printable SLA parameters.
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-gray-200 p-4 space-y-3 text-left bg-slate-50/50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Formal Quote
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">
                          {q.projectName}
                        </h4>
                      </div>
                      <button
                        onClick={() => {
                          apiDownloadQuotePDF(q.id).catch((err) => {
                            console.error(err);
                            alert("Could not download the quote PDF.");
                          });
                        }}
                        className="p-1.5 bg-white border border-gray-200 rounded text-gray-500 hover:text-blue-900 shadow-sm transition"
                        title="Download Quote PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-2 text-[11px] space-y-1 text-gray-600">
                      <div>
                        <span className="font-bold">Proposed Budget:</span> €
                        {q.amount.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-semibold">Expiry Date:</span>{" "}
                        {q.expiryDate}
                      </div>
                      <div className="text-[10px] text-gray-500 leading-relaxed italic mt-2">
                        {q.terms}
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      {q.status === "sent" ? (
                        <>
                          <button
                            onClick={() => handleQuoteAction(q.id, "accepted")}
                            className="flex-1 bg-blue-900 text-white text-[10px] font-bold py-2 rounded shadow-sm hover:bg-blue-950 transition cursor-pointer"
                          >
                            Accept & Sign SLA
                          </button>
                          <button
                            onClick={() => handleQuoteAction(q.id, "rejected")}
                            className="flex-1 bg-white border border-gray-300 text-gray-600 text-[10px] font-bold py-2 rounded shadow-sm hover:bg-gray-50 transition cursor-pointer"
                          >
                            Reject Quote
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center py-1 border rounded text-[10px] uppercase font-bold tracking-wider">
                          Quote Status:{" "}
                          <span
                            className={
                              q.status === "accepted"
                                ? "text-green-700"
                                : "text-red-700"
                            }
                          >
                            {q.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {}
      {}
      {activeSubTab === "appointments" && (
        <div className="space-y-6">
          {}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-left">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-950">
                  Available Slots
                </h3>
                <span className="text-[10px] text-gray-400">
                  Pick a date and time slot to book your consultation.
                </span>
              </div>
              <button
                onClick={() => {
                  setAptDate("");
                  setAptSlot("");
                  setIsBooking(true);
                }}
                className="rounded-lg bg-blue-900 hover:bg-blue-950 text-white px-3.5 py-2 text-xs font-semibold shadow flex items-center gap-1.5 cursor-pointer"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Book Consultation</span>
              </button>
            </div>

            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No available slots right now. Please come back later or contact
                our team directly.
              </div>
            ) : (
              <div className="space-y-3">
                {groupSlotsByDate(availableSlots).map((group) => (
                  <div
                    key={group.date}
                    className="rounded-xl border border-gray-150 p-3 text-left flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-[150px]">
                      <span className="block text-xs font-bold text-slate-900">
                        {new Date(`${group.date}T12:00:00`).toLocaleDateString(
                          "en-GB",
                          { weekday: "long", day: "numeric", month: "long" },
                        )}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {group.date}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {group.times.map((iso) => (
                        <button
                          key={iso}
                          onClick={() => {
                            setAptDate(group.date);
                            setAptSlot(iso);
                            setIsBooking(true);
                          }}
                          className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-900 hover:bg-blue-900 hover:text-white transition cursor-pointer"
                        >
                          {slotLabel(iso)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-950 border-b border-gray-100 pb-3 text-left">
              Appointments History
            </h3>

            {appointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No meetings scheduled yet. Pick an available slot above to book
                your first consultation!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {appointments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-gray-150 p-4 text-left space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="block text-xs font-bold text-slate-900">
                          {a.title}
                        </span>
                        <span className="block text-[10px] text-gray-500">
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
                    {a.adminNotes && (
                      <p className="text-[10px] text-gray-500 leading-relaxed bg-slate-50 p-2 rounded">
                        <span className="font-bold text-slate-900 block">
                          Manager Notes:
                        </span>
                        {a.adminNotes}
                      </p>
                    )}
                    {a.status === "pending" && (
                      <button
                        onClick={() => {
                          const aptsList = clientDb.getAppointments();
                          const found = aptsList.find((ap) => ap.id === a.id);
                          if (found) {
                            found.status = "cancelled";
                            clientDb.setAppointments(aptsList);
                            clientDb.addActivityLog(
                              currentUser.id,
                              currentUser.name,
                              `Cancelled appointment: "${a.title}"`,
                            );
                          }
                          fetchPortalData();
                        }}
                        className="text-[10px] text-red-600 font-bold hover:underline"
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {}
      {}
      {activeSubTab === "chat" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 max-w-2xl mx-auto">
          <div className="border-b border-gray-100 pb-3 text-left">
            <h3 className="font-display text-sm font-bold text-slate-950">
              Manager Direct Support Line
            </h3>
            <span className="text-[10px] text-gray-400">
              Directly converse with EBI Services department heads. Fully
              secured.
            </span>
          </div>

          {}
          <div>
            <span className="block text-[9px] font-bold uppercase text-gray-400 mb-2 text-left">
              Select a department representative
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setChatDept(GENERAL_REP.key)}
                className={`rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                  chatDept === GENERAL_REP.key
                    ? "border-blue-900 bg-blue-900 text-white"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <span
                  className={`block text-[10px] font-bold ${
                    chatDept === GENERAL_REP.key ? "text-white" : "text-slate-900"
                  }`}
                >
                  {GENERAL_REP.name}
                </span>
                <span
                  className={`block text-[9px] ${
                    chatDept === GENERAL_REP.key ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {GENERAL_REP.repRole}
                </span>
              </button>
              {DEPARTMENTS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setChatDept(d.key)}
                  className={`rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                    chatDept === d.key
                      ? "border-blue-900 bg-blue-900 text-white"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <span
                    className={`block text-[10px] font-bold ${
                      chatDept === d.key ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {d.name}
                  </span>
                  <span
                    className={`block text-[9px] ${
                      chatDept === d.key ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {d.repRole}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="rounded-xl bg-slate-50 border border-gray-150 px-3 py-2 text-left">
            <span className="block text-[10px] font-bold text-slate-900">
              {getDepartment(chatDept).repName}
            </span>
            <span className="block text-[9px] text-gray-500">
              {getDepartment(chatDept).repRole} — {getDepartment(chatDept).name}
            </span>
          </div>

          <div className="h-72 overflow-y-auto bg-slate-50 border border-gray-150 rounded-xl p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-[10px] text-gray-400 py-8">
                Start the conversation with your representative below.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start space-x-2 ${
                  m.senderId === currentUser.id
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    m.senderId === currentUser.id
                      ? "bg-blue-600"
                      : "bg-blue-950"
                  }`}
                >
                  {m.senderId === currentUser.id ? "Me" : "R"}
                </div>
                <div
                  className={`max-w-[70%] rounded-xl px-3 py-2 text-xs shadow-sm ${
                    m.senderId === currentUser.id
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-none text-left"
                  }`}
                >
                  <span className="block text-[8px] opacity-60 font-semibold mb-0.5">
                    {m.senderName}
                  </span>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Send message to our staff..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
              className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
            />
            <button
              onClick={handleSendChatMessage}
              disabled={!chatMessage.trim()}
              className="h-8 w-8 rounded-xl bg-blue-900 text-white flex items-center justify-center hover:bg-blue-950 transition disabled:opacity-45 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {}
      {}
      {}
      {activeSubTab === "documents" && (
        <div className="space-y-6">
          {}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragActive
                ? "border-blue-900 bg-blue-50/40"
                : "border-gray-300 bg-white"
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <UploadCloud className="h-10 w-10 text-gray-400" />
              <span className="font-display text-xs font-bold text-slate-900">
                Drag and Drop scoping draft / RFP documentation
              </span>
              <span className="text-[10px] text-gray-400">
                PDF, Word, Excel, Images (max 10MB)
              </span>

              <div className="relative">
                <input
                  type="file"
                  id="vault-file-picker"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("vault-file-picker")?.click()
                  }
                  className="mt-2 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white px-3.5 py-1.5 rounded-lg shadow cursor-pointer"
                >
                  Browse Files manually
                </button>
              </div>

              {uploadProgressMsg && (
                <span className="block text-[11px] font-bold text-blue-900 pt-1">
                  {uploadProgressMsg}
                </span>
              )}
            </div>
          </div>

          {}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-950 border-b border-gray-100 pb-3 text-left">
              Document Vault logs
            </h3>

            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Vault is empty. Upload your contracts, mock receipts, or
                specifications.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-xl border border-gray-150 p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-blue-900">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">
                          {doc.name}
                        </span>
                        <span className="block text-[9px] text-gray-400">
                          {doc.size} •{" "}
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadDocumentPDF(doc.id)}
                        className="p-1.5 bg-gray-50 border border-gray-200 hover:text-blue-900 rounded shadow-sm text-gray-500 transition"
                        title="Download PDF summary"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                      <a
                        href={doc.url}
                        className="p-1.5 bg-gray-50 border border-gray-200 hover:text-blue-900 rounded shadow-sm text-gray-500 transition"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 bg-gray-50 border border-gray-200 hover:text-red-600 rounded shadow-sm text-gray-500 transition"
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {isRequestingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-display text-base font-bold text-slate-900">
                Request Custom Quote
              </h2>
              <button
                onClick={() => setIsRequestingQuote(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuoteRequestSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                    Company Industry
                  </label>
                  <select
                    value={quoteIndustry}
                    onChange={(e) => setQuoteIndustry(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  >
                    <option>Retail & E-commerce</option>
                    <option>Fintech & Banking</option>
                    <option>Logistics & Transport</option>
                    <option>Healthcare & Pharma</option>
                    <option>SaaS & Tech Startup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                    Project Category choice
                  </label>
                  <select
                    value={quoteType}
                    onChange={(e) => setQuoteType(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  >
                    <option>Web SaaS Application</option>
                    <option>Custom ERP system</option>
                    <option>IT Screening & Recruitment</option>
                    <option>Bilingual Call Center Outsource</option>
                    <option>Back-office Admin Support</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                    Budget Allocation
                  </label>
                  <select
                    value={quoteBudget}
                    onChange={(e) => setQuoteBudget(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  >
                    <option>€5,000 - €10,000</option>
                    <option>€10,000 - €25,000</option>
                    <option>€25,000 - €50,000</option>
                    <option>€50,000 - €100,000</option>
                    <option>€100,000+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                    Delivery Deadline
                  </label>
                  <select
                    value={quoteDeadline}
                    onChange={(e) => setQuoteDeadline(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  >
                    <option>1 Month (Urgent)</option>
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>Flexible timeline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                  Requirements Spec mark *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your technical parameters, stack selection, features checklist, or daily operations seats needs..."
                  value={quoteRequirements}
                  onChange={(e) => setQuoteRequirements(e.target.value)}
                  className="w-full rounded border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              {}
              <div>
                <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                  Upload Scoping RFP (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleQuoteAttachmentInput}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadedFile && (
                  <span className="block mt-1 text-[10px] text-green-700 font-semibold">
                    ✓ Attached: {uploadedFile.name}
                  </span>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg py-2.5 text-xs font-semibold shadow transition cursor-pointer"
                >
                  Submit Quote Request
                </button>
                <button
                  type="button"
                  onClick={() => setIsRequestingQuote(false)}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg px-4 py-2.5 text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {isBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-display text-base font-bold text-slate-900">
                Book SLA Consultation
              </h2>
              <button
                onClick={() => setIsBooking(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAppointmentBooking} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                  Meeting Objective *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kickoff ERP integration & pricing review"
                  value={aptTitle}
                  onChange={(e) => setAptTitle(e.target.value)}
                  className="w-full rounded border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                  Schedule Date *
                </label>
                <input
                  type="date"
                  required
                  value={aptDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setAptDate(e.target.value)}
                  className="w-full rounded border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                  Time Slot selection
                </label>
                {aptDate ? (
                  <select
                    value={effectiveAptSlot}
                    onChange={(e) => setAptSlot(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  >
                    {aptTimeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="block text-[10px] text-gray-400 border border-dashed border-gray-200 rounded p-2">
                    Select a date above to see the available time slots.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">
                  Timezone support
                </label>
                <select
                  value={aptTimezone}
                  onChange={(e) => setAptTimezone(e.target.value)}
                  className="w-full rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                >
                  <option>Europe/Paris (CET)</option>
                  <option>America/New_York (EST)</option>
                  <option>Asia/Singapore (SGT)</option>
                  <option>UTC / GMT</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg py-2.5 text-xs font-semibold shadow transition cursor-pointer"
                >
                  Book Slot on Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setIsBooking(false)}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg px-4 py-2.5 text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
