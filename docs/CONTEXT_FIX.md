# Conversation Context Fix

## Issue
The AI was only remembering the last 6 messages (3 exchanges) in streaming mode, causing it to lose context in longer conversations.

## Root Cause
In `agent/ai-researcher/main.py` line 454, the conversation history was being truncated:
```python
# OLD CODE (line 454)
recent_history = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
```

## Solution
Increased the context window to 20 messages (10 exchanges):
```python
# NEW CODE (line 455)
recent_history = conversation_history[-20:] if len(conversation_history) > 20 else conversation_history
```

## How to Apply
1. Update `agent/ai-researcher/main.py` line 454-455
2. Restart the FastAPI server
3. Test with a longer conversation (>10 messages)

## Options for Further Improvement
- **Option 1**: Remove limit entirely (use ALL history)
  ```python
  messages.extend(conversation_history)  # No truncation
  ```

- **Option 2**: Make it configurable via environment variable
  ```python
  CONTEXT_WINDOW = int(os.getenv("CONTEXT_WINDOW", "20"))
  recent_history = conversation_history[-CONTEXT_WINDOW:] if len(conversation_history) > CONTEXT_WINDOW else conversation_history
  ```

- **Option 3**: Use token-based truncation instead of message count
  (More accurate but requires token counting library)

## Testing
To verify the fix works:
1. Start a new conversation
2. Send 15+ messages back and forth
3. Reference something from the 1st or 2nd message
4. AI should remember the context now (previously would fail after message #7)
