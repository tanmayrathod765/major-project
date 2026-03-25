from fastapi import APIRouter, UploadFile, File
from PIL import Image
import pytesseract
import tempfile
import os

router = APIRouter()

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

@router.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        image = Image.open(tmp_path)
        text = pytesseract.image_to_string(image, lang="eng+hin")
        os.unlink(tmp_path)

        return {
            "success": True,
            "text": text.strip(),
            "char_count": len(text.strip())
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
