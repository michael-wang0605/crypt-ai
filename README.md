name: Crypt AI
description: >
  Crypt AI is an ephemeral, privacy-first AI chatbot built with Next.js + Tailwind on the frontend
  and FastAPI on the backend. It leverages Groq’s LLaMA 3 model through a backend proxy to ensure
  no chat history, no tracking, no logging, and no user accounts — delivering a truly stateless and
  anonymous AI experience.

features:
  - Privacy-First Design: Chats are never stored, tracked, or logged.
  - Ephemeral Conversations: Sessions vanish after they end.
  - No Accounts Required: Use instantly without sign-ups.
  - Minimalist UI: Clean black-and-white interface for distraction-free chatting.
  - Backend Proxy: Shields the AI API key and enforces statelessness.
  - Groq LLaMA 3 Integration: Fast and powerful large language model responses.

project_structure: |
  crypt-ai/
  ├── backend/         # FastAPI server for API requests and proxying to Groq
  ├── frontend/        # Next.js + Tailwind UI
  └── README.md

tech_stack:
  frontend: Next.js, Tailwind CSS
  backend: FastAPI, Python
  ai_model: Groq LLaMA 3
  hosting:
    frontend: Vercel
    backend: "[Your choice]"

setup:
  steps:
    - step: Clone the repository
      command: |
        git clone https://github.com/michael-wang0605/crypt-ai.git
        cd crypt-ai

    - step: Backend setup
      commands: |
        cd backend
        python -m venv venv
        venv\Scripts\activate   # Windows
        source venv/bin/activate  # macOS/Linux
        pip install -r requirements.txt
      env_file:
        path: backend/.env
        content: |
          GROQ_API_KEY=your_groq_api_key_here
      run: uvicorn main:app --reload --port 8000

    - step: Frontend setup
      commands: |
        cd ../frontend
        npm install
        npm run dev

privacy_policy: |
  Crypt AI is designed to store zero data:
  - No user tracking
  - No persistent chat logs
  - No cookies (unless required for essential frontend functionality)

license: MIT
license_file: LICENSE

contributing: |
  Pull requests are welcome! Please open an issue first to discuss your ideas or bug reports.

contact:
  email: "[your email or contact link]"
