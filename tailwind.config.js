from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import uuid
from typing import List

app = FastAPI(title="Anilo Storage API")

# CORS sozlamalari
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR = "films"
if not os.path.exists(STORAGE_DIR):
    os.makedirs(STORAGE_DIR)

app.mount("/films", StaticFiles(directory=STORAGE_DIR), name="films")

@app.get("/")
async def root():
    return {"status": "ok", "message": "Anilo Storage Server is running"}

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    if not file.filename.endswith((".mp4", ".mkv", ".mov")):
        raise HTTPException(status_code=400, detail="Faqat video fayllar ruxsat etiladi")
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(STORAGE_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {
        "url": f"https://api.anilo.uz/films/{unique_filename}",
        "filename": unique_filename
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
