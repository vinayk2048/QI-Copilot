from grok_client import GrokClient

class TestCaseGenerator:

    def __init__(self):
        self.grok = GrokClient()

    def generate_test_cases(self, user_story: str, test_type: str = "UI") -> str:
        prompt = f"""
        You are a senior QA engineer.

        Generate detailed structured positive, negative and edge test cases for the
        following {test_type} requirement:

        {user_story}

        Return ONLY the test cases, one after another, using EXACTLY this plain-text
        format. Do NOT use markdown tables and do NOT wrap the output in code fences:

        Test Case ID: TC-001
        Title: <short title>
        Preconditions: <preconditions>
        Test Steps:
        1. <step>
        2. <step>
        Expected Result: <expected result>
        Priority: High

        Test Case ID: TC-002
        Title: <short title>
        Preconditions: <preconditions>
        Test Steps:
        1. <step>
        Expected Result: <expected result>
        Priority: Medium

        Rules:
        - Start every test case with "Test Case ID:" followed by a unique ID (TC-001, TC-002, ...).
        - Every test case MUST include Title, Preconditions, Test Steps, Expected Result and Priority.
        - Priority must be exactly one of: High, Medium, Low.
        """

        return self.grok.generate_response(prompt)
