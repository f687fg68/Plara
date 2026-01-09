/**
 * ChurnGuard AI - Customer Success Retention Engine
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * Analyzes customer tickets and data to prevent churn and retain revenue.
 */

(function () {
    'use strict';

    // Retention Strategies
    const RETENTION_STRATEGIES = {
        'de-escalation': {
            name: 'De-Escalation',
            icon: '🔥',
            description: 'For angry/frustrated customers. Focus on listening & fixing.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Customer is furious about downtime or a critical bug.'
        },
        'value-reinforcement': {
            name: 'Value/ROI Defense',
            icon: '💎',
            description: 'For price objections or budget cuts.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Customer says "We actully looking to cut costs" or "Too expensive".'
        },
        'feature-gap': {
            name: 'Feature Gap / Roadmap',
            icon: '🚧',
            description: 'Leaving for a competitor feature.',
            defaultModel: 'gemini-3-pro-preview', // Gemini good for technical workarounds
            placeholder: 'Customer wants "Dark Mode" or "API Access" that we don\'t have yet.'
        },
        'executive-outreach': {
            name: 'Executive Save',
            icon: '👔',
            description: 'High ARR, requires leadership attention.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Enterprise client threatening to cancel. Needs VP/CEO step-in.'
        }
    };

    // State Management
    let churnState = {
        strategy: 'de-escalation',
        selectedModel: 'claude-sonnet-4',
        ticketContent: '',
        customerData: {
            arr: 0, // Annual Recurring Revenue
            tenure: '0', // Months
            usage: 'flat' // up, down, flat
        },
        analysis: null, // To store AI analysis results
        currentDraft: '',
        history: []
    };

    // Initialize global state
    window.churnState = churnState;

    /**
     * Initialize Churn Command Handler
     */
    window.churnCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startChurnWizard();
                break;
            case 'strategy':
                if (parts[2]) await setChurnStrategy(parts[2]);
                break;
            case 'help':
                showChurnHelp();
                break;
            default:
                await startChurnWizard();
        }
    };

    /**
     * Start the Churn Wizard UI
     */
    async function startChurnWizard() {
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
<div class="churn-wizard" style="font-family: 'Inter', sans-serif;">
    <div style="background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🛡️</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">ChurnGuard AI</h2>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">Retention Analysis & Recovery Engine</p>
    </div>

    <div style="padding: 0 1rem 1rem;">
        
        <!-- Step 1: Customer Ticket -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #b91c1c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 1</span>
                Customer Message / Ticket
            </h3>
            <textarea id="churn-ticket-input" rows="4" placeholder="Paste the angry email or cancellation request here..." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
        </div>

        <!-- Step 2: Customer Data (Vital for Risk Score) -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #b91c1c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 2</span>
                Customer Health Data
            </h3>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">ARR ($)</label>
                    <input type="number" id="churn-arr" placeholder="e.g. 15000" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Usage Trend</label>
                    <select id="churn-usage" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        <option value="flat">➡️ Flat</option>
                        <option value="down">↘️ Dropping (Risk)</option>
                        <option value="up">↗️ Growing</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Step 3: Strategy -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #b91c1c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 3</span>
                Recovery Strategy
            </h3>
            ${buildStrategyButtons()}
        </div>

        <button onclick="window.generateChurnResponse()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(185, 28, 28, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(185, 28, 28, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(185, 28, 28, 0.3)';">
            🛡️ Analyze & Draft Response
        </button>
    </div>
</div>`;
    }

    /**
     * Helper: Build Strategy Buttons
     */
    function buildStrategyButtons() {
        return Object.keys(RETENTION_STRATEGIES).map(strategy => {
            const config = RETENTION_STRATEGIES[strategy];
            const isActive = churnState.strategy === strategy;
            return `
<button onclick="window.setChurnStrategy('${strategy}')" style="
    display: inline-block; width: 48%; margin-right: 1%; margin-bottom: 0.5rem; padding: 0.75rem;
    border: 2px solid ${isActive ? '#b91c1c' : '#e5e7eb'};
    background: ${isActive ? '#fef2f2' : '#ffffff'};
    color: ${isActive ? '#991b1b' : '#374151'};
    border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s ease;
">
    <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">${config.icon} ${config.name}</div>
    <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">${config.description}</div>
</button>`;
        }).join('');
    }

    // -- State Setters --

    window.setChurnStrategy = function (strategy) {
        if (RETENTION_STRATEGIES[strategy]) {
            churnState.strategy = strategy;
            churnState.selectedModel = RETENTION_STRATEGIES[strategy].defaultModel;
            startChurnWizard();
        }
    };

    /**
     * Show Help
     */
    function showChurnHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `
<div style="padding: 1rem;">
    <h3>🛡️ ChurnGuard Help</h3>
    <ul style="line-height: 1.6;">
        <li><code>/churn start</code> - Open the specialized retention wizard.</li>
        <li><strong>Analyze:</strong> We assess the risk based on ARR and Sentiment.</li>
        <li><strong>Draft:</strong> We generate a high-EQ response tailored to save the account.</li>
    </ul>
</div>`
        });
    }

    console.log('✅ ChurnGuard Response Writer loaded');
})();
