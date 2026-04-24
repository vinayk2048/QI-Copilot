import json
import re


class ResultParser:

    @staticmethod
    def parse(result_file: str | None, stdout: str, stderr: str) -> dict:
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

        # Grab summary line: "= 2 passed, 1 failed in 3.45s ="
        summary_match = re.search(
            r"(\d+) passed|(\d+) failed|(\d+) error", stdout
        )

        if not tests:
            # No parseable output — surface raw stderr as a single error entry
            tests = [{
                "name": "execution_error",
                "status": "error",
                "duration": 0,
                "message": stderr or stdout or "No output captured",
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
