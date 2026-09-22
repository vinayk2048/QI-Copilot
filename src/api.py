"""
Thin FastAPI wrapper around existing backend logic.
Does NOT modify any existing modules - only exposes them as REST endpoints.
"""

import sys
import os
import io
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

# Ensure src is on path
sys.path.insert(0, os.path.dirname(__file__))

from test_case_generator import TestCaseGenerator
from script_generator import ScriptGenerator
from file_writer import FileWriter
from auth import LoginRequest, authenticate_user, get_current_user

app = FastAPI(title="QI Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tc_generator = TestCaseGenerator()
script_gen = ScriptGenerator()


class TestCaseRequest(BaseModel):
    user_story: str
    test_type: Optional[str] = "UI"


class ScriptRequest(BaseModel):
    test_cases: str
    framework: str
    language: str


@app.post("/api/login")
def login(req: LoginRequest):
    token = authenticate_user(req.username, req.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"access_token": token, "token_type": "bearer", "username": req.username}


@app.post("/api/logout")
def logout(current_user: str = Depends(get_current_user)):
    return {"status": "ok", "username": current_user}


@app.post("/api/generate-test-cases")
def generate_test_cases(req: TestCaseRequest, current_user: str = Depends(get_current_user)):
    try:
        result = tc_generator.generate_test_cases(req.user_story, req.test_type)
        FileWriter.save_test_cases(result)
        return {"test_cases": result, "confidence": 82}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-script")
def generate_script(req: ScriptRequest, current_user: str = Depends(get_current_user)):
    try:
        result = script_gen.generate_script(req.test_cases, req.framework, req.language)
        FileWriter.save_script(result, req.language)
        return {"script": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/test-cases")
def get_test_cases(current_user: str = Depends(get_current_user)):
    content = FileWriter.read_test_cases_from_file()
    if not content:
        return {"test_cases": None}
    return {"test_cases": content}


@app.get("/api/health")
def health():
    api_key = os.getenv("GROK_API_KEY")
    return {
        "status": "ok",
        "api_key_configured": bool(api_key),
        "model": os.getenv("MODEL_NAME", "openai/gpt-oss-120b"),
    }


def extract_text_from_upload(filename: str, data: bytes) -> str:
    name = (filename or "").lower()

    if name.endswith(".pdf"):
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        text = "\n".join((page.extract_text() or "") for page in reader.pages).strip()
        if not text:
            raise ValueError("Could not extract text from the PDF (it may be scanned/image-based).")
        return text

    if name.endswith(".docx"):
        from docx import Document
        document = Document(io.BytesIO(data))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs).strip()
        if not text:
            raise ValueError("The .docx file contains no readable text.")
        return text

    if name.endswith(".doc"):
        raise ValueError("Legacy .doc files are not supported. Please save as .docx, .pdf, or .txt.")

    for encoding in ("utf-8-sig", "utf-16", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue

    raise ValueError("Unsupported or unreadable file format.")


@app.post("/api/upload-requirements")
async def upload_requirements(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
):
    try:
        content = await file.read()
        text = extract_text_from_upload(file.filename, content)
        if not text.strip():
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
        return {"content": text, "filename": file.filename}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def _frontend_dist() -> Optional[str]:
    override = os.getenv("FRONTEND_DIST")
    if override and os.path.isdir(override):
        return override

    src_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(src_dir, "..", "frontend", "dist"),
        os.path.join(os.getcwd(), "frontend", "dist"),
    ]
    for candidate in candidates:
        if os.path.isdir(candidate):
            return candidate
    return None


_frontend = _frontend_dist()
if _frontend:
    app.mount("/", StaticFiles(directory=_frontend, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
