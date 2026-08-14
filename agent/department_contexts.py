GENERAL_BASE = """
====================================
EBI SERVICES – GENERAL PRESENTATION
====================================
Name: EBI Services
Slogan: "Votre Partenaire en Performance et Transformation"
Founded: Paris, France (8+ years)
CEO & Founder: Jean-Pierre Laurent
Industries: Custom Software, IT Recruitment, Back-Office & Call Center Outsourcing
Status: ISO 27001 Prepared

Core business: Custom software ecosystems, IT technical recruiting pipelines,
and scalable back-office tele-services to enterprises worldwide.

Partner logos: Aura Fintech, Cyberdyne Systems, Carrefour France, Innovatech Sourcing, Global Tele-Hub.

Key statistics:
- SLA Code Delivery: 98.7%
- Vetted Engineers: 450+
- Global Coverage: 24/7 (bilingual)
- Client Revenue Optimized: EUR15M+

Services:
1) Tele-services
2) Business Process Outsourcing (BPO)
3) Solutions IT & Digitales
4) Sourcing & Integration de profils

Contact:
- Phone: +33 1 74 88 99 00
- Email: contact@ebiservices.com
- Address: 12 Avenue des Champs-Elysees, Paris, France
- Hours: 08:30 AM - 06:30 PM (CET), Monday to Friday

====================================
WEB APPLICATION – HOW TO USE IT
====================================
EBI Services has a full web application at ebiservices.com with these pages:

PUBLIC PAGES (no login needed):
- Home page: company presentation, stats, testimonials
- Services page: 3 department tabs with detailed info
- About page: company overview, values, CEO vision
- Contact page: contact form (Name, Email, Phone, Need), FAQ, phone/address

ACCOUNT PAGES:
- Register: create an account (Name, Company, Email, Password)
- Login: access portal with Email and Password
- Reset Password: via email link

CLIENT PORTAL (after login as client):
- Overview: dashboard with stats (quotes, appointments, requests)
- Quotations & Requests: submit quote requests, view/accept/reject formal quotes
- Consultations: view appointments, cancel pending ones
- Manager Chat: direct messaging with EBI team
- Secure Vault: upload/download/delete documents (PDF, Word, Excel, Images, max 10MB)
- Top buttons: "Request Quote" and "Book Consultation"

QUOTE REQUEST WORKFLOW:
1. Click "Request Quote" in portal
2. Fill: Industry, Project Category, Budget (EUR 5k-100k+), Deadline, Requirements, optional RFP
3. Submit -> status "new"
4. EBI reviews and issues formal quote -> status "quoted"
5. Client sees quote with pricing and terms
6. Client clicks "Accept & Sign SLA" or "Reject Quote"

CONSULTATION BOOKING WORKFLOW:
1. Click "Book Consultation" in portal
2. Fill: Meeting Objective, Date, Time Slot (09:00-18:00), Timezone (Paris/NY/Singapore/UTC)
3. Submit -> status "pending"
4. EBI confirms -> status "confirmed"
5. Client gets notification, can cancel if pending

NAVIGATION GUIDE FOR USERS:
- "I need a quote" -> "Register/login, go to Portal, click 'Request Quote'"
- "Book a meeting" -> "Register/login, go to Portal, click 'Book Consultation'"
- "Contact you" -> "Go to Contact page or call +33 1 74 88 99 00"
- "Upload a document" -> "Login, go to Portal > Secure Vault"
- "Chat with manager" -> "Login, go to Portal > Manager Chat"
- "Forgot password" -> "Go to Login page, click 'Forgot Password'"
- "See my quotes" -> "Login, go to Portal > Quotations & Requests"
- "Cancel appointment" -> "Login, go to Portal > Consultations > Cancel"
"""


DEPARTMENT_CONTEXTS = {
    "Tele-services": """
--------------------------------------------------------------
TELE-SERVICES / CALL CENTER & TELE-SERVICES
--------------------------------------------------------------
Bilingual: English & French, 24/7 coverage

Services:
a) Inbound Call Management (7j/7 - 24h/24) - customer requests, tech support, complaints
b) Outbound Sales & Prospection B2B/B2C - campaigns, lead qualification, closing
c) Qualified Appointment Setting - prospect qualification, scheduling, follow-up
d) Virtual Secretariat & Agenda Management - call reception, messages, admin follow-up
e) Customer Satisfaction Surveys & Retention - surveys, loyalty campaigns, post-sale follow-up
f) Data Entry & Processing - admin/accounting entry, database updates, archiving (Excel, CRM, ERP)
g) Traffic Creation & Lead Generation - email, SMS, social media, SEO, SEA campaigns

SLA targets: ASA < 90 seconds, resolution > 97%, weekly reports

To get tele-services: "Go to the Contact page to submit a request, or register for a Client Portal account and submit a Quote Request selecting 'Bilingual Call Center Outsource' as the project category."
""",

    "Business Process Outsourcing (BPO)": """
--------------------------------------------------------------
BUSINESS PROCESS OUTSOURCING (BPO)
--------------------------------------------------------------
Externalisation des processus metiers for operational efficiency, cost reduction, agility.

Services:
- Customer Relations Outsourcing (Call Center & Tele-services)
- Back-office & Administrative Tasks
- Data Entry & Processing
- Order Management & Customer Follow-up
- Level 1 Technical Support
- Custom Operational Assistance

To get BPO services: "Go to the Contact page to submit a request, or register for a Client Portal account and submit a Quote Request selecting 'Back-office Admin Support' as the project category."
""",

    "Solutions IT & Digitales": """
--------------------------------------------------------------
SOLUTIONS IT & DIGITALES / SOFTWARE DEVELOPMENT
--------------------------------------------------------------
Tech: React 19, TypeScript, Tailwind CSS, RESTful APIs, PostgreSQL, SQLite
Methodology: Agile/Scrum, 3-phase sprints

Services:
a) Managed IT Services - proactive infrastructure management
b) Web & Mobile Development - custom solutions on demand
c) ERP Development & Integration - custom inventory, barcode/RFID, logistics

Sprint phases:
- Phase 1: Requirements Scoping & Wireframes (3-5 days)
- Phase 2: Agile Code Sprint & DB Schemas (10-15 days)
- Phase 3: QA Vetting, Pen Testing & Delivery

Additional: Legacy Code Maintenance, code migration, security refactoring

To get IT services: "Go to the Contact page to submit a request, or register for a Client Portal account and submit a Quote Request selecting 'Web SaaS Application' or 'Custom ERP system' as the project category."
""",

    "Sourcing & Integration de profils": """
--------------------------------------------------------------
SOURCING & INTEGRATION DE PROFILS / IT RECRUITMENT & HR
--------------------------------------------------------------
Sectors: IT, Healthcare, High-Tech
Candidate pool: 450+ experienced developers

Services:
a) Talent Sourcing via LinkedIn, GitHub, CV databases, executive search
b) Candidate Placement with full assessment pipeline

Pre-vetting: Algorithms Check, Reference Vetting, HR Compliance, Whiteboard interviews
Pipeline: 1. Talent Profiling -> 2. Pre-vetting -> 3. Presentation with reports

To get recruitment services: "Go to the Contact page to submit a request, or register for a Client Portal account and submit a Quote Request selecting 'IT Screening & Recruitment' as the project category."
""",
}


def build_context(intent_result: dict) -> str:
    dept = intent_result.get("intent_fr") or intent_result.get("intent", "")
    specific = DEPARTMENT_CONTEXTS.get(dept, "")
    return f"{GENERAL_BASE}\n{specific}" if specific else GENERAL_BASE
