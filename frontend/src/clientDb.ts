import {
  User,
  Lead,
  Appointment,
  QuoteRequest,
  Quote,
  ClientDocument,
  Message,
  Conversation,
  Notification,
  ActivityLog,
  SystemSettings,
} from "./types";

const DEFAULT_USERS: User[] = [
  {
    id: "usr-admin",
    email: "admin@ebi.com",
    name: "Jean-Pierre Laurent",
    role: "admin",
    createdAt: "2026-06-09T12:50:08.778Z",
  },
  {
    id: "usr-client1",
    email: "yosrbejaoui42@gmail.com",
    name: "Yosr Bejaoui",
    role: "client",
    companyId: "Acme Corp",
    createdAt: "2026-06-24T12:50:08.778Z",
  },
  {
    id: "usr-client2",
    email: "client@acme.com",
    name: "Sarah Connors",
    role: "client",
    companyId: "Cyberdyne Systems",
    createdAt: "2026-06-29T12:50:08.778Z",
  },
];

// Default passwords are stored separately for demo/offline mode only.
// In production, passwords are hashed and stored in the database.
const DEFAULT_PASSWORDS: Record<string, string> = {
  "admin@ebi.com": "admin123",
  "yosrbejaoui42@gmail.com": "client123",
  "client@acme.com": "client123",
};

const DEFAULT_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Marc Dubreuil",
    company: "Carrefour Logistics",
    email: "marc.d@carrefour.fr",
    phone: "+33 6 1234 5678",
    country: "France",
    projectDescription:
      "Need a high-performance custom ERP for warehouse tracking and logistics management. Must connect with standard barcode scanners.",
    budget: "€50,000 - €100,000",
    deadline: "End of 2026",
    status: "qualified",
    suggestedDepartment: "Development",
    priority: "high",
    conversationSummary:
      "Client requested an ERP integration. They are looking for RFID tracking and standard dashboard modules. Recommended the Web & ERP team.",
    notes:
      "Follow up scheduled. Client is very interested in our outsourcing support as well.",
    createdAt: "2026-07-05T12:50:08.778Z",
  },
  {
    id: "lead-2",
    name: "Sophie Tremblay",
    company: "Innovatech Solutions",
    email: "sophie@innovatech.ca",
    phone: "+1 514 987 6543",
    country: "Canada",
    projectDescription:
      "Looking to outsource candidate screening and IT recruitment sourcing for 15 React and Node developers in North America.",
    budget: "€20,000 - €50,000",
    deadline: "Immediate",
    status: "new",
    suggestedDepartment: "Recruitment",
    priority: "medium",
    conversationSummary:
      "Inquiry on IT recruitment and sourcing. They need technical vetting for high-level React engineers.",
    notes: "Auto-classified by AI as high-priority Recruitment.",
    createdAt: "2026-07-08T12:50:08.778Z",
  },
  {
    id: "lead-3",
    name: "Vikram Naidu",
    company: "Aura Fintech",
    email: "v.naidu@aurafintech.sg",
    phone: "+65 8765 4321",
    country: "Singapore",
    projectDescription:
      "Customer support outsourcing for our fintech trading app. Support hours must be 24/7 with agents bilingual in French and English.",
    budget: "€10,000 - €20,000 / month",
    deadline: "September 2026",
    status: "contacted",
    suggestedDepartment: "Outsourcing",
    priority: "high",
    conversationSummary:
      "Fintech startup needs professional French/English call center and administrative back-office support for support tickets.",
    notes: "Needs confirmation on bilingual team availability.",
    createdAt: "2026-07-01T12:50:08.778Z",
  },
];

const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1",
    userId: "usr-client1",
    clientName: "Yosr Bejaoui",
    clientEmail: "yosrbejaoui42@gmail.com",
    title: "EBI Development kickoff meeting",
    date: "2026-07-11",
    timeSlot: "10:00 AM - 11:00 AM",
    timezone: "Europe/Paris",
    status: "confirmed",
    adminNotes:
      "Kickoff call with Web App development team. Presenting initial mockups.",
    createdAt: "2026-07-06T12:50:08.778Z",
  },
  {
    id: "apt-2",
    userId: "usr-client2",
    clientName: "Sarah Connors",
    clientEmail: "client@acme.com",
    title: "Recruitment Sourcing Consult",
    date: "2026-07-14",
    timeSlot: "02:30 PM - 03:00 PM",
    timezone: "America/New_York",
    status: "confirmed",
    adminNotes: "Review talent pipeline requirements.",
    createdAt: "2026-07-09T12:50:08.778Z",
  },
];

