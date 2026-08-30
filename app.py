import os
import json
import pymupdf
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai

# Load .env file
load_dotenv()

app = Flask(__name__)

# Store uploaded document text for the question feature
document_text = ""

# Get Gemini API key
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY is missing from .env")

# Create Gemini client
client = genai.Client(api_key=api_key)


# =========================================================
# EXTRACT TEXT FROM PDF
# =========================================================

def extract_text(pdf_data):

    pdf = pymupdf.open(stream=pdf_data, filetype="pdf")

    text = ""

    for page in pdf:
        text += page.get_text("text") + "\n"

    pdf.close()

    return text.strip()


# =========================================================
# ASK GEMINI
# =========================================================

def ask_gemini(prompt):

    # Try the main model first
    models = [
        "gemini-3.6-flash",
        "gemini-2.5-flash"
    ]

    last_error = None

    for model in models:

        try:

            print("Trying model:", model)

            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            print("Gemini response received.")

            return response.text

        except Exception as error:

            print("Model error:", error)

            last_error = error

            # Try the next model
            continue

    # If both models failed
    if last_error is not None:
        raise last_error
    raise RuntimeError("All models failed to respond.")


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def home():

    return render_template("index.html")


# =========================================================
# ANALYZE DOCUMENT
# =========================================================

@app.route("/analyze", methods=["POST"])
def analyze():

    global document_text

    # Check PDF
    if "file" not in request.files:

        return jsonify({
            "error": "Please upload a PDF file."
        }), 400

    file = request.files["file"]

    if file.filename == "":

        return jsonify({
            "error": "Please select a PDF file."
        }), 400

    if not file.filename.lower().endswith(".pdf"):

        return jsonify({
            "error": "Only PDF files are allowed."
        }), 400

    try:

        # Read PDF
        pdf_data = file.read()

        # Extract text
        text = extract_text(pdf_data)

        # Check extracted text
        if len(text) < 20:

            return jsonify({
                "error": "No readable text was found in this PDF. The PDF may be scanned or image-based."
            }), 400

        # Save document for Q&A
        document_text = text

        # =================================================
        # GEMINI PROMPT
        # =================================================

        prompt = f"""
You are OpenLaw, an AI assistant that explains Indian legal
documents to ordinary people.

Analyze ONLY the document provided below.

LANGUAGE RULE:

Respond in the SAME LANGUAGE as the document.

If the document is English, respond in English.

If the document is Marathi, respond in Marathi.

If the document is Hindi, respond in Hindi.

Do not translate the original clause text.

LEGAL SAFETY RULES:

Do not invent information.

If information is not present in the document, write:

"Not specified in the document."

Simplify legal language without changing its meaning.

Do not change:

"damages" into "fine"

"damages" into "penalty"

"may" into "will"

"generally" into a definite statement

"up to" into a fixed amount

"caused solely by" into "caused by"

Do not say that the document is definitely:

- safe
- dangerous
- legal
- illegal
- valid
- invalid

Instead use:

"AI-identified areas requiring attention"

These are not legal conclusions.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "document_language": "",
    "document_type": "",

    "summary": "",

    "simple_explanation": "",

    "parties": [],

    "important_dates": [],

    "financial_obligations": [],

    "key_points": [],

    "important_clauses": [
        {{
            "clause": "",
            "original_text": "",
            "simple_explanation": "",
            "importance": "Low"
        }}
    ],

    "attention_areas": [
        {{
            "title": "",
            "description": "",
            "severity": "Low"
        }}
    ],

    "rights": [],

    "responsibilities": [],

    "termination_conditions": [],

    "overall_attention_level": "Low",

    "favorability_analysis": {{
        "parties": [],
        "favored_party": "",
        "favorability_score": 50,
        "party_scores": [
            {{
                "party": "",
                "score": 50
            }}
        ],
        "confidence": "High",
        "verdict": "",
        "overall_assessment": "",
        "reasons": [],
        "supporting_clauses": [
            {{
                "clause": "",
                "target_party": "",
                "explanation": ""
            }}
        ]
    }}
}}

For importance, severity, and confidence use only:

Low
Medium
High

PARTY FAVORABILITY RULES:
- Identify all parties (e.g. Landlord, Tenant, Buyer, Seller, Employer, Employee, Client, Provider).
- Evaluate rights, termination, payment, penalties, liability, IP, and risk distribution between parties.
- If one party benefits more, name the favored_party, assign scores (0-100), set confidence (High/Medium/Low), and provide a concise verdict (e.g., "Moderately favors Party A").
- If terms are evenly balanced, set favored_party to "Balanced", score to 50, and verdict to "Relatively balanced between the parties".
- If document lacks sufficient detail to determine favorability, set favored_party to "Insufficient information" and verdict to "Insufficient information to determine favorability".
- Explain "why" in overall_assessment and reasons list.
- Detail specific supporting_clauses showing clause number/title, target_party, and brief explanation.

Keep:

- Names
- Company names
- Dates
- Amounts
- Clause numbers
- Original wording

accurate.

DOCUMENT:

{text}
"""

        # Ask Gemini
        result = ask_gemini(prompt)

        # Remove markdown JSON formatting if Gemini adds it
        result = result.replace("```json", "")
        result = result.replace("```", "")
        result = result.strip()

        # Convert JSON string to Python object
        data = json.loads(result)

        return jsonify(data)

    except json.JSONDecodeError:

        return jsonify({
            "error": "Gemini returned an unexpected response. Please try again."
        }), 500

    except Exception as error:

        print("FINAL ERROR:", error)

        return jsonify({
            "error": "Unable to analyze the document right now. Please try again."
        }), 500


# =========================================================
# ASK QUESTION
# =========================================================

@app.route("/ask", methods=["POST"])
def ask_question():

    global document_text

    if not document_text:

        return jsonify({
            "error": "Please upload and analyze a document first."
        }), 400

    data = request.get_json()

    question = data.get("question", "").strip()

    if not question:

        return jsonify({
            "error": "Please enter a question."
        }), 400

    # =====================================================
    # QUESTION PROMPT
    # =====================================================

    prompt = f"""
You are OpenLaw, an AI assistant helping a person
understand their uploaded legal document.

Answer the question using ONLY the document below.

Do not use outside information.

If the answer is not found in the document, say:

"I couldn't find this information in the uploaded document."

Answer in the SAME LANGUAGE as the document.

Do not provide legal advice.

DOCUMENT:

{document_text}

QUESTION:

{question}
"""

    try:

        answer = ask_gemini(prompt)

        return jsonify({
            "answer": answer
        })

    except Exception as error:

        print("QUESTION ERROR:", error)

        return jsonify({
            "error": "Unable to answer the question right now."
        }), 500


# =========================================================
# START FLASK
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )