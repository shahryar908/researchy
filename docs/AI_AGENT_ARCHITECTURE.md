# AI Agent Architecture Guide

## Overview

This document explains how the AI agents work in the Researchy application and provides guidance on improving agent handling, error management, and performance.

---

## How AI Agents Work

### Architecture Overview

```
┌─────────────────┐
│   Frontend      │  User sends message
│   (Next.js)     │
└────────┬────────┘
         │ POST /api/chat (SSE)
         ▼
┌─────────────────┐
│   Backend       │  Forwards to AI agent
│   (Express.js)  │
└────────┬────────┘
         │ POST /chat (SSE)
         ▼
┌─────────────────┐
│   AI Agent      │  LangGraph orchestration
│   (FastAPI)     │
└─────────────────┘
```

### Component Breakdown

#### 1. **LangGraph State Machine**

Located in: `agent/ai-researcher/main.py`

The AI agent uses LangGraph to create a stateful conversation graph with the following components:

**State Definition:**
```python
class State(TypedDict):
    messages: Annotated[list, add_messages]  # Conversation history
    user_id: str                              # Clerk user ID
    user_name: str                            # User's actual name
```

**Graph Structure:**
```
START → agent_node → should_continue → tools_node → agent_node → END
                            │
                            └─────────────────────────┘
```

**Flow:**
1. **agent_node**: AI model processes messages and decides actions
2. **should_continue**: Conditional edge checks if tools are needed
3. **tools_node**: Executes requested tools (search, PDF generation, etc.)
4. Loop continues until AI responds without tool calls

---

#### 2. **Available Tools**

The agent has access to specialized tools bound to the LangGraph workflow:

| Tool | Purpose | File |
|------|---------|------|
| `search_arxiv` | Search academic papers on arXiv | `arxiv_tool.py` |
| `read_pdf_from_url` | Extract text from PDF URLs | `read_pdf.py` |
| `render_latex_pdf` | Generate PDF from LaTeX, upload to Supabase | `write_pdf.py` |

**Tool Binding:**
```python
llm_with_tools = llm.bind_tools([search_arxiv, read_pdf_from_url, render_latex_pdf])
```

---

#### 3. **Custom Tool Node with Context Injection**

The `custom_tool_node` function intercepts tool calls and injects contextual data:

```python
def custom_tool_node(state: State):
    user_id = state.get("user_id")
    user_name = state.get("user_name")

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"].copy()

        # Inject user context for PDF generation
        if tool_name == "render_latex_pdf":
            if user_id and "user_id" not in tool_args:
                tool_args["user_id"] = user_id
            if user_name and "user_name" not in tool_args:
                tool_args["user_name"] = user_name

        # Execute tool with enriched context
        result = tool.invoke(tool_args)
```

**Why This Matters:**
- Tools get automatic access to user context without AI having to explicitly pass it
- Ensures PDFs are associated with correct users
- Maintains security by controlling what data tools can access

---

#### 4. **System Prompt Engineering**

Located in: `agent/ai-researcher/main.py` (INITIAL_PROMPT)

The system prompt dynamically includes user context:

```python
user_context = f"\n\n**CURRENT USER INFORMATION:**\n- User Name: {request.user_name or 'User'}\n- When generating LaTeX PDFs, use \\author{{{request.user_name or 'User'}}} to credit this user."

system_prompt_with_context = INITIAL_PROMPT + user_context
```

**Key Instructions in Prompt:**
- Generate comprehensive research papers (3000+ words)
- Use LaTeX for academic formatting
- Cite sources from arXiv searches
- Include user name as author
- Provide paper download links

---

#### 5. **Server-Sent Events (SSE) Streaming**

The agent streams responses in real-time using SSE:

```python
async def chat(request: ChatRequest):
    async def event_generator():
        config = {"configurable": {"thread_id": request.conversation_id}}

        async for event in graph.astream_events(inputs, config=config, version="v2"):
            if event["event"] == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    yield f"data: {json.dumps({'content': chunk.content})}\n\n"
```

**Flow:**
1. Frontend opens SSE connection to backend
2. Backend opens SSE connection to AI agent
3. AI agent streams tokens as they're generated
4. Backend forwards stream to frontend
5. Frontend renders chunks in real-time

