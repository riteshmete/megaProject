# OpenLaw — AI-Powered Legal Document Simplifier

**OpenLaw** is a simple full-stack web application designed for ordinary people to easily understand Indian legal documents (rental agreements, employment contracts, service agreements, NDAs, etc.).

It extracts text from uploaded PDF documents, analyzes them using Google Gemini AI, and presents structured explanations, key parties, financial obligations, important clauses, risk attention areas, and interactive analytics.

---

## Technologies Used

* **Frontend**: HTML5, CSS3, Vanilla JavaScript, Chart.js (CDN)
* **Backend**: Python 3.12, Flask
* **PDF Processing**: PyMuPDF (`fitz`)
* **AI Analysis**: Google Gemini API (`google-genai`)
* **Environment Management**: `python-dotenv`

---

## Project Structure

```
OpenLaw/
│
├── app.py              # Main Flask backend application (routes, PDF text extraction, Gemini AI prompt)
├── requirements.txt    # Python dependencies
├── .env                # API key storage (private)
├── .env.example        # Environment variable template
├── .gitignore          # Git exclusion file
├── README.md           # Project documentation
│
├── templates/
│   └── index.html      # Main user interface
│
└── static/
    ├── style.css       # Clean legal-tech styling
    └── script.js       # Dynamic UI interaction & Chart.js rendering
```

---

## Project Flow

```
Upload PDF File
      │
      ▼
PyMuPDF (fitz) Extracts Plain Text
      │
      ▼
Python Sends Prompt + Document Text to Gemini AI
      │
      ▼
Gemini Returns Structured JSON Response
      │
      ▼
Flask Passes JSON to Vanilla JavaScript
      │
      ▼
Dashboard Displays Overview, Key Info, Clauses, Attention Areas & Charts
```

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

## Key Features

1. **PDF Upload & Text Extraction**: Accepts any readable PDF legal document and extracts text page by page.
2. **AI Document Simplification**: Generates a summary, plain-English explanation, parties, dates, and financial terms.
3. **Important Clause Breakdown**: Highlights critical clauses with original text excerpts, simple explanations, and importance levels.
4. **AI-Identified Attention Areas**: Tags potential areas requiring user attention with High, Medium, or Low severity labels.
5. **Visual Analytics**: Interactive Chart.js bar and doughnut charts representing clause distribution and severity levels.
6. **Interactive Document Q&A**: Allows users to ask specific questions about the uploaded document and receive context-aware answers based strictly on document text.

---

## Legal Disclaimer

*OpenLaw provides AI-generated explanations for informational and educational purposes only. It does not provide legal advice and should not replace consultation with a qualified legal professional.*
