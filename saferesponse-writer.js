/**
 * ========================================
 * SAFERESPONSE WRITER
 * ========================================
 * Interactive wizard for de-escalation response generation
 */

(function() {
    'use strict';

    // ====================================
    // State Management
    // ====================================

    let safeResponseState = {
        selectedModel: 'claude-sonnet-4.5',
        responseStyle: 'professional',
        platform: 'general',
        currentMessage: '',
        analysis: null,
        generatedResponse: null,
        history: []
    };

    // Initialize global state
    window.safeResponseState = safeResponseState;

    // ====================================
    // Response Style Configurations
    // ====================================

    const RESPONSE_STYLES = {
        professional: {
            name: 'Professional',
            icon: '💼',
            description: 'Formal, business-appropriate tone',
            example: '"I prefer respectful dialogue. This approach isn\'t productive."'
        },
        firm: {
            name: 'Firm & Direct',
            icon: '🛑',
            description: 'Clear boundaries with authority',
            example: '"This behavior is unacceptable. I will not engage further."'
        },
        empathetic: {
            name: 'Empathetic',
            icon: '🤝',
            description: 'Understanding while setting boundaries',
            example: '"I sense you\'re upset. Let\'s have a respectful conversation."'
        },
        humorous: {
            name: 'Humorous',
            icon: '😊',
            description: 'Light humor to defuse tension',
            example: '"Let\'s try this again when we\'re both feeling more zen."'
        },
        minimal: {
            name: 'Minimal',
            icon: '✂️',
            description: 'Brief, 1-2 sentences only',
            example: '"Not engaging with this. Reach out respectfully."'
        }
    };

    const PLATFORMS = {
        general: { name: 'General', icon: '🌐', limit: 500 },
        twitter: { name: 'Twitter/X', icon: '𝕏', limit: 280 },
        instagram: { name: 'Instagram', icon: '📷', limit: 2200 },
        facebook: { name: 'Facebook', icon: '👥', limit: 8000 },
        reddit: { name: 'Reddit', icon: '🤖', limit: 10000 },
        discord: { name: 'Discord', icon: '💬', limit: 2000 },
        email: { name: 'Email', icon: '📧', limit: 5000 }
    };

    // ====================================
    // Command Handler
    // ====================================

    /**
     * Main command handler for /saferesponse
     */
    window.safeResponseCommandHandler = async function(command) {
        console.log('🛡️ SafeResponse command:', command);

        // Parse command variations
        if (/^\s*\/saferesponse\s+help\s*$/i.test(command)) {
            showSafeResponseHelp();
            return;
        }

        if (/^\s*\/saferesponse\s+style\s+(\w+)\s*$/i.test(command)) {
            const match = command.match(/style\s+(\w+)/i);
            const style = match[1].toLowerCase();
            if (RESPONSE_STYLES[style]) {
                safeResponseState.responseStyle = style;
                showNotification(`✅ Response style set to: ${RESPONSE_STYLES[style].name}`, 'success');
            }
            startSafeResponseWizard();
            return;
        }

        if (/^\s*\/saferesponse\s+model\s+(.+)\s*$/i.test(command)) {
            const match = command.match(/model\s+(.+)/i);
            const model = match[1].trim();
            safeResponseState.selectedModel = model;
            showNotification(`✅ AI Model set to: ${model}`, 'success');
            startSafeResponseWizard();
            return;
        }

        // Default: Start wizard
        startSafeResponseWizard();
    };

    /**
     * Show SafeResponse help information
     */
    function showSafeResponseHelp() {
        const helpContent = `
<div style="padding: 24px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; color: white; max-width: 800px;">
    <h2 style="margin: 0 0 16px 0; display: flex; align-items: center; gap: 10px; font-size: 26px;">
        <span style="font-size: 36px;">🛡️</span>
        <span>SafeResponse - De-escalation Assistant</span>
    </h2>
    
    <div style="background: rgba(99,102,241,0.15); padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
        <h3 style="margin: 0 0 8px 0; color: #818cf8; font-size: 16px;">What is SafeResponse?</h3>
        <p style="margin: 0; line-height: 1.7; color: #e2e8f0;">
            AI-powered assistant that helps you respond to online harassment with dignity and composure. 
            Analyzes toxic messages, assesses risk levels, and generates calm, boundary-setting responses 
            that de-escalate conflict without escalating harm.
        </p>
    </div>

    <h3 style="margin: 24px 0 12px 0; color: #818cf8; font-size: 18px;">📋 How It Works</h3>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
        <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 6px; color: #60a5fa;">1️⃣ Paste Message</div>
            <div style="font-size: 13px; color: #cbd5e1;">Copy the harassing message you received</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 6px; color: #60a5fa;">2️⃣ AI Analysis</div>
            <div style="font-size: 13px; color: #cbd5e1;">Toxicity detection & risk assessment</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 6px; color: #60a5fa;">3️⃣ Generate Response</div>
            <div style="font-size: 13px; color: #cbd5e1;">AI creates de-escalating boundary-setting reply</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 6px; color: #60a5fa;">4️⃣ Report Guidance</div>
            <div style="font-size: 13px; color: #cbd5e1;">Platform-specific reporting instructions</div>
        </div>
    </div>

    <h3 style="margin: 20px 0 12px 0; color: #818cf8; font-size: 18px;">💬 Commands</h3>
    <div style="font-family: 'Monaco', monospace; font-size: 13px;">
        <div style="margin-bottom: 10px;">
            <code style="background: rgba(99,102,241,0.2); padding: 5px 10px; border-radius: 6px;">/saferesponse</code>
            <span style="margin-left: 12px; color: #94a3b8;">Launch the de-escalation wizard</span>
        </div>
        <div style="margin-bottom: 10px;">
            <code style="background: rgba(99,102,241,0.2); padding: 5px 10px; border-radius: 6px;">/saferesponse help</code>
            <span style="margin-left: 12px; color: #94a3b8;">Show this help information</span>
        </div>
        <div style="margin-bottom: 10px;">
            <code style="background: rgba(99,102,241,0.2); padding: 5px 10px; border-radius: 6px;">/saferesponse style [professional|firm|empathetic]</code>
            <span style="margin-left: 12px; color: #94a3b8;">Set response style</span>
        </div>
        <div style="margin-bottom: 10px;">
            <code style="background: rgba(99,102,241,0.2); padding: 5px 10px; border-radius: 6px;">/saferesponse model [claude|gemini|gpt-4o]</code>
            <span style="margin-left: 12px; color: #94a3b8;">Choose AI model</span>
        </div>
    </div>

    <h3 style="margin: 20px 0 12px 0; color: #818cf8; font-size: 18px;">✨ Features</h3>
    <ul style="line-height: 2; padding-left: 20px; color: #e2e8f0; margin: 0;">
        <li><strong>Harassment Analysis:</strong> Detects toxicity, threats, and harassment types</li>
        <li><strong>Risk Assessment:</strong> Categorizes severity (low, medium, high, critical)</li>
        <li><strong>5 Response Styles:</strong> Professional, firm, empathetic, humorous, minimal</li>
        <li><strong>3 AI Models:</strong> Claude Sonnet 4.5, Gemini 3.0 Pro, GPT-4o</li>
        <li><strong>Platform-Specific:</strong> Optimized for Twitter, Instagram, Discord, etc.</li>
        <li><strong>Reporting Guidance:</strong> Step-by-step platform reporting instructions</li>
        <li><strong>Alternative Responses:</strong> Multiple approach options</li>
    </ul>

    <div style="background: rgba(239,68,68,0.15); border-left: 3px solid #ef4444; padding: 14px; margin-top: 20px; border-radius: 4px;">
        <strong style="color: #fca5a5;">⚠️ Important Safety Note:</strong>
        <div style="color: #fecaca; margin-top: 6px; font-size: 14px; line-height: 1.6;">
            If you receive threats of violence or feel unsafe, report immediately to law enforcement 
            and the platform. SafeResponse provides communication tools, not legal or safety advice.
        </div>
    </div>

    <div style="background: rgba(16,185,129,0.1); border-left: 3px solid #10b981; padding: 14px; margin-top: 16px; border-radius: 4px;">
        <strong style="color: #6ee7b7;">💡 Pro Tips:</strong>
        <div style="color: #d1fae5; margin-top: 6px; font-size: 13px; line-height: 1.7;">
            • Use Claude Sonnet 4.5 for most empathetic responses<br>
            • Choose "Firm" style for repeat harassers<br>
            • Copy exact harassment text for best analysis<br>
            • Always block after responding (or don't respond at all)<br>
            • Document everything with screenshots
        </div>
    </div>
</div>
        `;

        if (window.appendNotionMessage) {
            window.appendNotionMessage({
                role: 'assistant',
                content: helpContent
            });
        }
    }

    /**
     * Start the SafeResponse wizard
     */
    function startSafeResponseWizard() {
        const wizardHTML = buildSafeResponseWizard();
        
        if (window.appendNotionMessage) {
            window.appendNotionMessage({
                role: 'assistant',
                content: wizardHTML
            });
        }

        // Attach event listeners after DOM insertion
        setTimeout(() => {
            attachWizardEventListeners();
        }, 100);
    }

    /**
     * Build the wizard HTML
     */
    function buildSafeResponseWizard() {
        const styleCards = Object.entries(RESPONSE_STYLES).map(([key, config]) => {
            const isSelected = safeResponseState.responseStyle === key;
            return `
<div class="saferesponse-style" data-style="${key}" style="
    flex: 1;
    min-width: 140px;
    padding: 14px;
    background: ${isSelected ? 'linear-gradient(135deg, #6366f120, #8b5cf610)' : '#1e293b'};
    border: 2px solid ${isSelected ? '#6366f1' : '#334155'};
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
" onmouseover="this.style.borderColor='#6366f1'" onmouseout="if(!this.dataset.selected) this.style.borderColor='#334155'">
    <div style="font-size: 28px; margin-bottom: 6px;">${config.icon}</div>
    <div style="font-weight: 600; margin-bottom: 3px; color: white; font-size: 13px;">${config.name}</div>
    <div style="font-size: 11px; color: #94a3b8;">${config.description}</div>
</div>`;
        }).join('');

        const platformOptions = Object.entries(PLATFORMS).map(([key, config]) => {
            return `<option value="${key}" ${safeResponseState.platform === key ? 'selected' : ''}>${config.icon} ${config.name}</option>`;
        }).join('');

        const modelButtons = buildModelButtons();

        return `
<div style="max-width: 900px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: white;">
            <span style="font-size: 40px; vertical-align: middle;">🛡️</span>
            SafeResponse
        </h1>
        <p style="margin: 0; color: #94a3b8; font-size: 16px;">
            AI De-escalation Assistant for Online Harassment
        </p>
        <div style="display: flex; gap: 16px; justify-content: center; margin-top: 12px; font-size: 13px; color: #64748b;">
            <span>🤖 AI-Powered</span>
            <span>•</span>
            <span>🎯 Boundary-Setting</span>
            <span>•</span>
            <span>💙 Dignity-Preserving</span>
        </div>
    </div>

    <!-- Step 1: AI Model Selection -->
    <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 14px 0; color: #60a5fa; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
            Step 1: AI Model
        </h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            ${modelButtons}
        </div>
    </div>

    <!-- Step 2: Response Style -->
    <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 14px 0; color: #60a5fa; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
            Step 2: Response Style
        </h3>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${styleCards}
        </div>
    </div>

    <!-- Step 3: Platform & Message -->
    <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 14px 0; color: #60a5fa; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
            Step 3: Harassment Message
        </h3>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px;">
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #e2e8f0;">
                    Platform
                </label>
                <select id="saferesponse-platform" style="
                    width: 100%;
                    padding: 10px 14px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                ">
                    ${platformOptions}
                </select>
                <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                    <span id="platform-char-limit">Character limit: 500</span>
                </div>
            </div>

            <div>
                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #e2e8f0;">
                    Paste the Harassing Message <span style="color: #ef4444;">*</span>
                </label>
                <textarea id="saferesponse-message" rows="6" placeholder="Paste the harassing or abusive message you received here...

Examples:
• Threatening language
• Personal attacks
• Discriminatory comments
• Cyberbullying
• Sexual harassment

The AI will analyze the toxicity level and generate an appropriate de-escalation response." style="
                    width: 100%;
                    padding: 14px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    line-height: 1.6;
                    resize: vertical;
                    font-family: inherit;
                "></textarea>
                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #64748b;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>🔒</span>
                        <span>Your message is analyzed privately and never stored</span>
                    </div>
                    <span id="char-count">0 characters</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Generate Button -->
    <div style="text-align: center;">
        <button id="saferesponse-generate-btn" style="
            padding: 16px 48px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 17px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
            transition: all 0.2s ease;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 15px 40px rgba(99, 102, 241, 0.5)'"
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 30px rgba(99, 102, 241, 0.4)'">
            <span style="margin-right: 8px;">🚀</span>
            Analyze & Generate De-escalation Response
        </button>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748b;">
            AI will assess risk level and create a calm, boundary-setting response
        </p>
    </div>

    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 14px; margin-top: 24px;">
        <div style="display: flex; align-items: start; gap: 10px;">
            <span style="font-size: 20px;">⚠️</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #fca5a5; margin-bottom: 4px; font-size: 14px;">Safety First</div>
                <div style="color: #fecaca; font-size: 13px; line-height: 1.6;">
                    If you feel physically unsafe or receive credible threats, contact law enforcement immediately. 
                    This tool helps with communication, not personal safety.
                </div>
            </div>
        </div>
    </div>
</div>
        `;
    }

    /**
     * Build model selection buttons
     */
    function buildModelButtons() {
        const models = [
            { 
                id: 'claude-sonnet-4.5', 
                name: 'Claude Sonnet 4.5', 
                icon: '🎯', 
                desc: 'Most empathetic',
                color: '#8b5cf6'
            },
            { 
                id: 'gemini-3-pro', 
                name: 'Gemini 3.0 Pro', 
                icon: '🧠', 
                desc: 'Comprehensive',
                color: '#3b82f6'
            },
            { 
                id: 'gpt-4o', 
                name: 'GPT-4o', 
                icon: '⚡', 
                desc: 'Fast & professional',
                color: '#10b981'
            }
        ];

        return models.map(model => {
            const isActive = safeResponseState.selectedModel === model.id;
            return `
<button onclick="window.setSafeResponseModel('${model.id}')" style="
    flex: 1;
    min-width: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px;
    background: ${isActive ? `linear-gradient(135deg, ${model.color}20, ${model.color}10)` : '#1e293b'};
    border: 2px solid ${isActive ? model.color : '#334155'};
    border-radius: 10px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
" onmouseover="if(this.style.borderColor !== '${model.color}') this.style.borderColor='${model.color}'" 
   onmouseout="if(!this.textContent.includes('${safeResponseState.selectedModel}')) this.style.borderColor='#334155'">
    <span style="font-size: 26px; margin-bottom: 6px;">${model.icon}</span>
    <span style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${model.name}</span>
    <span style="font-size: 11px; color: #94a3b8;">${model.desc}</span>
</button>`;
        }).join('');
    }

    /**
     * Set SafeResponse model
     */
    window.setSafeResponseModel = function(model) {
        safeResponseState.selectedModel = model;
        window.safeResponseState = safeResponseState;
        
        // Refresh wizard to show updated selection
        startSafeResponseWizard();
        
        showNotification(`✅ AI Model: ${model}`, 'success');
    };

    /**
     * Attach event listeners to wizard elements
     */
    function attachWizardEventListeners() {
        // Style selection
        document.querySelectorAll('.saferesponse-style').forEach(card => {
            card.addEventListener('click', function() {
                document.querySelectorAll('.saferesponse-style').forEach(c => {
                    c.dataset.selected = '';
                    c.style.borderColor = '#334155';
                    c.style.background = '#1e293b';
                });
                this.dataset.selected = 'true';
                safeResponseState.responseStyle = this.dataset.style;
                this.style.borderColor = '#6366f1';
                this.style.background = 'linear-gradient(135deg, #6366f120, #8b5cf610)';
            });
        });

        // Platform change
        const platformSelect = document.getElementById('saferesponse-platform');
        if (platformSelect) {
            platformSelect.addEventListener('change', function() {
                safeResponseState.platform = this.value;
                const platform = PLATFORMS[this.value];
                document.getElementById('platform-char-limit').textContent = 
                    `Character limit: ${platform.limit}`;
            });
        }

        // Character count
        const messageInput = document.getElementById('saferesponse-message');
        if (messageInput) {
            messageInput.addEventListener('input', function() {
                document.getElementById('char-count').textContent = 
                    `${this.value.length} characters`;
            });
        }

        // Generate button
        const generateBtn = document.getElementById('saferesponse-generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerate);
        }
    }

    /**
     * Handle generate button click
     */
    async function handleGenerate() {
        const message = document.getElementById('saferesponse-message')?.value?.trim();

        if (!message) {
            showNotification('⚠️ Please paste a harassment message to analyze', 'error');
            return;
        }

        // Store message
        safeResponseState.currentMessage = message;
        safeResponseState.platform = document.getElementById('saferesponse-platform')?.value || 'general';

        // Trigger generation
        if (window.generateSafeResponse) {
            await window.generateSafeResponse();
        }
    }

    /**
     * Show notification helper
     */
    function showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        if (window.showToast) {
            window.showToast(message, type);
        }
    }

    console.log('✅ SafeResponse Writer module loaded');

})();
