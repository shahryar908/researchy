# Researchy - AI Research Assistant Platform

## Overview
Researchy is a comprehensive AI-powered research assistant platform that enables users to search, analyze, and generate academic research papers. Built with a modern tech stack including Next.js 15, Express.js, FastAPI, and LangGraph, it provides an intelligent conversational interface with real-time streaming capabilities, intelligent conversation management, and cloud storage integration.

### Architecture Overview
```
┌─────────────┐      ┌──────────────┐      ┌───────────────┐
│   Next.js   │─────▶│  Express.js  │─────▶│    FastAPI    │
│  Frontend   │      │   Backend    │      │   AI Agent    │
│  (Port 3000)│      │  (Port 3001) │      │  (Port 8000)  │
└─────────────┘      └──────────────┘      └───────────────┘
                            │                       │
                            ▼                       ▼
                     ┌──────────────┐      ┌───────────────┐
                     │    SQLite    │      │   Supabase    │
                     │   (Prisma)   │      │    Storage    │
                     └──────────────┘      └───────────────┘
```

---

## 🎯 Core Features

### 1. **User Authentication & Management**
- **Clerk Integration**: Secure user authentication with OAuth support
- **User Registration**: Sign up/Sign in functionality
- **Session Management**: Persistent user sessions across the platform
- **Profile Management**: User avatar and profile information via Clerk
- **Multi-user Support**: Isolated conversations per user with proper data segregation

### 2. **Advanced Streaming Chat Interface**
- **Real-time Token Streaming**: Live word-by-word response generation using Gemini's native streaming
- **Server-Sent Events (SSE)**: Standards-compliant streaming with proper buffering and chunk handling
- **ReadableStream Processing**: Frontend handles streaming data with TextDecoder for real-time display
- **Interactive UI**: Modern gradient design with streaming indicators and visual feedback
- **Conversation Continuity**: Conversations survive server restarts with persistent state
- **Intelligent Conversation Management**: 
  - Create new research sessions with AI-generated titles (like Claude)
  - View conversation history with optimized loading
  - Delete conversations with cascade cleanup
  - Switch between multiple conversations seamlessly
  - Auto-generated conversation names based on content analysis
- **Enhanced Message Features**:
  - Copy message content to clipboard
  - Like/thumbs up messages for feedback
  - Real-time tool execution visualization
  - Auto-scrolling to new messages
  - Multi-line input support (Shift+Enter)
  - Typing indicators during streaming
  - Error recovery and retry mechanisms
  - Streaming message bubbles with live content updates

### 3. **AI Research Agent (LangGraph + Google Gemini)**
- **Advanced LLM**: Google Gemini 2.5 Pro integration with streaming support
- **Conversational AI**: Context-aware responses with optimized conversation memory
- **Multi-step Reasoning**: LangGraph workflow for complex research tasks
- **Tool Integration**: Seamless tool calling and execution with real-time feedback
- **State Management**: Optimized conversation state with unique thread handling
- **Advanced State Management**:
  - Unique thread IDs to prevent LangGraph state conflicts
  - Memory-based conversation checkpointing with MemorySaver
  - Conversation state persistence across server restarts
  - Thread isolation to handle concurrent user sessions
- **Performance Optimizations**:
  - Smart conversation history truncation (last 6 messages)
  - 30-second conversation caching for faster loading
  - Optimized database queries with relationship preloading
  - Reduced API timeouts for faster responses
  - Efficient SSE buffering to handle streaming data chunks

### 4. **Research Tools & Capabilities**

#### 📚 **ArXiv Integration**
- **Paper Search**: Search recent academic papers by topic
- **Metadata Extraction**: Title, authors, summary, categories, publication dates
- **PDF Links**: Direct access to paper PDFs
- **Sorted Results**: Papers sorted by submission date (most recent first)
- **Category Filtering**: Support for various academic fields

#### 📖 **PDF Processing**
- **PDF Reading**: Extract text content from academic papers
- **Multi-page Support**: Full document text extraction
- **URL-based Access**: Read PDFs directly from web URLs
- **Text Analysis**: Process extracted content for research insights

