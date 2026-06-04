"""
Thin FastAPI wrapper around existing backend logic.
Does NOT modify any existing modules - only exposes them as REST endpoints.
"""

import sys
import os
import uuid as uuid_lib
import threading
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

# In-memory store for background test runs
_bg_runs: dict = {}

# Ensure src is on path
sys.path.insert(0, os.path.dirname(__file__))

from test_case_generator import TestCaseGenerator
from script_generator import ScriptGenerator
from file_writer import FileWriter
from devops_connector import DevOpsConnector
from repo_manager import RepoManager
from db import get_db
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


@app.post("/api/execute-tests/background")
def start_background_run(req: ExecuteRequest):
    """Start a test run in a background thread and return a run_id immediately."""
    run_id = str(uuid_lib.uuid4())[:8]
    _bg_runs[run_id] = {"status": "running", "data": None, "error": None}

    def worker():
        try:
            executor = TestExecutor()
            raw = executor.run(req.script, req.framework, req.language)
            if not raw.get("supported"):
                _bg_runs[run_id] = {"status": "error", "data": None, "error": raw.get("error", "Unsupported")}
                return
            result = ResultParser.parse(raw.get("result_file"), raw.get("stdout", ""), raw.get("stderr", ""))
            _bg_runs[run_id] = {"status": "done", "data": {**result, "run_id": run_id}, "error": None}
        except Exception as exc:
            _bg_runs[run_id] = {"status": "error", "data": None, "error": str(exc)}

    threading.Thread(target=worker, daemon=True).start()
    return {"run_id": run_id, "status": "running"}


@app.get("/api/execute-tests/{run_id}/status")
def poll_background_run(run_id: str):
    if run_id not in _bg_runs:
        raise HTTPException(status_code=404, detail="Run not found")
    return _bg_runs[run_id]


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


class ListBranchesRequest(BaseModel):
    platform: str
    pat: str
    org_url: Optional[str] = ""
    username: Optional[str] = ""
    project: Optional[str] = ""
    repo: str


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


@app.post("/api/project/list-branches")
def project_list_branches(req: ListBranchesRequest):
    try:
        connector = _make_connector(req)
        branches = connector.list_branches(req.repo, req.project or None)
        return {"branches": branches}
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


# ------------------------------------------------------------------ #
# Saved Projects — persistent credential store
# ------------------------------------------------------------------ #

class SaveProjectRequest(BaseModel):
    name: str
    platform: str
    pat: str
    org_url: Optional[str] = ""
    project: Optional[str] = ""
    username: Optional[str] = ""


@app.get("/api/saved-projects")
def list_saved_projects():
    try:
        conn = get_db()
        rows = conn.execute(
            "SELECT id, name, platform, org_url, project, username, pat, created_at "
            "FROM saved_projects ORDER BY created_at DESC"
        ).fetchall()
        conn.close()
        return {"projects": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/saved-projects")
def save_project(req: SaveProjectRequest):
    try:
        conn = get_db()
        existing = conn.execute(
            "SELECT id FROM saved_projects WHERE name = ?", (req.name,)
        ).fetchone()
        if existing:
            conn.execute(
                "UPDATE saved_projects SET platform=?, org_url=?, project=?, username=?, pat=? WHERE name=?",
                (req.platform, req.org_url or "", req.project or "", req.username or "", req.pat, req.name)
            )
        else:
            conn.execute(
                "INSERT INTO saved_projects (name, platform, org_url, project, username, pat) VALUES (?,?,?,?,?,?)",
                (req.name, req.platform, req.org_url or "", req.project or "", req.username or "", req.pat)
            )
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/saved-projects/{project_id}")
def delete_saved_project(project_id: int):
    try:
        conn = get_db()
        conn.execute("DELETE FROM saved_projects WHERE id = ?", (project_id,))
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
