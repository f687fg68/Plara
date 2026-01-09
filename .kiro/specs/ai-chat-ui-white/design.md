# Design Document: AI Chat UI (White Theme)

## Overview

This design describes a web-based AI chat interface that replicates the Notion AI chat UI with a white/light theme. The interface is built as a single-page component using HTML, CSS, and vanilla JavaScript, following the existing project structure.

## Architecture

The UI follows a simple component-based structure rendered as static HTML with CSS styling:

```
┌─────────────────────────────────────────┐
│              Header                      │
│  [New AI chat ▼]          [⎘] [□] [—]   │
├─────────────────────────────────────────┤
│                                          │
│              Main Content                │
│                                          │
│         ┌──────────┐                     │
│         │  Avatar  │                     │
│         └──────────┘                     │
│                                          │
│      Welcome Relax ! 👋                  │
│                                          │
│      I'm your Notion Agent...            │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │         Prompt Card                  │ │
│  │  [@] [👋 Welcome to Notion!]        │ │
│  │                                      │ │
│  │  Create a simple daily planner...   │ │
│  │                                      │ │
│  │  [📎] [✳ Claude Sonnet] [🌐 All] [↑]│ │
│  └─────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ChatContainer
The root container that holds all UI elements.

```css
.chat-container {
  width: 100%;
  max-width: 480px;
  height: 100vh;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
}
```

### 2. Header Component
Top navigation bar with title and controls.

```html
<header class="chat-header">
  <div class="chat-title">
    <span>New AI chat</span>
    <svg class="dropdown-icon">...</svg>
  </div>
  <div class="window-controls">
    <button class="control-btn">⎘</button>
    <button class="control-btn">□</button>
    <button class="control-btn">—</button>
  </div>
</header>
```

### 3. Avatar Component
Circular icon representing the AI agent.

```html
<div class="avatar">
  <svg class="avatar-icon">...</svg>
</div>
```

### 4. WelcomeSection Component
Greeting and introductory text.

```html
<div class="welcome-section">
  <h1 class="welcome-title">Welcome Relax ! 👋</h1>
  <p class="welcome-text">I'm your Notion Agent and I'm here to help you get set up!</p>
  <p class="welcome-instruction">Start by sending the prompt below to see what I can do.</p>
</div>
```

### 5. PromptCard Component
Input area with suggested prompt and action buttons.

```html
<div class="prompt-card">
  <div class="prompt-header">
    <button class="mention-btn">@</button>
    <span class="prompt-tag">👋 Welcome to Notion!</span>
  </div>
  <p class="prompt-text">Create a simple daily planner for today with three priority tasks in a new page.</p>
  <div class="prompt-actions">
    <button class="action-btn attachment-btn">📎</button>
    <button class="action-btn model-btn">✳ Claude Sonnet 4.5</button>
    <button class="action-btn sources-btn">🌐 All sources</button>
    <button class="send-btn">↑</button>
  </div>
</div>
```

## Data Models

This is a static UI component with no persistent data models. The interface displays hardcoded content matching the reference design.

### UI State (if interactive features added later)
```javascript
const chatState = {
  title: "New AI chat",
  welcomeMessage: {
    heading: "Welcome Relax ! 👋",
    subtext: "I'm your Notion Agent and I'm here to help you get set up!",
    instruction: "Start by sending the prompt below to see what I can do."
  },
  suggestedPrompt: {
    tag: "Welcome to Notion!",
    text: "Create a simple daily planner for today with three priority tasks in a new page."
  },
  selectedModel: "Claude Sonnet 4.5"
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Since this is primarily a static UI replication task, the testable properties focus on visual rendering and DOM structure verification.

### Property 1: Header contains required elements
*For any* rendered Chat_Interface, the Header SHALL contain a title element with "New AI chat" text and exactly three window control buttons.
**Validates: Requirements 1.1, 1.2**

### Property 2: Welcome section displays complete content
*For any* rendered Chat_Interface, the Welcome_Section SHALL contain a heading with "Welcome Relax" text, and two paragraph elements with introductory content.
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: Prompt card contains all action buttons
*For any* rendered Prompt_Card, the actions area SHALL contain exactly four interactive elements: attachment button, model selector, sources button, and send button.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 4: White theme background colors
*For any* rendered Chat_Interface, the main container background color SHALL be white (#FFFFFF or rgb(255,255,255)) and the Prompt_Card background SHALL be a light gray distinguishable from white.
**Validates: Requirements 5.1, 5.3**

## Error Handling

Since this is a static UI component:
- Missing assets (icons/images): Use inline SVG or emoji fallbacks
- CSS loading failure: Include critical styles inline in HTML head
- JavaScript disabled: UI renders correctly as static HTML

## Testing Strategy

### Unit Tests
- Verify DOM structure contains all required elements
- Verify correct CSS classes are applied
- Verify text content matches requirements

### Property-Based Tests
- Property tests will verify DOM structure invariants
- Use a DOM testing library to query and validate element presence
- Test that styling properties match white theme requirements

### Visual Testing
- Manual comparison against reference image
- Verify white theme contrast and readability
