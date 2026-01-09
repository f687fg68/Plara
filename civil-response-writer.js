/**
 * CivilMind AI - Constructive Political Discourse Engine
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * Generates balanced, fact-based responses to heated political arguments.
 */

(function () {
    'use strict';

    // Engagement Tones
    const CIVIL_TONES = {
        'socratic': {
            name: 'Socratic Method',
            icon: '🤔',
            description: 'Asks guiding questions to expose contradictions gently.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Comment: "Taxation is theft!"'
        },
        'fact-based': {
            name: 'Fact-Checker',
            icon: '📊',
            description: 'Neutral, data-driven correction of misinformation.',
            defaultModel: 'gemini-3-pro-preview', // Gemini is great at facts
            placeholder: 'Comment: "Crime is at an all-time high!"'
        },
        'common-ground': {
            name: 'Bridge Builder',
            icon: '🌉',
            description: 'Validates emotions while offering a different perspective.',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Comment: "We need to ban all cars to save the planet."'
        }
    };

    // Stances (Optional context for the AI to know where the user stands)
    const USER_STANCES = [
        'Left-Leaning', 'Right-Leaning', 'Centrist', 'Libertarian', 'Neutral/Observer'
    ];

    // State Management
    let civilState = {
        tone: 'common-ground',
        userStance: 'Neutral/Observer',
        argumentInput: '',
        analysis: null, // Gemini analysis of fallacies/facts
        currentDraft: '',
        history: []
    };

    // Initialize global state
    window.civilState = civilState;

    /**
     * Initialize Civil Command Handler
     */
    window.civilCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startCivilWizard();
                break;
            case 'tone':
                if (parts[2]) await setCivilTone(parts[2]);
                break;
            case 'help':
                showCivilHelp();
                break;
            default:
                await startCivilWizard();
        }
    };

    /**
     * Start the Wizard UI
     */
    async function startCivilWizard() {
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
<div class="civil-wizard" style="font-family: 'Georgia', serif;">
    <div style="background: linear-gradient(135deg, #475569 0%, #1e293b 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🏛️</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 500; font-family: 'Inter', sans-serif;">CivilMind</h2>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem; font-style: italic;">"Come let us reason together."</p>
    </div>

    <div style="padding: 0 1rem 1rem;">
        
        <!-- Step 1: Input -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Inter', sans-serif;">
                Step 1: The Argument
            </h3>
            <textarea id="civil-input" rows="4" placeholder="Paste the heated comment, tweet, or argument here..." style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; font-family: inherit; resize: vertical; background: #f8fafc; color: #334155;"></textarea>
        </div>

        <!-- Step 2: Tone -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Inter', sans-serif;">
                Step 2: Your Strategy
            </h3>
            ${buildToneButtons()}
        </div>

        <!-- Step 3: Stance -->
         <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Inter', sans-serif;">
                Step 3: Your Perspective
            </h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${USER_STANCES.map(stance => `
                    <button onclick="window.setCivilStance('${stance}')" style="
                        padding: 6px 12px; border-radius: 20px; border: 1px solid ${civilState.userStance === stance ? '#475569' : '#cbd5e1'};
                        background: ${civilState.userStance === stance ? '#475569' : 'white'};
                        color: ${civilState.userStance === stance ? 'white' : '#64748b'};
                        cursor: pointer; font-size: 0.85rem; transition: all 0.2s; font-family: 'Inter', sans-serif;
                    ">${stance}</button>
                `).join('')}
            </div>
        </div>

        <button onclick="window.generateCivilResponse()" style="width: 100%; padding: 1rem; background: #475569; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#475569'">
            Draft Civil Response
        </button>
    </div>
</div>`;
    }

    /**
     * Helper: Build Tone Buttons
     */
    function buildToneButtons() {
        return Object.keys(CIVIL_TONES).map(type => {
            const config = CIVIL_TONES[type];
            const isActive = civilState.tone === type;
            return `
<button onclick="window.setCivilTone('${type}')" style="
    display: inline-block; width: 48%; margin-right: 1%; margin-bottom: 0.5rem; padding: 0.75rem;
    border: 1px solid ${isActive ? '#475569' : '#e2e8f0'};
    background: ${isActive ? '#f1f5f9' : '#ffffff'};
    color: ${isActive ? '#1e293b' : '#64748b'};
    border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s ease;
">
    <div style="font-weight: 600; display: flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif;">${config.icon} ${config.name}</div>
    <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px; font-family: 'Inter', sans-serif;">${config.description}</div>
</button>`;
        }).join('');
    }

    // -- State Setters --

    window.setCivilTone = function (tone) {
        if (CIVIL_TONES[tone]) {
            civilState.tone = tone;
            startCivilWizard();
        }
    };

    window.setCivilStance = function (stance) {
        civilState.userStance = stance;
        startCivilWizard();
    };

    /**
     * Show Help
     */
    function showCivilHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `
<div style="padding: 1rem;">
    <h3>🏛️ CivilMind Help</h3>
    <ul style="line-height: 1.6;">
        <li><code>/civil start</code> - Open the discourse engine.</li>
        <li><strong>Socratic:</strong> Asks questions to make them think.</li>
        <li><strong>Fact-Checker:</strong> Uses Gemini to find data-driven corrections.</li>
        <li><strong>Bridge Builder:</strong> Finds common ground to lower the temperature.</li>
    </ul>
</div>`
        });
    }

    console.log('✅ CivilMind Response Writer loaded');
})();
