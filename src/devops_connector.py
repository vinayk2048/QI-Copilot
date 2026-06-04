import base64
import requests
from urllib.parse import quote


class DevOpsConnector:
    def __init__(self, platform: str, credentials: dict):
        self.platform = platform.lower()
        self.pat = credentials.get("pat", "")
        self.org_url = credentials.get("org_url", "").rstrip("/")
        self.username = credentials.get("username", "")
        self.project = credentials.get("project", "")
        self.session = requests.Session()
        self.session.timeout = 30
        self._setup_auth()

    def _setup_auth(self):
        if self.platform == "github":
            self.session.headers["Authorization"] = f"Bearer {self.pat}"
            self.session.headers["Accept"] = "application/vnd.github+json"
            self.session.headers["X-GitHub-Api-Version"] = "2022-11-28"
            self.base_url = "https://api.github.com"

        elif self.platform == "gitlab":
            self.session.headers["PRIVATE-TOKEN"] = self.pat
            self.base_url = "https://gitlab.com/api/v4"

        elif self.platform == "azuredevops":
            token = base64.b64encode(f":{self.pat}".encode()).decode()
            self.session.headers["Authorization"] = f"Basic {token}"
            self.session.headers["Content-Type"] = "application/json"
            self.base_url = self.org_url

        elif self.platform == "bitbucket":
            self.session.auth = (self.username, self.pat)
            self.base_url = "https://api.bitbucket.org/2.0"

    def _get(self, url: str, params: dict = None) -> dict:
        resp = self.session.get(url, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    # ------------------------------------------------------------------ #
    # Connection validation
    # ------------------------------------------------------------------ #

    def validate_connection(self) -> dict:
        try:
            if self.platform == "github":
                data = self._get(f"{self.base_url}/user")
                return {"success": True, "user": data.get("login"), "platform": "github"}

            elif self.platform == "gitlab":
                data = self._get(f"{self.base_url}/user")
                return {"success": True, "user": data.get("username"), "platform": "gitlab"}

            elif self.platform == "azuredevops":
                data = self._get(f"{self.base_url}/_apis/projects", params={"api-version": "7.0"})
                projects = [p["name"] for p in data.get("value", [])]
                return {"success": True, "user": "connected", "platform": "azuredevops", "projects": projects}

            elif self.platform == "bitbucket":
                data = self._get(f"{self.base_url}/user")
                return {"success": True, "user": data.get("display_name"), "platform": "bitbucket"}

            return {"success": False, "error": f"Unknown platform: {self.platform}"}

        except requests.HTTPError as e:
            code = e.response.status_code
            if code == 401 or code == 403:
                msg = f"Auth failed ({code}): invalid or expired PAT token"
            elif code == 404:
                msg = f"Not found ({code}): check that the Organization URL is correct (e.g. https://saketatfs.visualstudio.com or https://dev.azure.com/your-org)"
            else:
                msg = f"Request failed ({code}): {e.response.text[:200]}"
            return {"success": False, "error": msg}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ------------------------------------------------------------------ #
    # Repositories
    # ------------------------------------------------------------------ #

    def list_repos(self, project: str = None) -> list:
        proj = project or self.project
        try:
            if self.platform == "github":
                data = self._get(f"{self.base_url}/user/repos",
                                 params={"per_page": 100, "sort": "updated", "affiliation": "owner,collaborator"})
                return [{"name": r["name"], "full_name": r["full_name"]} for r in data]

            elif self.platform == "gitlab":
                data = self._get(f"{self.base_url}/projects",
                                 params={"membership": True, "per_page": 50, "order_by": "last_activity_at"})
                return [{"name": r["name"], "full_name": str(r["id"]), "path": r["path_with_namespace"]} for r in data]

            elif self.platform == "azuredevops":
                data = self._get(f"{self.base_url}/{proj}/_apis/git/repositories",
                                 params={"api-version": "7.0"})
                return [{"name": r["name"], "full_name": r["id"], "project": proj} for r in data.get("value", [])]

            elif self.platform == "bitbucket":
                data = self._get(f"{self.base_url}/repositories/{self.username}",
                                 params={"pagelen": 50, "sort": "-updated_on"})
                return [{"name": r["slug"], "full_name": r["full_name"]} for r in data.get("values", [])]

        except Exception as e:
            raise Exception(f"Failed to list repos: {e}")

    # ------------------------------------------------------------------ #
    # Branches
    # ------------------------------------------------------------------ #

    def list_branches(self, repo: str, project: str = None) -> list:
        proj = project or self.project
        try:
            if self.platform == "github":
                data = self._get(f"{self.base_url}/repos/{repo}/branches", params={"per_page": 100})
                return [b["name"] for b in data]

            elif self.platform == "gitlab":
                data = self._get(f"{self.base_url}/projects/{repo}/repository/branches", params={"per_page": 100})
                return [b["name"] for b in data]

            elif self.platform == "azuredevops":
                data = self._get(f"{self.base_url}/{proj}/_apis/git/repositories/{repo}/refs",
                                 params={"filter": "heads/", "api-version": "7.0"})
                return [r["name"].replace("refs/heads/", "") for r in data.get("value", [])]

            elif self.platform == "bitbucket":
                data = self._get(f"{self.base_url}/repositories/{repo}/refs/branches",
                                 params={"pagelen": 50})
                return [b["name"] for b in data.get("values", [])]

        except Exception as e:
            raise Exception(f"Failed to list branches: {e}")

    # ------------------------------------------------------------------ #
    # Files
    # ------------------------------------------------------------------ #

    def list_files(self, repo: str, branch: str, path: str = "", project: str = None) -> list:
        proj = project or self.project
        try:
            if self.platform == "github":
                url = f"{self.base_url}/repos/{repo}/contents/{path}"
                data = self._get(url, params={"ref": branch})
                if isinstance(data, list):
                    return [{"name": f["name"], "path": f["path"], "type": f["type"]} for f in data]
                return [{"name": data["name"], "path": data["path"], "type": data["type"]}]

            elif self.platform == "gitlab":
                data = self._get(f"{self.base_url}/projects/{repo}/repository/tree",
                                 params={"ref": branch, "path": path, "per_page": 100})
                return [{"name": f["name"], "path": f["path"],
                         "type": "dir" if f["type"] == "tree" else "file"} for f in data]

            elif self.platform == "azuredevops":
                scope = f"/{path}" if path else "/"
                params = {"scopePath": scope, "recursionLevel": "OneLevel", "api-version": "7.0"}
                if branch:
                    params["versionDescriptor.version"] = branch
                    params["versionDescriptor.versionType"] = "branch"
                data = self._get(f"{self.base_url}/{proj}/_apis/git/repositories/{repo}/items",
                                 params=params)
                items = data.get("value", [])
                return [{"name": i["path"].split("/")[-1], "path": i["path"].lstrip("/"),
                         "type": "dir" if i.get("isFolder") else "file"}
                        for i in items if i["path"] not in (scope, "/")]

            elif self.platform == "bitbucket":
                url = f"{self.base_url}/repositories/{repo}/src/{branch}/{path}"
                data = self._get(url)
                return [{"name": f["path"].split("/")[-1], "path": f["path"],
                         "type": "dir" if f["type"] == "commit_directory" else "file"}
                        for f in data.get("values", [])]

        except Exception as e:
            raise Exception(f"Failed to list files: {e}")

    def get_file_content(self, repo: str, branch: str, path: str, project: str = None) -> str:
        proj = project or self.project
        try:
            if self.platform == "github":
                data = self._get(f"{self.base_url}/repos/{repo}/contents/{path}", params={"ref": branch})
                return base64.b64decode(data["content"].replace("\n", "")).decode("utf-8")

            elif self.platform == "gitlab":
                encoded = quote(path, safe="")
                resp = self.session.get(f"{self.base_url}/projects/{repo}/repository/files/{encoded}/raw",
                                        params={"ref": branch}, timeout=30)
                resp.raise_for_status()
                return resp.text

            elif self.platform == "azuredevops":
                ado_path = path if path.startswith("/") else f"/{path}"
                resp = self.session.get(f"{self.base_url}/{proj}/_apis/git/repositories/{repo}/items",
                                        params={"path": ado_path,
                                                "versionDescriptor.version": branch,
                                                "api-version": "7.0",
                                                "$format": "text"}, timeout=30)
                resp.raise_for_status()
                return resp.text

            elif self.platform == "bitbucket":
                resp = self.session.get(f"{self.base_url}/repositories/{repo}/src/{branch}/{path}", timeout=30)
                resp.raise_for_status()
                return resp.text

        except Exception as e:
            raise Exception(f"Failed to get file content: {e}")

    # ------------------------------------------------------------------ #
    # Push file
    # ------------------------------------------------------------------ #

    def push_file(self, repo: str, branch: str, path: str, content: str,
                  commit_msg: str, project: str = None) -> bool:
        proj = project or self.project
        try:
            if self.platform == "github":
                sha = None
                try:
                    existing = self._get(f"{self.base_url}/repos/{repo}/contents/{path}", params={"ref": branch})
                    sha = existing.get("sha")
                except Exception:
                    pass
                payload = {
                    "message": commit_msg,
                    "content": base64.b64encode(content.encode()).decode(),
                    "branch": branch,
                }
                if sha:
                    payload["sha"] = sha
                resp = self.session.put(f"{self.base_url}/repos/{repo}/contents/{path}",
                                        json=payload, timeout=30)
                resp.raise_for_status()
                return True

            elif self.platform == "gitlab":
                encoded = quote(path, safe="")
                try:
                    self._get(f"{self.base_url}/projects/{repo}/repository/files/{encoded}",
                              params={"ref": branch})
                    method = self.session.put
                except Exception:
                    method = self.session.post
                payload = {"branch": branch, "content": content, "commit_message": commit_msg}
                resp = method(f"{self.base_url}/projects/{repo}/repository/files/{encoded}",
                              json=payload, timeout=30)
                resp.raise_for_status()
                return True

            elif self.platform == "azuredevops":
                refs = self._get(f"{self.base_url}/{proj}/_apis/git/repositories/{repo}/refs",
                                 params={"filter": f"heads/{branch}", "api-version": "7.0"})
                old_oid = refs["value"][0]["objectId"]
                payload = {
                    "refUpdates": [{"name": f"refs/heads/{branch}", "oldObjectId": old_oid}],
                    "commits": [{
                        "comment": commit_msg,
                        "changes": [{
                            "changeType": "add",
                            "item": {"path": f"/{path}"},
                            "newContent": {"content": content, "contentType": "rawtext"}
                        }]
                    }]
                }
                resp = self.session.post(
                    f"{self.base_url}/{proj}/_apis/git/repositories/{repo}/pushes",
                    params={"api-version": "7.0"}, json=payload, timeout=30)
                resp.raise_for_status()
                return True

            elif self.platform == "bitbucket":
                resp = self.session.post(
                    f"{self.base_url}/repositories/{repo}/src",
                    data={path: content, "message": commit_msg, "branch": branch},
                    timeout=30)
                resp.raise_for_status()
                return True

        except Exception as e:
            raise Exception(f"Failed to push file: {e}")

    # ------------------------------------------------------------------ #
    # Trigger pipeline
    # ------------------------------------------------------------------ #

    def trigger_pipeline(self, repo: str, branch: str, project: str = None) -> dict:
        proj = project or self.project
        try:
            if self.platform == "github":
                resp = self.session.post(
                    f"{self.base_url}/repos/{repo}/actions/workflows/ci.yml/dispatches",
                    json={"ref": branch}, timeout=30)
                return {"success": resp.status_code == 204,
                        "message": "GitHub Actions pipeline triggered" if resp.status_code == 204
                        else f"HTTP {resp.status_code}"}

            elif self.platform == "gitlab":
                resp = self.session.post(f"{self.base_url}/projects/{repo}/pipeline",
                                         json={"ref": branch}, timeout=30)
                resp.raise_for_status()
                data = resp.json()
                return {"success": True, "pipeline_id": data.get("id"), "url": data.get("web_url")}

            elif self.platform == "azuredevops":
                pipelines = self._get(f"{self.base_url}/{proj}/_apis/pipelines",
                                      params={"api-version": "7.0"})
                if not pipelines.get("value"):
                    return {"success": False, "message": "No pipelines found in this project"}
                pipeline_id = pipelines["value"][0]["id"]
                resp = self.session.post(
                    f"{self.base_url}/{proj}/_apis/pipelines/{pipeline_id}/runs",
                    params={"api-version": "7.0"},
                    json={"resources": {"repositories": {"self": {"refName": f"refs/heads/{branch}"}}}},
                    timeout=30)
                resp.raise_for_status()
                data = resp.json()
                return {
                    "success": True,
                    "run_id": data.get("id"),
                    "url": data.get("_links", {}).get("web", {}).get("href", "")
                }

            elif self.platform == "bitbucket":
                resp = self.session.post(
                    f"{self.base_url}/repositories/{repo}/pipelines/",
                    json={"target": {"ref_type": "branch", "type": "pipeline_ref_target", "ref_name": branch}},
                    timeout=30)
                resp.raise_for_status()
                data = resp.json()
                return {"success": True, "pipeline_id": data.get("uuid")}

        except Exception as e:
            raise Exception(f"Failed to trigger pipeline: {e}")
