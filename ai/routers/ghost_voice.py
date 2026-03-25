from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import FileResponse
import tempfile
import os

router = APIRouter()

@router.post("/clone-voice")
async def clone_voice(
    audio: UploadFile = File(...),
    text: str = Form(...)
):
    try:
        from gtts import gTTS

        # Save reference audio (for future use)
        suffix = os.path.splitext(audio.filename)[1] or ".wav"
        ref_path = os.path.join(tempfile.gettempdir(), f"ref_{tempfile.gettempprefix()}{suffix}")
        with open(ref_path, "wb") as f:
            f.write(await audio.read())

        # Generate speech
        out_path = os.path.join(tempfile.gettempdir(), f"ghost_{tempfile.gettempprefix()}.mp3")
        tts = gTTS(text=text, lang="hi", slow=False)
        tts.save(out_path)

        # Cleanup reference
        if os.path.exists(ref_path):
            os.remove(ref_path)

        return FileResponse(
            path=out_path,
            media_type="audio/mpeg",
            filename="ghost_voice.mp3"
        )
    except Exception as e:
        print(f"Ghost Voice Error: {str(e)}")
        return {"success": False, "error": str(e)}

@router.post("/tts")
async def text_to_speech(text: str = Form(...)):
    try:
        from gtts import gTTS
        out_path = os.path.join(tempfile.gettempdir(), f"tts_{tempfile.gettempprefix()}.mp3")
        tts = gTTS(text=text, lang="hi", slow=False)
        tts.save(out_path)
        return FileResponse(out_path, media_type="audio/mpeg", filename="speech.mp3")
    except Exception as e:
        return {"success": False, "error": str(e)}