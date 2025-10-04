from fastapi import FastAPI, UploadFile, File, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import io
import base64
from openai import OpenAI
from moviepy.editor import VideoFileClip
import tempfile
import os

client = OpenAI(api_key="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")

app = FastAPI(title="AI Accessibility Tools Backend")

# Allow CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/speech-to-text/")
async def speech_to_text(audio_file: UploadFile = File(...)):
    """
    Endpoint to convert speech audio to text.
    """
    try:
        content = await audio_file.read()
        audio_file_like = io.BytesIO(content)
        audio_file_like.name = audio_file.filename
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file_like
        )
        return {"text": transcript.text}
    except Exception as e:
        return {"text": f"Error: {str(e)}"}

@app.post("/text-to-speech/")
async def text_to_speech(request: Request):
    """
    Endpoint to convert text to speech audio.
    """
    # Mock implementation for demo
    audio_buffer = io.BytesIO(b"mock audio data for text to speech")
    return StreamingResponse(audio_buffer, media_type="audio/mpeg")

@app.post("/image-to-audio/")
async def image_to_audio(image_file: UploadFile = File(...)):
    """
    Endpoint to generate audio description from image.
    """
    # Mock implementation for demo
    audio_buffer = io.BytesIO(b"mock audio data for image description")
    return StreamingResponse(audio_buffer, media_type="audio/mpeg")

@app.post("/generate-subtitles/")
async def generate_subtitles(video_file: UploadFile = File(...)):
    """
    Endpoint to generate real-time subtitles from video.
    """
    # Mock implementation for demo
    subtitles = [
        {"start": 0, "end": 5, "text": "Mock subtitle: Hello, this is a sample subtitle."},
        {"start": 5, "end": 10, "text": "Another mock subtitle line."}
    ]
    return JSONResponse(content={"subtitles": subtitles})

@app.get("/")
async def serve_frontend():
    return FileResponse("../frontend/build/index.html")

# Serve the React frontend static files
app.mount("/static", StaticFiles(directory="../frontend/build/static"), name="static")
