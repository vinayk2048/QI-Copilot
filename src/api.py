"""
Thin FastAPI wrapper around existing backend logic.
Does NOT modify any existing modules - only exposes them as REST endpoints.
"""

import sys
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

# Ensure src is on path
sys.path.insert(0, os.path.dirname(__file__))

from test_case_generator import TestCaseGenerator
from script_generator import ScriptGenerator
from file_writer import FileWriter
from devops_connector import DevOpsConnector
from repo_manager import RepoManager
from test_executor import TestExecutor
from result_parser import ResultParser

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
    app_url: Optional[str] = ""


class ExecuteRequest(BaseModel):
    script: str
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
        result = script_gen.generate_script(req.test_cases, req.framework, req.language, req.app_url or "")
        FileWriter.save_script(result, req.language)
        return {"script": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/execute-tests")
async def execute_tests(req: ExecuteRequest):
    try:
        executor = TestExecutor()
        raw = executor.run(req.script, req.framework, req.language)
        if not raw.get("supported"):
            raise HTTPException(status_code=400, detail=raw.get("error", "Unsupported language"))
        result = ResultParser.parse(raw.get("result_file"), raw.get("stdout", ""), raw.get("stderr", ""))
        return {**result, "run_id": raw["run_id"], "returncode": raw.get("returncode", -1)}
    except HTTPException:
        raise
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


# ------------------------------------------------------------------ #
# Project Setup — request models
# ------------------------------------------------------------------ #

class ConnectRequest(BaseModel):
    platform: str
    pat: str
    org_url: Optional[str] = ""
    username: Optional[str] = ""
    project: Optional[str] = ""


class ListFilesRequest(BaseModel):
    platform: str
    pat: str
    org_url: Optional[str] = ""
    username: Optional[str] = ""
    project: Optional[str] = ""
    repo: str
    branch: str
    path: Optional[str] = ""


class FetchRequirementsRequest(BaseModel):
    platform: str
    pat: str
    org_url: Optional[str] = ""
    username: Optional[str] = ""
    project: Optional[str] = ""
    repo: str
    branch: str
    paths: List[str]


class PushScriptsRequest(BaseModel):
    platform: str
    pat: str
    org_url: Optional[str] = ""
    username: Optional[str] = ""
    project: Optional[str] = ""
    repo: str
    branch: str
    scripts: List[dict]


class TriggerPipelineRequest(BaseModel):
    platform: str
    pat: str
    org_url: Optional[str] = ""
    username: Optional[str] = ""
    project: Optional[str] = ""
    repo: str
    branch: str


def _make_connector(req) -> DevOpsConnector:
    return DevOpsConnector(req.platform, {
        "pat": req.pat,
        "org_url": req.org_url,
        "username": req.username,
        "project": req.project,
    })


# ------------------------------------------------------------------ #
# Project Setup — endpoints
# ------------------------------------------------------------------ #

@app.post("/api/project/connect")
def project_connect(req: ConnectRequest):
    try:
        connector = _make_connector(req)
        result = connector.validate_connection()
        if not result["success"]:
            raise HTTPException(status_code=401, detail=result.get("error", "Connection failed"))
        repos = connector.list_repos(req.project or None)
        return {**result, "repos": repos}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/project/list-files")
def project_list_files(req: ListFilesRequest):
    try:
        connector = _make_connector(req)
        manager = RepoManager(connector)
        branches = connector.list_branches(req.repo, req.project or None)
        req_files = manager.list_requirement_files(req.repo, req.branch, req.path, req.project or None)
        test_files = manager.list_test_files(req.repo, req.branch, req.path, req.project or None)
        return {"branches": branches, "requirement_files": req_files, "test_files": test_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/project/fetch-requirements")
def project_fetch_requirements(req: FetchRequirementsRequest):
    try:
        connector = _make_connector(req)
        manager = RepoManager(connector)
        files = manager.fetch_multiple_files(req.repo, req.branch, req.paths, req.project or None)
        combined = "\n\n---\n\n".join(
            f"# {f['path']}\n\n{f['content']}" for f in files if f["success"]
        )
        return {"content": combined, "files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/project/push-scripts")
def project_push_scripts(req: PushScriptsRequest):
    try:
        connector = _make_connector(req)
        manager = RepoManager(connector)
        result = manager.push_scripts(req.repo, req.branch, req.scripts, req.project or None)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/project/trigger-pipeline")
def project_trigger_pipeline(req: TriggerPipelineRequest):
    try:
        connector = _make_connector(req)
        result = connector.trigger_pipeline(req.repo, req.branch, req.project or None)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
