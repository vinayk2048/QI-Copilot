from grok_client import GrokClient

class ScriptGenerator:

    def __init__(self):
        self.grok = GrokClient()

    def generate_script(self, test_cases: str, framework: str, language: str) -> str:

        prompt = f"""
        You are an automation expert.

        Convert the following test cases into an automation script.

        Framework: {framework}
        Language: {language}

        Rules:
        - Follow best coding practices
        - Use proper structure
        - Add comments
        - Only use {framework} in {language}

        Test Cases:
        {test_cases}
        """

        return self.grok.generate_response(prompt)