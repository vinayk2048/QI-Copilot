"""
Thin FastAPI wrapper around existing backend logic.
Does NOT modify any existing modules - only exposes them as REST endpoints.
"""

import sys
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
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
        result = tc_generator.generate_test_cases(req.user_story)
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


@app.post("/api/upload-requirements")
async def upload_requirements(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode("utf-8")
        return {"content": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
