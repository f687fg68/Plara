/**
 * Puter Session Manager
 * Handles conversation sessions, history, and UI
 */

class PuterSessionManager {
    constructor() {
        this.currentSessionId = null;
        this.sessions = [];
        this.sortOrder = 'newest'; // 'newest' or 'oldest'
        
        this.init();
    }
    
    /**
     * Initialize session manager
     */
    init() {
        this.setupEventListeners();
        this.loadCurrentSession();
        console.log('✅ Session Manager initialized');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // New session button
        const newSessionBtn = document.getElementById('newSessionBtn');
        if (newSessionBtn) {
            newSessionBtn.addEventListener('click', () => this.createNewSession());
        }
        
        // History button
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.openHistoryModal());
        }
        
        // Modal controls
        const closeModalBtn = document.getElementById('closeHistoryModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeHistoryModal());
        }
        
        const refreshBtn = document.getElementById('refreshHistoryBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshHistory());
        }
        
        const sortBtn = document.getElementById('sortHistoryBtn');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => this.toggleSort());
        }
        
        const clearAllBtn = document.getElementById('clearAllHistoryBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllHistory());
        }
        
        // Close modal on overlay click
        const modal = document.getElementById('sessionHistoryModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeHistoryModal();
                }
            });
        }
    }
    
    /**
     * Load current session from KV store
     */
    async loadCurrentSession() {
        try {
            if (!window.puterKV || !window.puterKV.isInitialized) {
                console.warn('PuterKV not initialized, using default session');
                this.currentSessionId = 'conv_' + Date.now();
                return;
            }
            
            const sessionState = await window.puterKV.loadSessionState();
            
            if (sessionState && sessionState.conversationId) {
                this.currentSessionId = sessionState.conversationId;
                
                // Load chat history for this session
                const history = await window.puterKV.loadChatHistory(this.currentSessionId);
                if (history && history.length > 0 && window.popupChatHistory) {
                    window.popupChatHistory = history;
                    console.log('✅ Restored session:', this.currentSessionId, `(${history.length} messages)`);
                }
            } else {
                // Create new session
                this.currentSessionId = 'conv_' + Date.now();
                await this.saveCurrentSession();
            }
            
            // Update current conversation ID in app.js
            if (window.currentConversationId !== undefined) {
                window.currentConversationId = this.currentSessionId;
            }
            
        } catch (error) {
            console.error('Failed to load current session:', error);
            this.currentSessionId = 'conv_' + Date.now();
        }
    }
    
    /**
     * Save current session to KV store
     */
    async saveCurrentSession() {
        try {
            if (!window.puterKV || !window.puterKV.isInitialized) return;
            
            await window.puterKV.saveSessionState({
                conversationId: this.currentSessionId,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Failed to save current session:', error);
        }
    }
    
    /**
     * Create new session
     */
    async createNewSession() {
        try {
            // Confirm if current session has messages
            if (window.popupChatHistory && window.popupChatHistory.length > 0) {
                const confirmed = confirm('Start a new conversation? Current chat will be saved to history.');
                if (!confirmed) return;
            }
            
            // Generate new session ID
            this.currentSessionId = 'conv_' + Date.now();
            
            // Clear current chat
            if (window.popupChatHistory) {
                window.popupChatHistory = [];
            }
            
            // Clear chat input
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = '';
                chatInput.style.height = 'auto';
            }
            
            // ✨ ENHANCED: Completely clear the editor to create blank page
            if (window.editorjs) {
                try {
                    await window.editorjs.clear();
                    // Also clear the output panel
                    const output = document.getElementById('ejOutput');
                    if (output) {
                        output.textContent = '';
                        output.parentElement?.classList.remove('visible');
                    }
                } catch (e) {
                    console.warn('Could not clear editor:', e);
                }
            }
            
            // Clear AI output area
            const aiOutput = document.getElementById('aiOutput');
            if (aiOutput) {
                aiOutput.innerHTML = '';
            }
            
            // Clear any attachment previews
            if (window.chatAttachments) {
                window.chatAttachments = [];
            }
            if (typeof window.renderChatAttachmentBar === 'function') {
                window.renderChatAttachmentBar();
            }
            
            // Save new session
            await this.saveCurrentSession();
            
            // Update global conversation ID
            if (window.currentConversationId !== undefined) {
                window.currentConversationId = this.currentSessionId;
            }
            
            this.showNotification('🆕 New blank session started', 'success');
            console.log('✅ New session created:', this.currentSessionId);
            
        } catch (error) {
            console.error('Failed to create new session:', error);
            this.showNotification('Failed to create new session', 'error');
        }
    }
    
    /**
     * Open history modal
     */
    async openHistoryModal() {
        const modal = document.getElementById('sessionHistoryModal');
        if (!modal) return;
        
        modal.classList.add('active');
        await this.loadHistory();
    }
    
    /**
     * Close history modal
     */
    closeHistoryModal() {
        const modal = document.getElementById('sessionHistoryModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    /**
     * Load history from KV store
     */
    async loadHistory() {
        const container = document.getElementById('sessionList');
        if (!container) return;
        
        // Show loading
        container.innerHTML = '<div class="session-loading"><div class="session-spinner"></div></div>';
        
        try {
            if (!window.puterKV || !window.puterKV.isInitialized) {
                throw new Error('PuterKV not initialized');
            }
            
            // Get all conversations
            this.sessions = await window.puterKV.listChatConversations();
            
            // Sort sessions
            this.sortSessions();
            
            // Render sessions
            this.renderSessions();
            
        } catch (error) {
            console.error('Failed to load history:', error);
            container.innerHTML = `
                <div class="session-empty-state">
                    <div class="session-empty-icon">⚠️</div>
                    <div class="session-empty-text">Failed to load history</div>
                    <div class="session-empty-subtext">${error.message}</div>
                </div>
            `;
        }
    }
    
    /**
     * Render sessions list
     */
    renderSessions() {
        const container = document.getElementById('sessionList');
        if (!container) return;
        
        if (this.sessions.length === 0) {
            container.innerHTML = `
                <div class="session-empty-state">
                    <div class="session-empty-icon">💬</div>
                    <div class="session-empty-text">No conversation history yet</div>
                    <div class="session-empty-subtext">Start chatting to create your first conversation</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        this.sessions.forEach(session => {
            const item = this.createSessionItem(session);
            container.appendChild(item);
        });
    }
    
    /**
     * Create session item element
     */
    createSessionItem(session) {
        const div = document.createElement('div');
        div.className = 'session-item';
        if (session.id === this.currentSessionId) {
            div.classList.add('active');
        }
        
        const date = new Date(session.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        div.innerHTML = `
            <div class="session-item-icon">💬</div>
            <div class="session-item-content">
                <div class="session-item-header">
                    <span class="session-item-id">${this.formatSessionId(session.id)}</span>
                    <span class="session-item-date">${dateStr}</span>
                </div>
                <div class="session-item-preview">${session.preview || 'Empty conversation'}</div>
                <div class="session-item-meta">
                    <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        ${session.messageCount} messages
                    </span>
                </div>
                <div class="session-item-actions">
                    <button class="session-item-action" data-action="load">Load</button>
                    <button class="session-item-action danger" data-action="delete">Delete</button>
                </div>
            </div>
        `;
        
        // Click to load
        div.addEventListener('click', (e) => {
            if (e.target.closest('.session-item-action')) return;
            this.loadSession(session.id);
        });
        
        // Action buttons
        const loadBtn = div.querySelector('[data-action="load"]');
        if (loadBtn) {
            loadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadSession(session.id);
            });
        }
        
        const deleteBtn = div.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(session.id);
            });
        }
        
        return div;
    }
    
    /**
     * Format session ID for display
     */
    formatSessionId(id) {
        // Extract timestamp from ID (format: conv_TIMESTAMP)
        const parts = id.split('_');
        if (parts.length > 1) {
            const timestamp = parseInt(parts[1]);
            if (!isNaN(timestamp)) {
                const date = new Date(timestamp);
                return `Session ${date.toLocaleDateString()}`;
            }
        }
        return id.substring(0, 20);
    }
    
    /**
     * Load a session
     */
    async loadSession(sessionId) {
        try {
            if (!window.puterKV || !window.puterKV.isInitialized) {
                throw new Error('PuterKV not initialized');
            }
            
            // Load chat history
            const history = await window.puterKV.loadChatHistory(sessionId);
            
            if (!history || history.length === 0) {
                this.showNotification('⚠️ Session is empty', 'warning');
                return;
            }
            
            // Update current session
            this.currentSessionId = sessionId;
            
            // Update global chat history
            if (window.popupChatHistory !== undefined) {
                window.popupChatHistory = history;
            }
            
            // Update global conversation ID
            if (window.currentConversationId !== undefined) {
                window.currentConversationId = sessionId;
            }
            
            // Save as current session
            await this.saveCurrentSession();
            
            // Close modal
            this.closeHistoryModal();
            
            this.showNotification(`📂 Loaded session (${history.length} messages)`, 'success');
            console.log('✅ Loaded session:', sessionId);
            
        } catch (error) {
            console.error('Failed to load session:', error);
            this.showNotification('Failed to load session', 'error');
        }
    }
    
    /**
     * Delete a session
     */
    async deleteSession(sessionId) {
        const confirmed = confirm('Delete this conversation? This cannot be undone.');
        if (!confirmed) return;
        
        try {
            if (!window.puterKV || !window.puterKV.isInitialized) {
                throw new Error('PuterKV not initialized');
            }
            
            await window.puterKV.deleteChatHistory(sessionId);
            
            // If this was the current session, create a new one
            if (sessionId === this.currentSessionId) {
                await this.createNewSession();
            }
            
            // Refresh history
            await this.loadHistory();
            
            this.showNotification('🗑️ Session deleted', 'success');
            
        } catch (error) {
            console.error('Failed to delete session:', error);
            this.showNotification('Failed to delete session', 'error');
        }
    }
    
    /**
     * Refresh history
     */
    async refreshHistory() {
        await this.loadHistory();
        this.showNotification('🔄 History refreshed', 'info');
    }
    
    /**
     * Toggle sort order
     */
    toggleSort() {
        this.sortOrder = this.sortOrder === 'newest' ? 'oldest' : 'newest';
        this.sortSessions();
        this.renderSessions();
        
        const btn = document.getElementById('sortHistoryBtn');
        if (btn) {
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" y1="6" x2="20" y2="6"/>
                    <line x1="4" y1="12" x2="20" y2="12"/>
                    <line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
                ${this.sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
            `;
        }
    }
    
    /**
     * Sort sessions
     */
    sortSessions() {
        this.sessions.sort((a, b) => {
            if (this.sortOrder === 'newest') {
                return b.timestamp - a.timestamp;
            } else {
                return a.timestamp - b.timestamp;
            }
        });
    }
    
    /**
     * Clear all history
     */
    async clearAllHistory() {
        const confirmed = confirm('Delete ALL conversation history? This cannot be undone.');
        if (!confirmed) return;
        
        try {
            if (!window.puterKV || !window.puterKV.isInitialized) {
                throw new Error('PuterKV not initialized');
            }
            
            // Delete all sessions
            for (const session of this.sessions) {
                await window.puterKV.deleteChatHistory(session.id);
            }
            
            // Create new session
            await this.createNewSession();
            
            // Refresh history
            await this.loadHistory();
            
            this.showNotification('🗑️ All history cleared', 'success');
            
        } catch (error) {
            console.error('Failed to clear history:', error);
            this.showNotification('Failed to clear history', 'error');
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize session manager when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for other components to initialize
        setTimeout(() => {
            window.sessionManager = new PuterSessionManager();
            console.log('✅ Session Manager ready');
        }, 500);
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuterSessionManager;
}
