import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

router = APIRouter()

load_dotenv()
api_key = os.getenv("ai_key")

client =genai.Client(api_key=api_key)

class ChatRequest(BaseModel):
    message: str
    
@router.post("/chat")
async def chat_with_tutor(request: ChatRequest):
    try:
        tutor_prompt = "bạn là một gia sư ai thông minh, hãy giúp đỡ học sinh trong việc giải bài bằng " \
        "cách gợi ý cho họ lưu ý là bạn phải gợi ý trước và nếu họ thật sự không biết hãy đưa ra đáp án " \
        "và giải thích kỹ càng và đưa ra một bài tập tương tự"

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=request.message,
            config=types.GenerateContentConfig(
                system_instruction=tutor_prompt,
            )
        )
        return {"reply": response.text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))