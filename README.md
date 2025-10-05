# Researchy - AI Research Assistant

An intelligent research assistant that helps you discover, analyze, and create academic research papers using AI.

## Features

- 🔍 **ArXiv Search** - Search and discover research papers from ArXiv
- 📄 **PDF Analysis** - Read and extract insights from research papers
- ✍️ **Paper Generation** - Generate complete research papers in LaTeX/PDF format
- 💾 **PDF Library** - Organize and manage all your generated research papers
- 🎨 **Topic-Based Naming** - PDFs automatically named by research topic
- 👤 **Author Attribution** - Your name automatically added to generated papers
- 💬 **Conversational AI** - Natural language interface powered by Google Gemini

## Tech Stack

### Frontend
- **Next.js 15** - React framework
- **Clerk** - Authentication
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Backend
- **Express.js** - API server
- **Bun** - JavaScript runtime
- **Prisma** - ORM
- **SQLite** - Database
- **Clerk** - Authentication middleware

### AI Agent
- **FastAPI** - Python API server
- **LangGraph** - AI agent orchestration
- **Google Gemini 2.5** - LLM
- **LaTeX/Tectonic** - PDF compilation
- **Supabase** - PDF storage

## Project Structure

```
researchy/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js API server
├── agent/
│   └── ai-researcher/ # FastAPI AI agent service
└── docs/              # Documentation files
```

## Quick Start

### Prerequisites
- Node.js 18+
- Bun runtime
- Python 3.11+
- Tectonic (LaTeX compiler)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd researchy
   ```

2. **Setup Backend**
   ```bash
   cd backend
   bun install
   bunx prisma migrate dev
   bunx prisma generate
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Setup AI Agent**
   ```bash
   cd agent/ai-researcher
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Environment Variables

Create `.env` files in each directory:

**Backend** (`backend/.env`):
```env
DATABASE_URL="file:./prisma/dev.db"
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

**Frontend** (`frontend/.env`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**AI Agent** (`agent/ai-researcher/.env`):
```env
GOOGLE_API_KEY=your_google_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
BACKEND_URL=http://localhost:3001
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
bun run dev
```

**Terminal 2 - AI Agent:**
```bash
cd agent/ai-researcher
python main.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

## Features Documentation

See `docs/` folder for detailed documentation:
- `PDF_LIBRARY_FEATURE.md` - PDF Library implementation details
- `DEPLOYMENT.md` - Production deployment guide
- `NEXT_FEATURES.md` - Planned features and roadmap

## Usage

1. **Sign up / Login** using Clerk authentication
2. **Start a conversation** with the AI research assistant
3. **Ask for research papers** - e.g., "Find papers on quantum computing"
4. **Generate papers** - e.g., "Write a research paper on neural networks"
5. **Access your library** - Click "Library" button to view all generated PDFs
6. **Download & manage** - Download or delete papers from your library

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
