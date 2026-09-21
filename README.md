🤖 AI-Powered Test Automation Engine

📌 Problem Statement

In modern software development, creating test cases and automation scripts manually is:

    1. Time-consuming
    2. Repetitive
    3. Error-prone
    4. Dependent on automation expertise
QA teams spend significant effort converting user stories into structured test cases and then into automation scripts across multiple frameworks and languages.

💡Proposed Solution

This project provides an AI-powered Test Automation Engine that:

    1. Automatically generates structured test cases from user stories
    2. Converts test cases into automation scripts
    3. Supports multiple frameworks: (Selenium, Playwright, Cypress, RestAssured)
    4. Supports multiple languages: (Python, Java, JavaScript)
    5. Automatically saves outputs into properly formatted files

The system is powered by Groq LLM for intelligent test artifact generation.



🏗️ Architecture Overview

The system consists of the following layers:

    1. Input Layer
       -Accepts user story
       -Allows framework and language selection

    2. AI Engine Layer
       -Groq API integration
       -Prompt engineering for: (Test case generation, Automation script generation)

    3. File Management Layer
       -Stores generated test cases in .txt
       -Stores generated scripts in appropriate file extensions: (.py, .java, .js)

    4. Output Layer
       -Displays generated artifacts
       -Saves files automatically


🔁 Application Flow

Step 1: Generate Test Cases

    -User enters user story
    -System sends structured prompt to Groq
    -AI generates formatted test cases
    
Step 2: Generate Automation Script

    -User selects framework
    -User selects programming language
    -System automatically reads latest test case file
    -AI generates automation script


📂 Project Structure

    Hackathon-Project/
    │
    ├── src/
    │   ├── grok_client.py
    │   ├── test_case_generator.py
    │   ├── script_generator.py
    │   ├── file_writer.py
    │   └── main.py
    │
    ├── architecture/
    │   └── architecture_diagram.png
    │
    ├── requirements.txt
    ├── .env.example
    ├── README.md
    └── .gitignore


⚙️ Setup Instructions

    1. Clone Repository
        -git clone <your-public-repo-url>
        -cd QI-Copilot

    2. Create Virtual Environment
        -python -m venv venv
       Activate:
        -Windows: (venv\Scripts\activate)
        -Mac/Linux: (source venv/bin/activate)

    3. Install Dependencies
        -pip install -r requirements.txt

    4. Configure Environment Variables
        -Create .env file from example:
            GROK_API_KEY=your_actual_api_key_here
            MODEL_NAME=llama-3.3-70b-versatile
            TEMPERATURE=0.7
            MAX_TOKENS=2000
        -Get a free API key at https://console.groq.com/keys
        -Do NOT commit .env to GitHub.


▶️ Run the Application

    Option A - Quick start (Windows PowerShell)
        -Backend:  .\run-backend.ps1
        -Frontend: .\run-frontend.ps1   (run in a second terminal)

    Option B - Manual
        -Backend (FastAPI):  cd src ; uvicorn api:app --reload --port 8000
        -Frontend (React):   cd frontend ; npm install ; npm run dev
        -Open http://localhost:3000

    CLI (no UI)
        -python src/main.py

🔌 API Endpoints

    -GET  /api/health               - service + API key status
    -POST /api/generate-test-cases  - generate test cases from a user story
    -POST /api/generate-script      - generate an automation script
    -GET  /api/test-cases           - read the latest generated test cases
    -POST /api/upload-requirements  - extract text from .txt/.md/.docx/.pdf

🛠️ Troubleshooting

    1. 500 error on "Generate Test Cases" / "Generate Script"
        -Cause: backend not running, dependencies missing, or GROK_API_KEY not set.
        -Fix: run run-backend.ps1, then open http://localhost:8000/api/health
              and confirm "api_key_configured": true.
    2. "GROK_API_KEY is not configured"
        -Add your key to .env and restart the backend.
    3. "Could not parse test cases from the response"
        -The LLM reply did not match the expected format; verify MODEL_NAME in .env.
    4. Uploaded .docx / .pdf returns an error
        -Install dependencies: pip install -r requirements.txt (pypdf, python-docx).
    5. Port already in use
        -Backend: .\run-backend.ps1 -Port 8001 (also update the Vite proxy target).

🧠 Technical Highlights

    1. Modular architecture
    2. Reusable Groq client
    3. Prompt engineering for better automation quality
    4. Dynamic framework & language support
    5. Automatic file handling
    6. Clean separation of concerns
    7. Secure environment variable handling

🔐 Security & Compliance

    1. No API keys committed
    2. .env excluded via .gitignore
    3. .env.example provided for configuration reference

🚀 Future Enhancements

    1. CI/CD Integration
    2. Integration with Jira / Azure DevOps
    3. Self Healing Locators
