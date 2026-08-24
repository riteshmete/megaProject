import os
import json
try:
    import pymupdf as fitz  # PyMuPDF
except ImportError:
    import fitz

from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Global variable to store current document text for Q&A session
CURRENT_DOC_TEXT = ""


def extract_text_from_pdf(file_bytes):
    """
    Extracts text page by page from an in-memory PDF using PyMuPDF (fitz).
    Cleans up excessive whitespace while preserving paragraphs and headings.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    full_text = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        if text and text.strip():
            full_text.append(text.strip())

    doc.close()

    # Combine page text with blank line separators
    combined_text = "\n\n".join(full_text)
    return combined_text.strip()


def call_gemini_api(prompt_text):
    """
    Calls the Google Gemini API using the official google-genai SDK.
    Tries gemini-3.6-flash first as recommended by API.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.strip() == "" or api_key == "your_gemini_api_key_here":
        raise ValueError("Gemini API key is not configured. Please add your GEMINI_API_KEY to the .env file.")

    models_to_try = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    last_exception = None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt_text,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                return response.text
            except Exception as e:
                last_exception = e
                if "404" in str(e) or "NOT_FOUND" in str(e):
                    continue
                raise e

        if last_exception:
            raise last_exception
    except ImportError:
        import google.generativeai as legacy_genai
        legacy_genai.configure(api_key=api_key)
        for model_name in ["gemini-1.5-flash", "gemini-1.0-pro"]:
            try:
                model = legacy_genai.GenerativeModel(model_name)
                response = model.generate_content(prompt_text)
                return response.text
            except Exception as ex:
                last_exception = ex
        raise last_exception


@app.route("/")
def index():
    """Serves the main HTML interface."""
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze_document():
    """
    Endpoint to process an uploaded PDF legal document:
    1. Extract text using PyMuPDF
    2. Analyze text with Gemini AI
    3. Return structured JSON analysis
    """
    global CURRENT_DOC_TEXT

    # 1. Check if file was uploaded
    if "file" not in request.files and "pdf" not in request.files:
        return jsonify({"error": "Please upload a PDF file."}), 400

    file = request.files.get("file") or request.files.get("pdf")

    if not file or file.filename == "":
        return jsonify({"error": "Please select a valid PDF file."}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Invalid file format. Please upload a PDF file."}), 400

    try:
        # 2. Read PDF file bytes and extract text
        file_bytes = file.read()
        extracted_text = extract_text_from_pdf(file_bytes)

        # Check for unreadable or empty text
        if not extracted_text or len(extracted_text.strip()) < 20:
            return jsonify({
                "error": "No readable text could be extracted from this PDF. The document may be scanned or image-based."
            }), 400

        # Save document text in memory for subsequent question-answering
        CURRENT_DOC_TEXT = extracted_text

        # 3. Formulate analysis prompt for Gemini
        analysis_prompt = f"""
You are an AI assistant that explains Indian legal documents to ordinary people.
Analyze ONLY the supplied legal document text below.
Do not invent or assume information. If information for a field is not present in the document, set it to "Not specified in the document." or an empty list.

Explain legal terminology in simple English.
Identify important clauses and explain them in simple language.
Identify provisions that may require user attention.
Do not provide definitive legal advice.
Do not claim that a document or clause is definitely legal, illegal, safe, dangerous, valid, or invalid.

Return your response as a strictly valid JSON object matching EXACTLY this JSON structure:
{{
  "document_type": "e.g. Residential Rental Agreement, Employment Contract, Non-Disclosure Agreement",
  "summary": "Clear, 2-3 sentence summary of the document",
  "simple_explanation": "A simple, plain-English overview explaining what this document does for an ordinary person",
  "parties": ["Party 1 name and designation", "Party 2 name and designation"],
  "important_dates": ["Start Date: ...", "Termination/Expiry Date: ...", "Notice Period: ..."],
  "financial_obligations": ["Rent/Payment details", "Deposit details", "Penalties or fees"],
  "key_points": ["Key point 1", "Key point 2"],
  "important_clauses": [
    {{
      "clause": "Clause Name / Title",
      "original_text": "Representative excerpt of the original wording",
      "simple_explanation": "What this clause means in plain English",
      "importance": "High"
    }}
  ],
  "attention_areas": [
    {{
      "title": "Title of area requiring attention",
      "description": "Description of why the user should pay attention to this",
      "severity": "High"
    }}
  ],
  "rights": ["Right 1", "Right 2"],
  "responsibilities": ["Responsibility 1", "Responsibility 2"],
  "termination_conditions": ["Condition 1", "Condition 2"],
  "overall_attention_level": "Medium"
}}

Note: For "importance" in important_clauses and "severity" in attention_areas, use ONLY one of: "High", "Medium", or "Low".
For "overall_attention_level", use ONLY one of: "High", "Medium", or "Low".

DOCUMENT TEXT:
{extracted_text}
"""

        # 4. Send request to Gemini API
        raw_response = call_gemini_api(analysis_prompt)

        # 5. Clean and parse JSON response
        cleaned_response = raw_response.strip()

        # Remove markdown block markers if present
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()

        result_data = json.loads(cleaned_response)
        return jsonify(result_data)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned an unexpected response format. Please try again."}), 500
    except Exception as e:
        return jsonify({"error": f"Unable to analyze the document right now: {str(e)}"}), 500


@app.route("/ask", methods=["POST"])
def ask_question():
    """
    Endpoint for asking questions about the currently uploaded document.
    """
    global CURRENT_DOC_TEXT

    if not CURRENT_DOC_TEXT or CURRENT_DOC_TEXT.strip() == "":
        return jsonify({"error": "No document has been uploaded yet. Please upload and analyze a PDF document first."}), 400

    data = request.get_json() or {}
    user_question = data.get("question", "").strip()

    if not user_question:
        return jsonify({"error": "Please enter a question about the document."}), 400

    ask_prompt = f"""
You are an AI assistant helping an ordinary person understand a legal document they uploaded.
Answer the user's question using ONLY the supplied document text below.
If the answer is not present in the document text, state: "I couldn't find this information in the uploaded document."
Where possible, reference the relevant clause or section.
Do not provide definitive legal advice.

DOCUMENT TEXT:
{CURRENT_DOC_TEXT}

USER QUESTION:
{user_question}
"""

    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.strip() == "" or api_key == "your_gemini_api_key_here":
            return jsonify({"error": "Gemini API key is not configured in .env file."}), 400

        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            models_to_try = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
            answer_text = None
            last_err = None
            for m in models_to_try:
                try:
                    response = client.models.generate_content(
                        model=m,
                        contents=ask_prompt
                    )
                    answer_text = response.text
                    break
                except Exception as ex:
                    last_err = ex
                    if "404" in str(ex) or "NOT_FOUND" in str(ex):
                        continue
                    raise ex
            if not answer_text and last_err:
                raise last_err
        except ImportError:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=api_key)
            model = legacy_genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(ask_prompt)
            answer_text = response.text

        return jsonify({"answer": answer_text})

    except Exception as e:
        return jsonify({"error": f"Could not process question: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
