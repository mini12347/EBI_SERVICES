import React, { useState, useRef, useEffect, JSX } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  User,
  HelpCircle,
  Calendar,
  Briefcase,
  ChevronDown,
  CornerDownRight,
} from "lucide-react";

import { clientDb } from "../clientDb";
import { apiCreateLead } from "../api/leads";
import { post, get } from "../api/client";
import { departmentKeyForName, getDepartment } from "../departments";

function renderMarkdown(text: string): JSX.Element[] {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let inList: { items: JSX.Element[]; key: string } | null = null;

  function flushList() {
    if (inList) {
      elements.push(
        <ul key={inList.key} className="list-disc pl-4 space-y-0.5 my-1.5 text-[11px]">
          {inList.items}
        </ul>
      );
      inList = null;
    }
  }

  function inlineFormat(part: string, idx: number): JSX.Element {
    const segments: JSX.Element[] = [];
    let remaining = part;
    let segIdx = 0;
    const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        segments.push(<span key={segIdx++}>{remaining.slice(lastIndex, match.index)}</span>);
      }
      if (match[1]) {
        segments.push(<strong key={segIdx++} className="font-semibold text-blue-900">{match[2]}</strong>);
      } else if (match[3]) {
        segments.push(<code key={segIdx++} className="bg-gray-100 px-1 rounded text-[10px] font-mono">{match[4]}</code>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < remaining.length) {
      segments.push(<span key={segIdx++}>{remaining.slice(lastIndex)}</span>);
    }
    return <React.Fragment key={idx}>{segments}</React.Fragment>;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") { i++; continue; }

    if (trimmed.startsWith("|")) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().split("|").filter(c => c !== "").map(c => c.trim());
        if (cells.length > 0) tableRows.push(cells);
        i++;
      }
      if (tableRows.length >= 2) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(2);
        if (bodyRows.length > 0) {
          elements.push(
            <div key={`tbl-${i}`} className="my-2">
              <table className="w-full text-[11px] border-collapse rounded-lg overflow-hidden shadow-sm border border-gray-300">
                <thead>
                  <tr className="bg-blue-900">
                    {headerRow.map((h, ci) => (
                      <th key={ci} className="px-3 py-2 text-left font-semibold text-white text-[10px] uppercase tracking-wider border-r border-blue-800 last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className={`${ri % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50/50 transition-colors`}>
                      {row.map((cell, ci) => {
                        const isFirst = ci === 0;
                        return (
                          <td key={ci} className={`px-3 py-1.5 border-t border-gray-200 text-[11px] ${isFirst ? "font-semibold text-blue-900 whitespace-nowrap" : "text-gray-700"} ${ci < row.length - 1 ? "border-r border-gray-100" : ""}`}>
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }
    }

    if (trimmed === "---") {
      elements.push(<hr key={`hr-${i}`} className="my-2 border-gray-200" />);
      i++; continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-[11px] font-bold text-blue-950 mt-2 mb-1">
          {trimmed.slice(4)}
        </h3>
      );
      i++; continue;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-xs font-bold text-blue-950 mt-2 mb-1">
          {trimmed.slice(3)}
        </h2>
      );
      i++; continue;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-sm font-bold text-blue-950 mt-2 mb-1">
          {trimmed.slice(2)}
        </h1>
      );
      i++; continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.slice(2);
      const item = <li key={`li-${i}`}>{inlineFormat(content, 0)}</li>;
      if (inList) {
        inList.items.push(item);
      } else {
        inList = { items: [item], key: `list-${i}` };
      }
      i++; continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-[11px] leading-relaxed mb-1.5">
        {inlineFormat(line, 0)}
      </p>
    );
    i++;
  }

  flushList();
  return elements;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  redirect?: { department: string; lang: string };
}

interface AIChatbotProps {
  currentUser: any;
  onLeadSubmitSuccess?: () => void;
  onOpenForm?: () => void;
  onOpenPortal?: () => void;
  onOpenBooking?: () => void;
  onOpenAppointments?: () => void;
  onOpenQuotes?: () => void;
  onOpenDepartmentChat?: (deptKey: string) => void;
  onOpenLogin?: () => void;
}

export default function AIChatbot({
  currentUser,
  onLeadSubmitSuccess,
  onOpenForm,
  onOpenPortal,
  onOpenBooking,
  onOpenAppointments,
  onOpenQuotes,
  onOpenDepartmentChat,
  onOpenLogin,
}: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am the EBI Services AI Assistant. I can help explain our custom software development workflows, IT recruitment capabilities, and customer support outsourcing solutions.\n\n**You can ask in English or French.**\n\n---\n\nBonjour ! Je suis l'assistant IA d'EBI Services. Je peux vous renseigner sur nos développements logiciels sur mesure, recrutement IT et solutions d'externalisation.\n\n**Vous pouvez poser vos questions en français ou en anglais.**",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [awaitingAppointmentConfirm, setAwaitingAppointmentConfirm] = useState(false);
  const [pendingDeptRedirect, setPendingDeptRedirect] = useState<string | null>(null);

  const [leadName, setLeadName] = useState(currentUser?.name || "");
  const [leadCompany, setLeadCompany] = useState(currentUser?.companyId || "");
  const [leadEmail, setLeadEmail] = useState(currentUser?.email || "");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCountry, setLeadCountry] = useState("France");
  const [leadDesc, setLeadDesc] = useState("");
  const [leadBudget, setLeadBudget] = useState("€10,000 - €25,000");
  const [leadDeadline, setLeadDeadline] = useState("3 Months");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [leadSubmitError, setLeadSubmitError] = useState("");
  const [conversationLang, setConversationLang] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, showLeadForm]);

  useEffect(() => {
    if (currentUser) {
      setLeadName(currentUser.name);
      setLeadEmail(currentUser.email);
      setLeadCompany(currentUser.companyId || "");
    }
  }, [currentUser]);



  // Detect language based on common patterns
  const detectLang = (text: string): string => {
    const frenchPattern = /[àâäéèêëîïôöùûüç]|^(bonjour|salut|je\s|j'|nous|vous|svp|s'il)/i;
    const englishPattern = /^(hello|hi|hey|i\s|we\s|can\s|how\s|what\s|where\s|when\s|is\s|are\s|please)/i;
    if (frenchPattern.test(text)) return "fr";
    if (englishPattern.test(text)) return "en";
    return "en";
  };

  const redirectWithMessage = (text: string, redirect: () => void) => {
    const msg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    setIsLoading(false);
    setTimeout(() => {
      setIsOpen(false);
      redirect();
    }, 1200);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Compute language for this message (use existing or detect on first message)
    const msgLang = conversationLang || detectLang(textToSend);
    if (!conversationLang) {
      setConversationLang(msgLang);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    const isClient = currentUser?.role === "client";
    const bookingIntent =
      /(prendre|r[eé]server|programmer|planifier)\s+(un\s+|une\s+|a\s+)?(rendez[- ]?vous|rdv|meeting|appointment|consultation)|(book|schedule|make)\s+(an?\s+)?(appointment|meeting|rdv)|je veux un rdv/i.test(
        textToSend,
      );
    const availabilityIntent =
      /(disponibilit[eé]s?|cr[eé]neaux?|available\s+slots?|availability|what\s+times|quels?\s+horaires)/i.test(
        textToSend,
      );
    const cancelAppointmentIntent =
      /(annuler|supprimer|cancel)\s+(mon\s+|mes\s+|le\s+|un\s+)?(rendez[- ]?vous|rdv|appointment)/i.test(
        textToSend,
      );

    if (bookingIntent || availabilityIntent || cancelAppointmentIntent) {
      if (isClient) {
        const destinationLabel =
          msgLang === "fr" ? "section Rendez-vous" : "Appointments section";
        const message =
          msgLang === "fr"
            ? `Je vous redirige vers la ${destinationLabel} de votre espace client pour consulter les créneaux et gérer votre demande.`
            : `I’m redirecting you to the ${destinationLabel} in your client portal to check availability or manage your request.`;
        redirectWithMessage(message, () => {
          if (cancelAppointmentIntent && onOpenAppointments) {
            onOpenAppointments();
          } else if (onOpenBooking) {
            onOpenBooking();
          } else if (onOpenPortal) {
            onOpenPortal();
          }
        });
      } else {
        const appointmentDescription =
          msgLang === "fr"
            ? `Demande de rendez-vous. Message du visiteur : "${textToSend}". Merci de le recontacter pour convenir d’un créneau.`
            : `Appointment request. Visitor message: "${textToSend}". Please contact them to arrange a time.`;
        setLeadDesc(appointmentDescription);
        setLeadSubmitError("");
        setShowLeadForm(true);
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `appointment-request-${Date.now()}`,
            sender: "bot",
            text:
              msgLang === "fr"
                ? "Bien sûr. Indiquez vos coordonnées et vos disponibilités : notre équipe vous recontactera pour convenir d’un rendez-vous."
                : "Of course. Share your contact details and preferred times, and our team will get in touch to arrange an appointment.",
            timestamp: new Date(),
          },
        ]);
      }
      return;
    }

    // Existing appointments belong to the authenticated client account.
    const viewAppointmentsIntent =
      /voir\s+mes\s+(rdv|rendez[- ]?vous)|(see|view|list|show)\s+(my|all|the)\s+appointments?|my appointments/i.test(
        textToSend,
      );
    if (viewAppointmentsIntent) {
      if (isClient) {
        redirectWithMessage(
          msgLang === "fr"
            ? "Je vous redirige vers la section Rendez-vous de votre espace client pour consulter vos réservations."
            : "Redirecting you to the Appointments section of your client portal to review your bookings.",
          () => {
            if (onOpenAppointments) onOpenAppointments();
            else if (onOpenPortal) onOpenPortal();
          },
        );
      } else {
        redirectWithMessage(
          msgLang === "fr"
            ? "Pour consulter vos rendez-vous, connectez-vous à votre espace client."
            : "Please log in to your client portal to view your appointments.",
          () => onOpenLogin?.(),
        );
      }
      return;
    }

    // Request quote → show a message, then route to the Request Quote section.
    const quoteIntent =
      /request\s+(an?\s+)?(instant\s+)?quote|request\s+(an?\s+)?quotation|demander\s+(un\s+|une\s+)?(devis|soumission)|je veux\s+(un\s+|une\s+)?(devis|soumission)/i.test(
        textToSend,
      );
    if (quoteIntent) {
      redirectWithMessage(
        msgLang === "fr"
          ? "Parfait ! Je vous redirige vers la section **Request Quote** pour soumettre votre demande de devis."
          : "Perfect! I'm redirecting you to the **Request Quote** section to submit your quotation request.",
        () => {
          if (isClient && onOpenQuotes) onOpenQuotes();
          else if (onOpenForm) onOpenForm();
          else if (onOpenPortal) onOpenPortal();
        },
      );
      return;
    }

    // Handle appointment confirmation response locally
    if (awaitingAppointmentConfirm) {
      setAwaitingAppointmentConfirm(false);
      const q = textToSend.toLowerCase().trim();
      const isAffirmative = /^(oui|ouais|ok|d'accord|bien sûr|bien sur|volontiers|je veux|vas-y|vas y|yes|yeah|yep|sure|absolutely|i do|i want|let's|lets|go ahead)/i.test(q) || q === "yes" || q === "oui";
      const isNegative = /^(non|no|nope|pas maintenant|plus tard|not now|later)/i.test(q);
      if (isAffirmative && !isNegative) {
        if (isClient) {
          redirectWithMessage(
            msgLang === "fr"
              ? "Parfait ! Je vous redirige vers la section Rendez-vous pour choisir un créneau."
              : "Perfect! I’m redirecting you to the Appointments section to choose a time.",
            () => {
              if (onOpenBooking) onOpenBooking();
              else if (onOpenPortal) onOpenPortal();
            },
          );
        } else {
          setLeadDesc(
            msgLang === "fr"
              ? "Demande de rendez-vous. Merci de m’indiquer vos disponibilités."
              : "Appointment request. Please let me know your preferred times.",
          );
          setLeadSubmitError("");
          setShowLeadForm(true);
          setIsLoading(false);
        }
        return;
      } else if (isNegative) {
        const declineText = msgLang === "fr"
          ? "D'accord, n'hésitez pas à revenir vers moi si vous changez d'avis."
          : "Alright, feel free to come back if you change your mind.";
        const declineMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: declineText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, declineMsg]);
        setIsLoading(false);
        return;
      }
    }

    let agentUsed = false;
    try {
      const body: Record<string, string> = { query: textToSend, lang: msgLang };
      const result = await post<{ response: string; query: string }>(
        '/agent/query',
        body,
      );
      if (result && result.response) {
        const responseText = result.response;

        // Detect if the agent redirected the user to a department and announce it
        let redirectDept: string | null = null;
        const redirectDetected =
          /departement d[eé]tect[eé]|department detected|vous redirige|redirig[eé](?: vers|r)|redirecting you/i.test(
            responseText,
          );
        if (redirectDetected) {
          const deptMatch = responseText.match(/\*\*([^*\n]{2,50})\*\*/);
          if (deptMatch) redirectDept = deptMatch[1].trim();
        }

        // Auto-redirect (high confidence) → connect the client with the
        // department representative in the portal chat section.
        const autoDeptRedirect =
          responseText.includes(
            "Je vous mets en relation avec le représentant",
          ) || responseText.includes("I'm connecting you with the");

        let autoDeptName = redirectDept;
        if (autoDeptRedirect) {
          const autoMatch =
            responseText.match(
              /représentant du département \*\*([^*\n]{2,60})\*\*/,
            ) ||
            responseText.match(/with the \*\*([^*\n]{2,60})\*\* representative/);
          if (autoMatch) autoDeptName = autoMatch[1].trim();
        }

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: responseText,
          timestamp: new Date(),
          ...(redirectDept
            ? { redirect: { department: redirectDept, lang: msgLang } }
            : {}),
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);
        agentUsed = true;

        if (
          autoDeptRedirect &&
          currentUser &&
          currentUser.role === "client" &&
          autoDeptName &&
          onOpenDepartmentChat
        ) {
          const deptKey = departmentKeyForName(autoDeptName);
          if (deptKey) {
            setAwaitingAppointmentConfirm(false);
            setPendingDeptRedirect(null);
            redirectWithMessage(
              msgLang === "fr"
                ? `Je vous connecte avec le représentant du département **${autoDeptName}** dans la messagerie de votre espace client.`
                : `I'm connecting you with the **${autoDeptName}** representative in your client portal's chat.`,
              () => onOpenDepartmentChat(deptKey),
            );
          }
        } else if (
          pendingDeptRedirect &&
          currentUser &&
          currentUser.role === "client" &&
          onOpenDepartmentChat
        ) {
          const deptKey = departmentKeyForName(pendingDeptRedirect);
          if (deptKey) {
            const deptName = getDepartment(deptKey).name;
            setAwaitingAppointmentConfirm(false);
            setPendingDeptRedirect(null);
            redirectWithMessage(
              msgLang === "fr"
                ? `Je vous connecte avec le représentant du département **${deptName}** dans la messagerie de votre espace client.`
                : `I'm connecting you with the **${deptName}** representative in your client portal's chat.`,
              () => onOpenDepartmentChat(deptKey),
            );
          }
        }

        // If response is an appointment confirmation question, set flag
        if (
          responseText.includes("Would you like to **book an appointment") ||
          responseText.includes("Souhaitez-vous **prendre un rendez-vous")
        ) {
          setAwaitingAppointmentConfirm(true);
        }

        // If response mentions form redirect, navigate to contact form
        if (
          responseText.toLowerCase().includes('formulaire') ||
          responseText.toLowerCase().includes('contact form') ||
          responseText.toLowerCase().startsWith('### contact form')
        ) {
          setTimeout(() => {
            if (onOpenForm) onOpenForm();
          }, 800);
        }
      }
    } catch (error) {
      console.error("EBI AI agent request failed", error);
    }

    if (!agentUsed) {
      const errorMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: "L'agent EBI AI est actuellement indisponible. Veuillez reessayer dans quelques instants ou contacter notre equipe directement par formulaire.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadDesc) return;

    setIsSubmittingForm(true);
    setLeadSubmitError("");
    try {
      const description = leadDesc.toLocaleLowerCase("fr");
      const suggestedDepartment = /(recrut|candidat|profil|talent)/.test(description)
        ? "Recruitment"
        : /(call|appel|support|t[eé]l[eé]service|back.office|administratif|relation client)/.test(description)
          ? "Outsourcing"
          : "Development";

      await apiCreateLead({
        name: leadName,
        company: leadCompany || "Individual",
        email: leadEmail,
        phone: leadPhone,
        country: leadCountry,
        projectDescription: leadDesc,
        budget: leadBudget,
        deadline: leadDeadline,
        suggestedDepartment,
        source: "chatbot",
        userId: currentUser?.id || "",
      });

      setShowLeadForm(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `lead-success-${Date.now()}`,
          sender: "bot",
          text: `Merci, ${leadName} ! Votre demande a été enregistrée et transmise à notre équipe. Nous reviendrons vers vous.`,
          timestamp: new Date(),
        },
      ]);
      if (onLeadSubmitSuccess) onLeadSubmitSuccess();
    } catch (err) {
      setLeadSubmitError(
        err instanceof Error
          ? err.message
          : "Erreur réseau lors de l’envoi de votre demande.",
      );
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const quickActions = [
    {
      label: "Software Development",
      dept: "development",
      text: "Quels services proposez-vous en développement d’applications web et métier ?",
    },
    {
      label: "IT Sourcing & Recruitment",
      dept: "recruitment",
      text: "Quels services proposez-vous en recrutement IT et préqualification de candidats ?",
    },
    {
      label: "Tele-services & Support",
      dept: "teleservices",
      text: "Quels services proposez-vous en téléservices et relation client ?",
    },
    {
      label: "Demander un devis",
      text: "Je souhaite demander un devis pour mon projet.",
    },
    {
      label: "Prendre rendez-vous",
      text: "Je souhaite prendre un rendez-vous.",
    },
    {
      label: "Voir les disponibilités",
      text: "Quels sont vos créneaux disponibles ?",
    },
  ];
  const handleOpenForm = () => {
    const formMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: "### Formulaire de contact\n\nJe vous redirige vers notre formulaire de contact pour transmettre votre demande à l’équipe EBI Services.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, formMsg]);
    setTimeout(() => {
      if (onOpenForm) onOpenForm();
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {}
      {isOpen && (
        <div className="mb-4 flex h-[580px] w-96 flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 overflow-hidden max-w-[calc(100vw-2rem)]">
          {}
          <div className="flex items-center justify-between bg-blue-950 p-4 text-white">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="font-display text-sm font-bold block">
                  EBI AI Consulting
                </span>
                <span className="text-[10px] text-blue-200 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Active Expert Assistant
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white rounded-full p-1 hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start space-x-2 ${
                  m.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                {}
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-950 text-white"
                  }`}
                >
                  {m.sender === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    "AI"
                  )}
                </div>

                {}
                <div
                  className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-xs shadow-sm ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-none leading-relaxed"
                  }`}
                >
                  {m.sender === "bot" ? (
                    <>
                      {m.redirect && (
                        <div className="mb-1.5 inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          <CornerDownRight className="h-3 w-3" />
                          {m.redirect.lang === "fr"
                            ? `Redirection vers le département : ${m.redirect.department}`
                            : `Redirected to department: ${m.redirect.department}`}
                        </div>
                      )}
                      {renderMarkdown(m.text)}
                    </>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ))}

            {}
            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-950 text-white text-xs">
                  AI
                </div>
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm rounded-tl-none">
                  <div className="flex space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}

            {}
            {showLeadForm && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-blue-950">
                  <Briefcase className="h-4 w-4" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider">
                    Demande de contact
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Décrivez votre besoin et indiquez vos coordonnées. Votre
                  demande sera transmise à notre équipe.
                </p>

                <form onSubmit={handleFormSubmit} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Votre nom *"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Entreprise"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="email"
                      placeholder="Adresse e-mail *"
                      required
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>
                  <textarea
                    placeholder="Décrivez votre besoin (développement, recrutement, téléservices...) *"
                    required
                    rows={3}
                    value={leadDesc}
                    onChange={(e) => setLeadDesc(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase">
                        Budget indicatif
                      </label>
                      <select
                        value={leadBudget}
                        onChange={(e) => setLeadBudget(e.target.value)}
                        className="w-full rounded border border-gray-200 bg-white p-1.5 text-[10px] focus:ring-1 focus:ring-blue-900 focus:outline-none"
                      >
                        <option>€5,000 - €10,000</option>
                        <option>€10,000 - €25,000</option>
                        <option>€25,000 - €50,000</option>
                        <option>€50,000 - €100,000</option>
                        <option>€100,000+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase">
                        Échéance
                      </label>
                      <select
                        value={leadDeadline}
                        onChange={(e) => setLeadDeadline(e.target.value)}
                        className="w-full rounded border border-gray-200 bg-white p-1.5 text-[10px] focus:ring-1 focus:ring-blue-900 focus:outline-none"
                      >
                        <option>Immediate (1 mo)</option>
                        <option>3 Months</option>
                        <option>6 Months</option>
                        <option>Flexible (2026)</option>
                      </select>
                    </div>
                  </div>

                  {leadSubmitError && (
                    <p
                      role="alert"
                      className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700"
                    >
                      {leadSubmitError}
                    </p>
                  )}

                  <div className="flex space-x-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmittingForm}
                      className="flex-1 bg-blue-900 hover:bg-blue-950 text-white rounded py-2 text-xs font-semibold transition shadow-sm disabled:opacity-55"
                    >
                      {isSubmittingForm ? "Envoi en cours..." : "Envoyer ma demande"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLeadForm(false)}
                      className="border border-gray-300 text-gray-600 rounded px-3 py-2 text-xs hover:bg-gray-100 transition"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {}
          {!showLeadForm && (
            <div className="p-2 border-t border-gray-150 bg-slate-50/50">
              <div className="flex flex-wrap gap-1.5 p-1 max-h-24 overflow-y-auto">
                <button
                  onClick={() => {
                    setLeadDesc("");
                    setLeadSubmitError("");
                    setShowLeadForm(true);
                  }}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-900 shadow-sm transition hover:bg-blue-100"
                >
                  Présenter mon besoin
                </button>
                <button
                onClick={handleOpenForm}
                className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 border-0 px-3 py-1 text-[10px] text-white font-semibold hover:from-purple-700 hover:to-pink-700 shadow-sm transition"
                >
                Formulaire de contact
                </button>
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if ((action as any).dept && currentUser?.role === "client")
                        setPendingDeptRedirect((action as any).dept);
                      handleSendMessage(action.text);
                    }}
                    className="rounded-full bg-white border border-gray-200 px-3 py-1 text-[10px] text-blue-900 font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-950 shadow-sm text-left transition"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {}
          <div className="p-3 border-t border-gray-200 bg-white flex items-center space-x-2">
            <input
              type="text"
              placeholder="Posez votre question sur nos services..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleSendMessage(inputText)
              }
              disabled={isLoading || showLeadForm}
              className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isLoading || showLeadForm}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-900 text-white hover:bg-blue-950 transition disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-900 text-white shadow-xl hover:bg-blue-950 transition-all duration-300 border border-blue-950/20 active:scale-95 animate-bounce hover:animate-none"
        title="Chat with AI"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
