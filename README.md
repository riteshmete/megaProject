# OpenLaw — AI-Powered Legal Document Simplifier & Hardened Render Deployment

**OpenLaw** is a full-stack web application designed to help everyday people easily understand complex legal documents (rental agreements, employment contracts, service agreements, NDAs, divorce agreements, etc.) in plain language.

It extracts text from uploaded PDF documents, analyzes them using Google Gemini AI, and presents structured plain-English explanations, key parties, financial obligations, important clauses, risk attention areas, party favorability analysis, and interactive document Q&A.

---

## Architecture & Production Hardening

* **Frontend**: HTML5, Vanilla CSS3 (Apple Design System), Vanilla JavaScript
* **Backend**: Python 3.11, Flask 3.x, Gunicorn WSGI Server
* **PDF Processing**: PyMuPDF (`fitz` >= 1.23.0)
* **AI Analysis**: Google Gemini API (`google-genai` SDK >= 0.1.1) with primary + fallback model failover
* **Security & Multi-User Isolation**:
  - Thread-safe in-memory session store mapping document context to secure UUID session cookies (preventing cross-user document leakage).
  - PDF binary signature validation (`%PDF-`), MIME check, and 10 MB request size limit (`MAX_CONTENT_LENGTH`).
  - Strict system instruction & untrusted document content separation (Prompt Injection defense).
  - Security HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
  - Structured operational logging without exposing API keys or sensitive document text.

---

## Project Structure

```
OpenLaw/
│
├── app.py                  # Main Flask backend (routes, session store, PDF extraction, Gemini integration)
├── requirements.txt        # Python package dependencies (Flask, PyMuPDF, google-genai, gunicorn, etc.)
├── render.yaml             # Render deployment configuration specification
├── runtime.txt             # Python runtime declaration (python-3.11.9)
├── DESIGN.md               # Apple design system specifications & UI tokens
├── .env.example            # Environment variable template
├── .gitignore              # Git exclusion file
├── README.md               # Project documentation & deployment guide
│
├── Project_Testing/        # Sample test legal documents (English & Marathi contracts, NDAs, leases)
│
├── templates/
│   └── index.html          # Main responsive user interface
│
└── static/
    ├── style.css           # Clean legal-tech styling & Apple design system components
    └── script.js           # Dynamic UI logic, loading states, favorability rendering & export tools
```

---

## Project Flow

```
Upload PDF File  OR  Select Sample Document ("Try Sample Document")
      │
      ▼
Binary Signature (%PDF-) & Size (<= 10MB) Validation
      │
      ▼
PyMuPDF (fitz) Extracts Text In-Memory (No Disk Files Created)
      │
      ▼
Text Stored in Server-Side Session Store (Keyed by User UUID Cookie)
      │
      ▼
Python Sends Prompt + Untrusted Document Text to Gemini AI
(Auto Failover: primary model `gemini-2.5-flash` ➔ fallback `gemini-1.5-flash`)
      │
      ▼
Gemini Returns Structured JSON Response (Sanitized against default schema)
      │
      ▼
Flask API Delivers Clean JSON Payload to Frontend JavaScript
      │
      ▼
Dashboard Renders Overview, Favorability Engine, Clauses, Risk Areas & Export Tools
      │
      ▼
Interactive Document Q&A (/ask endpoint grounded strictly in user's session document)
```

---

## Key Features

1. **Multi-User Isolation**: Every user session receives an isolated server-side context so uploaded contracts are never shared across users.
2. **PDF Validation & Safety**: Validates PDF signature, caps file size to 10 MB, and bounds text length for AI quota safety.
3. **Interactive Demo Mode**: Includes pre-configured sample data for instant UI testing without requiring an API key.
4. **AI Document Simplification**: Plain-English summaries, detailed overviews, parties, important dates, and financial obligations.
5. **Agreement Favorability Engine**: Evaluates rights, obligations, penalties, and risk distribution between parties.
6. **Important Clause Breakdown**: Highlights critical clauses with original text excerpts (viewable in an expandable drawer) and simple explanations.
7. **AI-Identified Attention Areas**: Tags potential risk areas requiring user attention with Low, Medium, or High severity labels.
8. **Interactive Document Q&A**: Context-aware Q&A allowing users to ask questions grounded strictly in their uploaded document.
9. **Gemini Model Failover & Resilience**: Configured with automatic model failover on 5xx/API availability errors.
10. **Export & Report Generation**: Download text summary report (`.txt`) or print/save analysis view as PDF.
11. **Health Monitoring**: Includes `/health` endpoint for uptime monitoring.

---

## Setup & Local Testing Instructions

### 1. Prerequisites
Ensure **Python 3.10+** is installed on your computer.

### 2. Create Virtual Environment
Open terminal/command prompt in the `OpenLaw` project directory:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Open `.env` and add your **Google Gemini API Key** (Get one for free at [Google AI Studio](https://aistudio.google.com/)):

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODEL=gemini-1.5-flash
FLASK_DEBUG=false
SECRET_KEY=local_development_secret_key
PORT=5000
```

### 5. Running Locally (Development Mode)
```bash
python app.py
```

### 6. Testing Production Mode (Gunicorn)
Run the application using Gunicorn locally:

```bash
gunicorn app:app --bind 127.0.0.1:5000
```

Open your browser and navigate to `http://127.0.0.1:5000` or test health endpoint `http://127.0.0.1:5000/health`.

---

## Deploying to Render

1. **Push Code to GitHub**: Commit all hardened files to your GitHub repository.
2. **Create New Web Service**: Log in to [Render](https://render.com) and click **New Web Service**.
3. **Connect Repository**: Select your `OpenLaw` repository.
4. **Configure Deployment Settings**:
   - **Name**: `openlaw` (or your preferred service name)
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. **Add Environment Variables**:
   Add the following variables under **Environment Variables** in Render:
   - `GEMINI_API_KEY`: *(Your Google Gemini API key)*
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `GEMINI_FALLBACK_MODEL`: `gemini-1.5-flash`
   - `FLASK_DEBUG`: `false`
   - `SECRET_KEY`: *(Generate a random secret string)*
6. **Deploy**: Click **Deploy Web Service**.
7. **Verify Deployment**:
   - Access `https://<your-render-app>.onrender.com/health` (should return `{"status": "ok"}`).
   - Upload a test legal PDF and run analysis & document Q&A.

---

## Legal Disclaimer

*OpenLaw provides AI-generated explanations for informational and educational purposes only. It does not provide legal advice and should not replace consultation with a qualified legal professional.*
