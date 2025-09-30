# Research Project - Features Documentation

## Overview
A comprehensive AI-powered research assistant platform that enables users to search, analyze, and generate academic research papers with advanced streaming capabilities, intelligent conversation management, and enterprise-ready performance.

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

*This documentation reflects the current state of the research project with all implemented features and capabilities.*