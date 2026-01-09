/**
 * PatentProse AI Application
 * Main application controller integrating all backend systems
 */

class PatentProseApp {
    constructor() {
        this.aiEngine = null;
        this.chatBackend = null;
        this.storage = null;
        this.initialized = false;
        this.currentPage = 'chat';
        this.currentContext = null;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('🚀 Starting PatentProse AI Application...');
            
            this.updateLoadingStatus('Initializing Puter.js...');
            
            // Wait for Puter to be ready
            if (typeof puter === 'undefined') {
                throw new Error('Puter.js not loaded');
            }

            await puter.auth.ready();

            // Initialize components
            this.updateLoadingStatus('Loading AI Engine...');
            this.aiEngine = new PatentProseAI();
            await this.aiEngine.initialize();

            this.updateLoadingStatus('Connecting to storage...');
            this.storage = new PatentProseStorage();
            await this.storage.initialize();

            this.updateLoadingStatus('Starting chat backend...');
            this.chatBackend = new PatentProseChat(this.aiEngine);
            await this.chatBackend.initialize();

            this.updateLoadingStatus('Setting up UI...');
            this.setupEventListeners();
            this.loadInitialData();

            // Hide loading screen and show app
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
                document.getElementById('appContainer').classList.add('active');
                this.initialized = true;
                console.log('✅ PatentProse AI ready!');
                this.showToast('success', 'Welcome to PatentProse AI', 'AI engine ready');
            }, 500);

        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.updateLoadingStatus('Initialization failed. Please refresh the page.');
            this.showToast('error', 'Initialization Error', error.message);
        }
    }

    /**
     * Update loading screen status
     */
    updateLoadingStatus(status) {
        const statusEl = document.getElementById('loadingStatus');
        if (statusEl) {
            statusEl.textContent = status;
        }
        console.log('📊', status);
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                if (page) {
                    this.navigateTo(page);
                }
            });
        });

        // Chat input
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        chatInput.addEventListener('input', () => {
            this.autoResizeTextarea(chatInput);
        });

        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Clear chat
        document.getElementById('clearChatBtn').addEventListener('click', () => {
            this.clearChat();
        });

        // New case button
        document.getElementById('newCaseBtn').addEventListener('click', () => {
            this.createNewCase();
        });

        // Global search
        document.getElementById('globalSearch').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Suggestion chips (will be dynamically added)
        this.setupSuggestionListeners();
    }

    /**
     * Setup suggestion chip listeners
     */
    setupSuggestionListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-chip')) {
                const suggestion = e.target.textContent;
                document.getElementById('chatInput').value = suggestion;
                this.sendMessage();
            }
        });
    }

    /**
     * Navigate to page
     */
    navigateTo(page) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Update page content
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.remove('active');
        });

        const pageEl = document.getElementById(`page-${page}`);
        if (pageEl) {
            pageEl.classList.add('active');
        }

        // Update page title
        const titles = {
            'chat': 'AI Assistant',
            'generator': 'Response Generator',
            'cases': 'Cases',
            'examiner': 'Examiner Database',
            'research': 'Legal Research',
            'responses': 'Saved Responses',
            'templates': 'Templates'
        };

        document.getElementById('pageTitle').textContent = titles[page] || 'PatentProse AI';
        this.currentPage = page;
    }

    /**
     * Send chat message
     */
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Clear input
        input.value = '';
        this.autoResizeTextarea(input);

        // Add user message to chat
        this.addMessageToChat('user', message);

        // Disable send button
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send to chat backend with streaming
            let fullResponse = '';
            const response = await this.chatBackend.sendMessage(
                message,
                this.currentContext,
                (chunk) => {
                    if (chunk.done) {
                        this.removeTypingIndicator();
                        this.addMessageToChat('assistant', chunk.fullText);
                        this.updateSuggestions();
                        this.updateContextDisplay();
                    } else {
                        fullResponse = chunk.fullText;
                        this.updateStreamingMessage(fullResponse);
                    }
                }
            );

            // If no streaming callback was used
            if (!response.metadata?.streaming) {
                this.removeTypingIndicator();
                this.addMessageToChat('assistant', response.text);
                this.updateSuggestions();
                this.updateContextDisplay();
            }

            // Handle special metadata
            if (response.metadata?.response) {
                // A full response was generated
                this.handleGeneratedResponse(response.metadata.response);
            }

        } catch (error) {
            console.error('Send message error:', error);
            this.removeTypingIndicator();
            this.addMessageToChat('assistant', 'I encountered an error. Please try again.');
            this.showToast('error', 'Error', 'Failed to process message');
        } finally {
            sendBtn.disabled = false;
        }
    }

    /**
     * Add message to chat display
     */
    addMessageToChat(role, text) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const content = document.createElement('div');
        content.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = text;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(new Date());

        content.appendChild(messageText);
        content.appendChild(time);

        messageEl.appendChild(avatar);
        messageEl.appendChild(content);

        messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        
        const indicator = document.createElement('div');
        indicator.className = 'message';
        indicator.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        indicator.appendChild(avatar);
        indicator.appendChild(content);

        messagesContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    /**
     * Remove typing indicator
     */
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Update streaming message (for real-time updates)
     */
    updateStreamingMessage(text) {
        let streamingMsg = document.getElementById('streamingMessage');
        
        if (!streamingMsg) {
            this.removeTypingIndicator();
            
            const messagesContainer = document.getElementById('chatMessages');
            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            messageEl.id = 'streamingMessage';

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.innerHTML = '<i class="fas fa-robot"></i>';

            const content = document.createElement('div');
            content.className = 'message-content';
            content.innerHTML = '<div class="message-text"></div>';

            messageEl.appendChild(avatar);
            messageEl.appendChild(content);

            messagesContainer.appendChild(messageEl);
            streamingMsg = messageEl;
        }

        const textEl = streamingMsg.querySelector('.message-text');
        if (textEl) {
            textEl.textContent = text;
        }

        this.scrollToBottom();
    }

    /**
     * Update suggestions based on context
     */
    updateSuggestions() {
        const suggestions = this.chatBackend.getQuickSuggestions();
        const container = document.getElementById('suggestions');

        container.innerHTML = '';

        suggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            container.appendChild(chip);
        });
    }

    /**
     * Update context display
     */
    updateContextDisplay() {
        const contextInfo = document.getElementById('contextInfo');
        
        if (!this.chatBackend.currentContext) {
            contextInfo.innerHTML = `
                <div class="empty-state" style="padding: 20px;">
                    <div class="empty-icon"><i class="fas fa-info-circle"></i></div>
                    <div class="empty-desc">No active case</div>
                </div>
            `;
            return;
        }

        const ctx = this.chatBackend.currentContext;
        contextInfo.innerHTML = `
            <div class="context-item">
                <span class="context-label">Application No.</span>
                <span class="context-value">${ctx.applicationNumber || 'N/A'}</span>
            </div>
            <div class="context-item">
                <span class="context-label">Jurisdiction</span>
                <span class="context-value">${ctx.jurisdiction || 'USPTO'}</span>
            </div>
            <div class="context-item">
                <span class="context-label">Rejection Types</span>
                <span class="context-value">${ctx.rejectionTypes?.join(', ') || 'None'}</span>
            </div>
            <div class="context-item">
                <span class="context-label">Status</span>
                <span class="context-value">${ctx.status || 'Active'}</span>
            </div>
        `;
    }

    /**
     * Clear chat
     */
    async clearChat() {
        const confirm = await this.showConfirm('Clear all messages?', 'This will clear the conversation history.');
        if (!confirm) return;

        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">Chat cleared. How can I help you?</div>
                    <div class="message-time">${this.formatTime(new Date())}</div>
                </div>
            </div>
        `;

        await this.chatBackend.clearHistory();
        this.updateSuggestions();
        this.showToast('success', 'Chat Cleared', 'Conversation history cleared');
    }

    /**
     * Handle generated response
     */
    async handleGeneratedResponse(response) {
        // Save response
        await this.storage.saveResponse(response);
        
        // Show success notification
        this.showToast('success', 'Response Generated', 
            `${response.metadata.wordCount} words generated in ${((Date.now() - response.metadata.generationTime) / 1000).toFixed(1)}s`);
        
        // Update UI
        this.updateSuggestions();
    }

    /**
     * Create new case
     */
    async createNewCase() {
        // For now, show a simple prompt
        const appNumber = prompt('Enter application number:');
        if (!appNumber) return;

        const caseData = {
            applicationNumber: appNumber,
            title: prompt('Enter invention title:') || 'Untitled',
            jurisdiction: 'USPTO',
            status: 'active',
            clientName: prompt('Enter client name:') || 'Unknown',
            createdAt: new Date().toISOString()
        };

        try {
            const caseId = await this.storage.saveCase(caseData);
            this.showToast('success', 'Case Created', `Case ${appNumber} created successfully`);
            
            // Update context
            this.chatBackend.updateContext(caseData);
            this.updateContextDisplay();
            this.loadCases();
        } catch (error) {
            this.showToast('error', 'Error', 'Failed to create case');
        }
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        this.updateSuggestions();
        this.loadCases();
    }

    /**
     * Load cases
     */
    async loadCases() {
        try {
            const cases = await this.storage.getAllCases();
            
            // Update badge
            document.getElementById('casesBadge').textContent = cases.length;

            // Update cases page
            const casesContainer = document.getElementById('casesContainer');
            
            if (cases.length === 0) {
                casesContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-briefcase"></i></div>
                        <div class="empty-title">No Cases Yet</div>
                        <div class="empty-desc">Create your first case to get started</div>
                    </div>
                `;
                return;
            }

            casesContainer.innerHTML = cases.map(c => `
                <div class="card" style="margin-bottom: 16px;">
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <div style="font-weight: 600; margin-bottom: 8px;">${c.title}</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">
                                    ${c.applicationNumber} • ${c.jurisdiction}
                                </div>
                            </div>
                            <button class="btn btn-sm" style="background: var(--primary);" 
                                    onclick="app.openCase('${c.id}')">
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Load cases error:', error);
        }
    }

    /**
     * Open case
     */
    async openCase(caseId) {
        try {
            const caseData = await this.storage.loadCase(caseId);
            if (!caseData) {
                this.showToast('error', 'Error', 'Case not found');
                return;
            }

            this.chatBackend.updateContext(caseData);
            this.updateContextDisplay();
            this.navigateTo('chat');
            
            // Add system message
            this.addMessageToChat('assistant', 
                `I've loaded the case for ${caseData.applicationNumber} - ${caseData.title}. How can I help with this case?`);

        } catch (error) {
            console.error('Open case error:', error);
            this.showToast('error', 'Error', 'Failed to open case');
        }
    }

    /**
     * Handle search
     */
    async handleSearch(query) {
        if (query.length < 2) return;

        // Implement debounced search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            const results = await this.storage.search(query);
            console.log('Search results:', results);
            // TODO: Display search results
        }, 300);
    }

    /**
     * Show toast notification
     */
    showToast(type, title, message) {
        const container = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    /**
     * Show confirm dialog (simple implementation)
     */
    async showConfirm(title, message) {
        return confirm(`${title}\n\n${message}`);
    }

    /**
     * Auto resize textarea
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Format time
     */
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }
}

// Initialize app when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new PatentProseApp();
    app.initialize();
});

// Expose app globally for debugging
window.app = app;
