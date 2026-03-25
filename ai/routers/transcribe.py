from fastapi import APIRouter, UploadFile, File
import whisper
import tempfile
import os
import shutil

router = APIRouter()
model = None

def get_model():
    global model
    if model is None:
        print("Loading Whisper model...")
        model = whisper.load_model("base")
        print("Whisper model loaded!")
    return model

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    tmp_path = None
    try:
        # Windows safe temp file
        suffix = os.path.splitext(file.filename)[1] or ".wav"
        tmp_path = os.path.join(tempfile.gettempdir(), f"griefbridge_{tempfile.gettempprefix()}{suffix}")
        
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        print(f"Temp file saved: {tmp_path}")
        
        whisper_model = get_model()
        result = whisper_model.transcribe(tmp_path)
        
        print(f"Transcript: {result['text']}")
        
        return {
            "success": True,
            "transcript": result["text"],
            "language": result["language"]
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)