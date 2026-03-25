from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()
sentiment_model = None

def get_sentiment_model():
    global sentiment_model
    if sentiment_model is None:
        from transformers import pipeline
        print("Loading BERT sentiment model...")
        sentiment_model = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
        print("BERT model loaded!")
    return sentiment_model

class TextInput(BaseModel):
    text: str

class MemoryInput(BaseModel):
    memories: List[dict]

@router.post("/sentiment")
async def analyze_sentiment(input: TextInput):
    try:
        model = get_sentiment_model()
        result = model(input.text[:512])[0]
        return {
            "success": True,
            "label": result["label"],
            "score": round(result["score"], 3),
            "is_positive": result["label"] == "POSITIVE"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/relevance")
async def score_memories(input: MemoryInput):
    try:
        model = get_sentiment_model()
        scored = []
        for memory in input.memories:
            text = memory.get("transcript", "") or " ".join(memory.get("tags", []))
            if text:
                result = model(text[:512])[0]
                score = result["score"] if result["label"] == "POSITIVE" else 1 - result["score"]
            else:
                score = 0.5
            scored.append({
                **memory,
                "relevanceScore": round(score, 3)
            })
        scored.sort(key=lambda x: x["relevanceScore"], reverse=True)
        return {"success": True, "memories": scored}
    except Exception as e:
        return {"success": False, "error": str(e)}
