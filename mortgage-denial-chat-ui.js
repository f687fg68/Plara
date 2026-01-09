/**
 * Chat UI Integration
 * Handles chat interface interactions
 */

// Global chat state
let chatBackend = null;
let currentChatModel = 'gemini-2.0-flash-exp';

/**
 * Initialize chat when app loads
 */
function initializeChat() {
    if (typeof MortgageDenialChatBackend !== 'undefined') {
        chatBackend = new MortgageDenialChatBackend();
        console.log('💬 Chat initialized');
    }
}

/**
 * Toggle chat interface
 */
function toggleChat() {
    const chatInterface = document.getElementById('chatInterface');
    const chatFab = document.getElementById('chatFab');
    
    if (chatInterface.classList.contains('open')) {
        chatInterface.classList.remove('open');
        chatFab.classList.remove('hidden');
    } else {
        chatInterface.classList.add('open');
        chatFab.classList.add('hidden');
    }
}

/**
 * Open AI chat
 */
function openAIChat() {
    const chatInterface = document.getElementById('chatInterface');
    const chatFab = document.getElementById('chatFab');
    
    chatInterface.classList.add('open');
    chatFab.classList.add('hidden');
    
    // Focus input
    setTimeout(() => {
        document.getElementById('chatInput').focus();
    }, 100);
}

/**
 * Select AI model
 */
function selectAIModel(button) {
    // Update active state
    document.querySelectorAll('.ai-model-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Update current model
    currentChatModel = button.dataset.model;
    if (chatBackend) {
        chatBackend.switchModel(currentChatModel);
    }
    
    console.log('🔄 Chat model switched to:', currentChatModel);
}

/**
 * Send quick prompt
 */
async function sendQuickPrompt(prompt) {
    const chatInput = document.getElementById('chatInput');
    chatInput.value = prompt;
    await sendChatMessage();
}

/**
 * Handle chat input keydown
 */
function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

/**
 * Send chat message
 */
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('chatSendBtn');
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Disable send button
    sendBtn.disabled = true;
    
    // Add user message to chat
    addChatMessage('user', message);
    
    // Show typing indicator
    const typingId = addTypingIndicator();
    
    try {
        // Initialize chat backend if needed
        if (!chatBackend) {
            initializeChat();
        }
        
        // Send to AI
        let aiResponse = '';
        
        await chatBackend.sendMessage(message, {
            stream: true,
            onChunk: (chunk, fullText) => {
                // Update the AI message in real-time
                updateAIMessage(typingId, fullText);
            }
        });
        
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
        addChatMessage('ai', '❌ Sorry, I encountered an error. Please try again.');
    } finally {
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

/**
 * Add chat message to UI
 */
function addChatMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'chat-avatar';
    avatarDiv.innerHTML = role === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'chat-bubble';
    bubbleDiv.textContent = content;
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(bubbleDiv);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message ai';
    messageDiv.id = 'typing-indicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'chat-avatar';
    avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'chat-bubble';
    bubbleDiv.innerHTML = '<div class="chat-typing"><span></span><span></span><span></span></div>';
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(bubbleDiv);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return 'typing-indicator';
}

/**
 * Update AI message (for streaming)
 */
function updateAIMessage(messageId, content) {
    let messageDiv = document.getElementById(messageId);
    
    if (!messageDiv) {
        // Create new message if typing indicator was removed
        const chatMessages = document.getElementById('chatMessages');
        messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ai';
        messageDiv.id = messageId;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'chat-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'chat-bubble';
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(messageDiv);
    }
    
    const bubble = messageDiv.querySelector('.chat-bubble');
    bubble.textContent = content;
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(messageId) {
    const indicator = document.getElementById(messageId);
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Toggle notifications
 */
function toggleNotifications() {
    alert('Notifications feature coming soon!');
}

// Auto-resize textarea
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }
    
    // Initialize chat
    initializeChat();
});
