/**
 * LegalMind AI - Discovery Response Generator
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * Automates drafting of legal discovery responses (Interrogatories, RFPs, RFAs).
 */

(function () {
    'use strict';

    // Discovery Types
    const DISCOVERY_TYPES = {
        'interrogatory': {
            name: 'Interrogatories',
            icon: '❓',
            description: 'Written questions requiring sworn answers (FRCP 33)',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'INTERROGATORY NO. 1: Identify all persons with knowledge of the alleged breach...'
        },
        'request-production': {
            name: 'Requests for Production (RFP)',
            icon: '📂',
            description: 'Requests for documents and ESI (FRCP 34)',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'REQUEST NO. 3: All emails sent by Defendant regarding "Project X" from 2020-2022.'
        },
        'request-admission': {
            name: 'Requests for Admission (RFA)',
            icon: '✅',
            description: 'Requests to admit/deny facts (FRCP 36)',
            defaultModel: 'gemini-3-pro-preview', // Gemini is good at logical truth evaluation
            placeholder: 'REQUEST NO. 5: Admit that you did not sign the contract on June 1st.'
        }
    };

    // Objection Strategies
    const OBJECTION_STRATEGIES = {
        'standard': {
            name: 'Standard / Balanced',
            icon: '⚖️',
            description: 'Preserve objections but provide substantive answer.',
            modifier: 'Assert standard General Objections. Answer "subject to and without waiving..."'
        },
        'aggressive': {
            name: 'Aggressive / Protective',
            icon: '🛡️',
            description: 'Object to everything possible. Minimal substantive disclosure.',
            modifier: 'Maximize objections (Overbroad, Vague, Undue Burden). Provide very narrow substantive response only if compelled.'
        },
        'cooperative': {
            name: 'Cooperative / Open',
            icon: '🤝',
            description: 'Minimize objections to move case forward.',
            modifier: 'Limit objections to privilege only. Provide full, clear substantive answers.'
        }
    };

    // State Management
    let discoveryState = {
        type: 'interrogatory',
        strategy: 'standard',
        selectedModel: 'claude-sonnet-4',
        inputText: '', // The raw request text
        caseContext: '', // Background facts of the case
        currentDraft: '',
        analysis: null, // Analysis from Gemini
        history: []
    };

    // Initialize global state
    window.discoveryState = discoveryState;

    /**
     * Initialize Discovery Command Handler
     */
    window.discoveryCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startDiscoveryWizard();
                break;
            case 'type':
                if (parts[2]) await setDiscoveryType(parts[2]);
                break;
            case 'help':
                showDiscoveryHelp();
                break;
            default:
                await startDiscoveryWizard();
        }
    };

    /**
     * Start the Wizard UI
     */
    async function startDiscoveryWizard() {
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
<div class="discovery-wizard" style="font-family: 'Inter', sans-serif;">
    <div style="background: linear-gradient(135deg, #3730a3 0%, #312e81 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">⚖️</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">LegalMind AI</h2>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">Discovery Response Generator • FRCP Compliant</p>
    </div>

    <div style="padding: 0 1rem 1rem;">
        
        <!-- Step 1: Discovery Type -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #3730a3; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 1</span>
                Request Type
            </h3>
            ${buildTypeButtons()}
        </div>

        <!-- Step 2: Strategy -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #3730a3; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 2</span>
                Objection Strategy
            </h3>
            ${buildStrategyButtons()}
        </div>

        <!-- Step 3: Input Data -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #1e3a5f;">
                <span style="background: #3730a3; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 3</span>
                Request & Case Facts
            </h3>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Discovery Requests (Paste Text)</label>
                <textarea id="discovery-input" rows="5" placeholder="${DISCOVERY_TYPES[discoveryState.type].placeholder}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: 'Courier New', monospace; resize: vertical;"></textarea>
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Case Context / Known Facts</label>
                <textarea id="discovery-context" rows="3" placeholder="e.g., Breach of Contract case. Defendant denies signing. Documents exist in Sharepoint." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
            </div>
        </div>

        <button onclick="window.generateDiscoveryResponse()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #3730a3 0%, #312e81 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(55, 48, 163, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(55, 48, 163, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(55, 48, 163, 0.3)';">
            ⚖️ Draft Responses
        </button>
    </div>
</div>`;
    }

    /**
     * Helper: Build Type Buttons
     */
    function buildTypeButtons() {
        return Object.keys(DISCOVERY_TYPES).map(type => {
            const config = DISCOVERY_TYPES[type];
            const isActive = discoveryState.type === type;
            return `
<button onclick="window.setDiscoveryType('${type}')" style="
    display: inline-block; width: 48%; margin-right: 1%; margin-bottom: 0.5rem; padding: 0.75rem;
    border: 2px solid ${isActive ? '#3730a3' : '#e5e7eb'};
    background: ${isActive ? '#e0e7ff' : '#ffffff'};
    color: ${isActive ? '#312e81' : '#374151'};
    border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s ease;
">
    <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">${config.icon} ${config.name}</div>
    <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">${config.description}</div>
</button>`;
        }).join('');
    }

    /**
     * Helper: Build Strategy Buttons
     */
    function buildStrategyButtons() {
        return Object.keys(OBJECTION_STRATEGIES).map(strategy => {
            const config = OBJECTION_STRATEGIES[strategy];
            const isActive = discoveryState.strategy === strategy;
            return `
<button onclick="window.setDiscoveryStrategy('${strategy}')" style="
    display: inline-block; padding: 0.5rem 1rem; margin-right: 0.5rem; margin-bottom: 0.5rem;
    border: 1px solid ${isActive ? '#3730a3' : '#d1d5db'};
    background: ${isActive ? '#3730a3' : '#ffffff'};
    color: ${isActive ? '#ffffff' : '#4b5563'};
    border-radius: 20px; font-size: 0.85rem; font-weight: 500; cursor: pointer;
">
    ${config.icon} ${config.name}
</button>`;
        }).join('');
    }

    // -- State Setters --

    window.setDiscoveryType = function (type) {
        if (DISCOVERY_TYPES[type]) {
            discoveryState.type = type;
            discoveryState.selectedModel = DISCOVERY_TYPES[type].defaultModel;
            startDiscoveryWizard();
        }
    };

    window.setDiscoveryStrategy = function (strategy) {
        if (OBJECTION_STRATEGIES[strategy]) {
            discoveryState.strategy = strategy;
            startDiscoveryWizard();
        }
    };

    /**
     * Show Help
     */
    function showDiscoveryHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `
<div style="padding: 1rem;">
    <h3>⚖️ LegalMind Help</h3>
    <ul style="line-height: 1.6;">
        <li><code>/discovery start</code> - Open the generator.</li>
        <li><strong>Workflow:</strong> We analyze requests for "objectionable" features (vague, overbroad) first, then draft the response.</li>
        <li><strong>Models:</strong> Gemini 3.0 Pro analyzes the legal text; Claude Sonnet 4.5 drafts the formal response.</li>
    </ul>
</div>`
        });
    }

    console.log('✅ LegalMind Response Writer loaded');
})();
