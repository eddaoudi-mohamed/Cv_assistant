import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_MODELS_FALLBACK = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
]

class JobParser:

    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    def extract_company_info(self, job_text: str) -> dict:

        prompt = f"""
You are an expert HR data extractor.

Extract structured information from the job description.

STRICT RULES:
- Return ONLY valid JSON
- No explanation, no markdown, no code fences
- If a field is missing, use ""

FIELDS:
- company_name
- position
- location
- contact
- address

JOB DESCRIPTION:
{job_text}

OUTPUT:
JSON only.
"""

        for model_name in GEMINI_MODELS_FALLBACK:
            try:
                print(f"Trying model: {model_name}")

                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )

                raw_text = response.text.strip()

                # Strip markdown fences if model added them anyway
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("```")[1]
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]
                    raw_text = raw_text.strip()

                data = json.loads(raw_text)

                position = data.get("position", "")
                print(f"✅ Success with {model_name}")

                return {
                    "name":    data.get("company_name", ""),
                    "role":    position,
                    "location": data.get("location", ""),
                    "contact": data.get("contact", "Hiring Manager"),
                    "address": data.get("address", ""),
                }

            except json.JSONDecodeError as e:
                print(f"⚠️  JSON parsing failed for {model_name}: {e}")
            except Exception as e:
                print(f"❌ Model call failed with {model_name}: {e}")

        raise Exception("All Gemini models failed")