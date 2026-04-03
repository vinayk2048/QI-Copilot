import os
from datetime import datetime

class FileWriter:

    @staticmethod
    def save_test_cases(content: str):
        filename = f"generated_test_cases.txt"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"\nTest cases saved to {filename}")

    @staticmethod
    def save_script(content: str, language: str):

        extension_map = {
            "python": ".py",
            "java": ".java",
            "javascript": ".js"
        }

        ext = extension_map.get(language.lower(), ".txt")

        filename = f"generated_script{ext}"

        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"\nScript saved to {filename}")

    @staticmethod
    def get_latest_test_case_file():
        files = [f for f in os.listdir() if f.startswith("generated_test_cases") and f.endswith(".txt")]

        if not files:
            return None

        latest_file = max(files, key=os.path.getctime)
        return latest_file

    @staticmethod
    def read_test_cases_from_file():
        latest_file = FileWriter.get_latest_test_case_file()

        if not latest_file:
            return None

        with open(latest_file, "r", encoding="utf-8") as f:
            return f.read()