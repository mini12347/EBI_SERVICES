# EBI Services

Premium SaaS enterprise platform and corporate CRM designed for EBI Services. This platform features an AI chatbot, a client portal, a quote generator, calendar booking, and analytics.

## 🏗 Project Architecture

The project is split into three main components:

- **`/frontend`**: The user interface, built with React and Vite (TypeScript).
- **`/backend`**: The REST API backend, built with Node.js, Express, and MongoDB. Handles authentication, data management, file uploads, emails, and PDF generation.
- **`/agent`**: The AI/Python agent component providing AI capabilities and interactions.

## 🚀 Tech Stack

### Frontend
- React
- Vite
- TypeScript

### Backend
- Node.js & Express (REST API)
- MongoDB (via Mongoose)
- JWT (Authentication)
- PDFKit (Quote Generator)
- Nodemailer (Email services)

### Agent
- Python (AI functionalities)

## 🛠 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Python 3](https://www.python.org/)
- MongoDB database (local or cloud instance like MongoDB Atlas)

### Installation

You can install the dependencies for all components at once using the root package script:

```bash
npm run install:all
```

Alternatively, you can install them manually:
1. **Frontend:** `cd frontend && npm install`
2. **Backend:** `cd backend && npm install`
3. **Agent:** `pip install -r agent/requirements.txt`

On Windows, the backend starts the agent with the Python launcher (`py -3`).
Set `PYTHON_EXECUTABLE` in the backend environment only if Python needs a
specific executable path.

### Environment Configuration
Ensure you set up your environment variables. Check for `.env.example` files in the respective directories (e.g., `backend/.env.example`) and copy them to `.env`, filling in the required values (like database connection strings, API keys, etc.).

To enable generative chatbot answers, configure a valid `GROQ_API_KEY` in
`agent/.env` using `agent/.env.example` as a template. Service questions about
the three catalog departments also have built-in answers and do not require the
external AI provider.

## 💻 Running the Application

From the root directory, you can run the individual services:

- **Start Frontend:**
  ```bash
  npm run dev:frontend
  ```
- **Start Backend:**
  ```bash
  npm run dev:backend
  ```
- **Start AI Agent:**
  ```bash
  npm run dev:agent
  ```

### Additional Root Scripts
- `npm run build` - Builds the frontend for production
- `npm run preview` - Previews the production build of the frontend
- `npm run lint` - Lints the frontend code
- `npm run dev` - Alias for starting the frontend dev server

## 💾 Database Seeding

To populate the database with initial dummy data for testing, navigate to the backend directory and run:

```bash
cd backend
npm run seed
```

> **Warning:** `npm run seed` clears and replaces existing users, services, requests,
> quotes, documents, messages, notifications, and tokens. Do not run it against a
> database containing data you want to keep.

To initialize or update only the EBI Services catalog without deleting existing
records, configure `backend/.env` and run:

```bash
npm run seed:services
```

This upserts the 16 services from the project brief and deactivates older services
outside that catalog. Active services are available through `GET /api/services`.

### Data ownership

MongoDB is the persistent source of truth for application data. A client owns
quote requests; each request references a service and can be assigned to an
admin. Quotes and documents can reference a request. Leads are separate
pre-client prospects. The browser `clientDb` remains a demo/offline fallback
and is not shared between users or devices.

Public contact-form and chatbot submissions are validated and stored as `Lead`
records. Both appear in the admin CRM through `GET /api/leads`; the `source`
field distinguishes `contact_form` from `chatbot`. The legacy
`POST /api/form-responses/form_response` endpoint also forwards new submissions
to the same lead collection for compatibility. Existing historical
`FormResponse` records are not automatically migrated.

Visitors can request an appointment through the chatbot by submitting their
contact details and preferred availability; the request is sent to the team as
a chatbot lead. Signed-in clients are directed to the appointment form in their
client portal, where available slots and bookings are handled by the API.

## 🧪 Testing

Run the backend automated tests (no database required):

```bash
cd backend
npm run test
```

The legacy end-to-end script in `backend/test_full_process.js` is not included in
this command; it uses outdated API routes and needs an isolated test database
before it can safely be repaired and run.
