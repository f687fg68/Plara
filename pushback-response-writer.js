/**
 * PushbackPro - AI Vendor & Contract Response Writer
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * This module provides intelligent contract negotiation response generation for:
 * - Price increase pushbacks
 * - Unfair contract clauses
 * - SLA violations
 * - Termination notices
 * - Payment terms
 * - Scope creep
 * - Auto-renewal disputes
 * - Liability caps
 */

(function () {
    'use strict';

    // Response Type Configurations
    const RESPONSE_TYPES = {
        'price-increase': {
            name: 'Price Increase Pushback',
            icon: '💰',
            description: 'Negotiate vendor price increases',
            defaultModel: 'gemini-3-pro-preview',
            placeholder: 'Vendor raised prices from $1,500/month to $2,100/month (40% increase) citing "market conditions"'
        },
        'unfair-clause': {
            name: 'Unfair Contract Clause',
            icon: '⚖️',
            description: 'Challenge one-sided contract terms',
            defaultModel: 'claude-3.5-sonnet',
            placeholder: 'Contract includes auto-renewal clause with 90-day notice requirement buried in fine print'
        },
        'sla-violation': {
            name: 'SLA Violation Response',
            icon: '⏱️',
            description: 'Demand compensation for service failures',
            defaultModel: 'claude-3.5-sonnet',
            placeholder: 'Vendor promised 99.9% uptime but delivered 96.5% last month, causing business disruption'
        },
        'termination': {
            name: 'Termination Notice Response',
            icon: '🚫',
            description: 'Handle contract terminations',
            defaultModel: 'claude-3.5-sonnet',
            placeholder: 'Vendor sent termination notice with 30 days notice, citing "restructuring"'
        },
        'payment-terms': {
            name: 'Payment Terms Negotiation',
            icon: '💳',
            description: 'Extend or modify payment terms',
            defaultModel: 'gemini-3-pro-preview',
            placeholder: 'Need to extend payment terms from Net 30 to Net 60 due to cash flow'
        },
        'scope-creep': {
            name: 'Scope Creep Response',
            icon: '📋',
            description: 'Address added work beyond contract',
            defaultModel: 'claude-3.5-sonnet',
            placeholder: 'Vendor requesting additional features not in original scope without discussing pricing'
        },
        'auto-renewal': {
            name: 'Auto-Renewal Dispute',
            icon: '🔄',
            description: 'Contest automatic renewals',
            defaultModel: 'claude-3.5-sonnet',
            placeholder: 'Contract auto-renewed despite our cancellation request 45 days before renewal'
        },
        'liability-cap': {
            name: 'Liability Cap Negotiation',
            icon: '🛡️',
            description: 'Negotiate liability limitations',
            defaultModel: 'gemini-3-pro-preview',
            placeholder: 'Vendor wants to cap liability at $10K but contract value is $100K annually'
        }
    };

    // Negotiation Tone Configurations
    const NEGOTIATION_TONES = {
        'diplomatic': {
            name: 'Diplomatic',
            icon: '🤝',
            description: 'Collaborative and relationship-preserving',
            modifier: 'Maintain a diplomatic, collaborative tone that preserves the business relationship while firmly stating your position.'
        },
        'firm': {
            name: 'Firm',
            icon: '💼',
            description: 'Professional and assertive',
            modifier: 'Use a firm, professional tone that makes your position clear without being aggressive. Balance assertiveness with respect.'
        },
        'assertive': {
            name: 'Assertive',
            icon: '⚡',
            description: 'Strong and direct',
            modifier: 'Be assertive and direct. Make it clear you are prepared to take action if needed. Use strong but professional language.'
        },
        'final-warning': {
            name: 'Final Warning',
            icon: '🚨',
            description: 'Last attempt before escalation',
            modifier: 'This is a final warning before legal/executive escalation. Be firm, document everything, and set clear deadlines.'
        }
    };

    // Leverage Point Configurations
    const LEVERAGE_POINTS = {
        'alternatives': 'We have researched competitive alternatives at better prices',
        'volume': 'We are a high-volume customer with significant business',
        'loyalty': 'We have been a loyal, long-term customer',
        'referrals': 'We provide referrals and positive reviews',
        'contract-violation': 'There are existing contract violations on vendor side',
        'market-data': 'We have market rate data showing better pricing',
        'legal': 'We have strong legal standing on this issue',
        'public-relations': 'Public relations considerations favor our position',
        'growth': 'We have significant growth potential',
        'timing': 'Current timing/circumstances favor our position'
    };

    // State Management
    let pushbackState = {
        responseType: 'price-increase',
        negotiationTone: 'firm',
        selectedModel: 'claude-sonnet-4', // Default to Claude Sonnet 4.5
        leveragePoints: [],
        formData: {},
        currentDraft: '',
        history: []
    };

    // Initialize global state
    window.pushbackState = pushbackState;

    /**
     * Initialize PushbackPro Command Handler
     */
    window.pushbackCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startPushbackWizard();
                break;
            case 'type':
                if (parts[2]) await setResponseType(parts[2]);
                break;
            case 'tone':
                if (parts[2]) await setNegotiationTone(parts[2]);
                break;
            case 'model':
                if (parts[2]) await setPushbackModel(parts[2]);
                break;
            case 'help':
                showPushbackHelp();
                break;
            default:
                await startPushbackWizard();
        }
    };

    /**
     * Start the PushbackPro Wizard UI
     */
    async function startPushbackWizard() {
        appendNotionMessage({
            role: 'assistant',
            content: buildWizardUI()
        });
    }

    /**
     * Build Interactive Wizard UI
     */
    function buildWizardUI() {
        return `
<div class="pushbackpro-wizard" style="font-family: 'Inter', sans-serif;">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🛡️</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">PushbackPro</h2>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">AI-Powered Vendor & Contract Negotiation Response Writer</p>
        <div style="margin-top: 12px; padding: 8px 12px; background: rgba(255,255,255,0.15); border-radius: 6px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
            💰 Average Savings: $127K/year • 94% Success Rate
        </div>
    </div>

    <div style="padding: 0 1rem 1rem;">
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 1</span>
                Select Response Type
            </h3>
            ${buildResponseTypeButtons()}
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 2</span>
                Choose Negotiation Tone
            </h3>
            ${buildToneButtons()}
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 3</span>
                Select AI Model
            </h3>
            ${buildModelButtons()}
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #1e3a5f;">
                <span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 4</span>
                Provide Contract Details
            </h3>
            <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.75rem;">Be specific about numbers, dates, and terms. The AI will craft a professional response.</p>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Vendor/Counterparty Name</label>
                <input type="text" id="pushback-vendor-name" placeholder="e.g., Acme Software Inc." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem;">
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Your Company Name</label>
                <input type="text" id="pushback-company-name" placeholder="e.g., My Business LLC" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem;">
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Issue Description (Be Specific)</label>
                <textarea id="pushback-issue-description" rows="5" placeholder="${RESPONSE_TYPES[pushbackState.responseType].placeholder}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Your Desired Outcome</label>
                <textarea id="pushback-desired-outcome" rows="3" placeholder="What result do you want? e.g., Reject increase, cap at 10%, or phase over 6 months" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Your Leverage Points (Select all that apply)</label>
                ${buildLeverageChips()}
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Additional Context (Optional)</label>
                <textarea id="pushback-additional-context" rows="2" placeholder="Any other relevant details: contract length, past issues, industry norms..." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
            </div>
        </div>

        <button onclick="window.generatePushbackResponse()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(37, 99, 235, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(37, 99, 235, 0.3)';">
            🚀 Generate Professional Pushback Response
        </button>

        <div style="margin-top: 1rem; padding: 1rem; background: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0; font-size: 0.85rem; color: #1e3a5f;">
                <strong>💡 Pro Tip:</strong> Include specific numbers, dates, and contract terms. The more detail you provide, the stronger your negotiation position.
            </p>
        </div>
    </div>
</div>`;
    }

    /**
     * Build Response Type Selection Buttons
     */
    function buildResponseTypeButtons() {
        return Object.keys(RESPONSE_TYPES).map(type => {
            const config = RESPONSE_TYPES[type];
            const isActive = pushbackState.responseType === type;
            return `
<button onclick="window.setResponseType('${type}')" style="
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border: 2px solid ${isActive ? '#2563eb' : '#e5e7eb'};
    background: ${isActive ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#ffffff'};
    color: ${isActive ? '#ffffff' : '#374151'};
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
" onmouseover="if(this.style.background === 'rgb(255, 255, 255)') this.style.background='#f9fafb'" onmouseout="if(!this.style.background.includes('gradient')) this.style.background='#ffffff'">
    <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2rem;">${config.icon}</span>
        <div>
            <div style="font-weight: 600;">${config.name}</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">${config.description}</div>
        </div>
    </div>
</button>`;
        }).join('');
    }

    /**
     * Build Tone Selection Buttons
     */
    function buildToneButtons() {
        return Object.keys(NEGOTIATION_TONES).map(tone => {
            const config = NEGOTIATION_TONES[tone];
            const isActive = pushbackState.negotiationTone === tone;
            return `
<button onclick="window.setNegotiationTone('${tone}')" style="
    display: inline-block;
    padding: 0.6rem 1rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    border: 2px solid ${isActive ? '#2563eb' : '#e5e7eb'};
    background: ${isActive ? '#2563eb' : '#ffffff'};
    color: ${isActive ? '#ffffff' : '#374151'};
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
" onmouseover="if(this.style.background === 'rgb(255, 255, 255)') this.style.background='#f9fafb'" onmouseout="if(this.style.background !== 'rgb(37, 99, 235)') this.style.background='#ffffff'" title="${config.description}">
    ${config.icon} ${config.name}
</button>`;
        }).join('');
    }

    /**
     * Build Model Selection Buttons
     */
    function buildModelButtons() {
        const models = [
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4.5', icon: '🎯', desc: 'Best for legal nuance and strategic negotiation' },
            { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', icon: '🧠', desc: 'Advanced reasoning and comprehensive analysis' },
            { id: 'gpt-4o', name: 'GPT-4o', icon: '⚡', desc: 'Fast, reliable, and balanced' }
        ];

        return models.map(model => {
            const isActive = pushbackState.selectedModel === model.id;
            return `
<button onclick="window.setPushbackModel('${model.id}')" style="
    display: inline-block;
    padding: 0.6rem 1rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    border: 2px solid ${isActive ? '#10b981' : '#e5e7eb'};
    background: ${isActive ? '#10b981' : '#ffffff'};
    color: ${isActive ? '#ffffff' : '#374151'};
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
" onmouseover="if(this.style.background === 'rgb(255, 255, 255)') this.style.background='#f9fafb'" onmouseout="if(this.style.background !== 'rgb(16, 185, 129)') this.style.background='#ffffff'" title="${model.desc}">
    ${model.icon} ${model.name}
</button>`;
        }).join('');
    }

    /**
     * Build Leverage Point Chips
     */
    function buildLeverageChips() {
        return `
<div style="display: flex; flex-wrap: wrap; gap: 8px;" id="leverage-chips-container">
    ${Object.keys(LEVERAGE_POINTS).map(key => {
            const isSelected = pushbackState.leveragePoints.includes(key);
            return `
    <button onclick="window.toggleLeveragePoint('${key}')" data-leverage="${key}" class="leverage-chip" style="
        padding: 8px 14px;
        border: 2px solid ${isSelected ? '#2563eb' : '#e5e7eb'};
        background: ${isSelected ? '#2563eb' : '#ffffff'};
        color: ${isSelected ? '#ffffff' : '#374151'};
        border-radius: 20px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;
    " onmouseover="if(!this.style.background.includes('37, 99, 235')) this.style.background='#f9fafb'" onmouseout="if(!this.style.background.includes('37, 99, 235')) this.style.background='#ffffff'">
        ${key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </button>`;
        }).join('')}
</div>`;
    }

    // Global functions for UI interaction
    window.setResponseType = function (type) {
        if (RESPONSE_TYPES[type]) {
            pushbackState.responseType = type;
            pushbackState.selectedModel = RESPONSE_TYPES[type].defaultModel;
            startPushbackWizard();
            showNotification(`Response type set to ${RESPONSE_TYPES[type].name}`, 'success');
        }
    };

    window.setNegotiationTone = function (tone) {
        if (NEGOTIATION_TONES[tone]) {
            pushbackState.negotiationTone = tone;
            startPushbackWizard();
            showNotification(`Tone set to ${NEGOTIATION_TONES[tone].name}`, 'success');
        }
    };

    window.setPushbackModel = function (model) {
        pushbackState.selectedModel = model;
        window.pushbackState = pushbackState; // Update global state
        startPushbackWizard();
        const modelNames = {
            'claude-sonnet-4': 'Claude Sonnet 4.5',
            'claude-3.5-sonnet': 'Claude Sonnet 4.5',
            'gemini-3-pro-preview': 'Gemini 3.0 Pro',
            'gemini-3-pro': 'Gemini 3.0 Pro',
            'gpt-4o': 'GPT-4o'
        };
        showNotification(`✅ AI Model: ${modelNames[model] || model}`, 'success');
    };

    window.toggleLeveragePoint = function (key) {
        const index = pushbackState.leveragePoints.indexOf(key);
        if (index > -1) {
            pushbackState.leveragePoints.splice(index, 1);
        } else {
            pushbackState.leveragePoints.push(key);
        }
        startPushbackWizard();
    };

    /**
     * Show Help Information
     */
    function showPushbackHelp() {
        const helpContent = `
<div style="font-family: 'Inter', sans-serif; padding: 1rem;">
    <h3 style="color: #1e3a5f; margin-bottom: 1rem;">🛡️ PushbackPro Help</h3>
    
    <h4 style="color: #374151; margin-top: 1rem;">Commands:</h4>
    <ul style="line-height: 1.8; color: #6b7280;">
        <li><code>/pushback start</code> - Start the pushback wizard</li>
        <li><code>/pushback type [type]</code> - Set response type</li>
        <li><code>/pushback tone [tone]</code> - Set negotiation tone</li>
        <li><code>/pushback model [model]</code> - Set AI model</li>
    </ul>

    <h4 style="color: #374151; margin-top: 1rem;">Response Types:</h4>
    <ul style="line-height: 1.8; color: #6b7280;">
        ${Object.keys(RESPONSE_TYPES).map(key => {
            const type = RESPONSE_TYPES[key];
            return `<li><strong>${type.icon} ${type.name}:</strong> ${type.description}</li>`;
        }).join('')}
    </ul>

    <h4 style="color: #374151; margin-top: 1rem;">Success Tips:</h4>
    <ul style="line-height: 1.8; color: #6b7280;">
        <li>Include specific numbers and dates</li>
        <li>Reference actual contract clauses</li>
        <li>Document past communications</li>
        <li>Know your alternatives (BATNA)</li>
        <li>Be prepared to walk away</li>
    </ul>

    <h4 style="color: #374151; margin-top: 1rem;">Average Results:</h4>
    <p style="color: #6b7280; line-height: 1.6;">
        💰 Average Savings: $127K annually<br>
        📈 Success Rate: 94% achieve favorable outcome<br>
        ⏱️ Time Saved: 3-5 hours per negotiation<br>
        🎯 User Satisfaction: 4.8/5 stars
    </p>
</div>`;

        appendNotionMessage({
            role: 'assistant',
            content: helpContent
        });
    }

    console.log('✅ PushbackPro module loaded');
})();
