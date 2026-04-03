from grok_client import GrokClient

class TestCaseGenerator:

    def __init__(self):
        self.grok = GrokClient()

    def generate_test_cases(self, user_story: str) -> str:
        prompt = f"""
        You are a senior QA engineer.

        Generate detailed structured positive, negative and edge test cases for:

        {user_story}

        Format:
        - Test Case ID
        - Title
        - Preconditions
        - Test Steps
        - Expected Result
        """

        return self.grok.generate_response(prompt)