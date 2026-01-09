# Requirements Document

## Introduction

This feature enhances the Plara AI Assistant application by integrating Puter.js Nano Banana (Gemini 3 Pro Image) AI image generation capabilities into the chat input area. The integration allows users to generate images from text prompts directly within the chat interface and seamlessly insert generated images into the Editor.js document workspace.

## Glossary

- **Chat_Input_Area**: The text input component within the Notion-style chat container where users type messages and prompts
- **Image_Generator**: The component responsible for calling Puter.js `txt2img` API to generate images from text prompts
- **Document_Editor**: The Editor.js-based A4 page workspace where users create and edit documents
- **Nano_Banana**: Google's Gemini 3 Pro Image model accessed via Puter.js for high-quality image generation
- **Image_Preview**: A visual representation of a generated image displayed in the chat messages area
- **Image_Insertion**: The action of adding a generated image into the Document_Editor

## Requirements

### Requirement 1: Text-to-Image Generation from Chat

**User Story:** As a user, I want to generate images from text prompts in the chat input area, so that I can quickly create visual content without leaving the chat interface.

#### Acceptance Criteria

1. WHEN a user enters a text prompt and clicks the image generation button, THE Image_Generator SHALL call the Puter.js `txt2img` API with the `gemini-3-pro-image-preview` model
2. WHEN a user types `/img <prompt>` in the Chat_Input_Area and presses Enter, THE Image_Generator SHALL extract the prompt and generate an image
3. WHILE an image is being generated, THE Chat_Input_Area SHALL display a loading indicator message in the chat
4. WHEN image generation completes successfully, THE Image_Preview SHALL display the generated image in the chat messages area
5. IF image generation fails, THEN THE Chat_Input_Area SHALL display an error message with the failure reason

### Requirement 2: Image-to-Image Generation

**User Story:** As a user, I want to transform existing images using text prompts, so that I can modify or enhance images with AI assistance.

#### Acceptance Criteria

1. WHEN a user attaches an image and provides a text prompt, THE Image_Generator SHALL call the Puter.js `txt2img` API with `input_image` and `input_image_mime_type` parameters
2. WHEN an image attachment is present, THE Chat_Input_Area SHALL display a preview thumbnail of the attached image
3. WHEN the user clicks the image generation button with an attached image, THE Image_Generator SHALL use the attached image as the base for transformation
4. IF the attached file is not a valid image format, THEN THE Chat_Input_Area SHALL display an error message indicating invalid file type

### Requirement 3: Image Insertion into Document

**User Story:** As a user, I want to insert generated images into my document, so that I can incorporate AI-generated visuals into my work.

#### Acceptance Criteria

1. WHEN an image is generated successfully, THE Image_Preview SHALL display an "Insert to Document" button
2. WHEN a user clicks the "Insert to Document" button, THE Document_Editor SHALL insert the image at the current cursor position or at the end of the document
3. WHEN an image is inserted into the document, THE Document_Editor SHALL include the original prompt as the image caption
4. IF the Document_Editor is not ready, THEN THE Image_Preview SHALL display a warning notification

### Requirement 4: Image Quality Options

**User Story:** As a user, I want to control the quality of generated images, so that I can balance between generation speed and image quality.

#### Acceptance Criteria

1. THE Image_Generator SHALL support a quality parameter with values "low", "medium", or "high"
2. WHEN no quality is specified, THE Image_Generator SHALL default to "medium" quality
3. WHEN a user specifies quality via `/img:low <prompt>` or `/img:high <prompt>`, THE Image_Generator SHALL use the specified quality setting

### Requirement 5: Chat History Integration

**User Story:** As a user, I want my image generation requests to be part of the chat history, so that I can reference previous generations and maintain context.

#### Acceptance Criteria

1. WHEN an image is generated, THE Chat_Input_Area SHALL add the user's prompt as a user message in the chat history
2. WHEN an image is generated successfully, THE Chat_Input_Area SHALL add the generated image as an assistant message in the chat history
3. THE Image_Preview SHALL persist in the chat messages area until the session is cleared

### Requirement 6: Accessibility and User Feedback

**User Story:** As a user, I want clear visual feedback during image generation, so that I understand the current state of my request.

#### Acceptance Criteria

1. THE image generation button SHALL have an appropriate aria-label for screen readers
2. WHILE generating an image, THE Chat_Input_Area SHALL disable the image generation button to prevent duplicate requests
3. WHEN image generation completes, THE Chat_Input_Area SHALL re-enable the image generation button
4. THE Image_Preview SHALL include alt text describing the generated image using the original prompt