const DEFAULT_QUOTE_REQUESTS: QuoteRequest[] = [
  {
    id: "qr-1",
    userId: "usr-client1",
    clientName: "Yosr Bejaoui",
    company: "Acme Corp",
    industry: "Retail & E-commerce",
    projectType: "Custom ERP & CRM Integration",
    budget: "€35,000",
    deadline: "November 2026",
    requirements:
      "We need an integrated inventory manager that coordinates our offline stores with our custom web platform.",
    attachmentName: "project_spec_draft.pdf",
    attachmentUrl: "#",
    status: "accepted",
    createdAt: "2026-07-04T12:50:08.778Z",
  },
  {
    id: "qr-2",
    userId: "usr-client2",
    clientName: "Sarah Connors",
    company: "Cyberdyne Systems",
    industry: "Defense Tech",
    projectType: "Automated Sourcing Platform",
    budget: "€15,000",
    deadline: "October 2026",
    requirements:
      "Vetting software for matching engineering candidates with background clearances.",
    status: "new",
    createdAt: "2026-07-09T12:50:08.778Z",
  },
];

const DEFAULT_QUOTES: Quote[] = [
  {
    id: "q-1",
    quoteRequestId: "qr-1",
    clientName: "Yosr Bejaoui",
    projectName: "Custom ERP & CRM Integration",
    amount: 32500,
    terms:
      "Net 30. 30% advance on approval, 40% on Beta delivery, 30% on completion. Includes 6 months free SLA maintenance support.",
    expiryDate: "2026-08-08",
    status: "accepted",
    createdAt: "2026-07-07T12:50:08.778Z",
  },
];

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    userId: "usr-client1",
    clientName: "Yosr Bejaoui",
    clientEmail: "yosrbejaoui42@gmail.com",
    status: "active",
    summary: "Client discussing budget constraints and custom timeline.",
    lastMessageAt: "2026-07-09T12:50:08.778Z",
  },
];

const DEFAULT_MESSAGES: Message[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "usr-admin",
    senderName: "Jean-Pierre Laurent",
    senderRole: "admin",
    text: "Hello Yosr! I have uploaded your custom ERP integration quotation. Please look it over.",
    timestamp: "2026-07-09T11:50:08.778Z",
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    senderId: "usr-client1",
    senderName: "Yosr Bejaoui",
    senderRole: "client",
    text: "Thanks, Jean-Pierre! Let me download the PDF. Will let you know by tomorrow.",
    timestamp: "2026-07-09T12:50:08.778Z",
  },
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    userId: "usr-client1",
    title: "New Quotation Ready",
    message:
      "EBI Admin has generated your quotation for the Custom ERP & CRM project. Amount: €32,500.",
    read: false,
    createdAt: "2026-07-07T12:50:08.778Z",
  },
  {
    id: "notif-tngbdp8ed",
    userId: "usr-admin",
    title: "Quote ACCEPTED",
    message: "Yosr Bejaoui has accepted the quote Q-1 for €32,500.",
    read: false,
    createdAt: "2026-07-09T12:54:01.580Z",
  },
  {
    id: "notif-nspqvq6r7",
    userId: "usr-client2",
    title: "Appointment Status Updated",
    message:
      'Your appointment "Recruitment Sourcing Consult" has been confirmed by EBI Services.',
    read: false,
    createdAt: "2026-07-09T12:57:18.637Z",
  },
];

const DEFAULT_DOCUMENTS: ClientDocument[] = [
  {
    id: "doc-1",
    userId: "usr-client1",
    name: "EBI_Services_Proposal_Acme.pdf",
    type: "application/pdf",
    size: "2.4 MB",
    url: "#",
    createdAt: "2026-07-07T12:50:08.778Z",
  },
  {
    id: "doc-2",
    userId: "usr-client1",
    name: "Acme_CRM_ERP_Requirements.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: "820 KB",
    url: "#",
    createdAt: "2026-07-04T12:50:08.778Z",
  },
];

const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: "act-st7wsxynt",
    userId: "usr-admin",
    userName: "Jean-Pierre Laurent",
    action:
      'Updated appointment "Recruitment Sourcing Consult" status to confirmed',
    timestamp: "2026-07-09T12:57:18.637Z",
  },
  {
    id: "act-8zv92jz55",
    userId: "usr-admin",
    userName: "Jean-Pierre Laurent",
    action: "User logged in successfully",
    timestamp: "2026-07-09T12:57:00.528Z",
  },
  {
    id: "act-ff3mv2zuo",
    userId: "usr-client1",
    userName: "Yosr Bejaoui",
    action: "User logged in successfully",
    timestamp: "2026-07-09T12:56:20.805Z",
  },
];

