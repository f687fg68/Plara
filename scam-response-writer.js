/**
 * ScamBaiter AI - Time-Wasting Response Generator
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * Generates safe, hilarious, and time-wasting responses to frustrating scammers.
 */

(function () {
    'use strict';

    // Scambaiting Personas
    const SCAM_PERSONAS = {
        'confused-grandpa': {
            name: 'Confused Grandpa',
            icon: '👴',
            description: 'Technologically illiterate, hard of hearing, goes on tangents.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Scammer: "Kindly send the $500 gift card photo."'
        },
        'eager-victim': {
            name: 'Eager Victim',
            icon: '🤑',
            description: 'Desperate to give money but fails at every simple step via incompetence.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Scammer: "You have won $10M lottery!"'
        },
        'tech-chaos': {
            name: 'Tech Support Chaos',
            icon: '💻',
            description: 'Uses made-up technical jargon, "Linux mainframe" issues, and misunderstandings',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Scammer: "Download AnyDesk to fix your virus."'
        },
        'storyteller': {
            name: 'The Storyteller',
            icon: '📖',
            description: 'Responds with incredibly long, boring, irrelevant personal stories.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Scammer: "I am Prince Abibi needing help."'
        }
    };

    // State Management
    let scamState = {
        persona: 'confused-grandpa',
        absurdityLevel: 5, // 1 (Believable) to 10 (Utter Nonsense)
        scamInput: '',
        analysis: null, // Gemini analysis of scam type
        currentDraft: '',
        history: []
    };

    // Initialize global state
    window.scamState = scamState;

    /**
     * Initialize Scam Command Handler
     */
    window.scamCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startScamWizard();
                break;
            case 'persona':
                if (parts[2]) await setScamPersona(parts[2]);
                break;
            case 'help':
                showScamHelp();
                break;
            default:
                await startScamWizard();
        }
    };

    /**
     * Start the Wizard UI
     */
    async function startScamWizard() {
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
<div class="scam-wizard" style="font-family: 'Courier New', monospace;">
    <div style="background: #000000; color: #00ff00; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem; border: 1px solid #00ff00;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="font-size: 1.5rem;">🎣</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; text-transform: uppercase;">ScamBaiter AI</h2>
        </div>
        <p style="margin: 0; opacity: 0.8; font-size: 0.9rem;">>> INITIATING COUNTER-SCAM PROTOCOLS...</p>
    </div>

    <div style="padding: 0 1rem 1rem; background: #0a0a0a; border: 1px solid #333; border-top: none; border-radius: 0 0 12px 12px;">
        
        <!-- Step 1: Input -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: #00ff00;">
                [INPUT_DATA]: PASTE SCAM EMAIL
            </h3>
            <textarea id="scam-input" rows="4" placeholder="Paste the scammer's message here..." style="width: 100%; padding: 0.75rem; background: #111; border: 1px solid #444; color: #eee; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
        </div>

        <!-- Step 2: Persona -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: #00ff00;">
                [SELECT_AGENT]: CHOOSE PERSONA
            </h3>
            ${buildPersonaButtons()}
        </div>

        <!-- Absurdity Slider -->
        <div style="margin-bottom: 1.5rem;">
             <label style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: #00ff00; margin-bottom: 6px;">
                 <span>BELIEVABLE</span>
                 <span>ABSURD NONSENSE</span>
             </label>
             <input type="range" min="1" max="10" value="${scamState.absurdityLevel}" oninput="window.scamState.absurdityLevel = this.value" style="width: 100%; accent-color: #00ff00;">
        </div>

        <button onclick="window.generateScamResponse()" style="width: 100%; padding: 1rem; background: #003300; color: #00ff00; border: 1px solid #00ff00; border-radius: 4px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: 'Courier New', monospace;" onmouseover="this.style.background='#004400'" onmouseout="this.style.background='#003300'">
            >> GENERATE_BAIT()
        </button>
    </div>
</div>`;
    }

    /**
     * Helper: Build Persona Buttons
     */
    function buildPersonaButtons() {
        return Object.keys(SCAM_PERSONAS).map(type => {
            const config = SCAM_PERSONAS[type];
            const isActive = scamState.persona === type;
            return `
<button onclick="window.setScamPersona('${type}')" style="
    display: inline-block; width: 48%; margin-right: 1%; margin-bottom: 0.5rem; padding: 0.75rem;
    border: 1px solid ${isActive ? '#00ff00' : '#444'};
    background: ${isActive ? '#002200' : '#111'};
    color: ${isActive ? '#00ff00' : '#aaa'};
    border-radius: 4px; text-align: left; cursor: pointer; transition: all 0.2s ease; font-family: 'Courier New', monospace;
">
    <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">${config.icon} ${config.name}</div>
    <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 4px;">${config.description}</div>
</button>`;
        }).join('');
    }

    // -- State Setters --

    window.setScamPersona = function (type) {
        if (SCAM_PERSONAS[type]) {
            scamState.persona = type;
            startScamWizard();
        }
    };

    /**
     * Show Help
     */
    function showScamHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `
<div style="padding: 1rem; font-family: 'Courier New', monospace; color: #333;">
    <h3>🎣 ScamBaiter Manual</h3>
    <ul>
        <li><code>/scam start</code> - Launch bait generator.</li>
        <li><strong>Goal:</strong> Waste their time so they can't scam real victims.</li>
        <li><strong>Safety:</strong> AI ensures no real personal info is shared.</li>
    </ul>
</div>`
        });
    }

    console.log('✅ ScamBaiter Response Writer loaded');
})();
