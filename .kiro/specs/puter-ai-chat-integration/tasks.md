# Implementation Plan: Puter AI Chat Integration

## Overview

This plan implements the puter.ai.chat() integration with the existing Plara chat interface, adding streaming responses, model selection, file attachments, and document context awareness. The implementation enhances the existing `app.js` and related files.

## Tasks

- [ ] 1. Refactor chat submission to use ChatController pattern
  - [ ] 1.1 Create ChatController object with state management
    - Add selectedModel, attachments, isStreaming state
    - Implement setModel(), addAttachment(), removeAttachment() methods
    - _Requirements: 2.4, 2.5, 4.2, 4.6_

  - [ ] 1.2 Refactor handleChatSubmitAsync to use ChatController
    - Extract message validation logic
    - Use ChatController.selectedModel for API calls
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.3 Write property test for empty message rejection
    - **Property 2: Empty message rejection**
    - **Validates: Requirements 1.3**

- [ ] 2. Enhance model selector functionality
  - [ ] 2.1 Update model dropdown with all available models
    - Add Gemini 3 Pro, Claude Opus 4.5, GPT-5.2 Chat, GPT-5.2 Pro
    - Update dropdown HTML and event handlers
    - _Requirements: 2.2, 2.3_

  - [ ] 2.2 Implement model selection state persistence
    - Update setSelectedModel() to persist to ChatController
    - Ensure API calls use ChatController.selectedModel
    - _Requirements: 2.4, 2.5_

  - [ ] 2.3 Write property test for model selection consistency
    - **Property 5: Model selection state consistency**
    - **Validates: Requirements 2.1, 2.4, 2.5**

- [ ] 3. Checkpoint - Verify basic chat and model selection
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement streaming response handling
  - [ ] 4.1 Enhance streaming display with visual indicator
    - Add streaming indicator element during response
    - Remove indicator when streaming completes
    - _Requirements: 3.1, 3.2_

  - [ ] 4.2 Implement error handling during streaming
    - Catch errors in streaming loop
    - Display error message and remove loading indicator
    - _Requirements: 3.4, 6.1, 6.3_

  - [ ] 4.3 Write property test for streaming error handling
    - **Property 8: Streaming error handling**
    - **Validates: Requirements 3.4**

- [ ] 5. Enhance markdown formatting
  - [ ] 5.1 Improve formatMessageText function
    - Add code block rendering with syntax highlighting
    - Add bold, italic, and inline code support
    - Ensure proper line break handling
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 5.2 Write property test for markdown rendering
    - **Property 7: Markdown rendering completeness**
    - **Validates: Requirements 3.3, 7.1, 7.2, 7.3**

- [ ] 6. Checkpoint - Verify streaming and formatting
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement file attachment handling
  - [ ] 7.1 Enhance attachment upload to Puter FS
    - Refactor file upload logic to use ChatController.addAttachment()
    - Generate preview for images and file icons for documents
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ] 7.2 Update attachment bar rendering
    - Display preview chips with remove buttons
    - Handle remove button clicks via ChatController.removeAttachment()
    - _Requirements: 4.2, 4.6_

  - [ ] 7.3 Include attachments in API request
    - Build content array with text and file references
    - Use puter_path for uploaded files
    - _Requirements: 4.5_

  - [ ] 7.4 Write property test for attachment management
    - **Property 11: Attachment removal**
    - **Validates: Requirements 4.6**

- [ ] 8. Implement document context integration
  - [ ] 8.1 Create getDocumentContext function
    - Extract content from Editor.js via editor.save()
    - Convert blocks to plain text for AI context
    - _Requirements: 5.1, 5.2_

  - [ ] 8.2 Add document context button to chat input
    - Add button to include current document in message
    - Toggle document context inclusion state
    - _Requirements: 5.2_

  - [ ] 8.3 Include document context in API request when requested
    - Check if document context is requested
    - Append document content to message
    - _Requirements: 5.1_

  - [ ] 8.4 Write property test for document context inclusion
    - **Property 12: Document context inclusion**
    - **Property 13: Document content not sent by default**
    - **Validates: Requirements 5.1, 5.4**

- [ ] 9. Checkpoint - Verify attachments and document context
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement error handling and retry
  - [ ] 10.1 Add connection error handling
    - Detect network/service unavailable errors
    - Display user-friendly error message
    - _Requirements: 6.1_

  - [ ] 10.2 Add file upload error handling
    - Catch upload failures
    - Display error and allow retry
    - _Requirements: 6.2_

  - [ ] 10.3 Add timeout handling
    - Implement request timeout (60 seconds)
    - Display timeout message
    - _Requirements: 6.3_

  - [ ] 10.4 Add retry functionality
    - Store last action for retry
    - Add retry button to error messages
    - _Requirements: 6.4_

- [ ] 11. Enhance message display styling
  - [ ] 11.1 Add AI icon to assistant messages
    - Ensure all assistant messages have icon indicator
    - _Requirements: 7.4_

  - [ ] 11.2 Style user messages distinctly
    - Apply different background/alignment for user messages
    - _Requirements: 7.5_

  - [ ] 11.3 Write property test for message role styling
    - **Property 14: Message role visual distinction**
    - **Validates: Requirements 7.4, 7.5**

- [ ] 12. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify complete flow: input → model selection → attachments → document context → streaming response → formatted display

## Notes

- All tasks including property tests are required for comprehensive coverage
- The implementation builds on existing code in `app.js`
- Property tests should use fast-check or similar PBT library
- Each property test should run minimum 100 iterations
- Checkpoints ensure incremental validation of functionality
