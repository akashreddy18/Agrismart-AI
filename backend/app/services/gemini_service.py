import requests
from typing import Optional
from app.core.config import settings

class GeminiService:
    @classmethod
    def generate_response(
        cls, prompt: str, crop_context: Optional[str] = None, weather_context: Optional[str] = None
    ) -> str:
        # Construct contextualized system instruction prepended to the prompt
        system_instruction = (
            "You are AgriSmart AI, a professional agronomic intelligence assistant. "
            "Help the farmer optimize their crop lifecycle with precise, science-backed guidance. "
            "Respond in a helpful, friendly, and practical tone. Keep answers concise.\n\n"
        )
        
        if crop_context:
            system_instruction += f"Context: Target Crop is {crop_context}.\n"
        if weather_context:
            system_instruction += f"Context: Local weather conditions are {weather_context}.\n"
            
        full_prompt = system_instruction + f"\nFarmer Query: {prompt}"

        # If Gemini API Key is configured, make real API request
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() != "":
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{
                        "parts": [{"text": full_prompt}]
                    }]
                }
                
                response = requests.post(url, headers=headers, json=payload, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    print(f"Gemini API returned error code {response.status_code}: {response.text}")
            except Exception as e:
                print(f"Error executing Gemini API request: {str(e)}")

        # Graceful fallback: agronomic rules-based advisory mapping common agricultural keywords
        p_lower = prompt.lower()
        if "spot" in p_lower or "blight" in p_lower or "leaf" in p_lower:
            return (
                "Leaf spotting and blights are commonly fungal. If you see concentric brown rings, it is likely Early Blight. "
                "Recommendation: Apply a Copper-based fungicide or Mancozeb spray. Keep leaves dry by shifting to drip irrigation."
            )
        elif "irrigate" in p_lower or "water" in p_lower:
            return (
                "Tomato crops require about 1-1.5 inches of water per week. During flowering and fruit setting stages, "
                "consistent moisture is critical to prevent Blossom End Rot. Avoid overhead watering to prevent mildew spread."
            )
        elif "fertilizer" in p_lower or "nitrogen" in p_lower or "npk" in p_lower:
            return (
                "For general crop vegetative stages, a balanced NPK (19-19-19) application is recommended. "
                "Once flowering begins, reduce high-nitrogen fertilizers and shift to high-potassium (K) blends to boost fruit yields."
            )
        elif "harvest" in p_lower:
            return (
                "Harvesting should be done early morning or late evening. Keep produce in a shaded, ventilated area. "
                "Check Bowenpally APMC Mandi price curves to decide if immediate selling or short-term storage holding is more profitable."
            )
        else:
            return (
                "AgriSmart AI recommendation: Ensure proper weeding, maintain a soil pH between 6.0 and 7.0 for optimal nutrient absorption, "
                "and delay pesticide spraying if winds exceed 15 km/h to prevent chemical drift."
            )
