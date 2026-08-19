from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.api.deps import get_current_user
from app.models.user import User
from app.services.gemini_service import GeminiService

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str = Field(..., description="Farmer's agronomic question")
    crop_context: Optional[str] = Field(None, description="Current crop name/stage context")
    weather_context: Optional[str] = Field(None, description="Current weather context")

class ChatResponse(BaseModel):
    response: str = Field(..., description="Context-aware AI answer")

@router.post("/chat", response_model=ChatResponse)
def assistant_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Expose Gemini LLM chat assistant endpoint tailored to the farmer's crop and weather context.
    """
    try:
        ai_response = GeminiService.generate_response(
            prompt=request.prompt,
            crop_context=request.crop_context,
            weather_context=request.weather_context
        )
        return {"response": ai_response}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Assistant query processing failed: {str(e)}"
        )
