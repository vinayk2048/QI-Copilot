import os
from dotenv import load_dotenv
from groq import Groq
from groq import RateLimitError
 
load_dotenv()
 
class GrokClient:
    def __init__(self):
        self.api_key = os.getenv("GROK_API_KEY")
        self.model = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")
        self.fallback_model = "llama-3.1-8b-instant"
        self.temperature = float(os.getenv("TEMPERATURE", 0.7))
 
        if not self.api_key:
            raise ValueError("GROK_API_KEY not found in environment variables.")
 
        self.client = Groq(api_key=self.api_key)
 
    def generate_response(self, prompt: str) -> str:
 
        # Limit prompt size (IMPORTANT FIX)
        prompt = prompt[:6000]
 
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=2500
            )
 
            return response.choices[0].message.content
 
        except RateLimitError:
            print("Rate limit reached. Switching to fallback model...")
 
            response = self.client.chat.completions.create(
                model=self.fallback_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=2000
            )
 
            return response.choices[0].message.content
 
        except Exception as e:
            print("Error occurred:", str(e))
            return f"Error generating response: {str(e)}"
 