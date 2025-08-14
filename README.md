# Crypt AI

Crypt AI is an ephemeral, privacy-first AI chatbot built with Next.js + Tailwind on the frontend and FastAPI on the backend. It leverages Groq’s LLaMA 3 model through a backend proxy to ensure no chat history, no tracking, no logging, and no user accounts — delivering a truly stateless and anonymous AI experience.

## Features
- Privacy-First Design: Chats are never stored, tracked, or logged.
- Ephemeral Conversations: Sessions vanish after they end.
- No Accounts Required: Use instantly without sign-ups.
- Minimalist UI: Clean black-and-white interface for distraction-free chatting.
- Backend Proxy: Shields the AI API key and enforces statelessness.
- Groq LLaMA 3 Integration: Fast and powerful large language model responses.

## Project Structure
crypt-ai/
- backend/ # FastAPI server for API requests and proxying to Groq
- frontend/ # Next.js + Tailwind UI
- README.md


## Tech Stack
- Frontend: Next.js, Tailwind CSS
- Backend: FastAPI, Python
- AI Model: Groq LLaMA 3
- Hosting:
  - Frontend: Vercel
  - Backend: Your choice

## Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/michael-wang0605/crypt-ai.git
cd crypt-ai
```
### 2. Backend setup
```cd backend
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```
Create a .env file in /backend:
```GROQ_API_KEY=your_groq_api_key_here```

Run the backend:
```uvicorn main:app --reload --port 8000```

### 3. Frontend setup
```
cd ../frontend
npm install
npm run dev
```

### Privacy Policy
Crypt AI is designed to store zero data:

- No user tracking
- No persistent chat logs
- No cookies (unless required for essential frontend functionality

### License
MIT License – see LICENSE for details.

### Contributing
Pull requests are welcome! Please open an issue first to discuss your ideas or bug reports.

### Contact
For questions or suggestions: [mwang0605@gmail.com]



