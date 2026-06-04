from grok_client import GrokClient

class TestCaseGenerator:

    def __init__(self):
        self.grok = GrokClient()

    def generate_test_cases(self, user_story: str) -> str:
        prompt = f"""You are a senior QA engineer. Generate detailed test cases for the requirement below.

REQUIREMENT:
{user_story}

Generate 5-8 test cases covering positive, negative, and edge cases.
Use EXACTLY this format — do not add extra headings, markdown, or commentary:

Test Case ID: TC-001
Title: Verify successful login with valid credentials
Preconditions: User account exists and is active
Test Steps:
1. Navigate to the login page
2. Enter valid username and password
3. Click the Login button
Expected Result: User is redirected to the dashboard
Priority: High

---

Test Case ID: TC-002
Title: Verify login fails with invalid password
Preconditions: User account exists
Test Steps:
1. Navigate to the login page
2. Enter valid username and incorrect password
3. Click the Login button
Expected Result: Error message is displayed, user remains on login page
Priority: High

---

Continue this exact pattern for all test cases. Always separate with ---. Always use TC-001, TC-002 etc as IDs."""

        return self.grok.generate_response(prompt)