---

## How to Improve Agent Handling

### 1. **Error Handling & Resilience**

#### Current Gaps:
- Limited error handling in tool execution
- No retry logic for failed API calls
- Tool failures may crash conversation flow

#### Improvements:

**a) Add Try-Catch to Tools**

```python
# In write_pdf.py
@tool
def render_latex_pdf(latex_content: str, topic: Optional[str] = None, user_id: Optional[str] = None, user_name: Optional[str] = None) -> str:
    """Render LaTeX to PDF with error handling."""
    try:
        # Validate inputs
        if not latex_content or len(latex_content.strip()) == 0:
            return "Error: LaTeX content is empty. Please provide valid LaTeX code."

        # Existing PDF generation logic...

    except subprocess.CalledProcessError as e:
        return f"LaTeX compilation failed: {e.stderr}. Please check your LaTeX syntax."
    except requests.RequestException as e:
        return f"Failed to upload PDF to Supabase: {str(e)}. The PDF was generated but not uploaded."
    except Exception as e:
        logger.error(f"Unexpected error in render_latex_pdf: {e}")
        return f"Unexpected error during PDF generation: {str(e)}"
```

**b) Add Retry Logic for Network Calls**

```python
# In arxiv_tool.py
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def search_arxiv_with_retry(query: str, max_results: int = 10):
    """Search arXiv with automatic retries on failure."""
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance
    )
    return list(search.results())

@tool
def search_arxiv(query: str, max_results: int = 10) -> str:
    """Search academic papers on arXiv with retry logic."""
    try:
        results = search_arxiv_with_retry(query, max_results)
        # Process results...
    except Exception as e:
        return f"ArXiv search failed after 3 retries: {str(e)}"
```

---

### 2. **State Management & Conversation Memory**

#### Current Implementation:
- Uses LangGraph's built-in memory with thread_id
- Memory persists only in current session (MemorySaver)

#### Improvements:

**a) Add Persistent Checkpointing**

```python
# Instead of MemorySaver, use SQLite for persistence
from langgraph.checkpoint.sqlite import SqliteSaver

# In main.py
checkpoint_db = SqliteSaver.from_conn_string("checkpoints.db")

graph = workflow.compile(checkpointer=checkpoint_db)
```

**Benefits:**
- Conversations persist across server restarts
- Can resume interrupted research sessions
- Better debugging (inspect historical states)

**b) Implement Conversation Summarization**

```python
# Add a summarization node for long conversations
async def summarize_node(state: State):
    """Summarize conversation when it gets too long."""
    messages = state["messages"]

    if len(messages) > 20:  # Threshold
        summary_prompt = f"Summarize this research conversation:\n{messages}"
        summary = await llm.ainvoke(summary_prompt)

        # Replace old messages with summary
        return {
            "messages": [
                SystemMessage(content=f"Previous conversation summary: {summary}"),
                *messages[-5:]  # Keep last 5 messages
            ]
        }

    return state
```

---

### 3. **Tool Validation & Safety**

#### Current Gaps:
- No validation of LaTeX content before compilation
- Tools accept any user_id without verification
- Large PDFs could cause memory issues

#### Improvements:

**a) Input Validation**

```python
# In write_pdf.py
import re

def validate_latex(latex_content: str) -> tuple[bool, str]:
    """Validate LaTeX content for safety and correctness."""

    # Check for dangerous commands
    dangerous_patterns = [
        r'\\input{', r'\\include{', r'\\write18',
        r'\\immediate\\write18', r'\\openin', r'\\openout'
    ]

    for pattern in dangerous_patterns:
        if re.search(pattern, latex_content):
            return False, f"Dangerous LaTeX command detected: {pattern}"

    # Check for required document structure
    if '\\documentclass' not in latex_content:
        return False, "Missing \\documentclass declaration"

    if '\\begin{document}' not in latex_content or '\\end{document}' not in latex_content:
        return False, "Missing document environment"

    # Check size (prevent abuse)
    if len(latex_content) > 500000:  # 500KB limit
        return False, "LaTeX content too large (max 500KB)"

    return True, "Valid"

@tool
def render_latex_pdf(latex_content: str, topic: Optional[str] = None, user_id: Optional[str] = None, user_name: Optional[str] = None) -> str:
    # Validate before processing
    is_valid, message = validate_latex(latex_content)
    if not is_valid:
        return f"Invalid LaTeX: {message}"

    # Continue with PDF generation...
```

