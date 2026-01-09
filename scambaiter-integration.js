/**
 * ScamBaiter Pro - Chat Integration Module
 * Connects ScamBaiter AI Engine with existing chat interface
 * Command: /scambait
 */

(async function() {
    'use strict';

    // Initialize ScamBaiter Engine
    let scamBaiterEngine = null;
    let scamBaiterWriter = null;
    let scamBaiterDisplay = null;

    /**
     * Initialize all ScamBaiter modules
     */
    async function initializeScamBaiter() {
        try {
            // Initialize AI Engine
            if (typeof ScamBaiterAIEngine !== 'undefined') {
                scamBaiterEngine = new ScamBaiterAIEngine();
                await scamBaiterEngine.initialize();
            } else {
                console.warn('ScamBaiterAIEngine not loaded');
                return false;
            }

            // Initialize Response Writer
            if (typeof ScamBaiterResponseWriter !== 'undefined') {
                scamBaiterWriter = new ScamBaiterResponseWriter();
                await scamBaiterWriter.initialize(scamBaiterEngine);
            } else {
                console.warn('ScamBaiterResponseWriter not loaded');
                return false;
            }

            // Initialize Display
            if (typeof ScamBaiterDisplay !== 'undefined') {
                scamBaiterDisplay = new ScamBaiterDisplay();
                await scamBaiterDisplay.initialize();
            } else {
                console.warn('ScamBaiterDisplay not loaded');
                return false;
            }

            console.log('✅ ScamBaiter Pro initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ ScamBaiter initialization failed:', error);
            return false;
        }
    }

    /**
     * Handle /scambait command from chat
     */
    window.scamBaiterCommandHandler = async function(rawCommand) {
        const command = rawCommand.trim();

        // Parse command
        const parts = command.split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        // /scambait help - Show help
        if (subCommand === 'help' || !subCommand) {
            showScamBaiterHelp();
            return;
        }

        // /scambait start - Start ScamBaiter mode
        if (subCommand === 'start') {
            await startScamBaiterMode();
            return;
        }

        // /scambait generate <scam message> - Quick generate
        if (subCommand === 'generate') {
            const scamMessage = parts.slice(2).join(' ');
            if (!scamMessage) {
                showNotification('❌ Please provide a scam message', 'error');
                return;
            }
            await quickGenerateResponse(scamMessage);
            return;
        }

        // /scambait tone <tone-id> - Set tone
        if (subCommand === 'tone') {
            const toneId = parts[2]?.toLowerCase();
            if (!toneId) {
                showAvailableTones();
                return;
            }
            setScamBaiterTone(toneId);
            return;
        }

        // /scambait template <template-name> - Load template
        if (subCommand === 'template') {
            const templateName = parts.slice(2).join(' ');
            if (!templateName) {
                showAvailableTemplates();
                return;
            }
            loadScamTemplate(templateName);
            return;
        }

        // /scambait stats - Show statistics
        if (subCommand === 'stats') {
            showScamBaiterStats();
            return;
        }

        // Default: Show help
        showScamBaiterHelp();
    };

    /**
     * Show ScamBaiter help message
     */
    function showScamBaiterHelp() {
        const helpHTML = `
            <div class="scambait-help">
                <h3>🎣 ScamBaiter Pro - AI Scam Response Generator</h3>
                <p>Generate time-wasting responses to scam emails using AI</p>
                
                <h4>Available Commands:</h4>
                <ul>
                    <li><code>/scambait start</code> - Start interactive ScamBaiter mode</li>
                    <li><code>/scambait generate &lt;message&gt;</code> - Quick generate response</li>
                    <li><code>/scambait tone &lt;id&gt;</code> - Set personality tone</li>
                    <li><code>/scambait template</code> - List available scam templates</li>
                    <li><code>/scambait stats</code> - View generation statistics</li>
                    <li><code>/scambait help</code> - Show this help</li>
                </ul>

                <h4>Available Tones:</h4>
                <ul>
                    <li>👵 <code>elderly</code> - Confused Elderly Person</li>
                    <li>🤩 <code>enthusiastic</code> - Overly Enthusiastic</li>
                    <li>🕵️ <code>paranoid</code> - Paranoid Conspiracy Theorist</li>
                    <li>💻 <code>techilliterate</code> - Tech Illiterate</li>
                    <li>📋 <code>bureaucrat</code> - Bureaucratic Nightmare</li>
                    <li>📖 <code>storyteller</code> - Rambling Storyteller</li>
                    <li>🤔 <code>skeptical</code> - Skeptical Professor</li>
                    <li>⚖️ <code>lawyer</code> - Amateur Lawyer</li>
                    <li>🎲 <code>chaotic</code> - Chaotic Random</li>
                    <li>🌍 <code>foreign</code> - Translation Issues</li>
                    <li>🙏 <code>religious</code> - Overly Religious</li>
                    <li>🤝 <code>competitor</code> - Fellow Scammer</li>
                </ul>

                <h4>Safety Notice:</h4>
                <p>⚠️ Never share real personal information. All generated details are fictional.</p>
                <p>📚 For entertainment and educational purposes only.</p>
            </div>
        `;

        appendChatMessage('assistant', helpHTML, { isHTML: true });
    }

    /**
     * Start interactive ScamBaiter mode
     */
    async function startScamBaiterMode() {
        if (!scamBaiterEngine || !scamBaiterWriter || !scamBaiterDisplay) {
            const initialized = await initializeScamBaiter();
            if (!initialized) {
                showNotification('❌ Failed to initialize ScamBaiter Pro', 'error');
                return;
            }
        }

        // Inject ScamBaiter UI into chat
        const chatContainer = document.getElementById('notionChatMessages');
        if (!chatContainer) {
            showNotification('❌ Chat container not found', 'error');
            return;
        }

        // Create ScamBaiter UI container
        const scambaiterContainer = document.createElement('div');
        scambaiterContainer.id = 'scambaiter-chat-mode';
        scambaiterContainer.className = 'scambaiter-mode-active';

        // Inject display styles
        const styleEl = document.createElement('style');
        styleEl.textContent = scamBaiterDisplay.getStyles();
        document.head.appendChild(styleEl);

        // Inject UI
        scamBaiterDisplay.injectScamBaiterUI(scambaiterContainer);
        chatContainer.appendChild(scambaiterContainer);

        // Render tones and templates
        const tones = scamBaiterEngine.getTones();
        const templates = scamBaiterEngine.getTemplates();
        
        scamBaiterDisplay.renderToneSelector(tones);
        scamBaiterDisplay.renderTemplateSelector(templates);

        // Setup event listeners
        setupScamBaiterEventListeners();

        showNotification('🎣 ScamBaiter Pro activated!', 'success');
    }

    /**
     * Setup event listeners for ScamBaiter UI
     */
    function setupScamBaiterEventListeners() {
        // Tone changed
        document.addEventListener('scambaiter:tone-changed', (e) => {
            const { toneId } = e.detail;
            window.scamBaiterState.currentTone = toneId;
            
            const tone = scamBaiterEngine.getTones().find(t => t.id === toneId);
            if (tone) {
                showNotification(`🎭 Tone set to: ${tone.name}`, 'success');
            }
        });

        // Template loaded
        document.addEventListener('scambaiter:template-loaded', (e) => {
            const { template } = e.detail;
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = template.content;
                chatInput.style.height = 'auto';
                chatInput.style.height = (chatInput.scrollHeight) + 'px';
                showNotification(`📑 Template loaded: ${template.type}`, 'success');
            }
        });

        // Status changed
        document.addEventListener('scambaiter:status-changed', (e) => {
            const { isGenerating, statusText } = e.detail;
            if (isGenerating && statusText) {
                showNotification(statusText, 'info');
            }
        });

        // Response chunk (streaming)
        document.addEventListener('scambaiter:response-chunk', (e) => {
            const { chunk, fullResponse } = e.detail;
            // Update UI with streaming response
            updateStreamingResponse(fullResponse);
        });

        // Response complete
        document.addEventListener('scambaiter:response-complete', (e) => {
            const responseData = e.detail;
            displayFinalScamBaitResponse(responseData);
        });

        // Error
        document.addEventListener('scambaiter:error', (e) => {
            const { message } = e.detail;
            showNotification(message, 'error');
        });
    }

    /**
     * Quick generate response
     */
    async function quickGenerateResponse(scamMessage) {
        if (!scamBaiterEngine || !scamBaiterWriter) {
            await initializeScamBaiter();
        }

        try {
            showNotification('🎣 Generating scam bait response...', 'info');

            const settings = window.scamBaiterState?.settings || {
                absurdity: 50,
                length: 50,
                fakeDetails: true,
                questions: true
            };

            const options = {
                tone: window.scamBaiterState?.currentTone || 'elderly',
                model: window.scamBaiterState?.selectedModel || 'gemini-2.0-flash-exp',
                tier: 'free',
                ...settings
            };

            // Generate with streaming
            let streamingResponse = '';
            const streamingMessageDiv = appendChatMessage('assistant', '', { streaming: true });

            const result = await scamBaiterWriter.generateResponse(
                scamMessage,
                options,
                (chunk, fullText) => {
                    streamingResponse = fullText;
                    updateChatMessage(streamingMessageDiv, fullText);
                }
            );

            // Update with final response
            updateChatMessage(streamingMessageDiv, result.response, { 
                streaming: false,
                metadata: {
                    tone: result.tone.name,
                    emoji: result.tone.emoji,
                    model: result.model,
                    timeWasted: result.timeWasted,
                    wordCount: result.wordCount
                }
            });

            // Store in state
            if (window.scamBaiterState) {
                window.scamBaiterState.currentResponse = result.response;
                window.scamBaiterState.currentScam = scamMessage;
                window.scamBaiterState.history.push({
                    scam: scamMessage,
                    response: result.response,
                    tone: result.tone.id,
                    timestamp: new Date().toISOString()
                });
            }

            showNotification(`✅ Generated ${result.wordCount} words (Est. ${result.timeWasted}min wasted)`, 'success');

        } catch (error) {
            console.error('ScamBait generation error:', error);
            showNotification('❌ Failed to generate response: ' + error.message, 'error');
        }
    }

    /**
     * Set ScamBaiter tone
     */
    function setScamBaiterTone(toneId) {
        if (!scamBaiterEngine) {
            showNotification('❌ ScamBaiter not initialized', 'error');
            return;
        }

        const tone = scamBaiterEngine.getTones().find(t => t.id === toneId);
        if (!tone) {
            showNotification(`❌ Unknown tone: ${toneId}`, 'error');
            showAvailableTones();
            return;
        }

        if (window.scamBaiterState) {
            window.scamBaiterState.currentTone = toneId;
        }

        showNotification(`🎭 Tone set to: ${tone.emoji} ${tone.name}`, 'success');
    }

    /**
     * Show available tones
     */
    function showAvailableTones() {
        if (!scamBaiterEngine) return;

        const tones = scamBaiterEngine.getTones();
        const tonesHTML = `
            <div class="scambait-tones">
                <h4>Available Tones:</h4>
                <ul>
                    ${tones.map(t => `
                        <li><code>/scambait tone ${t.id}</code> - ${t.emoji} ${t.name}</li>
                    `).join('')}
                </ul>
            </div>
        `;

        appendChatMessage('assistant', tonesHTML, { isHTML: true });
    }

    /**
     * Show available templates
     */
    function showAvailableTemplates() {
        if (!scamBaiterEngine) return;

        const templates = scamBaiterEngine.getTemplates();
        const templatesHTML = `
            <div class="scambait-templates">
                <h4>Available Templates:</h4>
                <ul>
                    ${templates.map((t, i) => `
                        <li><strong>${t.type}</strong>: ${t.title}</li>
                    `).join('')}
                </ul>
                <p>Use <code>/scambait template &lt;type&gt;</code> to load a template into chat input.</p>
            </div>
        `;

        appendChatMessage('assistant', templatesHTML, { isHTML: true });
    }

    /**
     * Load scam template
     */
    function loadScamTemplate(templateName) {
        if (!scamBaiterEngine) return;

        const templates = scamBaiterEngine.getTemplates();
        const template = templates.find(t => 
            t.type.toLowerCase().includes(templateName.toLowerCase()) ||
            t.title.toLowerCase().includes(templateName.toLowerCase())
        );

        if (!template) {
            showNotification(`❌ Template not found: ${templateName}`, 'error');
            showAvailableTemplates();
            return;
        }

        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = template.content;
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            showNotification(`📑 Loaded: ${template.type}`, 'success');
        }
    }

    /**
     * Show ScamBaiter statistics
     */
    function showScamBaiterStats() {
        if (!scamBaiterEngine) {
            showNotification('❌ ScamBaiter not initialized', 'error');
            return;
        }

        const stats = scamBaiterEngine.getStats();
        const history = window.scamBaiterState?.history || [];

        const statsHTML = `
            <div class="scambait-stats">
                <h3>📊 ScamBaiter Pro Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalGenerated}</div>
                        <div class="stat-label">Total Responses Generated</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.floor(stats.timeWasted / 60)}h ${stats.timeWasted % 60}m</div>
                        <div class="stat-label">Est. Scammer Time Wasted</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${history.length}</div>
                        <div class="stat-label">Session Responses</div>
                    </div>
                </div>
                ${history.length > 0 ? `
                    <h4>Recent History:</h4>
                    <ul class="history-list">
                        ${history.slice(-5).reverse().map(h => {
                            const tone = scamBaiterEngine.getTones().find(t => t.id === h.tone);
                            return `<li>${tone?.emoji || '🎣'} ${tone?.name || h.tone} - ${new Date(h.timestamp).toLocaleString()}</li>`;
                        }).join('')}
                    </ul>
                ` : ''}
            </div>
        `;

        appendChatMessage('assistant', statsHTML, { isHTML: true });
    }

    /**
     * Helper: Append chat message
     */
    function appendChatMessage(role, content, options = {}) {
        const container = document.getElementById('notionChatMessages');
        if (!container) return null;

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message`;

        if (role === 'assistant') {
            msgDiv.innerHTML = `
                <div class="message-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.4 7.2L19.6 9.6L14.4 12L12 17.2L9.6 12L4.4 9.6L9.6 7.2L12 2Z" />
                    </svg>
                </div>
                <div class="message-content">${options.isHTML ? content : formatMessageText(content)}</div>
            `;
        } else {
            msgDiv.innerHTML = `<div class="message-content">${formatMessageText(content)}</div>`;
        }

        if (options.streaming) {
            msgDiv.classList.add('streaming');
        }

        container.appendChild(msgDiv);
        scrollToNotionBottom();

        return msgDiv;
    }

    /**
     * Helper: Update chat message
     */
    function updateChatMessage(msgDiv, content, options = {}) {
        if (!msgDiv) return;

        const contentDiv = msgDiv.querySelector('.message-content');
        if (!contentDiv) return;

        contentDiv.textContent = content;

        if (options.streaming === false) {
            msgDiv.classList.remove('streaming');
        }

        if (options.metadata) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'response-metadata';
            metaDiv.innerHTML = `
                <span class="meta-badge">${options.metadata.emoji} ${options.metadata.tone}</span>
                <span class="meta-badge">📝 ${options.metadata.wordCount} words</span>
                <span class="meta-badge">⏱️ ${options.metadata.timeWasted}min wasted</span>
                <span class="meta-badge">🤖 ${options.metadata.model}</span>
            `;
            msgDiv.appendChild(metaDiv);
        }

        scrollToNotionBottom();
    }

    /**
     * Helper: Update streaming response
     */
    function updateStreamingResponse(text) {
        const container = document.getElementById('notionChatMessages');
        if (!container) return;

        const lastMessage = container.querySelector('.message.assistant-message:last-child');
        if (!lastMessage) return;

        const contentDiv = lastMessage.querySelector('.message-content');
        if (contentDiv) {
            contentDiv.textContent = text;
            scrollToNotionBottom();
        }
    }

    /**
     * Helper: Display final scam bait response
     */
    function displayFinalScamBaitResponse(responseData) {
        // This is handled by updateChatMessage with metadata
    }

    /**
     * Helper: Format message text
     */
    function formatMessageText(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, '<br>');
    }

    /**
     * Helper: Scroll to bottom of chat
     */
    function scrollToNotionBottom() {
        const body = document.getElementById('notionChatBody');
        if (body) body.scrollTop = body.scrollHeight;
    }

    /**
     * Helper: Show notification (uses existing function)
     */
    function showNotification(message, type) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScamBaiter);
    } else {
        initializeScamBaiter();
    }

    console.log('✅ ScamBaiter Pro integration module loaded');

})();
