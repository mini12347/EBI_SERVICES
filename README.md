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

### Environment Configuration
Ensure you set up your environment variables. Check for `.env.example` files in the respective directories (e.g., `backend/.env.example`) and copy them to `.env`, filling in the required values (like database connection strings, API keys, etc.).

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

## 🧪 Testing

To run the backend integration process tests:

```bash
cd backend
npm run test
```