**b) User Verification Middleware**

```python
# In main.py
async def verify_user_middleware(state: State) -> State:
    """Verify user_id exists in database before processing."""
    user_id = state.get("user_id")

    if not user_id:
        raise ValueError("Missing user_id in state")

    # Call backend to verify user exists
    response = requests.get(
        f"{BACKEND_URL}/api/verify-user",
        headers={"x-user-id": user_id, "x-internal-request": "true"}
    )

    if response.status_code != 200:
        raise ValueError(f"Invalid user_id: {user_id}")

    return state
```

---

### 4. **Performance Optimization**

#### a) Parallel Tool Execution

Currently tools execute sequentially. Enable parallel execution:

```python
# In custom_tool_node
import asyncio

async def custom_tool_node_parallel(state: State):
    """Execute multiple tools in parallel when possible."""
    last_message = state["messages"][-1]

    if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
        return state

    # Group independent tools
    async def execute_tool(tool_call):
        tool = tools_by_name[tool_call["name"]]
        return await tool.ainvoke(tool_call["args"])

    # Execute all tools in parallel
    results = await asyncio.gather(*[
        execute_tool(tc) for tc in last_message.tool_calls
    ])

    # Create tool messages
    tool_messages = [
        ToolMessage(content=str(result), tool_call_id=tc["id"])
        for result, tc in zip(results, last_message.tool_calls)
    ]

    return {"messages": tool_messages}
```

#### b) Caching for Repeated Searches

```python
# In arxiv_tool.py
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def cached_arxiv_search(query_hash: str, max_results: int):
    """Cached arXiv search to avoid duplicate API calls."""
    # Actual search logic
    pass

@tool
def search_arxiv(query: str, max_results: int = 10) -> str:
    # Create cache key
    query_hash = hashlib.md5(query.encode()).hexdigest()

    try:
        results = cached_arxiv_search(query_hash, max_results)
        # Format results...
    except Exception as e:
        return f"Search failed: {e}"
```

---

### 5. **Observability & Debugging**

#### a) Structured Logging

```python
# Add to main.py
import logging
import json
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def log_agent_event(event_type: str, data: dict):
    """Structured logging for agent events."""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event": event_type,
        "data": data
    }
    logger.info(json.dumps(log_entry))

# Usage in agent_node
async def agent_node(state: State):
    log_agent_event("agent_invoked", {
        "user_id": state.get("user_id"),
        "message_count": len(state["messages"]),
        "thread_id": state.get("thread_id")
    })

    result = await llm_with_tools.ainvoke(state["messages"])

    log_agent_event("agent_response", {
        "has_tool_calls": bool(result.tool_calls),
        "tool_count": len(result.tool_calls) if result.tool_calls else 0
    })

    return {"messages": [result]}
```

#### b) Performance Metrics

```python
# Add timing decorators
import time
from functools import wraps

def measure_time(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        duration = time.time() - start

        log_agent_event("performance", {
            "function": func.__name__,
            "duration_seconds": duration
        })

        return result
    return wrapper

@measure_time
async def agent_node(state: State):
    # Existing logic...
    pass
```

---

### 6. **Advanced Agent Patterns**

#### a) Multi-Agent Collaboration

Create specialized sub-agents for different tasks:

```python
# Create separate agents
literature_review_agent = create_react_agent(llm, [search_arxiv, read_pdf_from_url])
writing_agent = create_react_agent(llm, [render_latex_pdf])
critic_agent = create_react_agent(llm, [])  # Only reviews, no tools

class MultiAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    current_agent: str
    review_feedback: Optional[str]

def route_to_agent(state: MultiAgentState):
    """Route to appropriate specialized agent."""
    last_message = state["messages"][-1].content.lower()

    if "search" in last_message or "find papers" in last_message:
        return "literature_review"
    elif "write" in last_message or "generate pdf" in last_message:
        return "writing"
    elif "review" in last_message:
        return "critic"
    else:
        return "general"

# Build multi-agent workflow
workflow = StateGraph(MultiAgentState)
workflow.add_node("literature_review", literature_review_agent)
workflow.add_node("writing", writing_agent)
workflow.add_node("critic", critic_agent)
workflow.add_conditional_edges("START", route_to_agent)
```

