# Design Document: Puter AI Chat Integration

## Overview

This design describes the integration of puter.ai.chat() API into the existing Plara AI Assistant chat interface. The implementation enhances the current Notion-style chat UI with streaming responses, model selection, file attachments via Puter FS, and document context awareness with the Editor.js document editor.

## Architecture

The system follows an event-driven architecture where user interactions trigger async API calls to Puter.js services:

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat UI Layer                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ Chat Input  │  │ Model Select │  │ Attachment Bar    │   │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬─────────┘   │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │   Chat Controller     │                       │
│              │   (handleChatSubmit)  │                       │
│              └───────────┬───────────┘                       │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    Service Layer                             │
│         ┌────────────────┼────────────────┐                  │
│         ▼                ▼                ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ puter.ai    │  │ puter.fs    │  │ Editor.js   │          │
│  │ .chat()     │  │ .write()    │  │ .save()     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ChatController Module

Manages chat state and coordinates between UI and Puter services.

```javascript
const ChatController = {
  // State
  selectedModel: 'claude-opus-4-5',
  attachments: [],
  isStreaming: false,
  
  // Methods
  async submitMessage(text, options = {}) { ... },
  setModel(modelId) { ... },
  addAttachment(file) { ... },
  removeAttachment(index) { ... },
  getDocumentContext() { ... },
  clearState() { ... }
};
```

### 2. Model Selector Component

Dropdown for selecting AI models with visual feedback.

```javascript
const AVAILABLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', icon: '✦' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', icon: '✳' },
  { id: 'gpt-5.2-chat', name: 'GPT-5.2 Chat', icon: '◉' },
  { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', icon: '◉' }
];
```

### 3. Attachment Handler

Manages file uploads to Puter FS and preview rendering.

```javascript
async function handleFileAttachment(file) {
  // Upload to Puter FS
  const puterFile = await puter.fs.write(
    `chat_${Date.now()}_${file.name}`, 
    file
  );
  
  return {
    file: file,
    puterPath: puterFile.path,
    preview: await generatePreview(file),
    type: file.type.startsWith('image/') ? 'image' : 'file'
  };
}
```

### 4. Streaming Response Handler

Processes streaming responses and updates UI incrementally.

```javascript
async function handleStreamingResponse(response, messageElement) {
  let fullText = '';
  
  for await (const part of response) {
    const text = part?.text || '';
    fullText += text;
    messageElement.innerHTML = formatMessageText(fullText);
    scrollToBottom();
  }
  
  return fullText;
}
```

### 5. Document Context Provider

Extracts content from Editor.js for AI context.

```javascript
async function getDocumentContext() {
  if (!window.editor) return null;
  
  const outputData = await window.editor.save();
  return {
    blocks: outputData.blocks,
    plainText: blocksToPlainText(outputData.blocks)
  };
}
```

## Data Models

### ChatMessage
```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
  timestamp: number;
  model?: string;
  attachments?: Attachment[];
}

interface ContentPart {
  type: 'text' | 'file';
  text?: string;
  puter_path?: string;
}
```

### Attachment
```typescript
interface Attachment {
  file: File;
  puterPath: string;
  preview: string;  // Data URL for images, icon for files
  type: 'image' | 'file';
}
```

