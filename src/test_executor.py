import os
import sys
import subprocess
import tempfile
import uuid


class TestExecutor:
    # No hard timeout — let tests run until completion.
    # The HTTP API has its own long timeout and background mode handles async runs.
    TIMEOUT = None

    def run(self, script: str, framework: str = "Playwright", language: str = "Python") -> dict:
        run_id = str(uuid.uuid4())[:8]
        tmp_dir = tempfile.mkdtemp(prefix=f"qi_{run_id}_")

        ext = {"Python": "py", "Java": "java", "JavaScript": "js"}.get(language, "py")
        script_path = os.path.join(tmp_dir, f"test_generated.{ext}")
        result_path = os.path.join(tmp_dir, "results.json")

        with open(script_path, "w", encoding="utf-8") as f:
            f.write(script)

        if language == "Python":
            cmd = self._python_command(script_path, result_path, framework)
        elif language == "JavaScript":
            cmd = self._js_command(script_path, tmp_dir)
        else:
            return {
                "run_id": run_id,
                "supported": False,
                "error": f"{language} execution not yet supported. Use Python (Playwright) for now.",
                "results": [],
            }

        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.TIMEOUT,  # None = wait forever
                cwd=tmp_dir,
            )
            return {
                "run_id": run_id,
                "supported": True,
                "returncode": proc.returncode,
                "stdout": proc.stdout,
                "stderr": proc.stderr,
                "result_file": result_path if os.path.exists(result_path) else None,
                "tmp_dir": tmp_dir,
            }
        except FileNotFoundError as e:
            return {
                "run_id": run_id,
                "supported": True,
                "returncode": -1,
                "stdout": "",
                "stderr": f"Command not found: {e}. Make sure pytest and playwright are installed.",
                "result_file": None,
                "tmp_dir": tmp_dir,
            }

    def _python_command(self, script_path: str, result_path: str, framework: str = "Playwright") -> list:
        tmp_dir = os.path.dirname(script_path)
        cmd = [
            sys.executable, "-m", "pytest", script_path,
            "--json-report",
            f"--json-report-file={result_path}",
            f"--rootdir={tmp_dir}",    # stop pytest scanning the project src/
            "--import-mode=importlib", # avoid import collisions
            "-v",
            "--tb=short",
            "--no-header",
            "-p", "no:cacheprovider",
        ]

        # pytest-playwright requires --browser so the page/browser fixtures are injected.
        # Without it, playwright tests collect 0 items.
        if "playwright" in framework.lower():
            cmd += ["--browser=chromium"]

        return cmd

    def _js_command(self, script_path: str, tmp_dir: str) -> list:
        return ["npx", "playwright", "test", script_path, "--reporter=json"]
