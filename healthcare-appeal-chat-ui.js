/**
 * Healthcare Appeal Chat UI
 * Interactive AI assistant interface
 */

// Global chat state
let chatBackend = null;
let currentChatModel = 'claude-sonnet-4';
let isChatOpen = false;

/**
 * Initialize chat when app loads
 */
function initializeChat() {
    if (typeof HealthcareAppealChatBackend !== 'undefined' && app && app.chatBackend) {
        chatBackend = app.chatBackend;
        console.log('💬 Chat initialized');
    }
}

/**
 * Toggle chat interface
 */
function toggleChat() {
    // For this version, we'll use the existing modal pattern
    // In production, would show/hide a dedicated chat panel
    alert('💬 AI Chat Assistant\n\nChat interface integrated with backend.\nClick the help icon to ask questions about:\n\n• Denial codes and regulations\n• Appeal strategies\n• Payer requirements\n• Medical necessity criteria\n• Coding questions');
}

/**
 * Open AI chat (called from header button)
 */
function openAIChat() {
    toggleChat();
}

/**
 * Send chat message
 */
async function sendChatMessage(message) {
    if (!chatBackend) {
        chatBackend = app.chatBackend;
    }
    
    if (!message || !chatBackend) {
        return;
    }
    
    try {
        const response = await chatBackend.sendMessage(message, {
            stream: false
        });
        
        if (response.success) {
            return response.message;
        } else {
            throw new Error('Chat failed');
        }
        
    } catch (error) {
        console.error('Chat error:', error);
        return 'Sorry, I encountered an error. Please try again.';
    }
}

/**
 * Process quick prompt
 */
async function sendQuickPrompt(promptType, context = {}) {
    if (!chatBackend) {
        chatBackend = app.chatBackend;
    }
    
    if (!chatBackend) {
        alert('Chat backend not initialized');
        return;
    }
    
    try {
        const response = await chatBackend.processQuickPrompt(promptType, context);
        
        if (response.success) {
            // Display in modal or alert
            alert(`AI Response:\n\n${response.message.substring(0, 500)}...`);
        }
        
    } catch (error) {
        console.error('Quick prompt error:', error);
        alert('Error getting AI response');
    }
}

/**
 * Switch chat AI model
 */
function selectChatModel(model) {
    currentChatModel = model;
    if (chatBackend) {
        chatBackend.switchModel(model);
    }
    console.log('🔄 Chat model switched to:', model);
}

/**
 * Get help for denial code
 */
async function getDenialCodeHelp(code) {
    if (!chatBackend) return;
    
    const context = { code: code };
    await sendQuickPrompt('denial_code', context);
}

/**
 * Get payer-specific guidance
 */
async function getPayerGuidance(payer, denialType) {
    if (!chatBackend) return;
    
    try {
        const response = await chatBackend.getPayerGuidance(payer, denialType);
        
        if (response.success) {
            alert(`${payer} Appeal Guidance:\n\n${response.message.substring(0, 600)}...\n\n(See full response in chat interface)`);
        }
        
    } catch (error) {
        console.error('Payer guidance error:', error);
    }
}

/**
 * Analyze denial letter with AI
 */
async function analyzeDenialLetter(letterText) {
    if (!chatBackend) {
        chatBackend = app.chatBackend;
    }
    
    if (!letterText || !chatBackend) {
        alert('Please provide a denial letter to analyze');
        return;
    }
    
    try {
        showToast('info', 'Analyzing...', 'AI is analyzing the denial letter');
        
        const response = await chatBackend.analyzeDenialLetter(letterText);
        
        if (response.success) {
            // Display analysis in modal
            const modal = createAnalysisModal(response.message);
            document.body.appendChild(modal);
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        showToast('error', 'Analysis Failed', error.message);
    }
}

/**
 * Create analysis modal
 */
function createAnalysisModal(analysisText) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal" style="max-width: 800px;">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-brain"></i>
                    AI Denial Analysis
                </div>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
                <div style="white-space: pre-wrap; line-height: 1.6; font-size: 14px;">
                    ${analysisText}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                    Close
                </button>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Review appeal letter with AI
 */
async function reviewAppealLetter() {
    if (!generatedLetterContent || !currentGenerationData) {
        alert('Generate a letter first before requesting AI review');
        return;
    }
    
    if (!chatBackend) {
        chatBackend = app.chatBackend;
    }
    
    try {
        showToast('info', 'Reviewing...', 'AI is reviewing your appeal letter for quality and compliance');
        
        const response = await chatBackend.reviewAppealLetter(
            generatedLetterContent,
            currentGenerationData
        );
        
        if (response.success) {
            const modal = createAnalysisModal(response.message);
            document.body.appendChild(modal);
        }
        
    } catch (error) {
        console.error('Review error:', error);
        showToast('error', 'Review Failed', error.message);
    }
}

/**
 * Get coding guidance from AI
 */
async function getCodingGuidance(procedure, diagnosis) {
    if (!chatBackend) {
        chatBackend = app.chatBackend;
    }
    
    if (!procedure || !diagnosis) {
        alert('Please specify both procedure and diagnosis');
        return;
    }
    
    try {
        const response = await chatBackend.getCodingGuidance(
            procedure,
            diagnosis,
            'Healthcare claim appeal'
        );
        
        if (response.success) {
            const modal = createAnalysisModal(response.message);
            document.body.appendChild(modal);
        }
        
    } catch (error) {
        console.error('Coding guidance error:', error);
        showToast('error', 'Request Failed', error.message);
    }
}

/**
 * Clear chat history
 */
function clearChatHistory() {
    if (chatBackend && confirm('Clear all chat history?')) {
        chatBackend.clearHistory();
        showToast('success', 'Cleared', 'Chat history cleared');
    }
}

/**
 * Export chat conversation
 */
function exportChatConversation() {
    if (!chatBackend) {
        alert('No chat history to export');
        return;
    }
    
    const conversation = chatBackend.exportConversation();
    
    const blob = new Blob([conversation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('success', 'Exported', 'Chat conversation downloaded');
}

// Initialize chat when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChat);
} else {
    initializeChat();
}
