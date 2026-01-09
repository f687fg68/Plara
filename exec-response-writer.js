/**
 * ExecGhostwriter AI - C-Suite Communications Engine
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * Drafts high-stakes executive communications by analyzing voice and context.
 */

(function () {
    'use strict';

    // Communication Scenarios
    const COMM_TYPES = {
        'vision': {
            name: 'Vision & Strategy',
            icon: '🔭',
            description: 'Aligning the team, announcing major shifts.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'We are pivoting to AI-first. Need to inspire the team but acknowledge the hard work ahead.'
        },
        'neutral': {
            name: 'General / Operational',
            icon: '🏢',
            description: 'Updates, meeting recaps, standard comms.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Weekly update to the Board. Q3 metrics are up 10%, but retention is flat.'
        },
        'crisis': {
            name: 'Crisis / Bad News',
            icon: '🚨',
            description: 'Layoffs, outages, PR incidents.',
            defaultModel: 'claude-sonnet-4', // Claude is very safe/empathetic
            placeholder: 'Data breach occurred. Need to inform customers transparency without admitting liability yet.'
        },
        'negotiation': {
            name: 'High-Stakes Negotiation',
            icon: '🤝',
            description: 'M&A, big deals, partnership disputes.',
            defaultModel: 'gemini-3-pro-preview', // Gemini logic helpful here
            placeholder: 'Pushing back on the acquisition price. We want 15% more based on IP valuation.'
        }
    };

    // Audience Tiers
    const AUDIENCES = {
        'internal-all': { name: 'All Employees', icon: '📢' },
        'internal-leadership': { name: 'Leadership Team', icon: '💼' },
        'board': { name: 'Board of Directors', icon: '🏛️' },
        'external': { name: 'External / Public', icon: '🌐' }
    };

    // State Management
    let execState = {
        type: 'neutral',
        audience: 'internal-all',
        selectedModel: 'claude-sonnet-4',
        voiceSample: '', // The user's own writing to mimic
        context: '',
        nuance: 5, // 1 (Direct) to 10 (Diplomatic)
        currentDraft: '',
        styleAnalysis: null,
        history: []
    };

    // Initialize global state
    window.execState = execState;

    /**
     * Initialize Exec Command Handler
     */
    window.execCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startExecWizard();
                break;
            case 'type':
                if (parts[2]) await setExecType(parts[2]);
                break;
            case 'help':
                showExecHelp();
                break;
            default:
                await startExecWizard();
        }
    };

    /**
     * Start the Wizard UI
     */
    async function startExecWizard() {
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
<div class="exec-wizard" style="font-family: 'Inter', sans-serif;">
    <div style="background: linear-gradient(135deg, #111827 0%, #000000 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">✒️</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">Executive Ghostwriter</h2>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">C-Suite Communications Engine • Voice Match™</p>
    </div>

    <div style="padding: 0 1rem 1rem;">
        
        <!-- Step 1: Scenario -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1f2937;">
                <span style="background: #111827; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 1</span>
                Objective
            </h3>
            ${buildTypeButtons()}
        </div>

        <!-- Step 2: Audience -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1f2937;">
                <span style="background: #111827; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 2</span>
                Audience
            </h3>
            <select onchange="window.setExecAudience(this.value)" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem;">
                ${Object.keys(AUDIENCES).map(k => `<option value="${k}" ${execState.audience === k ? 'selected' : ''}>${AUDIENCES[k].icon} ${AUDIENCES[k].name}</option>`).join('')}
            </select>
        </div>

        <!-- Step 3: Voice Sample (The "Secret Sauce") -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #1f2937;">
                <span style="background: #111827; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 3</span>
                Style Match (Optional)
            </h3>
            <textarea id="exec-voice-sample" rows="2" placeholder="Paste a sample of your previous writing here. AI will match your cadence, vocabulary, and tone." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
        </div>

        <!-- Step 4: Context -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #1f2937;">
                <span style="background: #111827; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 4</span>
                What do you need to say?
            </h3>
            <textarea id="exec-context" rows="4" placeholder="${COMM_TYPES[execState.type].placeholder}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
        </div>

        <!-- Nuance Slider -->
        <div style="margin-bottom: 1.5rem;">
             <label style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 6px;">
                 <span>Direct / Blunt</span>
                 <span>Diplomatic / Nuanced</span>
             </label>
             <input type="range" min="1" max="10" value="${execState.nuance}" oninput="window.execState.nuance = this.value" style="width: 100%;">
        </div>

        <button onclick="window.generateExecResponse()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #111827 0%, #374151 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(0,0,0, 0.3)';">
            ✒️ Draft Communication
        </button>
    </div>
</div>`;
    }

    /**
     * Helper: Build Type Buttons
     */
    function buildTypeButtons() {
        return Object.keys(COMM_TYPES).map(type => {
            const config = COMM_TYPES[type];
            const isActive = execState.type === type;
            return `
<button onclick="window.setExecType('${type}')" style="
    display: inline-block; width: 48%; margin-right: 1%; margin-bottom: 0.5rem; padding: 0.75rem;
    border: 2px solid ${isActive ? '#111827' : '#e5e7eb'};
    background: ${isActive ? '#f3f4f6' : '#ffffff'};
    color: ${isActive ? '#111827' : '#374151'};
    border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s ease;
">
    <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">${config.icon} ${config.name}</div>
    <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">${config.description}</div>
</button>`;
        }).join('');
    }

    // -- State Setters --

    window.setExecType = function (type) {
        if (COMM_TYPES[type]) {
            execState.type = type;
            execState.selectedModel = COMM_TYPES[type].defaultModel;
            startExecWizard();
        }
    };

    window.setExecAudience = function (audience) {
        if (AUDIENCES[audience]) {
            execState.audience = audience;
        }
    };

    /**
     * Show Help
     */
    function showExecHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `
<div style="padding: 1rem;">
    <h3>✒️ Executive Ghostwriter Help</h3>
    <ul style="line-height: 1.6;">
        <li><code>/exec start</code> - Open the writer.</li>
        <li><strong>Voice Match:</strong> Paste 1-2 paragraphs of your own writing. Gemini analyzes your sentence length, vocabulary density, and tone markers to mimic you.</li>
        <li><strong>Nuance:</strong> Use the slider to adjust between "Brutally Honest" and "Politically Safe".</li>
    </ul>
</div>`
        });
    }

    console.log('✅ ExecWriter Response Writer loaded');
})();
