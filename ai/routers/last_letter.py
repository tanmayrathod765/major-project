from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import os
from groq import Groq

router = APIRouter()

def call_groq(prompt: str) -> str:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
    )
    return response.choices[0].message.content

class LetterRequest(BaseModel):
    patientName: str
    recipientName: str
    sessionData: List[dict]
    memories: List[dict]
    relationship: str = "family member"
    contextSummary: str = ""
    topTags: List[str] = []
    knownPeople: List[dict] = []

@router.post("/last-letter")
async def generate_last_letter(req: LetterRequest):
    try:
        positive_prompts = []
        for session in req.sessionData:
            for response in session.get("responses", []):
                if response.get("reaction") in ["smile", "word", "eye_contact"]:
                    positive_prompts.append(response.get("prompt", ""))

        memory_highlights = []
        for memory in req.memories[:5]:
            tags = ", ".join(memory.get("tags", []))
            decade = memory.get("decade", "")
            transcript = memory.get("transcript", "")
            if tags or transcript:
                memory_highlights.append(f"{decade}: {tags}. {transcript[:100] if transcript else ''}")

        evidence = "\n".join([f"- Responded positively when: {p}" for p in positive_prompts[:5]])
        memory_text = "\n".join([f"- {m}" for m in memory_highlights])
        tag_context = ", ".join(req.topTags) if req.topTags else ""

        prompt = f"""You are writing a deeply personal letter FROM {req.patientName} TO their {req.relationship} {req.recipientName}.

Personal context about {req.patientName}:
{req.contextSummary if req.contextSummary else "A person with rich life experiences"}

Things that matter most to them (from their memories):
{tag_context if tag_context else "family, memories, love"}

Evidence of connection from real sessions:
{evidence if evidence else "They visited regularly"}

Their memories:
{memory_text if memory_text else "A life full of love"}

Write a warm, personal letter of 3-4 paragraphs.
- Reference their actual memories and tags naturally
- Use simple heartfelt language
- Do not mention dementia
- End with love
- Sign as {req.patientName}"""

        letter = call_groq(prompt)
        return {"success": True, "letter": letter}

    except Exception as e:
        return {"success": False, "error": str(e), "letter": generate_fallback_letter(req.patientName, req.recipientName)}
    try:
        positive_prompts = []
        for session in req.sessionData:
            for response in session.get("responses", []):
                if response.get("reaction") in ["smile", "word", "eye_contact"]:
                    positive_prompts.append(response.get("prompt", ""))

        memory_highlights = []
        for memory in req.memories[:5]:
            tags = ", ".join(memory.get("tags", []))
            decade = memory.get("decade", "")
            transcript = memory.get("transcript", "")
            if tags or transcript:
                memory_highlights.append(
                    f"{decade}: {tags}. {transcript[:100] if transcript else ''}"
                )

        evidence = "\n".join([
            f"- Responded positively when: {p}" for p in positive_prompts[:5]
        ])
        memory_text = "\n".join([f"- {m}" for m in memory_highlights])

        prompt = f"""You are writing a deeply personal letter FROM a dementia patient named {req.patientName} TO their {req.relationship} named {req.recipientName}.

Write it as if {req.patientName} is speaking directly.

Evidence of connection:
{evidence if evidence else "They visited regularly and showed care"}

Their memories:
{memory_text if memory_text else "A life full of love and moments"}

Write a warm, emotional letter of 3-4 paragraphs.
- Use simple heartfelt language
- Do not mention dementia
- End with love and gratitude
- Sign as {req.patientName}"""

        letter = call_groq(prompt)
        return {"success": True, "letter": letter}

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "letter": generate_fallback_letter(req.patientName, req.recipientName)
        }

def generate_fallback_letter(patient_name, recipient_name):
    return f"""Dear {recipient_name},

There are so many things I wish I could say more clearly, but my heart has always known what my words sometimes cannot express. Every time you came to visit, something inside me recognized you — a warmth, a comfort, a feeling of home.

I may not always show it the way I used to, but your presence has meant everything to me. The sound of your voice, the touch of your hand — these things reach me even when nothing else does.

Thank you for never giving up on me. I love you more than words can hold.

With all my heart,
{patient_name}"""