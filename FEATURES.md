# Research Project - Features Documentation

## Overview
A comprehensive AI-powered research assistant platform that enables users to search, analyze, and generate academic research papers with integrated conversation management and real-time chat interface.

---

## 🎯 Core Features

### 1. **User Authentication & Management**
- **Clerk Integration**: Secure user authentication with OAuth support
- **User Registration**: Sign up/Sign in functionality
- **Session Management**: Persistent user sessions across the platform
- **Profile Management**: User avatar and profile information via Clerk

### 2. **Research Chat Interface**
- **Real-time Chat**: Interactive conversation interface with the AI research agent
- **Message History**: Persistent conversation storage with timestamps
- **Conversation Management**: 
  - Create new research sessions
  - View conversation history
  - Delete conversations
  - Switch between multiple conversations
- **Responsive UI**: Modern gradient design with Tailwind CSS
- **Message Features**:
  - Copy message content
  - Like/thumbs up messages
  - Tool call visualization
  - Auto-scrolling to new messages
  - Multi-line input support (Shift+Enter)

### 3. **AI Research Agent (LangGraph + Google Gemini)**
- **Advanced LLM**: Google Gemini 2.5 Pro integration
- **Conversational AI**: Context-aware responses with conversation memory
- **Multi-step Reasoning**: LangGraph workflow for complex research tasks
- **Tool Integration**: Seamless tool calling and execution
- **State Management**: Persistent conversation state with checkpointing

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
- `POST /api/research/chat` - Send messages to research agent
- `POST /api/research/chat/stream` - Streaming chat responses (SSE)
- `GET /api/research/history` - Retrieve conversation history (with optional conversationId)
- `GET /api/research/conversations` - List all user conversations with metadata
- `POST /api/research/conversations/new` - Create new conversation
- `DELETE /api/research/conversations/:conversationId` - Delete specific conversation
- `GET /api/research/papers/:filename` - Download generated PDF papers
- `GET /api/research/papers` - List all generated papers

#### 🤖 **AI Agent API (FastAPI) - Port 8000**
**Public Endpoints (No Authentication):**
- `GET /` - API status and info
- `GET /health` - Health check endpoint
- `POST /api/chat` - Process chat messages (called by Express backend)
- `GET /api/papers/download/{filename}` - Download PDF papers
- `GET /api/papers/list` - List generated papers

**Note:** FastAPI endpoints are called internally by Express backend, not directly by frontend.

### 6. **Database & Storage (Prisma + SQLite)**

#### 📊 **Data Models**
- **Users**: Clerk integration with profile data
- **Conversations**: Research session management
- **Messages**: Chat history with metadata
- **Relationships**: Proper foreign key constraints and cascading deletes

#### 🔄 **Data Features**
- **Auto-timestamps**: Created/updated tracking
- **JSON Support**: Tool calls and metadata storage
- **Migration System**: Database schema versioning
- **Connection Pooling**: Efficient database connections

### 7. **File Management & Output**
- **PDF Generation**: LaTeX compilation to PDF format
- **File Downloads**: Secure file serving with proper headers
- **Output Directories**: Organized file storage (`./output`, `./pdfs`)
- **File Listings**: API to browse generated papers

---

## 🏗 **Technical Architecture**

### **Frontend Stack**
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom gradients
- **Icons**: Lucide React for UI icons
- **Authentication**: Clerk Next.js integration
- **TypeScript**: Full type safety

### **Backend Stack**
- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Express.js with TypeScript
- **Database**: Prisma ORM with SQLite
- **Authentication**: Clerk Express middleware
- **CORS**: Cross-origin resource sharing enabled

### **AI Agent Stack**
- **Framework**: LangGraph for workflow orchestration
- **LLM**: Google Gemini 2.5 Pro
- **Tools**: Custom LangChain tools for research
- **State**: Memory-based conversation checkpointing
- **API**: FastAPI with async support

### **Development Features**
- **Hot Reload**: Development servers with auto-reload
- **Error Handling**: Comprehensive error catching and logging
- **Type Safety**: Full TypeScript implementation
- **CORS Configuration**: Proper cross-origin setup

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
- `GOOGLE_API_KEY` - Google Gemini API access
- `CLERK_SECRET_KEY` - Clerk authentication
- Database connection strings

### **External Dependencies**
- **Tectonic**: LaTeX rendering engine
- **ArXiv API**: Academic paper database
- **Google AI**: Gemini model access
- **Clerk**: Authentication service

---

## 📈 **Performance Features**
- **Streaming Responses**: Real-time chat updates
- **Connection Pooling**: Efficient database connections
- **Memory Management**: LangGraph state persistence
- **Async Processing**: Non-blocking API operations
- **Error Recovery**: Graceful failure handling

---

## 🛡 **Security Features**
- **Authentication**: Secure user sessions with Clerk
- **CORS Policy**: Controlled cross-origin access
- **Input Validation**: Request data validation
- **Error Sanitization**: Safe error message exposure
- **File Access Control**: Secured file download endpoints

---

*This documentation reflects the current state of the research project with all implemented features and capabilities.*