/**
 * CivilReply - Chat Integration Module
 * Connects CivilReply AI Engine with existing chat interface
 * Command: /civilreply
 */

(async function() {
    'use strict';

    // Initialize CivilReply modules
    let civilReplyEngine = null;
    let civilReplyWriter = null;
    let civilReplyDisplay = null;

    /**
     * Initialize all CivilReply modules
     */
    async function initializeCivilReply() {
        try {
            // Initialize AI Engine
            if (typeof CivilReplyAIEngine !== 'undefined') {
                civilReplyEngine = new CivilReplyAIEngine();
                await civilReplyEngine.initialize();
            } else {
                console.warn('CivilReplyAIEngine not loaded');
                return false;
            }

            // Initialize Response Writer
            if (typeof CivilReplyResponseWriter !== 'undefined') {
                civilReplyWriter = new CivilReplyResponseWriter();
                await civilReplyWriter.initialize(civilReplyEngine);
            } else {
                console.warn('CivilReplyResponseWriter not loaded');
                return false;
            }

            // Initialize Display
            if (typeof CivilReplyDisplay !== 'undefined') {
                civilReplyDisplay = new CivilReplyDisplay();
                await civilReplyDisplay.initialize();
            } else {
                console.warn('CivilReplyDisplay not loaded');
                return false;
            }

            console.log('✅ CivilReply initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ CivilReply initialization failed:', error);
            return false;
        }
    }

    /**
     * Handle /civilreply command from chat
     */
    window.civilReplyCommandHandler = async function(rawCommand) {
        const command = rawCommand.trim();
        const parts = command.split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        // /civilreply help - Show help
        if (subCommand === 'help' || !subCommand) {
            showCivilReplyHelp();
            return;
        }

        // /civilreply start - Start CivilReply mode
        if (subCommand === 'start') {
            await startCivilReplyMode();
            return;
        }

        // /civilreply generate <comment> - Quick generate
        if (subCommand === 'generate') {
            const comment = parts.slice(2).join(' ');
            if (!comment) {
                showNotification('❌ Please provide a political comment', 'error');
                return;
            }
            await quickGenerateResponse(comment);
            return;
        }

        // /civilreply tone <tone-id> - Set tone
        if (subCommand === 'tone') {
            const toneId = parts[2]?.toLowerCase();
            if (!toneId) {
                showAvailableTones();
                return;
            }
            setCivilReplyTone(toneId);
            return;
        }

        // /civilreply stance <stance> - Set stance
        if (subCommand === 'stance') {
            const stance = parts[2]?.toLowerCase();
            if (!stance) {
                showNotification('Available stances: neutral, agree, disagree', 'info');
                return;
            }
            setCivilReplyStance(stance);
            return;
        }

        // /civilreply stats - Show statistics
        if (subCommand === 'stats') {
            showCivilReplyStats();
            return;
        }

        // Default: Show help
        showCivilReplyHelp();
    };

    /**
     * Show CivilReply help message
     */
    function showCivilReplyHelp() {
        const helpHTML = `
            <div class="civilreply-help">
                <h3>🕊️ CivilReply - AI Political Discourse Generator</h3>
                <p>Generate civil, balanced responses to political arguments using AI</p>
                
                <h4>Available Commands:</h4>
                <ul>
                    <li><code>/civilreply start</code> - Start interactive CivilReply mode</li>
                    <li><code>/civilreply generate &lt;comment&gt;</code> - Quick generate response</li>
                    <li><code>/civilreply tone &lt;id&gt;</code> - Set response tone</li>
                    <li><code>/civilreply stance &lt;position&gt;</code> - Set your stance</li>
                    <li><code>/civilreply stats</code> - View generation statistics</li>
                    <li><code>/civilreply help</code> - Show this help</li>
                </ul>

                <h4>Available Tones:</h4>
                <ul>
                    <li>🤝 <code>diplomatic</code> - Professional, measured approach</li>
                    <li>💙 <code>empathetic</code> - Warm, emotionally aware</li>
                    <li>📊 <code>factual</code> - Data-driven, evidence-based</li>
                    <li>🌉 <code>bridge-building</code> - Finds common ground</li>
                </ul>

                <h4>Stance Options:</h4>
                <ul>
                    <li>⚖️ <code>neutral</code> - Present balanced view (default)</li>
                    <li>✅ <code>agree</code> - Support their view but de-escalate tone</li>
                    <li>❌ <code>disagree</code> - Oppose respectfully with counterpoints</li>
                </ul>

                <h4>AI Models:</h4>
                <ul>
                    <li>💎 <strong>Gemini 3.0 Pro</strong> - Fast, balanced responses</li>
                    <li>🧠 <strong>Claude Sonnet 4.5</strong> - Superior reasoning, nuanced</li>
                    <li>⚡ <strong>Auto-Select</strong> - Best model for chosen tone</li>
                </ul>

                <h4>Example Usage:</h4>
                <pre><code>/civilreply generate Anyone who supports [policy] is clearly an idiot!</code></pre>
                
                <h4>Safety Notice:</h4>
                <p>⚠️ This tool generates constructive responses to facilitate civil political dialogue. Always fact-check claims and engage in good faith.</p>
            </div>
        `;

        appendChatMessage('assistant', helpHTML, { isHTML: true });
    }

    /**
     * Start interactive CivilReply mode
     */
    async function startCivilReplyMode() {
        if (!civilReplyEngine || !civilReplyWriter || !civilReplyDisplay) {
            const initialized = await initializeCivilReply();
            if (!initialized) {
                showNotification('❌ Failed to initialize CivilReply', 'error');
                return;
            }
        }

        // Inject CivilReply UI into chat
        const chatContainer = document.getElementById('notionChatMessages');
        if (!chatContainer) {
            showNotification('❌ Chat container not found', 'error');
            return;
        }

        // Create CivilReply UI container
        const civilReplyContainer = document.createElement('div');
        civilReplyContainer.id = 'civilreply-chat-mode';
        civilReplyContainer.className = 'civilreply-mode-active';

        // Inject display styles
        const styleEl = document.createElement('style');
        styleEl.textContent = civilReplyDisplay.getStyles();
        document.head.appendChild(styleEl);

        // Inject UI
        civilReplyDisplay.injectCivilReplyUI(civilReplyContainer);
        chatContainer.appendChild(civilReplyContainer);

        // Render tones
        const tones = civilReplyEngine.getTones();
        civilReplyDisplay.renderToneSelector(tones);

        // Setup event listeners
        setupCivilReplyEventListeners();

        showNotification('🕊️ CivilReply activated!', 'success');
    }

    /**
     * Setup event listeners for CivilReply UI
     */
    function setupCivilReplyEventListeners() {
        // Tone changed
        document.addEventListener('civilreply:tone-changed', (e) => {
            const { toneId } = e.detail;
            window.civilReplyState.tone = toneId;
            
            const tone = civilReplyEngine.getTones().find(t => t.id === toneId);
            if (tone) {
                showNotification(`🎭 Tone set to: ${tone.name}`, 'success');
            }
        });

        // Stance changed
        document.addEventListener('civilreply:stance-changed', (e) => {
            const { stanceId } = e.detail;
            window.civilReplyState.stance = stanceId;
            showNotification(`⚖️ Stance set to: ${stanceId}`, 'success');
        });

        // Platform changed
        document.addEventListener('civilreply:platform-changed', (e) => {
            const { platformId } = e.detail;
            window.civilReplyState.platform = platformId;
            showNotification(`🌐 Platform set to: ${platformId}`, 'success');
        });

        // Model changed
        document.addEventListener('civilreply:model-changed', (e) => {
            const { modelId } = e.detail;
            window.civilReplyState.selectedModel = modelId;
            showNotification(`🤖 Model set to: ${modelId === 'auto' ? 'Auto-Select' : modelId}`, 'success');
        });
    }

    /**
     * Quick generate response
     */
    async function quickGenerateResponse(politicalComment) {
        if (!civilReplyEngine || !civilReplyWriter) {
            await initializeCivilReply();
        }

        try {
            showNotification('🕊️ Generating civil response...', 'info');

            const options = {
                originalComment: politicalComment,
                userStance: window.civilReplyState?.stance || 'neutral',
                tone: window.civilReplyState?.tone || 'diplomatic',
                platform: window.civilReplyState?.platform || 'general',
                model: window.civilReplyState?.selectedModel !== 'auto' ? window.civilReplyState?.selectedModel : null
            };

            // Generate with streaming
            let streamingResponse = '';
            const streamingMessageDiv = appendChatMessage('assistant', '', { streaming: true });

            const result = await civilReplyWriter.generateResponseStreaming(
                options,
                (chunk, fullText) => {
                    streamingResponse = fullText;
                    updateChatMessage(streamingMessageDiv, fullText);
                }
            );

            // Update with final response and metadata
            updateChatMessage(streamingMessageDiv, result.response, { 
                streaming: false,
                metadata: {
                    tone: result.tone,
                    model: result.model,
                    civilityScore: result.civilityScore,
                    wordCount: result.wordCount,
                    topic: result.topicData?.topic,
                    toxicityLevel: result.analysis?.toxicityLevel
                }
            });

            // Display analysis
            displayAnalysisPanel(result);

            // Display common ground
            if (result.commonGround && result.commonGround.length > 0) {
                displayCommonGround(result.commonGround);
            }

            // Display suggested questions
            if (result.suggestedQuestions && result.suggestedQuestions.length > 0) {
                displaySuggestedQuestions(result.suggestedQuestions);
            }

            // Store in state
            if (window.civilReplyState) {
                window.civilReplyState.currentResponse = result;
                window.civilReplyState.currentComment = politicalComment;
                window.civilReplyState.history.push({
                    comment: politicalComment,
                    response: result.response,
                    tone: result.tone,
                    stance: options.userStance,
                    timestamp: new Date().toISOString()
                });
            }

            showNotification(`✅ Generated ${result.wordCount} words (${result.civilityScore}% civil)`, 'success');

        } catch (error) {
            console.error('CivilReply generation error:', error);
            showNotification('❌ Failed to generate response: ' + error.message, 'error');
        }
    }

    /**
     * Display analysis panel
     */
    function displayAnalysisPanel(result) {
        const analysisHTML = `
            <div class="civilreply-analysis">
                <h4>📊 Comment Analysis</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span class="analysis-label">Topic</span>
                        <span class="analysis-value">${result.topicData?.topic || 'General'}</span>
                    </div>
                    <div class="analysis-item">
                        <span class="analysis-label">Emotional Intensity</span>
                        <span class="analysis-value">${result.analysis?.emotionalIntensity || 'Medium'}</span>
                    </div>
                    <div class="analysis-item">
                        <span class="analysis-label">Toxicity Level</span>
                        <span class="analysis-value">${result.analysis?.toxicityLevel || 0}%</span>
                    </div>
                    <div class="analysis-item">
                        <span class="analysis-label">Persuasion Style</span>
                        <span class="analysis-value">${result.analysis?.persuasionStyle || 'Mixed'}</span>
                    </div>
                </div>
            </div>
        `;

        appendChatMessage('assistant', analysisHTML, { isHTML: true });
    }

    /**
     * Display common ground
     */
    function displayCommonGround(commonGroundList) {
        const commonGroundHTML = `
            <div class="civilreply-common-ground">
                <h4>🤝 Common Ground</h4>
                <ul>
                    ${commonGroundList.map(cg => `<li>${cg}</li>`).join('')}
                </ul>
            </div>
        `;

        appendChatMessage('assistant', commonGroundHTML, { isHTML: true });
    }

    /**
     * Display suggested questions
     */
    function displaySuggestedQuestions(questions) {
        const questionsHTML = `
            <div class="civilreply-questions">
                <h4>💡 Suggested Questions</h4>
                <ul>
                    ${questions.map(q => `<li>${q}</li>`).join('')}
                </ul>
            </div>
        `;

        appendChatMessage('assistant', questionsHTML, { isHTML: true });
    }

    /**
     * Set CivilReply tone
     */
    function setCivilReplyTone(toneId) {
        if (!civilReplyEngine) {
            showNotification('❌ CivilReply not initialized', 'error');
            return;
        }

        const tone = civilReplyEngine.getTones().find(t => t.id === toneId);
        if (!tone) {
            showNotification(`❌ Unknown tone: ${toneId}`, 'error');
            showAvailableTones();
            return;
        }

        if (window.civilReplyState) {
            window.civilReplyState.tone = toneId;
        }

        showNotification(`🎭 Tone set to: ${tone.emoji} ${tone.name}`, 'success');
    }

    /**
     * Set CivilReply stance
     */
    function setCivilReplyStance(stance) {
        const validStances = ['neutral', 'agree', 'disagree'];
        
        if (!validStances.includes(stance)) {
            showNotification('❌ Invalid stance. Use: neutral, agree, or disagree', 'error');
            return;
        }

        if (window.civilReplyState) {
            window.civilReplyState.stance = stance;
        }

        const icons = { neutral: '⚖️', agree: '✅', disagree: '❌' };
        showNotification(`${icons[stance]} Stance set to: ${stance}`, 'success');
    }

    /**
     * Show available tones
     */
    function showAvailableTones() {
        if (!civilReplyEngine) return;

        const tones = civilReplyEngine.getTones();
        const tonesHTML = `
            <div class="civilreply-tones">
                <h4>Available Tones:</h4>
                <ul>
                    ${tones.map(t => `
                        <li><code>/civilreply tone ${t.id}</code> - ${t.emoji} ${t.name}</li>
                    `).join('')}
                </ul>
            </div>
        `;

        appendChatMessage('assistant', tonesHTML, { isHTML: true });
    }

    /**
     * Show CivilReply statistics
     */
    function showCivilReplyStats() {
        if (!civilReplyEngine) {
            showNotification('❌ CivilReply not initialized', 'error');
            return;
        }

        const stats = civilReplyEngine.getStats();
        const history = window.civilReplyState?.history || [];

        const statsHTML = `
            <div class="civilreply-stats">
                <h3>📊 CivilReply Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalResponses}</div>
                        <div class="stat-label">Total Responses Generated</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.avgCivility}%</div>
                        <div class="stat-label">Average Civility Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.timeSaved} min</div>
                        <div class="stat-label">Est. Time Saved</div>
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
                            const tone = civilReplyEngine.getTones().find(t => t.id === h.tone);
                            return `<li>${tone?.emoji || '🎭'} ${tone?.name || h.tone} - ${new Date(h.timestamp).toLocaleString()}</li>`;
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
                <span class="meta-badge">🎭 ${options.metadata.tone}</span>
                <span class="meta-badge">📝 ${options.metadata.wordCount} words</span>
                <span class="meta-badge">✨ ${options.metadata.civilityScore}% civil</span>
                <span class="meta-badge">🤖 ${options.metadata.model}</span>
                ${options.metadata.topic ? `<span class="meta-badge">🏷️ ${options.metadata.topic}</span>` : ''}
            `;
            msgDiv.appendChild(metaDiv);
        }

        scrollToNotionBottom();
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
        document.addEventListener('DOMContentLoaded', initializeCivilReply);
    } else {
        initializeCivilReply();
    }

    console.log('✅ CivilReply integration module loaded');

})();
