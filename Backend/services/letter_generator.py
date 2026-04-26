import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_MODELS_FALLBACK = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-1.5-flash",  # safe fallback (important)
]

class LetterGenerator:

    def __init__(self):
        self.client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY")
        )

    def generate_letter(self, cv_profile: dict, job_description: str):

        prompt = f"""You are a senior career coach and expert HR copywriter.

Write a natural, human-like cover letter.

STRICT RULES:
- Write in FIRST PERSON (I, my)
- Do NOT sound like AI or template
- Avoid repeating skills
- Do NOT list skills like a CV
- Focus on impact and achievements
- Be concise (max 4 short paragraphs)
- Avoid generic phrases
- Include measurable impact when possible
- Make the letter sound natural and human
- Personalize based on company values
- Avoid placeholders like [Hiring Manager Name]

STRUCTURE:
1. Introduction (who I am + role)
2. Most relevant experience (only 1-2 key examples)
3. Why this role/company (motivation)
4. Conclusion

CV:
{cv_profile}

JOB:
{job_description}

OUTPUT:
Only the cover letter in English."""

        for model_name in GEMINI_MODELS_FALLBACK:
            try:
                print(f"Trying model: {model_name}")

                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )

                print(f"✅ Success with {model_name}")
                return response.text

            except Exception as e:
                print(f"❌ Failed with {model_name}: {e}")

        raise Exception("All Gemini models failed")