# LangGraph Agent Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [State Management](#state-management)
4. [Nodes Deep Dive](#nodes-deep-dive)
5. [Edges and Flow Control](#edges-and-flow-control)
6. [Tools Integration](#tools-integration)
7. [Execution Flow](#execution-flow)
8. [Memory and Persistence](#memory-and-persistence)

---

## Overview

This research agent is built using **LangGraph**, a framework for building stateful, multi-agent applications with LLMs. The agent orchestrates a research workflow that can:
- Search academic papers on arXiv
- Read and extract PDF content
- Generate LaTeX research papers
- Maintain conversation history with memory

### Architecture Diagram
```
┌──────────────────────────────────────────────────────────┐
│                    User Request                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│                  START Node                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │    Agent Node         │
         │  (call_model)         │
         │  - LLM reasoning      │
         │  - Tool selection     │
         └───────┬───────────────┘
                 │
                 ▼
         [should_continue?]
                 │
         ┌───────┴───────┐
         │               │
    "tools"          "__end__"
         │               │
         ▼               ▼
┌─────────────────┐   ┌─────────┐
│  Tools Node     │   │   END   │
│  - arxiv_search │   └─────────┘
│  - read_pdf     │
│  - render_pdf   │
└────────┬────────┘
         │
         │ (Loop back)
         ▼
   [Agent Node]
```

---

## Core Concepts

### 1. **StateGraph**
LangGraph uses a `StateGraph` to define the agent's behavior as a directed graph where:
- **Nodes** = Functions that process state
- **Edges** = Transitions between nodes
- **State** = Shared data structure passed between nodes

```python
# Location: main.py:147
workflow = StateGraph(State)
```

### 2. **State Schema**
The state is defined using TypedDict with special annotations:

```python
# Location: main.py:43-46
class State(TypedDict):
    messages: Annotated[list, add_messages]  # Special reducer for message history
    user_id: str                             # User context
    user_name: str                           # For PDF authorship
```

**Key Points:**
- `Annotated[list, add_messages]` is a **reducer** that automatically merges new messages with existing ones
- State is **immutable** - nodes return updates, not modifications
- State flows through the entire graph

---

## State Management

### How State Works

#### 1. **State Initialization**
```python
# Location: main.py:435
input_data = {
    "messages": messages,      # Conversation history
    "user_id": request.user_id,
    "user_name": request.user_name or "User"
}
```

#### 2. **State Updates**
Nodes return **partial state updates** (deltas):

```python
# Location: main.py:125-129
def call_model(state: State) -> Dict[str, List[BaseMessage]]:
    messages = state["messages"]
    response = model.invoke(messages)
    return {"messages": [response]}  # Delta update
```

#### 3. **State Merging**
LangGraph automatically merges the delta with existing state:
- For `messages`: uses `add_messages` reducer (appends to list)
- For other fields: replaces the value

```
Initial State:
{
  "messages": [msg1, msg2],
  "user_id": "user_123",
  "user_name": "Alice"
}

Node Returns:
{"messages": [msg3]}

Merged State:
{
  "messages": [msg1, msg2, msg3],  ← Appended
  "user_id": "user_123",
  "user_name": "Alice"
}
```

---

## Nodes Deep Dive

Nodes are **functions** that take state as input and return state updates.

### Node 1: Agent Node (`call_model`)

**Purpose:** Invoke the LLM to generate responses or decide which tools to use

```python
# Location: main.py:125-129
def call_model(state: State) -> Dict[str, List[BaseMessage]]:
    """Call the LLM model"""
    messages = state["messages"]
    response = model.invoke(messages)
    return {"messages": [response]}
```

**What happens:**
1. Extracts message history from state
2. Sends to Gemini 2.5 Pro (bound with tools)
3. LLM decides: respond directly OR call tools
4. Returns AI message (possibly with `tool_calls` attribute)

**Example Output:**
```python
AIMessage(
    content="I'll search arXiv for quantum computing papers",
    tool_calls=[{
        "name": "arxiv_search",
        "args": {"topic": "quantum computing"},
        "id": "call_123"
    }]
)
```

---

### Node 2: Tools Node (`custom_tool_node`)

**Purpose:** Execute tools requested by the LLM

```python
# Location: main.py:57-111
def custom_tool_node(state: State):
    """Custom tool node that passes user_id and user_name to tools"""
    messages = state["messages"]
    user_id = state.get("user_id")
    user_name = state.get("user_name")

    last_message = messages[-1]
    if not hasattr(last_message, 'tool_calls'):
        return {"messages": []}

    tool_results = []
    for tool_call in last_message.tool_calls:
        tool_name = tool_call.get("name")
        tool_args = tool_call.get("args", {})
        tool_id = tool_call.get("id")

        # Special handling for render_latex_pdf
        if tool_name == "render_latex_pdf":
            if user_id and "user_id" not in tool_args:
                tool_args["user_id"] = user_id
            if user_name and "user_name" not in tool_args:
                tool_args["user_name"] = user_name

        # Execute tool
        result = tool_to_call.invoke(tool_args)
        tool_results.append(ToolMessage(content=str(result), tool_call_id=tool_id))

    return {"messages": tool_results}
```

**Key Features:**
- Extracts `tool_calls` from last AI message
- Injects user context (user_id, user_name) into tools
- Returns `ToolMessage` objects with results
- Error handling for tool failures

**Flow:**
```
AI Message with tool_calls
         ↓
Extract tool name & args
         ↓
Find matching tool from [arxiv_search, read_pdf, render_latex_pdf]
         ↓
Inject user context if needed
         ↓
Execute tool.invoke(args)
         ↓
Return ToolMessage(result)
```

---

## Edges and Flow Control

Edges define **transitions** between nodes. LangGraph supports:
1. **Static edges** - Always go to the same node
2. **Conditional edges** - Decision-based routing

### Edge Types in This Agent

#### 1. Static Edge: START → Agent
```python
# Location: main.py:154
workflow.add_edge(START, "agent")
```
Always starts by calling the agent node.

#### 2. Conditional Edge: Agent → Tools or END
```python
# Location: main.py:155-162
workflow.add_conditional_edges(
    "agent",                  # Source node
    should_continue,          # Decision function
    {
        "tools": "tools",     # If returns "tools", go to tools node
        "__end__": END        # If returns "__end__", terminate
    }
)
```

**Decision Function:**
```python
# Location: main.py:131-144
def should_continue(state: State) -> str:
    """Determine whether to continue to tools or end"""
    messages = state["messages"]
    last_message = messages[-1]

    # Check if there are tool calls
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "tools"  # Go to tools node

    # Otherwise end
    return "__end__"    # Terminate
```

**Logic:**
- If last message has `tool_calls` → route to "tools"
- Otherwise → END (conversation complete)

#### 3. Static Edge: Tools → Agent
```python
# Location: main.py:163
workflow.add_edge("tools", "agent")
```
After executing tools, **always** return to agent to process results.

---

### Complete Edge Flow

```
START
  │
  ├─────► agent (call_model)
            │
            ├─── should_continue() ───┐
            │                          │
            │ (has tool_calls?)        │
            │                          │
      YES   │          NO              │
            ▼           ▼              │
         tools         END             │
            │                          │
            └──────────────────────────┘
              (loop back to agent)
```

**Example Execution:**
1. User: "Find papers on quantum computing"
2. START → agent: LLM decides to use `arxiv_search`
3. agent → tools: Execute `arxiv_search("quantum computing")`
4. tools → agent: Process search results
5. agent → END: Respond with formatted results

---

## Tools Integration

### Tool Definition

Tools are defined using `@tool` decorator from LangChain:

```python
# Location: arxiv_tool.py:112-129
@tool
def arxiv_search(topic: str) -> list[dict]:
    """Search for recently uploaded arXiv papers

    Args:
        topic: The topic to search for papers about

    Returns:
        List of papers with their metadata
    """
    papers = search_arxiv_papers(topic)
    return papers
```

### Tool Binding

Tools are **bound** to the LLM model:

```python
# Location: main.py:117-120
model = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    api_key=os.getenv("GOOGLE_API_KEY")
).bind_tools(tools)  # Binds [arxiv_search, read_pdf, render_latex_pdf]
```

**What `.bind_tools()` does:**
- Converts tool schemas to function calling format
- LLM can now "see" available tools and their arguments
- Enables structured tool calling

### Available Tools

#### 1. **arxiv_search**
```python
# Location: arxiv_tool.py:112
@tool
def arxiv_search(topic: str) -> list[dict]:
```
- Searches arXiv API
- Returns papers with title, authors, summary, PDF link
- Has 10-minute caching

#### 2. **read_pdf**
```python
# Location: read_pdf.py:7
@tool
def read_pdf(url: str) -> str:
```
- Downloads PDF from URL
- Extracts text using PyPDF2
- Returns full text content

#### 3. **render_latex_pdf**
```python
# Location: write_pdf.py:19
@tool
def render_latex_pdf(latex_content: str, topic: str, user_id: str, user_name: str) -> str:
```
- Compiles LaTeX to PDF using Tectonic
- Uploads to Supabase storage
- Returns filename/path

---

## Execution Flow

### Synchronous Execution

```python
# Location: main.py:437-440
result = None
for s in graph.stream(input_data, config, stream_mode="values"):
    result = s["messages"][-1]
```

**How it works:**
- `graph.stream()` executes the graph step-by-step
- `stream_mode="values"` returns full state at each step
- Loop iterates until graph reaches END
- Final result is the last message

### Streaming Execution

```python
# Location: main.py:539
async for event in graph.astream_events(input_data, config, version="v2"):
```

**Event Types:**
- `on_chat_model_stream`: Token-by-token streaming from LLM
- `on_tool_start`: Tool execution begins
- `on_tool_end`: Tool execution completes

**Benefits:**
- Real-time user feedback
- Progressive rendering
- Better UX for long operations

---

## Memory and Persistence

### Checkpointer

```python
# Location: main.py:166-169
from langgraph.checkpoint.memory import MemorySaver
checkpointer = MemorySaver()
graph = workflow.compile(checkpointer=checkpointer)
```

**What it does:**
- Saves graph state after each step
- Enables **resuming** conversations
- Keyed by `thread_id` (conversation_id)

### Thread-based Memory

```python
# Location: main.py:404
config = {"configurable": {"thread_id": request.conversation_id}}
```

**How it works:**
1. Each conversation has unique `thread_id`
2. Checkpointer stores state under that ID
3. Subsequent requests with same ID retrieve stored state
4. Enables multi-turn conversations with context

### Conversation History Loading

```python
# Location: main.py:328-383
def load_conversation_history(conversation_id: str) -> List[Dict]:
    # Loads from Express backend (Prisma DB)
    # Converts to LangGraph message format
    # Caches for 5 minutes
```

**Architecture:**
```
┌─────────────┐
│  User Input │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│  Load History from Backend   │ ← Prisma database
│  (5-minute cache)            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Convert to LangGraph Format │
│  [HumanMessage, AIMessage]   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Add to State["messages"]    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Execute Graph with Context  │
└──────────────────────────────┘
```

---

## Advanced Features

### 1. **System Prompt Management**

```python
# Location: main.py:171-253
INITIAL_PROMPT = """You are an expert AI researcher..."""
```

**Injection:**
- Added to first message in new conversations
- Includes user context (name for PDF authorship)
- Contains tool usage instructions

### 2. **Conversation Truncation**

```python
# Location: main.py:515-522
if len(conversation_history) > 30:
    # Keep first 3 + last 20 messages
    messages.extend(conversation_history[:3])
    messages.extend(conversation_history[-20:])
```

**Why:**
- Prevents token limit issues
- Maintains important context (beginning + recent)
- Optimizes performance

### 3. **Smart Caching**

Multiple caching layers:
- **arXiv API**: 10-minute cache (arxiv_tool.py:48)
- **Conversation history**: 5-minute cache (main.py:326)
- **Supabase**: Lazy initialization (supabase_storage.py:209)

---

## Complete Request Flow Example

### User: "Find recent papers on quantum computing"

```
1. START
   ↓
2. Agent Node (call_model)
   - State: {messages: [SystemMessage, HumanMessage("Find recent papers...")]}
   - LLM Output: AIMessage(tool_calls=[{name: "arxiv_search", args: {topic: "quantum computing"}}])
   - State Update: {messages: [...prev, AIMessage(tool_calls=[...])]}
   ↓
3. Conditional Edge (should_continue)
   - Check: last_message.tool_calls exists? YES
   - Decision: "tools"
   ↓
4. Tools Node (custom_tool_node)
   - Extract: tool_name="arxiv_search", args={topic: "quantum computing"}
   - Execute: arxiv_search.invoke({topic: "quantum computing"})
   - Result: [{title: "Paper1", authors: [...], pdf: "https://..."}, ...]
   - State Update: {messages: [...prev, ToolMessage(content="[{...}]", tool_call_id="call_123")]}
   ↓
5. Back to Agent Node
   - State: {messages: [...SystemMessage, HumanMessage, AIMessage(tool_calls), ToolMessage(results)]}
   - LLM processes tool results
   - Output: AIMessage(content="Here are 5 recent papers on quantum computing:\n\n1. Paper1...")
   - State Update: {messages: [...prev, AIMessage(content="Here are...")]}
   ↓
6. Conditional Edge (should_continue)
   - Check: last_message.tool_calls exists? NO
   - Decision: "__end__"
   ↓
7. END
   - Return final response to user
```

---

## Key Takeaways

### State
- **Immutable** - nodes return updates, not modifications
- **Shared** - all nodes access the same state
- **Typed** - TypedDict ensures structure
- **Reduced** - `add_messages` automatically merges message lists

### Nodes
- **Functions** that process state
- Return **partial updates** (deltas)
- Can be sync or async
- Should be **pure** (no side effects on state)

### Edges
- **Static**: Always go to same destination
- **Conditional**: Decision-based routing
- Enable **loops** (tools → agent → tools)
- Control graph **topology**

### Graph
- **Compiled** with checkpointer for persistence
- **Streamable** for real-time responses
- **Resumable** via thread_id
- **Flexible** - easy to add new nodes/edges/tools

---

## Extending the Agent

### Adding a New Tool

1. **Define the tool:**
```python
@tool
def new_tool(arg: str) -> str:
    """Tool description"""
    # Implementation
    return result
```

2. **Add to tools list:**
```python
tools = [arxiv_search, read_pdf, render_latex_pdf, new_tool]
```

3. **Update system prompt:**
```python
INITIAL_PROMPT += "\n- `new_tool(arg)` - Description"
```

### Adding a New Node

1. **Define node function:**
```python
def new_node(state: State) -> Dict:
    # Process state
    return {"messages": [new_message]}
```

2. **Add to graph:**
```python
workflow.add_node("new_node", new_node)
workflow.add_edge("existing_node", "new_node")
```

### Modifying Flow

Change conditional logic in `should_continue`:
```python
def should_continue(state: State) -> str:
    if some_condition:
        return "new_path"
    elif other_condition:
        return "other_path"
    return "__end__"
```

---

## Conclusion

This LangGraph agent demonstrates:
- ✅ **Stateful conversations** with memory
- ✅ **Tool orchestration** with intelligent routing
- ✅ **Streaming responses** for better UX
- ✅ **Conditional flow** based on LLM decisions
- ✅ **Persistent context** across sessions
- ✅ **Modular design** for easy extension

The graph-based architecture makes it easy to:
- Visualize agent behavior
- Debug execution flow
- Add new capabilities
- Scale complexity

---

## References

- **LangGraph Docs**: https://langchain-ai.github.io/langgraph/
- **LangChain Tools**: https://python.langchain.com/docs/modules/tools/
- **Gemini Function Calling**: https://ai.google.dev/gemini-api/docs/function-calling
- **Code Location**: [agent/ai-researcher/main.py](agent/ai-researcher/main.py)
