# OpenLaw — AI-Powered Legal Document Simplifier & Favorability Engine

**OpenLaw** is a full-stack web application designed to help everyday people easily understand complex Indian legal documents (rental agreements, employment contracts, service agreements, NDAs, etc.).

It extracts text from uploaded PDF documents, analyzes them using Google Gemini AI, and presents structured plain-English explanations, key parties, financial obligations, important clauses, risk attention areas, party favorability analysis, and interactive document Q&A.

---

## Technologies Used

* **Frontend**: HTML5, Vanilla CSS3 (Apple Design System), Vanilla JavaScript
* **Backend**: Python 3.12, Flask
* **PDF Processing**: PyMuPDF (`fitz`)
* **AI Analysis**: Google Gemini API (`google-genai` SDK)
* **Environment Management**: `python-dotenv`

---

## Project Structure

```
OpenLaw/
│
├── app.py              # Main Flask backend (routes, PDF text extraction, Gemini AI prompts)
├── requirements.txt    # Python dependencies
├── DESIGN.md           # Apple design system specifications & UI tokens
├── .env                # API key storage (private)
├── .env.example        # Environment variable template
├── .gitignore          # Git exclusion file
├── README.md           # Project documentation
│
├── templates/
│   └── index.html      # Main responsive user interface
│
└── static/
    ├── style.css       # Clean legal-tech styling & design system components
    └── script.js       # Dynamic UI logic, demo mode, favorability rendering & report export
```

---

## Project Flow

```
Upload PDF File OR Select Sample Document
      │
      ▼
PyMuPDF (fitz) Extracts Plain Text
      │
      ▼
Python Sends Structured Prompt + Document Text to Gemini AI
      │
      ▼
Gemini Returns Structured JSON Response
      │
      ▼
Flask Passes JSON to Vanilla JavaScript
      │
      ▼
Dashboard Renders Overview, Favorability Metrics, Key Info, Clauses, Attention Areas & Export Tools
```

---

## Key Features

1. **PDF Upload & Text Extraction**: Accepts any readable PDF legal document and extracts text page by page.
2. **Interactive Demo Mode**: Includes a pre-configured sample document ("Try Sample Document") for instant testing without requiring a PDF upload or API key.
3. **AI Document Simplification**: Generates plain-English summaries, detailed overviews, parties involved, important dates, and financial terms.
4. **Agreement Favorability Engine ("Who Does This Agreement Favor?")**: Evaluates rights, obligations, penalties, and risk distribution between parties to determine who the agreement favors (0–100 favorability score, confidence rating, verdict, per-party progress breakdown, and supporting clause citations).
5. **Important Clause Breakdown**: Highlights critical clauses with original text excerpts, simple explanations, and importance levels (Low, Medium, High).
6. **AI-Identified Attention Areas**: Tags potential areas requiring user attention with Low, Medium, or High severity labels.
7. **Multilingual Processing**: Automatically detects and responds in the document's original language (English, Hindi, Marathi, etc.).
8. **Export & Report Generation**: Allows users to download a clean formatted text summary (`.txt`) or print/save the entire analysis view as a PDF.
9. **Interactive Document Q&A**: Context-aware Q&A allowing users to ask specific questions about the uploaded document and receive AI answers grounded strictly in the document text.

---

## Setup & Installation Instructions

### 1. Prerequisites
Ensure Python 3.10+ is installed on your computer.

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

Open `.env` and add your **Google Gemini API key** (Get one for free at [Google AI Studio](https://aistudio.google.com/)):
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

---

## Running the Application

Start the Flask local development server:

```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## Legal Disclaimer

*OpenLaw provides AI-generated explanations for informational and educational purposes only. It does not provide legal advice and should not replace consultation with a qualified legal professional.*
