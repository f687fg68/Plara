/**
 * CivilReply - Display Module
 * UI component that integrates with existing chat interface
 * Handles rendering of CivilReply-specific UI elements
 */

class CivilReplyDisplay {
    constructor() {
        this.currentSettings = {
            tone: 'diplomatic',
            stance: 'neutral',
            platform: 'general'
        };
    }

    /**
     * Initialize display module
     */
    async initialize() {
        console.log('✓ CivilReply Display initialized');
        return true;
    }

    /**
     * Inject CivilReply mode UI into existing chat interface
     */
    injectCivilReplyUI(containerElement) {
        if (!containerElement) {
            console.error('Container element not provided');
            return false;
        }

        const civilReplyUI = document.createElement('div');
        civilReplyUI.id = 'civilreply-mode-container';
        civilReplyUI.className = 'civilreply-mode-ui';
        civilReplyUI.innerHTML = this.getCivilReplyHTML();

        containerElement.appendChild(civilReplyUI);
        this.initializeEventListeners();

        return true;
    }

    /**
     * Get CivilReply mode HTML
     */
    getCivilReplyHTML() {
        return `
            <div class="civilreply-mode-header">
                <div class="mode-badge">
                    <span class="badge-icon">🕊️</span>
                    <span class="badge-text">CivilReply Mode Active</span>
                </div>
                <div class="mode-info">
                    <span class="info-icon">ℹ️</span>
                    <span class="info-text">Generate civil responses to political arguments</span>
                </div>
            </div>

            <div class="civilreply-controls">
                <!-- Stance Selector -->
                <div class="control-section">
                    <label class="control-label">
                        <span class="label-icon">⚖️</span>
                        <span class="label-text">Your Stance</span>
                    </label>
                    <div class="stance-selector" id="civilreply-stance-selector">
                        <div class="stance-option active" data-stance="neutral">
                            <span class="stance-icon">⚖️</span>
                            <span class="stance-name">Neutral</span>
                            <span class="stance-desc">Balanced view</span>
                        </div>
                        <div class="stance-option" data-stance="agree">
                            <span class="stance-icon">✅</span>
                            <span class="stance-name">Agree</span>
                            <span class="stance-desc">Support their view</span>
                        </div>
                        <div class="stance-option" data-stance="disagree">
                            <span class="stance-icon">❌</span>
                            <span class="stance-name">Disagree</span>
                            <span class="stance-desc">Oppose their view</span>
                        </div>
                    </div>
                </div>

                <!-- Tone Selector -->
                <div class="control-section">
                    <label class="control-label">
                        <span class="label-icon">🎭</span>
                        <span class="label-text">Response Tone</span>
                    </label>
                    <div class="tone-selector" id="civilreply-tone-selector">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- Platform Selector -->
                <div class="control-section">
                    <label class="control-label">
                        <span class="label-icon">🌐</span>
                        <span class="label-text">Target Platform</span>
                    </label>
                    <div class="platform-selector" id="civilreply-platform-selector">
                        <div class="platform-option active" data-platform="general">
                            <i class="fas fa-comment"></i>
                            <span>General</span>
                        </div>
                        <div class="platform-option" data-platform="twitter">
                            <i class="fab fa-twitter"></i>
                            <span>Twitter</span>
                        </div>
                        <div class="platform-option" data-platform="facebook">
                            <i class="fab fa-facebook"></i>
                            <span>Facebook</span>
                        </div>
                        <div class="platform-option" data-platform="reddit">
                            <i class="fab fa-reddit"></i>
                            <span>Reddit</span>
                        </div>
                        <div class="platform-option" data-platform="linkedin">
                            <i class="fab fa-linkedin"></i>
                            <span>LinkedIn</span>
                        </div>
                    </div>
                </div>

                <!-- Model Selector -->
                <div class="control-section">
                    <label class="control-label">
                        <span class="label-icon">🤖</span>
                        <span class="label-text">AI Model</span>
                    </label>
                    <div class="model-selector" id="civilreply-model-selector">
                        <div class="model-option active" data-model="auto">
                            <div class="model-icon">⚡</div>
                            <div class="model-info">
                                <div class="model-name">Auto-Select</div>
                                <div class="model-desc">Best model for selected tone</div>
                            </div>
                        </div>
                        <div class="model-option" data-model="gemini-2.0-flash-exp">
                            <div class="model-icon">💎</div>
                            <div class="model-info">
                                <div class="model-name">Gemini 3.0 Pro</div>
                                <div class="model-desc">Fast, balanced responses</div>
                            </div>
                        </div>
                        <div class="model-option" data-model="claude-sonnet-4">
                            <div class="model-icon">🧠</div>
                            <div class="model-info">
                                <div class="model-name">Claude Sonnet 4.5</div>
                                <div class="model-desc">Superior reasoning, nuanced</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Safety Notice -->
                <div class="safety-notice">
                    <div class="notice-icon">⚠️</div>
                    <div class="notice-text">
                        <strong>Respectful Discourse:</strong> This tool generates civil responses to facilitate constructive political dialogue. Always fact-check claims and engage in good faith.
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render tone selector with all tones
     */
    renderToneSelector(tones) {
        const container = document.getElementById('civilreply-tone-selector');
        if (!container || !tones) return;

        container.innerHTML = tones.map(tone => `
            <div class="tone-card ${tone.id === this.currentSettings.tone ? 'active' : ''}" 
                 data-tone="${tone.id}">
                <div class="tone-emoji">${tone.emoji}</div>
                <div class="tone-info">
                    <div class="tone-name">${tone.name}</div>
                    <div class="tone-desc">${tone.desc}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.tone-card').forEach(card => {
            card.addEventListener('click', () => {
                const toneId = card.dataset.tone;
                this.selectTone(toneId);
            });
        });
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Stance selection
        const stanceOptions = document.querySelectorAll('.stance-option');
        stanceOptions.forEach(option => {
            option.addEventListener('click', () => {
                const stance = option.dataset.stance;
                this.selectStance(stance);
            });
        });

        // Platform selection
        const platformOptions = document.querySelectorAll('.platform-option');
        platformOptions.forEach(option => {
            option.addEventListener('click', () => {
                const platform = option.dataset.platform;
                this.selectPlatform(platform);
            });
        });

        // Model selection
        const modelOptions = document.querySelectorAll('.model-option');
        modelOptions.forEach(option => {
            option.addEventListener('click', () => {
                const model = option.dataset.model;
                this.selectModel(model);
            });
        });
    }

    /**
     * Select stance
     */
    selectStance(stanceId) {
        this.currentSettings.stance = stanceId;
        
        document.querySelectorAll('.stance-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.stance === stanceId);
        });

        this.dispatchEvent('stance-changed', { stanceId });
    }

    /**
     * Select tone
     */
    selectTone(toneId) {
        this.currentSettings.tone = toneId;
        
        document.querySelectorAll('.tone-card').forEach(card => {
            card.classList.toggle('active', card.dataset.tone === toneId);
        });

        this.dispatchEvent('tone-changed', { toneId });
    }

    /**
     * Select platform
     */
    selectPlatform(platformId) {
        this.currentSettings.platform = platformId;
        
        document.querySelectorAll('.platform-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.platform === platformId);
        });

        this.dispatchEvent('platform-changed', { platformId });
    }

    /**
     * Select model
     */
    selectModel(modelId) {
        this.currentSettings.model = modelId;
        
        document.querySelectorAll('.model-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.model === modelId);
        });

        this.dispatchEvent('model-changed', { modelId });
    }

    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(`civilreply:${eventName}`, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.currentSettings };
    }

    /**
     * Get styles for CivilReply UI
     */
    getStyles() {
        return `
            <style>
                .civilreply-mode-ui {
                    padding: 20px;
                    background: rgba(30, 41, 59, 0.7);
                    border-radius: 16px;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .civilreply-mode-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .mode-badge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #0EA5E9 100%);
                    border-radius: 20px;
                    font-weight: 600;
                }

                .mode-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #94A3B8;
                    font-size: 0.9rem;
                }

                .control-section {
                    margin-bottom: 20px;
                }

                .control-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #F8FAFC;
                    margin-bottom: 12px;
                }

                .stance-selector {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }

                .stance-option {
                    padding: 12px;
                    background: #0F172A;
                    border: 2px solid #334155;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                }

                .stance-option:hover {
                    border-color: #4F46E5;
                    transform: translateY(-2px);
                }

                .stance-option.active {
                    border-color: #4F46E5;
                    background: rgba(79, 70, 229, 0.1);
                }

                .stance-icon {
                    font-size: 24px;
                    display: block;
                    margin-bottom: 8px;
                }

                .stance-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    display: block;
                    color: #F8FAFC;
                }

                .stance-desc {
                    font-size: 0.75rem;
                    color: #64748B;
                    display: block;
                    margin-top: 4px;
                }

                .tone-selector {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }

                .tone-card {
                    padding: 12px;
                    background: #0F172A;
                    border: 2px solid #334155;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .tone-card:hover {
                    border-color: #4F46E5;
                }

                .tone-card.active {
                    border-color: #4F46E5;
                    background: rgba(79, 70, 229, 0.1);
                }

                .tone-emoji {
                    font-size: 24px;
                }

                .tone-info {
                    flex: 1;
                }

                .tone-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #F8FAFC;
                }

                .tone-desc {
                    font-size: 0.75rem;
                    color: #64748B;
                    margin-top: 2px;
                }

                .platform-selector {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .platform-option {
                    padding: 8px 12px;
                    background: #0F172A;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: #94A3B8;
                }

                .platform-option:hover {
                    border-color: #4F46E5;
                    color: #F8FAFC;
                }

                .platform-option.active {
                    background: #4F46E5;
                    border-color: #4F46E5;
                    color: white;
                }

                .model-selector {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .model-option {
                    padding: 12px;
                    background: #0F172A;
                    border: 2px solid #334155;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .model-option:hover {
                    border-color: #4F46E5;
                }

                .model-option.active {
                    border-color: #4F46E5;
                    background: rgba(79, 70, 229, 0.1);
                }

                .model-icon {
                    font-size: 24px;
                }

                .model-info {
                    flex: 1;
                }

                .model-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #F8FAFC;
                }

                .model-desc {
                    font-size: 0.75rem;
                    color: #64748B;
                    margin-top: 2px;
                }

                .safety-notice {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 15px;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 12px;
                    margin-top: 20px;
                }

                .notice-icon {
                    font-size: 20px;
                }

                .notice-text {
                    font-size: 0.85rem;
                    color: #94A3B8;
                    line-height: 1.5;
                }

                @media (max-width: 768px) {
                    .stance-selector {
                        grid-template-columns: 1fr;
                    }
                    
                    .tone-selector {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CivilReplyDisplay;
}