#### b) Human-in-the-Loop Approval

```python
class ApprovalState(TypedDict):
    messages: Annotated[list, add_messages]
    pending_approval: Optional[dict]
    approved: bool

async def request_approval_node(state: ApprovalState):
    """Request human approval before executing sensitive actions."""
    last_message = state["messages"][-1]

    if hasattr(last_message, 'tool_calls'):
        for tool_call in last_message.tool_calls:
            if tool_call["name"] == "render_latex_pdf":
                # Store pending action
                return {
                    "pending_approval": tool_call,
                    "approved": False
                }

    return state

def should_wait_for_approval(state: ApprovalState):
    """Check if waiting for approval."""
    if state.get("pending_approval") and not state.get("approved"):
        return "wait"
    return "continue"

# Add to workflow
workflow.add_node("approval_check", request_approval_node)
workflow.add_conditional_edges("approval_check", should_wait_for_approval)
```

---

## Best Practices Summary

### ✅ Do's

1. **Always validate tool inputs** before execution
2. **Log all agent decisions** for debugging and auditing
3. **Use structured error messages** that the AI can understand and act on
4. **Implement retry logic** for network-dependent operations
5. **Cache expensive operations** (API calls, PDF processing)
6. **Set timeouts** for long-running operations
7. **Provide clear feedback** to users during long operations
8. **Version your prompts** (track changes in system prompts)

### ❌ Don'ts

1. **Don't trust user input** - always validate and sanitize
2. **Don't expose internal errors** to end users (log them instead)
3. **Don't execute tools without context** (user_id, permissions)
4. **Don't store sensitive data** in conversation state
5. **Don't make tools too powerful** - prefer small, focused tools
6. **Don't skip error handling** - every tool should gracefully fail
7. **Don't ignore rate limits** - implement backoff strategies

---

## Monitoring & Maintenance

### Key Metrics to Track

1. **Agent Performance:**
   - Average response time
   - Tool invocation frequency
   - Success/failure rates per tool
   - Token usage per conversation

2. **User Experience:**
   - Conversation completion rate
   - PDF generation success rate
   - Average research session duration
   - User satisfaction (explicit feedback)

3. **System Health:**
   - API rate limit hits
   - Memory usage trends
   - Error frequency by type
   - Queue depth (if using background workers)

### Logging Examples

```python
# Add to agent startup
log_agent_event("agent_started", {
    "model": "gemini-2.0-flash-exp",
    "tools": ["search_arxiv", "read_pdf_from_url", "render_latex_pdf"],
    "version": "1.0.0"
})

# Add to each tool
log_agent_event("tool_invoked", {
    "tool": "render_latex_pdf",
    "user_id": user_id,
    "topic": topic,
    "success": True,
    "duration_ms": duration
})
```

---

## Future Enhancements

### 1. **RAG (Retrieval-Augmented Generation)**
- Store previously generated research papers in vector database
- Retrieve relevant past research for context
- Reduce duplicate research efforts

### 2. **Streaming Tool Results**
- Stream partial results from long-running tools
- Show "Searching arXiv... found 3 papers so far"
- Improve perceived performance

### 3. **Cost Optimization**
- Switch to smaller models for simple tasks
- Implement prompt caching (supported by Gemini)
- Batch similar tool calls

### 4. **Advanced Error Recovery**
- Automatic retry with prompt adjustments
- Fallback to alternative tools
- Self-healing workflows

### 5. **User Preferences**
- Customizable citation styles
- Preferred paper length
- Research depth settings
- Favorite research areas for better suggestions

---

## Conclusion

The AI agent system is built on a solid foundation with LangGraph orchestration, specialized tools, and streaming responses. By implementing the improvements outlined above—especially error handling, validation, and observability—you can create a more robust, reliable, and user-friendly research assistant.

Focus on incremental improvements, starting with error handling and logging, then move to performance optimizations and advanced patterns as needed.
