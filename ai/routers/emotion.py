from fastapi import APIRouter, UploadFile, File
import tempfile
import os
import cv2
import numpy as np
import importlib

router = APIRouter()

def convert_to_python(obj):
    if isinstance(obj, np.float32) or isinstance(obj, np.float64):
        return float(obj)
    if isinstance(obj, np.int32) or isinstance(obj, np.int64):
        return int(obj)
    if isinstance(obj, dict):
        return {k: convert_to_python(v) for k, v in obj.items()}
    return obj


def analyze_with_opencv_fallback(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    smile_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_smile.xml")

    faces = face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    dominant = "neutral"

    if len(faces) > 0:
        x, y, w, h = faces[0]
        face_roi = gray[y:y + h, x:x + w]
        smiles = smile_detector.detectMultiScale(face_roi, scaleFactor=1.7, minNeighbors=20, minSize=(25, 25))
        dominant = "happy" if len(smiles) > 0 else "neutral"

    base = {
        "angry": 2.0,
        "disgust": 1.0,
        "fear": 2.0,
        "happy": 8.0,
        "sad": 4.0,
        "surprise": 3.0,
        "neutral": 80.0,
    }

    if dominant == "happy":
        base["happy"] = 75.0
        base["neutral"] = 15.0

    return dominant, base


def detect_emotion_from_image(img):
    try:
        deepface_module = importlib.import_module("deepface")
        DeepFace = deepface_module.DeepFace

        tmp_path = os.path.join(tempfile.gettempdir(), f"emotion_{tempfile.gettempprefix()}.jpg")
        cv2.imwrite(tmp_path, img)

        result = DeepFace.analyze(
            img_path=tmp_path,
            actions=["emotion"],
            enforce_detection=False,
            silent=True
        )

        os.remove(tmp_path)

        if isinstance(result, list):
            result = result[0]

        emotions = convert_to_python(result.get("emotion", {}))
        dominant = str(result.get("dominant_emotion", "neutral"))
        return dominant, emotions
    except Exception:
        return analyze_with_opencv_fallback(img)

@router.post("/detect-emotion")
async def detect_emotion(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"success": False, "error": "Invalid image"}

        dominant, emotions = detect_emotion_from_image(img)

        suggestions = {
            "happy": "Great moment! Patient seems happy — try sharing a warm memory now.",
            "sad": "Patient seems sad — play a comforting familiar song.",
            "angry": "Patient seems agitated — keep calm, avoid questions, try soft music.",
            "fear": "Patient seems anxious — hold their hand, speak softly.",
            "surprise": "Patient seems alert — good time to try a memory prompt!",
            "disgust": "Patient seems uncomfortable — change the topic gently.",
            "neutral": "Patient is calm — good time to start a conversation.",
        }

        return {
            "success": True,
            "dominant_emotion": dominant,
            "emotions": {k: round(float(v), 1) for k, v in emotions.items()},
            "suggestion": suggestions.get(dominant, "Keep the visit gentle and calm."),
            "is_positive": dominant in ["happy", "surprise", "neutral"],
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "dominant_emotion": "neutral",
            "suggestion": "Keep the visit gentle and calm.",
            "is_positive": True,
        }

@router.post("/analyze-session-emotion")
async def analyze_session(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"success": False, "error": "Invalid image"}

        dominant, emotions = detect_emotion_from_image(img)

        return {
            "success": True,
            "dominant_emotion": dominant,
            "emotions": {k: round(float(v), 1) for k, v in emotions.items()},
        }

    except Exception as e:
        return {"success": False, "error": str(e)}