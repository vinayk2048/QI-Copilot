from grok_client import GrokClient

class ScriptGenerator:

    def __init__(self):
        self.grok = GrokClient()

    def generate_script(self, test_cases: str, framework: str, language: str, app_url: str = "") -> str:
        url_instruction = (
            f"\n        Target Application URL: {app_url}\n        Use this URL as the base URL in all tests."
            if app_url else ""
        )

        prompt = f"""
        You are an automation expert.

        Convert the following test cases into a fully runnable automation script.

        Framework: {framework}
        Language: {language}{url_instruction}

        Rules:
        - Follow best coding practices for {framework} in {language}
        - Use proper test structure with setup and teardown
        - Each test case must be its own test function named test_<snake_case_title>
        - Add brief inline comments
        - Output ONLY the code — no explanations, no markdown fences
        - For Playwright Python: use pytest-playwright fixtures (page, browser)
        - For Selenium Python: use unittest.TestCase with setUp/tearDown

        Test Cases:
        {test_cases}
        """

        return self.grok.generate_response(prompt)