### ChatState
```typescript
interface ChatState {
  messages: ChatMessage[];
  selectedModel: string;
  pendingAttachments: Attachment[];
  isStreaming: boolean;
  error: string | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Message submission triggers AI call
*For any* non-empty message text, when submitted via Enter key or send button click, the puter.ai.chat() function SHALL be called with that message text and the currently selected model.
**Validates: Requirements 1.1, 1.2**

### Property 2: Empty message rejection
*For any* string composed entirely of whitespace characters (including empty string), attempting to submit SHALL NOT trigger an API call and the chat state SHALL remain unchanged.
**Validates: Requirements 1.3**

### Property 3: Input cleared after send
*For any* successfully submitted message, the Chat_Input_Area value SHALL be empty and the message SHALL appear in the chat message history.
**Validates: Requirements 1.4**

### Property 4: Loading indicator during processing
*For any* message submission, a loading indicator SHALL be visible from the moment of submission until the response completes or an error occurs.
**Validates: Requirements 1.5**

### Property 5: Model selection state consistency
*For any* model selection action, the Model_Selector display text SHALL match the selected model name, and subsequent API calls SHALL use that model ID.
**Validates: Requirements 2.1, 2.4, 2.5**

### Property 6: Streaming response incremental display
*For any* streaming response from Puter_AI, each text chunk SHALL be appended to the message display as it arrives, and a streaming indicator SHALL be visible until completion.
**Validates: Requirements 3.1, 3.2**

### Property 7: Markdown rendering completeness
*For any* AI response containing markdown syntax (code blocks, bold, italic, line breaks), the final rendered output SHALL contain the corresponding HTML elements.
**Validates: Requirements 3.3, 7.1, 7.2, 7.3**

### Property 8: Streaming error handling
*For any* error that occurs during streaming, an error message SHALL be displayed and the loading/streaming indicator SHALL be removed.
**Validates: Requirements 3.4**

### Property 9: File attachment upload and preview
*For any* file selected via the attachment picker, the file SHALL be uploaded to Puter FS and a preview chip SHALL be added to the attachment bar.
**Validates: Requirements 4.2**

### Property 10: Attachments included in request
*For any* message submission with pending attachments, the API request SHALL include puter_path references for each uploaded file.
**Validates: Requirements 4.5**

### Property 11: Attachment removal
*For any* attachment in the pending list, clicking its remove button SHALL decrease the attachment count by exactly one and remove that specific attachment.
**Validates: Requirements 4.6**

### Property 12: Document context inclusion
*For any* message that explicitly requests document context inclusion, the API request content SHALL include the current Editor.js document content.
**Validates: Requirements 5.1**

### Property 13: Document content not sent by default
*For any* message submission without explicit document context request, the API request SHALL NOT contain Editor.js document content.
**Validates: Requirements 5.4**

### Property 14: Message role visual distinction
*For any* rendered message, assistant messages SHALL have an AI icon and user messages SHALL have visually distinct styling (different background, alignment, or color).
**Validates: Requirements 7.4, 7.5**

## Error Handling

### Connection Errors
```javascript
try {
  const response = await puter.ai.chat(message, options);
} catch (error) {
  if (error.message.includes('network') || error.message.includes('unavailable')) {
    showError('Unable to connect to AI service. Please check your connection.');
  }
}
```

### File Upload Errors
```javascript
try {
  const puterFile = await puter.fs.write(filename, file);
} catch (error) {
  showError(`Failed to upload ${file.name}. Please try again.`);
  // Allow retry by keeping file in selection
}
```

### Streaming Errors
```javascript
try {
  for await (const part of response) {
    // Process chunk
  }
} catch (error) {
  removeLoadingIndicator();
  appendErrorMessage('Response interrupted. Please try again.');
}
```

### Timeout Handling
```javascript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Request timed out')), 60000)
);

const response = await Promise.race([
  puter.ai.chat(message, options),
  timeoutPromise
]);
```

## Testing Strategy

### Unit Tests
- Test message validation (empty/whitespace rejection)
- Test model selection state updates
- Test attachment list management (add/remove)
- Test markdown formatting function
- Test document context extraction

### Property-Based Tests
Property-based tests will use fast-check or similar library to verify:
- Message submission behavior across random valid inputs
- Empty message rejection across all whitespace variations
- Model selection consistency across all available models
- Attachment management invariants
- Markdown rendering for various input patterns

Each property test should run minimum 100 iterations.

### Integration Tests
- Test full message flow: input → API call → streaming → display
- Test file attachment flow: select → upload → include in request
- Test document context flow: request → extract → include

### Test Configuration
```javascript
// Property test example using fast-check
import fc from 'fast-check';

describe('Chat Input Validation', () => {
  // Feature: puter-ai-chat-integration, Property 2: Empty message rejection
  it('should reject all whitespace-only inputs', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        (whitespaceString) => {
          const result = validateMessage(whitespaceString);
          return result.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```