#### 📝 **LaTeX Document Generation**
- **Paper Writing**: Generate complete research papers
- **LaTeX Rendering**: Convert LaTeX to PDF using Tectonic
- **Mathematical Equations**: Full support for mathematical notation
- **Bibliography Support**: Proper citation and reference formatting
- **Timestamped Output**: Automatic file naming with timestamps

### 5. **Backend API (Express + Prisma) - Port 3001**

#### 🌐 **Public Endpoints (No Authentication Required)**
- `GET /` - Basic server info and status

#### 🔐 **Protected Endpoints (Require Clerk Authentication)**
All endpoints below require valid Clerk session with `requireAuth` middleware:

- `GET /protected` - Test route with user data and conversation count
- `POST /api/research/chat` - Send messages to research agent (non-streaming)
- `POST /api/research/chat/stream` - **Real-time streaming chat responses** (SSE)
- `GET /api/research/history` - Retrieve conversation history (with optional conversationId)
- `GET /api/research/conversations` - List all user conversations with metadata
- `POST /api/research/conversations/new` - Create new conversation
- `DELETE /api/research/conversations/:conversationId` - Delete specific conversation
- `GET /api/research/papers/:filename` - Download generated PDF papers
- `GET /api/research/papers` - List all generated papers

#### 🔒 **Internal Endpoints (Server-to-Server)**
- `GET /internal/conversation/:conversationId/history` - Internal conversation history access

#### 🤖 **AI Agent API (FastAPI) - Port 8000**
**Public Endpoints (Internal Use Only):**
- `GET /` - API status and info
- `GET /health` - Health check endpoint
- `POST /api/chat` - Process chat messages (called by Express backend)
- `POST /api/chat/stream` - **Real-time streaming responses** with astream_events
- `POST /api/generate-title` - **Intelligent conversation title generation**
- `GET /api/papers/download/{filename}` - Download PDF papers
- `GET /api/papers/list` - List generated papers

**Advanced Features:**
- **Real-time Streaming**: Token-by-token streaming using LangGraph's astream_events
- **Intelligent Title Generation**: AI-powered conversation naming using Gemini analysis
- **Tool Execution Tracking**: Live progress updates during research tasks
- **State Persistence**: Conversation memory with unique thread management
- **Async Processing**: Non-blocking operations with FastAPI async/await

### 6. **Database & Storage (Prisma + SQLite + Supabase)**

#### 📊 **Data Models**
```prisma
User {
  id: string (cuid)
  clerkUserId: string (unique)
  email?: string
  firstName?: string
  lastName?: string
  conversations: Conversation[]
  messages: Message[]
}

Conversation {
  id: string (cuid)
  userId: string (foreign key)
  threadId: string (unique - LangGraph state)
  title?: string (auto-generated)
  messages: Message[]
}

Message {
  id: string (cuid)
  conversationId: string (foreign key)
  userId: string (foreign key)
  role: "user" | "assistant" | "system"
  content: string
  toolCalls?: JSON (tool execution data)
  metadata?: JSON
  timestamp: DateTime
}
```

#### 🔄 **Data Features**
- **Auto-timestamps**: Created/updated tracking
- **JSON Support**: Tool calls and metadata storage
- **Migration System**: Database schema versioning with Prisma
- **Connection Pooling**: Efficient database connections
- **Cascade Deletes**: Clean up related data automatically

#### ☁️ **Supabase Cloud Storage Integration**
- **Automatic Upload**: PDFs auto-uploaded to Supabase Storage after generation
- **User Buckets**: Organized storage per user (`{userId}/{filename}.pdf`)
- **Public URLs**: Shareable links for generated papers
- **Fallback Storage**: Local filesystem backup if Supabase unavailable
- **Dual Retrieval**: Download from Supabase first, fallback to local
- **Bucket Management**: Auto-creation of `researchy` bucket
- **Error Handling**: Graceful degradation with detailed logging

### 7. **File Management & PDF Download System**
- **LaTeX to PDF**: Tectonic compiler for professional paper generation
- **Timestamped Files**: `paper_YYYYMMDD_HHMMSS.pdf` naming convention
- **Dual Storage**:
  - Primary: Supabase Storage (cloud, user-specific)
  - Fallback: Local filesystem (`./output` directory)
