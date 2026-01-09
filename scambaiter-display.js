/**
 * ScamBaiter Pro - Display Module
 * UI component that integrates with existing chat interface
 * Handles rendering of scambaiter-specific UI elements
 */

class ScamBaiterDisplay {
    constructor() {
        this.currentTone = 'elderly';
        this.settings = {
            absurdity: 50,
            length: 50,
            fakeDetails: true,
            questions: true,
            delayTactics: false,
            multipart: false,
            typos: false
        };
        this.isGenerating = false;
    }

    /**
     * Initialize display module
     */
    async initialize() {
        console.log('✓ ScamBaiter Display initialized');
        return true;
    }

    /**
     * Inject ScamBaiter mode UI into existing chat interface
     */
    injectScamBaiterUI(containerElement) {
        if (!containerElement) {
            console.error('Container element not provided');
            return false;
        }

        const scambaiterUI = document.createElement('div');
        scambaiterUI.id = 'scambaiter-mode-container';
        scambaiterUI.className = 'scambaiter-mode-ui';
        scambaiterUI.innerHTML = this.getScamBaiterHTML();

        // Insert into container
        containerElement.appendChild(scambaiterUI);

        // Initialize event listeners
        this.initializeEventListeners();

        return true;
    }

    /**
     * Get ScamBaiter mode HTML
     */
    getScamBaiterHTML() {
        return `
            <div class="scambaiter-mode-header">
                <div class="mode-badge">
                    <span class="badge-icon">🎣</span>
                    <span class="badge-text">ScamBaiter Mode Active</span>
                </div>
                <div class="mode-info">
                    <span class="info-icon">ℹ️</span>
                    <span class="info-text">Generate time-wasting responses to scam messages</span>
                </div>
            </div>

            <div class="scambaiter-controls">
                <!-- Tone/Personality Selector -->
                <div class="control-section">
                    <label class="control-label">
                        <span class="label-icon">🎭</span>
                        <span class="label-text">Baiting Personality</span>
                    </label>
                    <div class="tone-selector" id="scambaiter-tone-selector">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- Quick Templates -->
                <div class="control-section">
                    <label class="control-label">
                        <span class="label-icon">📑</span>
                        <span class="label-text">Quick Templates</span>
                    </label>
                    <div class="template-selector" id="scambaiter-template-selector">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- Advanced Settings Toggle -->
                <div class="control-section">
                    <button class="advanced-toggle-btn" id="scambaiter-advanced-toggle">
                        <span class="toggle-icon">⚙️</span>
                        <span class="toggle-text">Advanced Settings</span>
                        <span class="toggle-arrow">▼</span>
                    </button>
                    
                    <div class="advanced-settings" id="scambaiter-advanced-settings" style="display: none;">
                        <!-- Absurdity Slider -->
                        <div class="setting-item">
                            <div class="setting-header">
                                <label class="setting-label">🔥 Absurdity Level</label>
                                <span class="setting-value" id="absurdity-value">50%</span>
                            </div>
                            <input type="range" class="setting-slider" id="absurdity-slider" 
                                   min="0" max="100" value="50" step="5">
                            <div class="setting-hint">Higher = more ridiculous and time-wasting</div>
                        </div>

                        <!-- Length Slider -->
                        <div class="setting-item">
                            <div class="setting-header">
                                <label class="setting-label">📝 Response Length</label>
                                <span class="setting-value" id="length-value">Medium</span>
                            </div>
                            <input type="range" class="setting-slider" id="length-slider" 
                                   min="0" max="100" value="50" step="25">
                            <div class="setting-hint">Longer responses waste more scammer time</div>
                        </div>

                        <!-- Toggle Options -->
                        <div class="setting-toggles">
                            <div class="toggle-option">
                                <label class="toggle-option-label">
                                    <input type="checkbox" id="fake-details-toggle" checked>
                                    <span class="toggle-checkmark"></span>
                                    <span class="toggle-label-text">Include fake personal details</span>
                                </label>
                                <div class="toggle-hint">Adds fictional names, addresses, banking "errors"</div>
                            </div>

                            <div class="toggle-option">
                                <label class="toggle-option-label">
                                    <input type="checkbox" id="questions-toggle" checked>
                                    <span class="toggle-checkmark"></span>
                                    <span class="toggle-label-text">Ask clarification questions</span>
                                </label>
                                <div class="toggle-hint">Generate questions to force more responses</div>
                            </div>

                            <div class="toggle-option">
                                <label class="toggle-option-label">
                                    <input type="checkbox" id="delay-tactics-toggle">
                                    <span class="toggle-checkmark"></span>
                                    <span class="toggle-label-text">Add delay tactics</span>
                                </label>
                                <div class="toggle-hint">Include reasons for delays (bank issues, travel, etc.)</div>
                            </div>

                            <div class="toggle-option">
                                <label class="toggle-option-label">
                                    <input type="checkbox" id="multipart-toggle">
                                    <span class="toggle-checkmark"></span>
                                    <span class="toggle-label-text">Multi-part response</span>
                                </label>
                                <div class="toggle-hint">Set up follow-up sequence for ongoing baiting</div>
                            </div>

                            <div class="toggle-option">
                                <label class="toggle-option-label">
                                    <input type="checkbox" id="typos-toggle">
                                    <span class="toggle-checkmark"></span>
                                    <span class="toggle-label-text">Include realistic typos</span>
                                </label>
                                <div class="toggle-hint">Makes responses seem more human</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Model Selector (Tier-based) -->
                <div class="control-section">
                    <label class="control-label">
                        <span class="label-icon">🤖</span>
                        <span class="label-text">AI Model</span>
                    </label>
                    <div class="model-selector" id="scambaiter-model-selector">
                        <div class="model-option" data-model="gemini">
                            <div class="model-icon">💎</div>
                            <div class="model-info">
                                <div class="model-name">Gemini 2.0 Flash</div>
                                <div class="model-tier">Free & Pro Tier</div>
                            </div>
                        </div>
                        <div class="model-option" data-model="claude">
                            <div class="model-icon">🧠</div>
                            <div class="model-info">
                                <div class="model-name">Claude Sonnet 4</div>
                                <div class="model-tier">Unlimited Tier</div>
                            </div>
                            <div class="model-badge">Premium</div>
                        </div>
                    </div>
                </div>

                <!-- Safety Warning -->
                <div class="safety-warning">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-text">
                        <strong>Safety Reminder:</strong> Never share real personal information. 
                        All generated details are fictional. For entertainment purposes only.
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render tone selector with all personalities
     */
    renderToneSelector(tones) {
        const container = document.getElementById('scambaiter-tone-selector');
        if (!container || !tones) return;

        container.innerHTML = `
            <div class="tone-grid">
                ${tones.map(tone => `
                    <div class="tone-card ${tone.id === this.currentTone ? 'selected' : ''}" 
                         data-tone="${tone.id}">
                        <div class="tone-emoji">${tone.emoji}</div>
                        <div class="tone-name">${tone.name}</div>
                        <div class="tone-desc">${tone.desc}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click handlers
        container.querySelectorAll('.tone-card').forEach(card => {
            card.addEventListener('click', () => {
                const toneId = card.dataset.tone;
                this.selectTone(toneId);
            });
        });
    }

    /**
     * Render template selector
     */
    renderTemplateSelector(templates) {
        const container = document.getElementById('scambaiter-template-selector');
        if (!container || !templates) return;

        container.innerHTML = `
            <div class="template-grid">
                ${templates.map((template, index) => `
                    <div class="template-card" data-index="${index}">
                        <div class="template-type">${template.type}</div>
                        <div class="template-title">${template.title}</div>
                        <div class="template-preview">${template.content.substring(0, 80)}...</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click handlers
        container.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.loadTemplate(templates[index]);
            });
        });
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Advanced settings toggle
        const advancedToggle = document.getElementById('scambaiter-advanced-toggle');
        const advancedSettings = document.getElementById('scambaiter-advanced-settings');
        
        if (advancedToggle && advancedSettings) {
            advancedToggle.addEventListener('click', () => {
                const isOpen = advancedSettings.style.display !== 'none';
                advancedSettings.style.display = isOpen ? 'none' : 'block';
                const arrow = advancedToggle.querySelector('.toggle-arrow');
                if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
            });
        }

        // Absurdity slider
        const absurditySlider = document.getElementById('absurdity-slider');
        const absurdityValue = document.getElementById('absurdity-value');
        if (absurditySlider && absurdityValue) {
            absurditySlider.addEventListener('input', (e) => {
                const value = e.target.value;
                absurdityValue.textContent = value + '%';
                this.settings.absurdity = parseInt(value);
            });
        }

        // Length slider
        const lengthSlider = document.getElementById('length-slider');
        const lengthValue = document.getElementById('length-value');
        if (lengthSlider && lengthValue) {
            const labels = ['Very Short', 'Short', 'Medium', 'Long', 'Very Long'];
            lengthSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const index = Math.floor(value / 25);
                lengthValue.textContent = labels[Math.min(index, labels.length - 1)];
                this.settings.length = value;
            });
        }

        // Toggle checkboxes
        const toggleIds = ['fake-details', 'questions', 'delay-tactics', 'multipart', 'typos'];
        toggleIds.forEach(id => {
            const toggle = document.getElementById(`${id}-toggle`);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    const key = id.replace(/-/g, '');
                    this.settings[key] = e.target.checked;
                });
            }
        });
    }

    /**
     * Select a tone/personality
     */
    selectTone(toneId) {
        this.currentTone = toneId;
        
        // Update UI
        document.querySelectorAll('.tone-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.tone === toneId);
        });

        // Dispatch custom event
        const event = new CustomEvent('scambaiter:tone-changed', {
            detail: { toneId }
        });
        document.dispatchEvent(event);
    }

    /**
     * Load a template into chat input
     */
    loadTemplate(template) {
        // Dispatch custom event with template content
        const event = new CustomEvent('scambaiter:template-loaded', {
            detail: { template }
        });
        document.dispatchEvent(event);
    }

    /**
     * Update generation status
     */
    updateGenerationStatus(isGenerating, statusText = '') {
        this.isGenerating = isGenerating;
        
        // Dispatch status event
        const event = new CustomEvent('scambaiter:status-changed', {
            detail: { isGenerating, statusText }
        });
        document.dispatchEvent(event);
    }

    /**
     * Display streaming response
     */
    displayStreamingChunk(chunk, fullResponse) {
        // Dispatch streaming event
        const event = new CustomEvent('scambaiter:response-chunk', {
            detail: { chunk, fullResponse }
        });
        document.dispatchEvent(event);
    }

    /**
     * Display final response with metadata
     */
    displayFinalResponse(responseData) {
        // Dispatch completion event
        const event = new CustomEvent('scambaiter:response-complete', {
            detail: responseData
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current settings
     */
    getSettings() {
        return {
            tone: this.currentTone,
            ...this.settings
        };
    }

    /**
     * Show error message
     */
    showError(errorMessage) {
        const event = new CustomEvent('scambaiter:error', {
            detail: { message: errorMessage }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get styles for ScamBaiter UI
     */
    getStyles() {
        return `
            <style>
                /* ScamBaiter Mode UI Styles */
                .scambaiter-mode-ui {
                    padding: 20px;
                    background: var(--glass-bg, rgba(30, 41, 59, 0.7));
                    border-radius: 16px;
                    margin-bottom: 20px;
                    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
                }

                .scambaiter-mode-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
                }

                .mode-badge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    border-radius: 20px;
                    font-weight: 600;
                }

                .mode-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary, #94a3b8);
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
                    color: var(--text-primary, #f1f5f9);
                    margin-bottom: 12px;
                }

                .tone-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 10px;
                }

                .tone-card {
                    padding: 12px;
                    background: var(--dark, #0f172a);
                    border: 2px solid var(--dark-tertiary, #334155);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                }

                .tone-card:hover {
                    border-color: var(--primary, #6366f1);
                    transform: translateY(-2px);
                }

                .tone-card.selected {
                    border-color: var(--primary, #6366f1);
                    background: rgba(99, 102, 241, 0.1);
                }

                .tone-emoji {
                    font-size: 32px;
                    margin-bottom: 8px;
                }

                .tone-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-primary, #f1f5f9);
                    margin-bottom: 4px;
                }

                .tone-desc {
                    font-size: 0.7rem;
                    color: var(--text-muted, #64748b);
                    line-height: 1.3;
                }

                .template-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 10px;
                }

                .template-card {
                    padding: 12px;
                    background: var(--dark, #0f172a);
                    border: 1px solid var(--dark-tertiary, #334155);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .template-card:hover {
                    border-color: var(--secondary, #f59e0b);
                    transform: translateY(-2px);
                }

                .template-type {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: var(--secondary, #f59e0b);
                    text-transform: uppercase;
                    margin-bottom: 6px;
                }

                .template-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-primary, #f1f5f9);
                    margin-bottom: 4px;
                }

                .template-preview {
                    font-size: 0.75rem;
                    color: var(--text-muted, #64748b);
                    line-height: 1.4;
                }

                .advanced-toggle-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: var(--dark, #0f172a);
                    border: 1px solid var(--dark-tertiary, #334155);
                    border-radius: 12px;
                    color: var(--text-primary, #f1f5f9);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .advanced-toggle-btn:hover {
                    border-color: var(--primary, #6366f1);
                }

                .advanced-settings {
                    margin-top: 15px;
                    padding: 20px;
                    background: var(--dark, #0f172a);
                    border-radius: 12px;
                }

                .setting-item {
                    margin-bottom: 20px;
                }

                .setting-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .setting-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-primary, #f1f5f9);
                }

                .setting-value {
                    font-size: 0.85rem;
                    color: var(--primary-light, #818cf8);
                    font-weight: 600;
                }

                .setting-slider {
                    width: 100%;
                    height: 6px;
                    background: var(--dark-tertiary, #334155);
                    border-radius: 3px;
                    outline: none;
                    -webkit-appearance: none;
                    cursor: pointer;
                }

                .setting-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    border-radius: 50%;
                    cursor: pointer;
                }

                .setting-hint {
                    font-size: 0.75rem;
                    color: var(--text-muted, #64748b);
                    margin-top: 6px;
                }

                .setting-toggles {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .toggle-option {
                    padding: 10px;
                    background: var(--dark-secondary, #1e293b);
                    border-radius: 8px;
                }

                .toggle-option-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                }

                .toggle-option-label input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }

                .toggle-label-text {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary, #f1f5f9);
                }

                .toggle-hint {
                    font-size: 0.75rem;
                    color: var(--text-muted, #64748b);
                    margin-top: 4px;
                    margin-left: 30px;
                }

                .model-selector {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .model-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: var(--dark, #0f172a);
                    border: 1px solid var(--dark-tertiary, #334155);
                    border-radius: 12px;
                    position: relative;
                }

                .model-icon {
                    font-size: 24px;
                }

                .model-info {
                    flex: 1;
                }

                .model-name {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-primary, #f1f5f9);
                }

                .model-tier {
                    font-size: 0.75rem;
                    color: var(--text-muted, #64748b);
                }

                .model-badge {
                    padding: 4px 10px;
                    background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .safety-warning {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 15px;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 12px;
                    margin-top: 20px;
                }

                .warning-icon {
                    font-size: 20px;
                }

                .warning-text {
                    font-size: 0.85rem;
                    color: var(--text-secondary, #94a3b8);
                    line-height: 1.5;
                }

                @media (max-width: 768px) {
                    .tone-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .template-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScamBaiterDisplay;
}
