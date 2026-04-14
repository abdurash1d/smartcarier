"""
=============================================================================
GEMINI AI SERVICE - Google Gemini Integration (google-genai SDK)
=============================================================================

Bu service Google Gemini API bilan ishlaydi - BEPUL!
OpenAI'dan farqi - bu tekin va juda tez ishlaydi.

Gemini API kalitini olish:
1. https://ai.google.dev/ ga boring
2. "Get API key" bosing
3. Google hisobingiz bilan kiring
4. Yangi kalit yarating

.env fayliga qo'shing:
GEMINI_API_KEY=your-gemini-api-key

SDK: pip install google-genai>=1.0.0

AUTHOR: SmartCareer AI Team
VERSION: 2.0.0 (migrated from google-generativeai to google-genai)
"""

import json
import logging
from typing import Dict, Any, Optional

try:
    from google import genai
    from google.genai import types as genai_types
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False

from app.config import settings

# =============================================================================
# LOGGING
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# GEMINI SERVICE CLASS
# =============================================================================

class GeminiService:
    """
    Google Gemini AI Service - Tekin AI API!

    Bu service:
    - Resume generatsiya qiladi
    - Cover letter yozadi
    - Job matching tahlil qiladi
    - Motivatsion xat yozadi
    """

    def __init__(self):
        """Gemini client yaratish"""
        self.api_key = getattr(settings, 'GEMINI_API_KEY', None)
        # Use correct model name format for Gemini API
        model_setting = getattr(settings, 'GEMINI_MODEL', 'gemini-1.5-flash')
        # Map common names to API model names
        model_mapping = {
            'gemini-1.5-flash': 'gemini-1.5-flash',
            'gemini-1.5-pro': 'gemini-1.5-pro',
            'gemini-pro': 'gemini-pro',
            'gemini-flash': 'gemini-1.5-flash',
            'gemini-2.0-flash': 'gemini-2.0-flash',
            'gemini-2.0-pro': 'gemini-2.0-pro-exp',
        }
        self._model_name = model_mapping.get(model_setting, model_setting)
        self.client = None

        self._initialize()

    def _initialize(self):
        """Gemini client ni sozlash"""
        logger.info("=" * 60)
        logger.info("🌟 Initializing Gemini AI Service (google-genai SDK)")
        logger.info("=" * 60)

        if not _GENAI_AVAILABLE:
            logger.error("❌ google-genai package not installed. Run: pip install google-genai>=1.0.0")
            return

        if not self.api_key or self.api_key == "your-gemini-api-key-here":
            logger.warning("⚠️ GEMINI_API_KEY not set. Please add it to .env")
            logger.warning("   Get free key at: https://ai.google.dev/")
            return

        try:
            self.client = genai.Client(api_key=self.api_key)
            logger.info(f"✅ Gemini client initialized, model: {self._model_name}")
            logger.info("🎉 Gemini AI Service ready!")
            logger.info("=" * 60)

        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini: {e}")
            self.client = None

    @property
    def is_available(self) -> bool:
        """Gemini ishga tayyormi?"""
        return self.client is not None

    async def generate(
        self,
        prompt: str,
        response_format: str = "text"
    ) -> str:
        """
        Generic AI generation method.

        Args:
            prompt: Text prompt
            response_format: "text" or "json"

        Returns:
            Generated text
        """
        if not self.is_available:
            raise Exception("Gemini API not configured")

        try:
            # Add JSON instruction if needed
            if response_format == "json":
                prompt = f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON, no other text."

            # Generate response (async)
            response = await self.client.aio.models.generate_content(
                model=self._model_name,
                contents=prompt,
            )

            # Extract text
            text = response.text.strip()

            # Clean up JSON response if needed
            if response_format == "json":
                if text.startswith("```json"):
                    text = text.replace("```json", "").replace("```", "").strip()
                elif text.startswith("```"):
                    text = text.replace("```", "").strip()

            return text

        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise

    async def generate_resume(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI yordamida professional rezyume yaratish

        Args:
            user_data: Foydalanuvchi ma'lumotlari

        Returns:
            Yaratilgan rezyume JSON formatda
        """
        if not self.is_available:
            return {"error": "Gemini API not configured", "success": False}

        prompt = f"""
You are a professional resume writer. Create a comprehensive, ATS-optimized resume based on the following information.

USER DATA:
{json.dumps(user_data, indent=2, ensure_ascii=False)}

Generate a professional resume in JSON format with the following structure:
{{
    "personal_info": {{
        "full_name": "...",
        "title": "...",
        "email": "...",
        "phone": "...",
        "location": "...",
        "linkedin": "...",
        "website": "..."
    }},
    "summary": "A compelling 2-3 sentence professional summary highlighting key achievements and expertise",
    "experience": [
        {{
            "title": "Job Title",
            "company": "Company Name",
            "location": "City, Country",
            "start_date": "MM/YYYY",
            "end_date": "MM/YYYY or Present",
            "achievements": [
                "Achievement 1 with metrics",
                "Achievement 2 with metrics",
                "Achievement 3 with metrics"
            ]
        }}
    ],
    "education": [
        {{
            "degree": "Degree Name",
            "institution": "University Name",
            "location": "City, Country",
            "graduation_date": "YYYY",
            "gpa": "X.X (if notable)",
            "highlights": ["Honor", "Achievement"]
        }}
    ],
    "skills": {{
        "technical": ["Skill 1", "Skill 2"],
        "soft": ["Skill 1", "Skill 2"],
        "languages": ["Language 1 (Level)", "Language 2 (Level)"]
    }},
    "certifications": [
        {{
            "name": "Certification Name",
            "issuer": "Issuing Organization",
            "date": "YYYY"
        }}
    ],
    "ats_score": 95,
    "suggestions": ["Improvement suggestion 1", "Improvement suggestion 2"]
}}

IMPORTANT:
- Use strong action verbs (Led, Developed, Implemented, Achieved)
- Include quantifiable achievements with numbers and percentages
- Make it ATS-friendly with relevant keywords
- Keep it professional and concise
- Return ONLY valid JSON, no markdown or extra text
"""

        try:
            response = await self.client.aio.models.generate_content(
                model=self._model_name,
                contents=prompt,
            )

            # Parse JSON from response
            text = response.text.strip()

            # Remove markdown code blocks if present
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]

            resume_data = json.loads(text.strip())

            logger.info("✅ Resume generated successfully with Gemini!")

            return {
                "success": True,
                "resume": resume_data,
                "model": self._model_name,
                "provider": "gemini"
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            return {
                "success": False,
                "error": "Failed to parse AI response",
                "raw_response": response.text if response else None
            }
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def generate_cover_letter(
        self,
        resume_data: Dict[str, Any],
        job_description: str,
        company_name: str
    ) -> Dict[str, Any]:
        """
        Job uchun cover letter yaratish
        """
        if not self.is_available:
            return {"error": "Gemini API not configured", "success": False}

        prompt = f"""
You are a professional career coach. Write a compelling cover letter.

RESUME DATA:
{json.dumps(resume_data, indent=2, ensure_ascii=False)}

JOB DESCRIPTION:
{job_description}

COMPANY NAME: {company_name}

Write a professional cover letter that:
1. Opens with a strong hook
2. Highlights relevant experience and skills
3. Shows enthusiasm for the role and company
4. Ends with a clear call to action

Return JSON format:
{{
    "cover_letter": "Full cover letter text...",
    "key_points": ["Point 1", "Point 2", "Point 3"],
    "match_score": 85
}}

Return ONLY valid JSON.
"""

        try:
            response = await self.client.aio.models.generate_content(
                model=self._model_name,
                contents=prompt,
            )
            text = response.text.strip()

            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]

            result = json.loads(text.strip())

            return {
                "success": True,
                **result,
                "provider": "gemini"
            }

        except Exception as e:
            logger.error(f"Cover letter generation error: {e}")
            return {"success": False, "error": str(e)}

    async def analyze_job_match(
        self,
        resume_data: Dict[str, Any],
        job_description: str
    ) -> Dict[str, Any]:
        """
        Resume va job o'rtasidagi moslikni tahlil qilish
        """
        if not self.is_available:
            return {"error": "Gemini API not configured", "success": False}

        prompt = f"""
Analyze the match between this resume and job description.

RESUME:
{json.dumps(resume_data, indent=2, ensure_ascii=False)}

JOB DESCRIPTION:
{job_description}

Provide analysis in JSON format:
{{
    "match_score": 85,
    "matching_skills": ["skill1", "skill2"],
    "missing_skills": ["skill1", "skill2"],
    "experience_match": "Strong/Moderate/Weak",
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "interview_tips": ["Tip 1", "Tip 2"]
}}

Return ONLY valid JSON.
"""

        try:
            response = await self.client.aio.models.generate_content(
                model=self._model_name,
                contents=prompt,
            )
            text = response.text.strip()

            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]

            result = json.loads(text.strip())

            return {
                "success": True,
                **result,
                "provider": "gemini"
            }

        except Exception as e:
            logger.error(f"Job match analysis error: {e}")
            return {"success": False, "error": str(e)}


# =============================================================================
# GLOBAL INSTANCE
# =============================================================================

gemini_service = GeminiService()