- **Download UI**:
  - In-message download buttons with progress indicators
  - Navbar dropdown showing all available PDFs
  - One-click download with error recovery
- **PDF Detection**: Automatic extraction of PDF filenames from AI responses
- **File Listings**: API endpoints to browse all generated papers
- **Secure Serving**: Authenticated downloads with proper headers

---

## 🏗 **Technical Architecture**

### **Frontend Stack**
- **Framework**: Next.js 15.5.4 with React 19.1.0
- **Styling**: Tailwind CSS 4 with custom gradients and Lucide React icons
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Authentication**: Clerk Next.js SDK v6.33.0
- **TypeScript**: Full type safety across the application
- **Routing**: App Router with client/server components
- **State Management**: React hooks for local state

### **Backend Stack**
- **Runtime**: Bun v1.2.2 (fast JavaScript runtime)
- **Framework**: Express.js 5.1.0 with TypeScript
- **Database**: SQLite with Prisma ORM v6.16.2
- **Authentication**: Clerk Express middleware v1.7.34
- **CORS**: Configured for localhost:3000 origin
- **HTTP Client**: Axios for FastAPI communication
- **Cloud Storage**: Supabase JS Client v2.58.0

### **AI Agent Stack**
- **Orchestration**: LangGraph for stateful workflow management
- **LLM**: Google Gemini 2.5 Pro (primary) + Gemini 2.5 Flash (title generation)
- **Tools**: LangChain Core custom tools:
  - `arxiv_search` - Search academic papers
  - `read_pdf` - Extract text from PDFs
  - `render_latex_pdf` - Generate LaTeX PDFs
- **State Management**:
  - MemorySaver checkpointer for conversation persistence
  - Unique thread IDs to prevent state conflicts
- **API**: FastAPI with async/await support
- **Streaming**: SSE with astream_events for real-time responses

### **Development & DevOps**
- **Hot Reload**: All services support auto-reload
- **Error Handling**: Comprehensive try-catch with user-friendly messages
- **Type Safety**: TypeScript + Python type hints
- **Logging**: Console logging with structured debug messages
- **Process Management**: Graceful shutdown handlers (SIGTERM, SIGINT)
- **CORS**: Configured for development and production origins

---

## 🚀 **Supported Research Workflows**

1. **Topic Exploration**: Start with broad research questions
2. **Paper Discovery**: Search and find relevant academic papers
3. **Content Analysis**: Read and analyze paper contents
4. **Insight Generation**: Identify research gaps and opportunities
5. **Paper Writing**: Generate new research papers with proper formatting
6. **PDF Export**: Professional LaTeX-rendered documents

---

## 🔧 **Configuration & Environment**

### **Required Environment Variables**

**Root `.env` (Backend + AI Agent):**
```bash
# Google AI
GOOGLE_API_KEY=your_google_ai_api_key

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Express Server
PORT=3001
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

### **External Dependencies**
- **Tectonic**: LaTeX rendering engine (must be installed on system)
- **ArXiv API**: Academic paper database (public API)
- **Google Gemini API**: AI model access (API key required)
- **Clerk**: Authentication service (account required)
- **Supabase**: Cloud storage (project required, optional - falls back to local)

---

## 📈 **Performance Features**
- **Real-time Streaming**: Token-by-token response streaming with SSE
- **Conversation Caching**: 30-second cache for faster conversation loading
- **Unique Thread Management**: Prevents LangGraph state conflicts between users
- **Smart History Truncation**: Optimized memory usage with last 6 messages
- **Connection Pooling**: Efficient database connections with Prisma
- **Async Processing**: Non-blocking API operations with FastAPI
- **Error Recovery**: Graceful failure handling with retry mechanisms
- **Optimized Queries**: Database relationship preloading for faster responses
- **SSE Buffering**: Efficient streaming data chunk handling

---

## 🛡 **Security Features**
- **Authentication**: Secure user sessions with Clerk
- **CORS Policy**: Controlled cross-origin access
- **Input Validation**: Request data validation
- **Error Sanitization**: Safe error message exposure
- **File Access Control**: Secured file download endpoints

---

## 🎨 **UI/UX Highlights**

### **Chat Interface Design**
- **Welcome Screen**: Claude-style centered input with friendly prompt
- **Message Bubbles**: Distinct styling for user (orange gradient) vs AI (dark gray)
- **Markdown Rendering**:
  - Headers (##, ###)
  - Bold text (**text**)
  - Numbered lists with proper indentation
  - Bullet points with sub-bullets
  - Clickable links
- **Auto-features**:
  - Auto-scroll to latest message
  - Auto-resize textarea as user types
  - Auto-save conversation state
- **Visual Feedback**:
  - Typing indicators (animated dots)
  - Tool execution status messages
  - Loading spinners for actions
  - Success/error toast messages

### **Sidebar Navigation**
- Collapsible conversation list
- Current conversation highlighted with brand color
- Auto-generated conversation titles
- Delete button with hover effects
- "New Chat" button always accessible

### **Brand Identity**
- **Primary Color**: `#ff9a54` (vibrant orange)
- **Theme**: Dark mode (gray-900 background)
- **Accents**: Blue for links, orange for actions
- **Typography**: Clean sans-serif with proper hierarchy
- **Animations**: Smooth transitions (300ms duration)

