"""
Thin FastAPI wrapper around existing backend logic.
Does NOT modify any existing modules - only exposes them as REST endpoints.
"""

import sys
import os
import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Ensure src is on path
sys.path.insert(0, os.path.dirname(__file__))

from test_case_generator import TestCaseGenerator
from script_generator import ScriptGenerator
from file_writer import FileWriter

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


@app.post("/api/generate-test-cases")
def generate_test_cases(req: TestCaseRequest):
    try:
        result = tc_generator.generate_test_cases(req.user_story, req.test_type)
        FileWriter.save_test_cases(result)
        return {"test_cases": result, "confidence": 82}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-script")
def generate_script(req: ScriptRequest):
    try:
        result = script_gen.generate_script(req.test_cases, req.framework, req.language)
        FileWriter.save_script(result, req.language)
        return {"script": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/test-cases")
def get_test_cases():
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
async def upload_requirements(file: UploadFile = File(...)):
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
