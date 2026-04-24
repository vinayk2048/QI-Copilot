from devops_connector import DevOpsConnector

REQUIREMENT_EXTENSIONS = {".md", ".txt", ".rst", ".docx", ".pdf", ".feature"}
TEST_EXTENSIONS = {".py", ".java", ".js", ".ts", ".spec.js", ".spec.ts"}
MAX_DEPTH = 3


class RepoManager:
    def __init__(self, connector: DevOpsConnector):
        self.connector = connector

    def list_all_files(self, repo: str, branch: str, path: str = "",
                       project: str = None, depth: int = 0) -> list:
        if depth >= MAX_DEPTH:
            return []
        items = self.connector.list_files(repo, branch, path, project)
        result = []
        for item in items:
            if item["type"] == "file":
                result.append(item)
            elif item["type"] in ("dir", "tree") and depth < MAX_DEPTH - 1:
                try:
                    children = self.list_all_files(repo, branch, item["path"], project, depth + 1)
                    result.extend(children)
                except Exception:
                    pass
        return result

    def list_requirement_files(self, repo: str, branch: str,
                               path: str = "", project: str = None) -> list:
        all_files = self.list_all_files(repo, branch, path, project)
        return [f for f in all_files
                if any(f["name"].lower().endswith(ext) for ext in REQUIREMENT_EXTENSIONS)]

    def list_test_files(self, repo: str, branch: str,
                        path: str = "", project: str = None) -> list:
        all_files = self.list_all_files(repo, branch, path, project)
        return [f for f in all_files
                if any(f["name"].lower().endswith(ext) for ext in TEST_EXTENSIONS)]

    def fetch_file_content(self, repo: str, branch: str,
                           path: str, project: str = None) -> str:
        return self.connector.get_file_content(repo, branch, path, project)

    def fetch_multiple_files(self, repo: str, branch: str,
                             paths: list, project: str = None) -> list:
        results = []
        for path in paths:
            try:
                content = self.connector.get_file_content(repo, branch, path, project)
                results.append({"path": path, "content": content, "success": True})
            except Exception as e:
                results.append({"path": path, "content": "", "success": False, "error": str(e)})
        return results

    def push_scripts(self, repo: str, branch: str,
                     scripts: list, project: str = None) -> dict:
        results = []
        for script in scripts:
            try:
                self.connector.push_file(
                    repo, branch,
                    script["path"], script["content"],
                    f"QI-CoPilot: Add generated test script — {script['path']}",
                    project
                )
                results.append({"path": script["path"], "success": True})
            except Exception as e:
                results.append({"path": script["path"], "success": False, "error": str(e)})
        return {
            "results": results,
            "pushed": sum(1 for r in results if r["success"]),
            "failed": sum(1 for r in results if not r["success"]),
        }
