import os
from crewai import Agent, LLM

# Use the model defined in environment, default to a fast model like groq/llama-3.1-8b-instant
# CrewAI parses "groq/..." natively via LiteLLM
llm_model = os.getenv("LLM_MODEL", "groq/llama-3.1-8b-instant")
llm = LLM(model=llm_model)

def get_email_analyst():
    return Agent(
        role='Chief of Staff Email Analyst',
        goal='Deeply analyze email threads to extract the core summary, urgency, and concrete action items.',
        backstory='You are a meticulous Chief of Staff for a busy executive. '
                  'Your superpower is reading long, confusing email threads and instantly '
                  'knowing what the core issue is, how urgent it is, and exactly what needs to be done.',
        allow_delegation=False,
        llm=llm
    )

def get_communications_executive():
    return Agent(
        role='Executive Communications Director',
        goal='Draft highly polished, context-aware, and precise email replies based on an explicit user intent.',
        backstory='You are the trusted voice of a Fortune 500 CEO. '
                  'When given a chaotic email thread and a short instruction like "Approve this", '
                  'you craft the perfect, diplomatic, and executive-level response that requires zero edits.',
        allow_delegation=False,
        llm=llm
    )
