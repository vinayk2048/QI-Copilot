from grok_client import GrokClient

class ScriptGenerator:

    def __init__(self):
        self.grok = GrokClient()

    def generate_script(self, test_cases: str, framework: str, language: str, app_url: str = "") -> str:
        url_instruction = (
            f"\n        Target Application URL: {app_url}\n        Use this URL as the base URL in all tests."
            if app_url else ""
        )

        prompt = f"""You are an automation expert. Convert the test cases below into a fully runnable {framework} {language} script.
{url_instruction}
STRICT RULES:
- Output ONLY raw Python code. No markdown, no triple backticks, no explanations.
- Every test function MUST start with "test_" (required for pytest to collect it).
- For Playwright Python use pytest-playwright fixtures: def test_xxx(page):
- Each test case becomes one test function.
- Do NOT use classes — use plain functions only.
- Do NOT include if __name__ == "__main__" blocks.
- Start the file with imports, then write the test functions immediately.

Example of correct format:
import re
from playwright.sync_api import Page, expect

def test_login_valid_credentials(page: Page):
    page.goto("https://example.com/login")
    page.fill("#username", "admin")
    page.fill("#password", "secret")
    page.click("button[type=submit]")
    expect(page).to_have_url(re.compile(".*dashboard.*"))

def test_login_invalid_password(page: Page):
    page.goto("https://example.com/login")
    page.fill("#username", "admin")
    page.fill("#password", "wrong")
    page.click("button[type=submit]")
    expect(page.locator(".error-message")).to_be_visible()

Now generate the script for these test cases:
{test_cases}"""

        raw = self.grok.generate_response(prompt)
        return self._strip_fences(raw)

    @staticmethod
    def _strip_fences(code: str) -> str:
        """Remove markdown code fences the LLM adds despite instructions."""
        import re
        code = code.strip()
        # Remove opening fence: ```python or ```
        code = re.sub(r'^```[a-zA-Z]*\n?', '', code)
        # Remove closing fence
        code = re.sub(r'\n?```\s*$', '', code)
        return code.strip()