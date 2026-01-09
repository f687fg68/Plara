# Requirements Document

## Introduction

This feature replicates an AI chat interface UI similar to Notion's AI chat, but with a white/light theme instead of the dark theme shown in the reference image. The interface includes a header with chat title, an avatar with welcome message, and a prompt input area with action buttons.

## Glossary

- **Chat_Interface**: The main container component that holds all UI elements of the AI chat
- **Header**: The top navigation bar containing the chat title and window controls
- **Avatar**: A circular icon representing the AI agent
- **Welcome_Section**: The area displaying the greeting message and introductory text
- **Prompt_Card**: The input area where users can type or select prompts to send
- **Action_Button**: Interactive buttons for attachments, model selection, and sending messages

## Requirements

### Requirement 1: Header Display

**User Story:** As a user, I want to see a clear header with the chat title and window controls, so that I can identify the chat and manage the window.

#### Acceptance Criteria

1. THE Header SHALL display "New AI chat" text with a dropdown indicator
2. THE Header SHALL display window control icons (external link, maximize, minimize) on the right side
3. THE Header SHALL have a white background with dark text for contrast

### Requirement 2: AI Avatar and Welcome Message

**User Story:** As a user, I want to see a friendly AI avatar with a welcome message, so that I feel welcomed and understand the purpose of the chat.

#### Acceptance Criteria

1. THE Chat_Interface SHALL display a circular Avatar with a stylized face icon
2. THE Welcome_Section SHALL display a bold heading "Welcome Relax ! 👋"
3. THE Welcome_Section SHALL display introductory text explaining the AI agent's purpose
4. THE Welcome_Section SHALL display instructional text prompting the user to send a message

### Requirement 3: Prompt Input Card

**User Story:** As a user, I want a prompt input area where I can type or select suggested prompts, so that I can interact with the AI.

#### Acceptance Criteria

1. THE Prompt_Card SHALL display an "@" mention button with a suggested prompt tag
2. THE Prompt_Card SHALL display editable prompt text
3. THE Prompt_Card SHALL have a light gray background with subtle border styling
4. WHEN the Prompt_Card is displayed, THE Chat_Interface SHALL show action buttons at the bottom

### Requirement 4: Action Buttons

**User Story:** As a user, I want action buttons for attachments, model selection, and sending messages, so that I can control my interaction with the AI.

#### Acceptance Criteria

1. THE Prompt_Card SHALL display an attachment button (paperclip icon)
2. THE Prompt_Card SHALL display a model selector showing "Claude Sonnet 4.5" with an icon
3. THE Prompt_Card SHALL display an "All sources" button with a globe icon
4. THE Prompt_Card SHALL display a circular blue send button with an up arrow
5. WHEN the send button is clicked, THE Chat_Interface SHALL submit the prompt

### Requirement 5: White Theme Styling

**User Story:** As a user, I want the interface to have a clean white theme, so that it matches light mode preferences.

#### Acceptance Criteria

1. THE Chat_Interface SHALL have a white (#FFFFFF) or near-white background
2. THE Chat_Interface SHALL use dark text colors for readability
3. THE Prompt_Card SHALL have a light gray background to distinguish it from the main background
4. THE Action_Button elements SHALL maintain appropriate contrast in the light theme
5. THE Avatar SHALL have a light background with dark icon styling
