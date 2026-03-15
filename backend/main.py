from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from litellm import completion
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from crewai import Crew, Process
from agents import get_email_analyst, get_communications_executive
from tasks import summary_task, draft_reply_task

load_dotenv()

app = FastAPI(title="AI Executive Mail Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Executive Mail Assistant API is running. Use /health for status."}

# Configuration for models (can be moved to config or env)
DEFAULT_MODEL = os.getenv("LLM_MODEL", "groq/llama-3.1-8b-instant")

class EmailRequest(BaseModel):
    text: str
    context: str = ""
    intent: str = ""
    custom_prompt: str = ""

class ImprovementRequest(BaseModel):
    text: str
    custom_prompt: str = ""

class SummaryResponse(BaseModel):
    summary: str
    key_decisions: list[str]
    open_questions: list[str]
    action_items: list[str]
    suggested_reply: str

@app.post("/improve")
async def improve_draft(request: ImprovementRequest):
    try:
        system_instruction = request.custom_prompt if request.custom_prompt else "You are an executive communication assistant. Write concise, professional, and clear emails."
        prompt = f"""Rewrite the following email draft to be professional, concise, and suitable for an executive.
Maintain the original intent but enhance the tone.

CRITICAL INSTRUCTION: Return ONLY the raw rewritten text. Do not include any conversational filler, do not say "Here is the improved version:", and do not include any quotes.

Draft:
{request.text}"""
        
        response = completion(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ]
        )
        return {"improved_text": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reply")
async def generate_reply(request: EmailRequest):
    try:
        # The Executive Agent crafts the reply based on the exact thread and intent
        executive = get_communications_executive()
        task = draft_reply_task(executive, request.text, request.intent or "Write a standard professional reply.", request.custom_prompt)
        
        crew = Crew(
            agents=[executive],
            tasks=[task],
            process=Process.sequential
        )
        
        result = crew.kickoff()
        return {"reply_text": result.raw.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize_thread(request: EmailRequest):
    try:
        # The Analyst Agent reads the thread and maps it to the SummaryResponse schema
        analyst = get_email_analyst()
        task = summary_task(analyst, request.text, SummaryResponse, request.custom_prompt)
        
        crew = Crew(
            agents=[analyst],
            tasks=[task],
            process=Process.sequential
        )
        
        result = crew.kickoff()
        
        # CrewAI automatically parses to the output_pydantic model
        if hasattr(result, 'pydantic') and result.pydantic:
            return result.pydantic.model_dump()
        elif hasattr(result, 'json_dict') and result.json_dict:
            return result.json_dict
        else:
            import json
            return json.loads(result.raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
