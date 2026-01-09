/**
 * SafeSpace AI - Online Harassment De-Escalation Engine
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * Generates safe, de-escalating responses to online harassment and abuse.
 */

(function () {
    'use strict';

    // De-Escalation Strategies
    const SAFETY_STRATEGIES = {
        'grey-rock': {
            name: 'The Grey Rock',
            icon: '🪨',
            description: 'Boring, non-reactive. Starves the troll of attention.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Troll: "You are the worst streamer ever, just quit!"'
        },
        'firm-boundary': {
            name: 'Firm Boundary',
            icon: '🛑',
            description: 'Clear, polite, but final refusal to engage further.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Harasser: "Why wont you answer my DMs? I know where you live."'
        },
        'humorous-deflection': {
            name: 'Humorous Deflection',
            icon: '🤡',
            description: 'Uses wit to disarm the tension without being mean.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Comment: "Your makeup looks like a clown painted it."'
        },
        'empathetic-pivot': {
            name: 'Empathetic Pivot',
            icon: '❤️',
            description: 'For misguided anger. Validates feelings to lower temp.',
            defaultModel: 'claude-sonnet-4', // Claude excels at empathy
            placeholder: 'Customer: "I hate your company! You ruined my week!"'
        }
    };

    // State Management
    let safetyState = {
        strategy: 'grey-rock',
        selectedModel: 'claude-sonnet-4',
        harassmentInput: '',
        context: '', // Optional context (platform, relationship)
        analysis: null, // Risk analysis from Gemini
        currentDraft: '',
        reportingGuide: '',
        history: []
    };

    // Initialize global state
    window.safetyState = safetyState;

    /**
     * Initialize Safety Command Handler
     */
    window.safetyCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startSafetyWizard();
                break;
            case 'strategy':
                if (parts[2]) await setSafetyStrategy(parts[2]);
                break;
            case 'help':
                showSafetyHelp();
                break;
            default:
                await startSafetyWizard();
        }
    };

    /**
     * Start the Wizard UI
     */
    async function startSafetyWizard() {
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
<div class="safety-wizard" style="font-family: 'Inter', sans-serif;">
    <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🛡️</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">SafeSpace AI</h2>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">Harassment De-Escalation & Safety Engine</p>
    </div>

    <div style="padding: 0 1rem 1rem;">
        
        <!-- Step 1: The Input -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #0d9488; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 1</span>
                Incoming Message
            </h3>
            <textarea id="safety-input" rows="3" placeholder="Paste the harassing message, DM, or comment here..." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
        </div>

        <!-- Step 2: Strategy -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #0d9488; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 2</span>
                Response Strategy
            </h3>
            ${buildStrategyButtons()}
        </div>

        <!-- Step 3: Context (Optional) -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #1e3a5f;">
                <span style="background: #0d9488; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 3</span>
                Context (Platform/Relationship)
            </h3>
            <input type="text" id="safety-context" placeholder="e.g., Twitter, Ex-Partner, Anonymous Troll, Work Slack" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem;">
        </div>

        <button onclick="window.generateSafetyResponse()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(13, 148, 136, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(13, 148, 136, 0.3)';">
            🛡️ Analyze Risk & Draft Reply
        </button>
    </div>
</div>`;
    }

    /**
     * Helper: Build Strategy Buttons
     */
    function buildStrategyButtons() {
        return Object.keys(SAFETY_STRATEGIES).map(strategy => {
            const config = SAFETY_STRATEGIES[strategy];
            const isActive = safetyState.strategy === strategy;
            return `
<button onclick="window.setSafetyStrategy('${strategy}')" style="
    display: inline-block; width: 48%; margin-right: 1%; margin-bottom: 0.5rem; padding: 0.75rem;
    border: 2px solid ${isActive ? '#0d9488' : '#e5e7eb'};
    background: ${isActive ? '#ccfbf1' : '#ffffff'};
    color: ${isActive ? '#0f766e' : '#374151'};
    border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s ease;
">
    <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">${config.icon} ${config.name}</div>
    <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">${config.description}</div>
</button>`;
        }).join('');
    }

    // -- State Setters --

    window.setSafetyStrategy = function (strategy) {
        if (SAFETY_STRATEGIES[strategy]) {
            safetyState.strategy = strategy;
            safetyState.selectedModel = SAFETY_STRATEGIES[strategy].defaultModel;
            startSafetyWizard();
        }
    };

    /**
     * Show Help
     */
    function showSafetyHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `
<div style="padding: 1rem;">
    <h3>🛡️ SafeSpace Help</h3>
    <ul style="line-height: 1.6;">
        <li><code>/safety start</code> - Open the de-escalation tool.</li>
        <li><strong>Grey Rock:</strong> Start boring them. Best for persistent trolls.</li>
        <li><strong>Risk Analysis:</strong> We scan for threats of doxxing or physical harm using Gemini.</li>
    </ul>
</div>`
        });
    }

    console.log('✅ SafeSpace Response Writer loaded');
})();
