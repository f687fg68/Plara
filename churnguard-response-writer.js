/**
 * ========================================
 * CHURNGUARD RESPONSE WRITER
 * ========================================
 * Interactive wizard for churn prevention response generation
 */

(function() {
    'use strict';

    // ====================================
    // State Management
    // ====================================

    let churnGuardState = {
        selectedModel: 'claude-sonnet-4.5',
        responseType: 'retention',
        customerData: {},
        sentimentAnalysis: null,
        churnRisk: null,
        currentResponse: null,
        history: []
    };

    // Initialize global state
    window.churnGuardState = churnGuardState;

    // ====================================
    // Response Type Configurations
    // ====================================

    const RESPONSE_TYPES = {
        retention: {
            name: 'Retention Response',
            icon: '🛡️',
            description: 'Win-back unhappy customers showing churn risk',
            color: '#dc2626'
        },
        support: {
            name: 'Support Resolution',
            icon: '🎧',
            description: 'Address technical issues and support concerns',
            color: '#2563eb'
        },
        checkin: {
            name: 'Proactive Check-in',
            icon: '💚',
            description: 'Health check for at-risk accounts',
            color: '#16a34a'
        },
        escalation: {
            name: 'Escalation Response',
            icon: '⚠️',
            description: 'Handle escalated complaints and crises',
            color: '#ea580c'
        },
        upsell: {
            name: 'Value Expansion',
            icon: '📈',
            description: 'Turn support into expansion opportunity',
            color: '#7c3aed'
        },
        offboarding: {
            name: 'Exit Interview',
            icon: '👋',
            description: 'Professional offboarding and feedback collection',
            color: '#64748b'
        }
    };

    // ====================================
    // Command Handler
    // ====================================

    /**
     * Main command handler for /churnguard
     */
    window.churnGuardCommandHandler = async function(command) {
        console.log('🛡️ ChurnGuard command:', command);

        // Parse command variations
        if (/^\s*\/churnguard\s+help\s*$/i.test(command)) {
            showChurnGuardHelp();
            return;
        }

        if (/^\s*\/churnguard\s+type\s+(\w+)\s*$/i.test(command)) {
            const match = command.match(/type\s+(\w+)/i);
            const type = match[1].toLowerCase();
            if (RESPONSE_TYPES[type]) {
                churnGuardState.responseType = type;
                showNotification(`✅ Response type set to: ${RESPONSE_TYPES[type].name}`, 'success');
            }
            startChurnGuardWizard();
            return;
        }

        if (/^\s*\/churnguard\s+model\s+(.+)\s*$/i.test(command)) {
            const match = command.match(/model\s+(.+)/i);
            const model = match[1].trim();
            churnGuardState.selectedModel = model;
            showNotification(`✅ AI Model set to: ${model}`, 'success');
            startChurnGuardWizard();
            return;
        }

        // Default: Start wizard
        startChurnGuardWizard();
    };

    /**
     * Show ChurnGuard help information
     */
    function showChurnGuardHelp() {
        const helpContent = `
<div style="padding: 20px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; color: white;">
    <h2 style="margin: 0 0 16px 0; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 32px;">🛡️</span>
        <span>ChurnGuard - Customer Success Churn Prevention</span>
    </h2>
    
    <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <h3 style="margin: 0 0 12px 0; color: #60a5fa;">What is ChurnGuard?</h3>
        <p style="margin: 0; line-height: 1.6;">
            AI-powered customer success engine that analyzes support tickets, predicts churn risk, 
            and generates personalized retention responses to save at-risk customers.
        </p>
    </div>

    <h3 style="margin: 20px 0 12px 0; color: #60a5fa;">Commands</h3>
    <div style="font-family: 'Monaco', monospace; font-size: 13px;">
        <div style="margin-bottom: 8px;">
            <code style="background: rgba(99,102,241,0.2); padding: 4px 8px; border-radius: 4px;">/churnguard</code>
            <span style="margin-left: 12px; color: #94a3b8;">Start the retention response wizard</span>
        </div>
        <div style="margin-bottom: 8px;">
            <code style="background: rgba(99,102,241,0.2); padding: 4px 8px; border-radius: 4px;">/churnguard help</code>
            <span style="margin-left: 12px; color: #94a3b8;">Show this help information</span>
        </div>
        <div style="margin-bottom: 8px;">
            <code style="background: rgba(99,102,241,0.2); padding: 4px 8px; border-radius: 4px;">/churnguard type [retention|support|checkin]</code>
            <span style="margin-left: 12px; color: #94a3b8;">Set response type</span>
        </div>
        <div style="margin-bottom: 8px;">
            <code style="background: rgba(99,102,241,0.2); padding: 4px 8px; border-radius: 4px;">/churnguard model [claude|gemini|gpt-4o]</code>
            <span style="margin-left: 12px; color: #94a3b8;">Choose AI model</span>
        </div>
    </div>

    <h3 style="margin: 20px 0 12px 0; color: #60a5fa;">Features</h3>
    <ul style="line-height: 1.8; padding-left: 20px; color: #e2e8f0;">
        <li><strong>Sentiment Analysis:</strong> AI detects frustration and churn signals</li>
        <li><strong>Churn Risk Scoring:</strong> ML model calculates 0-100% churn probability</li>
        <li><strong>Personalized Responses:</strong> Context-aware retention messages</li>
        <li><strong>Escalation Logic:</strong> Auto-recommends when to escalate to management</li>
        <li><strong>Product Solutions:</strong> Maps issues to specific feature recommendations</li>
        <li><strong>Multi-Model Support:</strong> Claude Sonnet 4.5, Gemini 3.0 Pro, GPT-4o</li>
    </ul>

    <div style="background: rgba(16,185,129,0.1); border-left: 3px solid #10b981; padding: 12px; margin-top: 20px; border-radius: 4px;">
        <strong style="color: #10b981;">💡 Pro Tip:</strong>
        <span style="color: #e2e8f0; margin-left: 8px;">Use Claude Sonnet 4.5 for the most empathetic and nuanced responses</span>
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
     * Start the ChurnGuard wizard
     */
    function startChurnGuardWizard() {
        const wizardHTML = buildChurnGuardWizard();
        
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
    function buildChurnGuardWizard() {
        const responseTypeCards = Object.entries(RESPONSE_TYPES).map(([key, config]) => {
            const isSelected = churnGuardState.responseType === key;
            return `
<div class="churnguard-response-type" data-type="${key}" style="
    flex: 1;
    min-width: 150px;
    padding: 16px;
    background: ${isSelected ? 'linear-gradient(135deg, ' + config.color + '20, ' + config.color + '10)' : '#1e293b'};
    border: 2px solid ${isSelected ? config.color : '#334155'};
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
" onmouseover="this.style.borderColor='${config.color}'" onmouseout="if(!this.classList.contains('selected')) this.style.borderColor='#334155'">
    <div style="font-size: 32px; margin-bottom: 8px;">${config.icon}</div>
    <div style="font-weight: 600; margin-bottom: 4px; color: white;">${config.name}</div>
    <div style="font-size: 12px; color: #94a3b8;">${config.description}</div>
</div>`;
        }).join('');

        const modelButtons = buildModelButtons();

        return `
<div style="max-width: 900px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: white;">
            <span style="font-size: 36px; vertical-align: middle;">🛡️</span>
            ChurnGuard
        </h1>
        <p style="margin: 0; color: #94a3b8; font-size: 15px;">
            AI-Powered Customer Success Churn Prevention Engine
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 12px; font-size: 13px; color: #64748b;">
            <span>💰 Avg. $127K saved/year</span>
            <span>•</span>
            <span>📊 94% save rate</span>
            <span>•</span>
            <span>⚡ Real-time analysis</span>
        </div>
    </div>

    <!-- Step 1: Response Type -->
    <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
            Step 1: Response Type
        </h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            ${responseTypeCards}
        </div>
    </div>

    <!-- Step 2: AI Model Selection -->
    <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
            Step 2: AI Model
        </h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            ${modelButtons}
        </div>
    </div>

    <!-- Step 3: Customer & Ticket Information -->
    <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
            Step 3: Customer & Ticket Details
        </h3>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #e2e8f0;">
                        Customer Name <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="text" id="churnguard-customer-name" placeholder="e.g., Acme Corporation" style="
                        width: 100%;
                        padding: 10px 14px;
                        background: #0f172a;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                    ">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #e2e8f0;">
                        Company Name
                    </label>
                    <input type="text" id="churnguard-company-name" placeholder="Your company name" style="
                        width: 100%;
                        padding: 10px 14px;
                        background: #0f172a;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                    ">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #e2e8f0;">
                        Customer Tier
                    </label>
                    <select id="churnguard-tier" style="
                        width: 100%;
                        padding: 10px 14px;
                        background: #0f172a;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                    ">
                        <option value="enterprise">Enterprise</option>
                        <option value="professional" selected>Professional</option>
                        <option value="starter">Starter</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #e2e8f0;">
                        Contract Value ($)
                    </label>
                    <input type="number" id="churnguard-contract-value" placeholder="50000" style="
                        width: 100%;
                        padding: 10px 14px;
                        background: #0f172a;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                    ">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #e2e8f0;">
                        Days Until Renewal
                    </label>
                    <input type="number" id="churnguard-renewal-days" placeholder="180" value="180" style="
                        width: 100%;
                        padding: 10px 14px;
                        background: #0f172a;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                    ">
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #e2e8f0;">
                    Support Ticket / Issue Description <span style="color: #ef4444;">*</span>
                </label>
                <textarea id="churnguard-ticket-content" rows="5" placeholder="Paste the customer's support ticket, complaint, or feedback here...

Example: 'We've been experiencing extremely slow load times for the past 2 weeks. Our team productivity has dropped significantly. We're considering switching to [competitor] if this isn't resolved immediately.'" style="
                    width: 100%;
                    padding: 12px 14px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    line-height: 1.6;
                    resize: vertical;
                "></textarea>
                <div style="font-size: 12px; color: #64748b; margin-top: 6px; display: flex; align-items: center; gap: 6px;">
                    <span>💡</span>
                    <span>Tip: Include exact customer language for best sentiment analysis</span>
                </div>
            </div>

            <div style="border-top: 1px solid #334155; padding-top: 16px; margin-top: 16px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #e2e8f0;">
                    Customer Behavior Metrics (Optional - Improves Churn Scoring)
                </h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; color: #94a3b8;">
                            Usage Change (%)
                        </label>
                        <input type="number" id="churnguard-usage-change" placeholder="-30" style="
                            width: 100%;
                            padding: 8px 10px;
                            background: #0f172a;
                            border: 1px solid #334155;
                            border-radius: 6px;
                            color: white;
                            font-size: 13px;
                        ">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; color: #94a3b8;">
                            Days Since Login
                        </label>
                        <input type="number" id="churnguard-days-login" placeholder="7" style="
                            width: 100%;
                            padding: 8px 10px;
                            background: #0f172a;
                            border: 1px solid #334155;
                            border-radius: 6px;
                            color: white;
                            font-size: 13px;
                        ">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; color: #94a3b8;">
                            NPS Score
                        </label>
                        <input type="number" id="churnguard-nps" placeholder="25" style="
                            width: 100%;
                            padding: 8px 10px;
                            background: #0f172a;
                            border: 1px solid #334155;
                            border-radius: 6px;
                            color: white;
                            font-size: 13px;
                        ">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; color: #94a3b8;">
                            Support Tickets
                        </label>
                        <input type="number" id="churnguard-ticket-count" placeholder="3" style="
                            width: 100%;
                            padding: 8px 10px;
                            background: #0f172a;
                            border: 1px solid #334155;
                            border-radius: 6px;
                            color: white;
                            font-size: 13px;
                        ">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Generate Button -->
    <div style="text-align: center;">
        <button id="churnguard-generate-btn" style="
            padding: 16px 48px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
            transition: all 0.2s ease;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 15px 40px rgba(99, 102, 241, 0.5)'"
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 30px rgba(99, 102, 241, 0.4)'">
            <span style="margin-right: 8px;">🚀</span>
            Analyze & Generate Retention Response
        </button>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748b;">
            AI will analyze sentiment, calculate churn risk, and generate personalized response
        </p>
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
                desc: 'Most empathetic & nuanced',
                color: '#8b5cf6'
            },
            { 
                id: 'gemini-3-pro', 
                name: 'Gemini 3.0 Pro', 
                icon: '🧠', 
                desc: 'Comprehensive analysis',
                color: '#3b82f6'
            },
            { 
                id: 'gpt-4o', 
                name: 'GPT-4o', 
                icon: '⚡', 
                desc: 'Fast & reliable',
                color: '#10b981'
            }
        ];

        return models.map(model => {
            const isActive = churnGuardState.selectedModel === model.id;
            return `
<button onclick="window.setChurnGuardModel('${model.id}')" style="
    flex: 1;
    min-width: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    background: ${isActive ? `linear-gradient(135deg, ${model.color}20, ${model.color}10)` : '#1e293b'};
    border: 2px solid ${isActive ? model.color : '#334155'};
    border-radius: 10px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
" onmouseover="if(this.style.borderColor !== '${model.color}') this.style.borderColor='${model.color}'" 
   onmouseout="if(!this.textContent.includes('${churnGuardState.selectedModel}')) this.style.borderColor='#334155'">
    <span style="font-size: 28px; margin-bottom: 8px;">${model.icon}</span>
    <span style="font-weight: 600; margin-bottom: 4px;">${model.name}</span>
    <span style="font-size: 11px; color: #94a3b8;">${model.desc}</span>
</button>`;
        }).join('');
    }

    /**
     * Set ChurnGuard model
     */
    window.setChurnGuardModel = function(model) {
        churnGuardState.selectedModel = model;
        window.churnGuardState = churnGuardState;
        
        // Refresh wizard to show updated selection
        const wizardContainer = document.querySelector('[data-type="retention"]')?.closest('div')?.parentElement;
        if (wizardContainer) {
            startChurnGuardWizard();
        }
        
        showNotification(`✅ AI Model: ${model}`, 'success');
    };

    /**
     * Attach event listeners to wizard elements
     */
    function attachWizardEventListeners() {
        // Response type selection
        document.querySelectorAll('.churnguard-response-type').forEach(card => {
            card.addEventListener('click', function() {
                document.querySelectorAll('.churnguard-response-type').forEach(c => {
                    c.classList.remove('selected');
                    c.style.borderColor = '#334155';
                });
                this.classList.add('selected');
                churnGuardState.responseType = this.dataset.type;
                const config = RESPONSE_TYPES[this.dataset.type];
                this.style.borderColor = config.color;
            });
        });

        // Generate button
        const generateBtn = document.getElementById('churnguard-generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerate);
        }
    }

    /**
     * Handle generate button click
     */
    async function handleGenerate() {
        // Collect form data
        const customerName = document.getElementById('churnguard-customer-name')?.value?.trim();
        const companyName = document.getElementById('churnguard-company-name')?.value?.trim();
        const ticketContent = document.getElementById('churnguard-ticket-content')?.value?.trim();
        const tier = document.getElementById('churnguard-tier')?.value;
        const contractValue = document.getElementById('churnguard-contract-value')?.value;
        const renewalDays = document.getElementById('churnguard-renewal-days')?.value;
        const usageChange = document.getElementById('churnguard-usage-change')?.value;
        const daysLogin = document.getElementById('churnguard-days-login')?.value;
        const nps = document.getElementById('churnguard-nps')?.value;
        const ticketCount = document.getElementById('churnguard-ticket-count')?.value;

        // Validation
        if (!customerName || !ticketContent) {
            showNotification('⚠️ Please fill in Customer Name and Ticket Description', 'error');
            return;
        }

        // Store customer data
        churnGuardState.customerData = {
            customerName,
            companyName,
            tier,
            contractValue: contractValue ? parseFloat(contractValue) : null,
            renewalDays: renewalDays ? parseInt(renewalDays) : 180,
            usageChange: usageChange ? parseFloat(usageChange) : 0,
            daysSinceLastLogin: daysLogin ? parseInt(daysLogin) : 0,
            npsScore: nps ? parseInt(nps) : 0,
            supportTicketCount: ticketCount ? parseInt(ticketCount) : 1,
            ticketContent
        };

        // Trigger generation
        if (window.generateChurnGuardResponse) {
            await window.generateChurnGuardResponse();
        }
    }

    /**
     * Show notification helper
     */
    function showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        // Could integrate with app's toast system
        if (window.showToast) {
            window.showToast(message, type);
        }
    }

    console.log('✅ ChurnGuard Response Writer module loaded');

})();
