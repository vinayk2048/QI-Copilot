import json
import re
from typing import Optional


class ResultParser:

    @staticmethod
    def parse(result_file: Optional[str], stdout: str, stderr: str) -> dict:
        if result_file:
            try:
                with open(result_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return ResultParser._from_json_report(data)
            except Exception:
                pass

        # Fallback: parse pytest stdout
        return ResultParser._from_stdout(stdout, stderr)

    @staticmethod
    def _from_json_report(data: dict) -> dict:
        tests = []
        for t in data.get("tests", []):
            # Clean up node id for display: strip file path prefix
            name = t.get("nodeid", "unknown")
            name = re.sub(r"^.*::", "", name)  # keep only function name

            outcome = t.get("outcome", "unknown")  # passed | failed | error | skipped
            duration = round(t.get("duration", 0), 3)

            # Extract failure message
            message = ""
            call = t.get("call", {})
            if call.get("longrepr"):
                longrepr = call["longrepr"]
                # Truncate very long tracebacks
                if isinstance(longrepr, str) and len(longrepr) > 800:
                    longrepr = longrepr[-800:]
                message = longrepr
            elif t.get("setup", {}).get("longrepr"):
                message = t["setup"]["longrepr"]

            tests.append({
                "name": name,
                "status": outcome,
                "duration": duration,
                "message": message,
            })

        summary = data.get("summary", {})
        return {
            "tests": tests,
            "summary": {
                "passed": summary.get("passed", 0),
                "failed": summary.get("failed", 0),
                "error": summary.get("error", 0),
                "skipped": summary.get("skipped", 0),
                "total": summary.get("total", len(tests)),
                "duration": round(data.get("duration", 0), 2),
            },
        }

    @staticmethod
    def _from_stdout(stdout: str, stderr: str) -> dict:
        tests = []
        passed = failed = error = 0
        combined = stdout + "\n" + stderr

        # Match pytest verbose lines: "test_name PASSED" / "test_name FAILED"
        for line in stdout.splitlines():
            m = re.match(r"\s*(test_\S+)\s+(PASSED|FAILED|ERROR|SKIPPED)", line)
            if m:
                name, status = m.group(1), m.group(2).lower()
                tests.append({"name": name, "status": status, "duration": 0, "message": ""})
                if status == "passed":
                    passed += 1
                elif status == "failed":
                    failed += 1
                elif status == "error":
                    error += 1

        if not tests:
            # Check for collection errors (syntax error, import error, no tests found)
            if "SyntaxError" in combined or "ModuleNotFoundError" in combined or "ImportError" in combined:
                msg = next(
                    (l for l in combined.splitlines() if any(k in l for k in ["SyntaxError", "ModuleNotFoundError", "ImportError", "Error"])),
                    "Script has a syntax or import error — check the generated code."
                )
                tests = [{"name": "collection_error", "status": "error", "duration": 0, "message": msg}]
                error = 1
            elif "no tests ran" in combined or "collected 0 items" in combined:
                # Pytest collected 0 tests — likely test functions not named test_*
                tests = [{
                    "name": "no_tests_collected",
                    "status": "error",
                    "duration": 0,
                    "message": (
                        "Pytest collected 0 test functions. "
                        "The generated script may not have functions starting with 'test_'. "
                        "Regenerate the script — the prompt will now enforce correct naming."
                    ),
                }]
                error = 1
            else:
                # Generic fallback — surface raw output
                tests = [{
                    "name": "execution_error",
                    "status": "error",
                    "duration": 0,
                    "message": (stderr or stdout or "No output captured")[:1000],
                }]
                error = 1

        return {
            "tests": tests,
            "summary": {
                "passed": passed,
                "failed": failed,
                "error": error,
                "skipped": 0,
                "total": len(tests),
                "duration": 0,
            },
        }
