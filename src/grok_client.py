import os
from dotenv import load_dotenv
from groq import Groq
from groq import RateLimitError
 
load_dotenv()
 
class GrokClient:
    def __init__(self):
        self.api_key = os.getenv("GROK_API_KEY")
        self.model = os.getenv("MODEL_NAME", "openai/gpt-oss-120b")
        self.fallback_model = "openai/gpt-oss-20b"
        self.temperature = float(os.getenv("TEMPERATURE", 0.7))
        self.client = Groq(api_key=self.api_key) if self.api_key else None

    def _check_api_key(self):
        if not self.api_key:
            raise RuntimeError(
                "GROK_API_KEY is not configured. Create a .env file in the project root "
                "with GROK_API_KEY=<your key> (see .env.example), then restart the backend."
            )

    def _call_model(self, model: str, prompt: str, max_tokens: int = 2500):
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=self.temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content

    def generate_response(self, prompt: str) -> str:
        self._check_api_key()

        # Limit prompt size
        prompt = prompt[:6000]

        try:
            return self._call_model(self.model, prompt)
        except RateLimitError:
            print("Rate limit reached. Switching to fallback model...")
            return self._call_model(self.fallback_model, prompt, max_tokens=2000)
 