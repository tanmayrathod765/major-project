from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import transcribe, ocr, sentiment, ghost_voice, last_letter, life_story, emotion
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI(title="GriefBridge AI Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcribe.router, prefix="/ai", tags=["Transcribe"])
app.include_router(ocr.router, prefix="/ai", tags=["OCR"])
app.include_router(sentiment.router, prefix="/ai", tags=["Sentiment"])
app.include_router(ghost_voice.router, prefix="/ai", tags=["Ghost Voice"])
app.include_router(life_story.router, prefix="/ai", tags=["Life Story"])
app.include_router(last_letter.router, prefix="/ai", tags=["Last Letter"])
app.include_router(emotion.router, prefix="/ai", tags=["Emotion"])

@app.get("/")
def root():
    return {"status": "GriefBridge AI Core running ✅"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)