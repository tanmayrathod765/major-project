from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import transcribe, ocr, sentiment, ghost_voice, last_letter, life_story, emotion
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI(title="GriefBridge AI Core")

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5000",
]

frontend_url = os.getenv("FRONTEND_URL")
backend_url = os.getenv("BACKEND_URL")

if frontend_url:
    allowed_origins.extend([value.strip() for value in frontend_url.split(",") if value.strip()])
if backend_url:
    allowed_origins.extend([value.strip() for value in backend_url.split(",") if value.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
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

@app.head("/")
def root_head():
    return

@app.get("/health")
def health():
    return {"status": "ok"}

@app.head("/health")
def health_head():
    return

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)