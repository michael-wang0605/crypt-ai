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
├── backend/ # FastAPI server for API requests and proxying to Groq
├── frontend/ # Next.js + Tailwind UI
└── README.md


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

### 2. Backend setup

