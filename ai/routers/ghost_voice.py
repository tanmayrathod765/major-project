from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi import HTTPException
import tempfile
import os

router = APIRouter()

@router.post("/clone-voice")
async def clone_voice(
    audio: UploadFile = File(...),
    text: str = Form(...),
    language: str = Form("hi")
):
    try:
        from gtts import gTTS

        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        allowed_languages = {"hi", "en", "mr", "gu", "pa", "bn"}
        lang = language if language in allowed_languages else "hi"

        # Save reference audio (for future use)
        suffix = os.path.splitext(audio.filename)[1] or ".wav"
        ref_path = os.path.join(tempfile.gettempdir(), f"ref_{tempfile.gettempprefix()}{suffix}")
        with open(ref_path, "wb") as f:
            f.write(await audio.read())

        # Generate speech
        out_path = os.path.join(tempfile.gettempdir(), f"ghost_{tempfile.gettempprefix()}.mp3")
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(out_path)

        # Cleanup reference
        if os.path.exists(ref_path):
            os.remove(ref_path)

        return FileResponse(
            path=out_path,
            media_type="audio/mpeg",
            filename="ghost_voice.mp3"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ghost Voice Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tts")
async def text_to_speech(text: str = Form(...)):
    try:
        from gtts import gTTS
        out_path = os.path.join(tempfile.gettempdir(), f"tts_{tempfile.gettempprefix()}.mp3")
        tts = gTTS(text=text, lang="hi", slow=False)
        tts.save(out_path)
        return FileResponse(out_path, media_type="audio/mpeg", filename="speech.mp3")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))