---

## 📦 **Installation & Setup**

### **Prerequisites**
```bash
- Node.js 20+ or Bun runtime
- Python 3.10+
- Tectonic LaTeX compiler
- Git
```

### **Setup Instructions**

1. **Clone Repository**
```bash
git clone <repository-url>
cd research-project
```

2. **Install Dependencies**
```bash
# Root (Backend)
bun install

# Frontend
cd frontend
npm install

# AI Agent
cd agent/ai-researcher
pip install -r requirements.txt
```

3. **Configure Environment**
```bash
# Create .env file in root
cp .env.example .env
# Add your API keys

# Create .env.local in frontend
cp frontend/.env.example frontend/.env.local
# Add Clerk publishable key
```

4. **Setup Database**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Run Services**
```bash
# Terminal 1: Backend
bun run index.ts

# Terminal 2: AI Agent
cd agent/ai-researcher
python main.py

# Terminal 3: Frontend
cd frontend
npm run dev
```

6. **Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- AI Agent: http://localhost:8000

---

## 🧪 **Testing & Debugging**

### **API Testing**
- Backend health: `curl http://localhost:3001`
- AI Agent health: `curl http://localhost:8000/health`
- FastAPI docs: http://localhost:8000/docs

### **Debug Features**
- Comprehensive console logging in all services
- Structured debug messages with `DEBUG:` prefix
- Error stack traces in development mode
- Request/response logging for API calls

---

## 🚀 **Deployment Considerations**

### **Production Checklist**
- [ ] Switch from SQLite to PostgreSQL
- [ ] Configure production CORS origins
- [ ] Set up environment variables in hosting platform
- [ ] Configure Supabase bucket policies and RLS
- [ ] Set up monitoring and logging (e.g., Sentry)
- [ ] Implement rate limiting on API endpoints
- [ ] Add request validation middleware
- [ ] Set up CI/CD pipeline
- [ ] Configure custom domain and SSL
- [ ] Implement database backup strategy
- [ ] Use Redis for LangGraph checkpointer (instead of MemorySaver)
- [ ] Implement queue system for long-running PDF generation

---

## 📚 **Key Technologies & Libraries**

### **Frontend**
- next: 15.5.4
- react: 19.1.0
- @radix-ui/react-slot: ^1.2.3
- lucide-react: ^0.544.0
- tailwindcss: ^4

### **Backend**
- express: ^5.1.0
- @prisma/client: ^6.16.2
- @clerk/express: ^1.7.34
- @supabase/supabase-js: ^2.58.0
- axios: ^1.12.2

### **AI Agent (Python)**
- fastapi
- langgraph
- langchain-google-genai
- langchain-core
- supabase
- pydantic

---

## 🤝 **Contributing**

This is a research project showcasing modern AI agent architecture with LangGraph. Feel free to explore, modify, and extend the functionality.

---

## 📄 **License**

See LICENSE file for details.

---

**Last Updated:** October 2025
**Version:** 1.0.0
**Project Name:** Researchy - AI Research Assistant