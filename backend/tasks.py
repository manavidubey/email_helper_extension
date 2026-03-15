from crewai import Task
from textwrap import dedent

def summary_task(agent, email_thread, output_schema, custom_prompt=""):
    instruction = custom_prompt if custom_prompt else "Identify the overall priority of the most recent message (High, Medium, or Low).\nExtract any concrete action items or next steps required of the executive."
    return Task(
        description=dedent(f"""
            Analyze the following email thread:
            {email_thread}

            CRITICAL INSTRUCTION: Provide an extremely brief, 1-sentence TL;DR of the thread. DO NOT rewrite or paraphrase the entire email. The summary must be an absolute maximum of 15 words.
            
            USER INSTRUCTIONS:
            {instruction}
        """),
        expected_output="A valid JSON object matching the requested schema.",
        agent=agent,
        output_pydantic=output_schema
    )

def draft_reply_task(agent, email_thread, user_intent, custom_prompt=""):
    instruction = custom_prompt if custom_prompt else "Write a highly polished, professional, and precise email reply that strictly adheres to the executive's intent. Do not include placeholder text like '[Your Name]'. Do not include conversational filler before or after the email draft."
    return Task(
        description=dedent(f"""
            Read the following email thread carefully:
            {email_thread}

            The executive has requested you to draft a reply with the following explicit intent:
            "{user_intent}"

            Your task: {instruction}
        """),
        expected_output="The raw text of the final email draft.",
        agent=agent,
    )
