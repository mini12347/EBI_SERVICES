export type UserRole = "admin" | "client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  projectDescription: string;
  budget: string;
  deadline: string;
  status: "new" | "contacted" | "qualified" | "lost";
  suggestedDepartment?: string;
  priority?: "low" | "medium" | "high";
  conversationSummary?: string;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  userId?: string;
  clientName: string;
  clientEmail: string;
  title: string;
  date: string;
  timeSlot: string;
  timezone: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  adminNotes?: string;
  createdAt: string;
}

export interface QuoteRequest {
  id: string;
  userId: string;
  clientName: string;
  company: string;
  industry: string;
  projectType: string;
  budget: string;
  deadline: string;
  requirements: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: "new" | "in_review" | "waiting" | "quoted" | "accepted" | "rejected";
  createdAt: string;
}

export interface Quote {
  id: string;
  quoteRequestId: string;
  clientName: string;
  projectName: string;
  amount: number;
  terms: string;
  expiryDate: string;
  status: "sent" | "accepted" | "rejected";
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  status: "active" | "archived";
  summary?: string;
  lastMessageAt: string;
  department?: string;
  repName?: string;
  repRole?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ClientDocument {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: string;
  url: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface SystemSettings {
  websiteName: string;
  chatbotPrompt: string;
  emailTemplateQuote: string;
  emailTemplateAppointment: string;
  welcomeMessage: string;
}

export interface ChatSessionMessage {
  role: "user" | "model" | "system";
  parts: { text: string }[];
}
