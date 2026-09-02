import os
import json
import re
import pymupdf
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import types

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
# SAFELY EXTRACT JSON FROM TEXT
# =========================================================

def extract_json_from_text(text):

    if not text:
        raise ValueError("Empty response received from Gemini.")

    text = text.strip()

    # Direct JSON parse attempt
    try:
        return json.loads(text)
    except Exception:
        pass

    # Strip code block wrappers like ```json ... ``` or ``` ... ```
    cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE | re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE | re.MULTILINE).strip()

    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Extract JSON substring starting from first '{' to last '}'
    first_brace = text.find("{")
    last_brace = text.rfind("}")

    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        json_substring = text[first_brace:last_brace + 1].strip()

        try:
            return json.loads(json_substring)
        except Exception:
            # Strip invalid control characters if present
            cleaned_substring = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', json_substring)
            try:
                return json.loads(cleaned_substring)
            except Exception:
                pass

    raise json.JSONDecodeError("Could not extract valid JSON structure", text, 0)


# =========================================================
# ASK GEMINI
# =========================================================

def ask_gemini(prompt, response_mime_type=None):

    model = "gemini-3.6-flash"

    try:

        print("Trying model:", model)

        config = types.GenerateContentConfig(response_mime_type=response_mime_type) if response_mime_type else None

        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=config
        )

        if not response or not response.text:
            raise ValueError(f"Model {model} returned an empty response.")

        print("Gemini response received.")

        return response.text

    except Exception as error:

        print("Model error:", error)

        raise error


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

        # Ask Gemini with JSON response mime type specified
        result = ask_gemini(prompt, response_mime_type="application/json")

        # Extract and convert JSON string to Python object
        data = extract_json_from_text(result)

        return jsonify(data)

    except (json.JSONDecodeError, ValueError) as error:

        print("JSON PARSE ERROR:", error)

        return jsonify({
            "error": "Gemini returned an unexpected response. Please try again."
        }), 500

    except Exception as error:

        print("FINAL ERROR:", error)

        err_str = str(error)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
            return jsonify({
                "error": "Gemini API quota exceeded. Please try again later."
            }), 429

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

        err_str = str(error)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
            return jsonify({
                "error": "Gemini API quota exceeded. Please try again later."
            }), 429

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