const DEFAULT_SETTINGS: SystemSettings = {
  websiteName: "EBI Services",
  chatbotPrompt:
    "You are the friendly, professional AI Assistant for EBI Services. Your job is to answer questions about EBI Services, explain our key offerings (Development, Recruitment, Tele-services/Outsourcing), guide visitors, and gather contact details (Name, Company, Email, Phone, Project Description, Budget, Deadline) to generate business leads. Be concise, expert, and polite.",
  welcomeMessage:
    "Welcome to EBI Services! I am your AI Assistant. How can we help accelerate your business today? (e.g. Ask about custom software development, recruitment solutions, customer support outsourcing, or book a consultation!)",
  emailTemplateQuote:
    "Dear {{clientName}},\n\nWe are pleased to submit our formal quotation for your project: {{projectName}}.\n\nTotal Estimate: €{{amount}}\n\nPlease log in to your Client Portal to review the full details and accept or reject the quote.\n\nBest regards,\nEBI Services Team",
  emailTemplateAppointment:
    "Dear {{clientName}},\n\nYour appointment '{{title}}' scheduled on {{date}} at {{timeSlot}} ({{timezone}}) has been updated to status: {{status}}.\n\nBest regards,\nEBI Services Team",
};

function getStored<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(`ebi_db_${key}`);
  if (!data) {
    localStorage.setItem(`ebi_db_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  localStorage.setItem(`ebi_db_${key}`, JSON.stringify(value));
}

export const clientDb = {
  getUsers: () => getStored<User[]>("users", DEFAULT_USERS),
  setUsers: (users: User[]) => setStored<User[]>("users", users),
  getPasswords: () =>
    getStored<Record<string, string>>("passwords", DEFAULT_PASSWORDS),
  setPasswords: (pass: Record<string, string>) =>
    setStored<Record<string, string>>("passwords", pass),

  getLeads: () => getStored<Lead[]>("leads", DEFAULT_LEADS),
  setLeads: (leads: Lead[]) => setStored<Lead[]>("leads", leads),

  getAppointments: () =>
    getStored<Appointment[]>("appointments", DEFAULT_APPOINTMENTS),
  setAppointments: (apts: Appointment[]) =>
    setStored<Appointment[]>("appointments", apts),

  getQuoteRequests: () =>
    getStored<QuoteRequest[]>("quoteRequests", DEFAULT_QUOTE_REQUESTS),
  setQuoteRequests: (reqs: QuoteRequest[]) =>
    setStored<QuoteRequest[]>("quoteRequests", reqs),

  getQuotes: () => getStored<Quote[]>("quotes", DEFAULT_QUOTES),
  setQuotes: (quotes: Quote[]) => setStored<Quote[]>("quotes", quotes),

  getConversations: () =>
    getStored<Conversation[]>("conversations", DEFAULT_CONVERSATIONS),
  setConversations: (convs: Conversation[]) =>
    setStored<Conversation[]>("conversations", convs),
  getMessages: () => getStored<Message[]>("messages", DEFAULT_MESSAGES),
  setMessages: (msgs: Message[]) => setStored<Message[]>("messages", msgs),

  getNotifications: () =>
    getStored<Notification[]>("notifications", DEFAULT_NOTIFICATIONS),
  setNotifications: (notifs: Notification[]) =>
    setStored<Notification[]>("notifications", notifs),

  getDocuments: () =>
    getStored<ClientDocument[]>("documents", DEFAULT_DOCUMENTS),
  setDocuments: (docs: ClientDocument[]) =>
    setStored<ClientDocument[]>("documents", docs),

  getLogs: () => getStored<ActivityLog[]>("logs", DEFAULT_LOGS),
  setLogs: (logs: ActivityLog[]) => setStored<ActivityLog[]>("logs", logs),

  getSettings: () => getStored<SystemSettings>("settings", DEFAULT_SETTINGS),
  setSettings: (settings: SystemSettings) =>
    setStored<SystemSettings>("settings", settings),

  addActivityLog: (userId: string, userName: string, action: string) => {
    const logs = clientDb.getLogs();
    const newLog: ActivityLog = {
      id: `act-${Math.random().toString(36).substring(2, 11)}`,
      userId,
      userName,
      action,
      timestamp: new Date().toISOString(),
    };
    clientDb.setLogs([newLog, ...logs]);
    return newLog;
  },

  addNotification: (userId: string, title: string, message: string) => {
    const notifs = clientDb.getNotifications();
    const newNotif: Notification = {
      id: `notif-${Math.random().toString(36).substring(2, 11)}`,
      userId,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    clientDb.setNotifications([newNotif, ...notifs]);
    return newNotif;
  },
};
