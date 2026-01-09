/**
 * HealthGuard - AI Patient Portal Response Assistant
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * HIPAA-Compliant Response Generator for Healthcare Providers
 */

(function () {
    'use strict';

    // Response Type Configurations
    const RESPONSE_TYPES = {
        'lab-results': {
            name: 'Lab Results Explanation',
            icon: '🧪',
            description: 'Explain test results in plain language',
            defaultModel: 'gemini-3-pro-preview', // Gemini is great for complex reasoning/explaining
            placeholder: 'Patient asks about slightly elevated ALT/AST levels and what "comprehensive metabolic panel" means.'
        },
        'general-inquiry': {
            name: 'General Medical Inquiry',
            icon: '❓',
            description: 'Answer common health questions',
            defaultModel: 'gemini-3-pro-preview',
            placeholder: 'Patient asking if they can take Ibuprofen with their current blood pressure medication.'
        },
        'appointment': {
            name: 'Appointment/Follow-up',
            icon: '📅',
            description: 'Scheduling and follow-up guidance',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Patient wants to know when they need to come back for a check-up after starting new meds.'
        },
        'prescription': {
            name: 'Prescription Refill/Q&A',
            icon: '💊',
            description: 'Refill protocols and medication instructions',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Requesting refill of Lisinopril but hasn\'t been seen in 14 months.'
        },
        'referral': {
            name: 'Referral Request',
            icon: '📋',
            description: 'Manage specialist referral requests',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Asking for a dermatologist referral for a changing mole.'
        },
        'reassurance': {
            name: 'Reassurance & Empathy',
            icon: '❤️',
            description: 'Comfort anxious patients',
            defaultModel: 'claude-sonnet-4', // Claude excels at empathy
            placeholder: 'Worried about upcoming surgery potential complications.'
        }
    };

    // Clinical Tone Configurations
    const CLINICAL_TONES = {
        'empathetic': {
            name: 'Empathetic & Warm',
            icon: '🤗',
            description: 'Caring, supportive, and reassuring',
            modifier: 'Use a warm, caring tone. Validate the patient\'s feelings. Be reassuring but realistic.'
        },
        'professional': {
            name: 'Professional & Direct',
            icon: '👨‍⚕️',
            description: 'Standard clinical communication',
            modifier: 'Maintain a standard professional clinical tone. Clear, concise, and objective.'
        },
        'simplified': {
            name: 'Simplified (ELI5)',
            icon: '👶',
            description: 'Plain language for complex topics',
            modifier: 'Use very simple, plain language. Avoid jargon. Explain medical terms clearly as if to a layperson.'
        },
        'firm': {
            name: 'Firm/Compliance',
            icon: '⚠️',
            description: 'For non-compliance or policy issues',
            modifier: 'Be firm but respectful. Emphasize the importance of following medical advice or clinic policy.'
        }
    };

    // State Management
    let healthState = {
        type: 'general-inquiry',
        tone: 'professional',
        selectedModel: 'claude-sonnet-4',
        patientContext: {}, // { age, gender, conditions: [] }
        rawInput: '',
        currentDraft: '',
        history: []
    };

    // Initialize global state
    window.healthState = healthState;

    /**
     * Initialize HealthGuard Command Handler
     */
    window.healthCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startHealthWizard();
                break;
            case 'type':
                if (parts[2]) await setHealthType(parts[2]);
                break;
            case 'tone':
                if (parts[2]) await setHealthTone(parts[2]);
                break;
            case 'model':
                if (parts[2]) await setHealthModel(parts[2]);
                break;
            case 'help':
                showHealthHelp();
                break;
            default:
                await startHealthWizard();
        }
    };

    /**
     * Start the HealthGuard Wizard UI
     */
    async function startHealthWizard() {
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
<div class="healthguard-wizard" style="font-family: 'Inter', sans-serif;">
    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">⚕️</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">HealthGuard AI</h2>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">Patient Portal Response Assistant • HIPAA Compliant Mode</p>
    </div>

    <div style="padding: 0 1rem 1rem;">
        
        <!-- Step 1: Response Type -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #0ea5e9; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 1</span>
                Response Scenario
            </h3>
            ${buildTypeButtons()}
        </div>

        <!-- Step 2: Tone -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #0ea5e9; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 2</span>
                Communication Style
            </h3>
            ${buildToneButtons()}
        </div>

        <!-- Step 3: Model -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #0ea5e9; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 3</span>
                AI Model
            </h3>
            ${buildModelButtons()}
        </div>

        <!-- Step 4: Patient Context & Input -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #1e3a5f;">
                <span style="background: #0ea5e9; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 4</span>
                Patient Message & Context
            </h3>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Patient Message / Query</label>
                <textarea id="health-patient-input" rows="4" placeholder="${RESPONSE_TYPES[healthState.type].placeholder}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Relevant Clinical Context (Optional)</label>
                <textarea id="health-clinical-context" rows="2" placeholder="e.g., 45yo Male, Type 2 Diabetic, Last A1C 8.2, Started Metformin 2 weeks ago" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
            </div>
            
            <div style="background: #f0fdf4; padding: 0.75rem; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 0.8rem; color: #166534; display: flex; gap: 8px;">
                <span>🔒</span>
                <div>
                    <strong>HIPAA Note:</strong> Do not include full name, DOB, or SSN. Use "Patient" or first name only securely. Local processing enabled.
                </div>
            </div>
        </div>

        <button onclick="window.generateHealthResponse()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(14, 165, 233, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(14, 165, 233, 0.3)';">
            🩺 Generate Response
        </button>
    </div>
</div>`;
    }

    /**
     * Helper: Build Type Buttons
     */
    function buildTypeButtons() {
        return Object.keys(RESPONSE_TYPES).map(type => {
            const config = RESPONSE_TYPES[type];
            const isActive = healthState.type === type;
            return `
<button onclick="window.setHealthType('${type}')" style="
    display: inline-block; width: 48%; margin-right: 1%; margin-bottom: 0.5rem; padding: 0.75rem;
    border: 2px solid ${isActive ? '#0ea5e9' : '#e5e7eb'};
    background: ${isActive ? '#f0f9ff' : '#ffffff'};
    color: ${isActive ? '#0369a1' : '#374151'};
    border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s ease;
">
    <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">${config.icon} ${config.name}</div>
    <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">${config.description}</div>
</button>`;
        }).join('');
    }

    /**
     * Helper: Build Tone Buttons
     */
    function buildToneButtons() {
        return Object.keys(CLINICAL_TONES).map(tone => {
            const config = CLINICAL_TONES[tone];
            const isActive = healthState.tone === tone;
            return `
<button onclick="window.setHealthTone('${tone}')" style="
    display: inline-block; padding: 0.5rem 1rem; margin-right: 0.5rem; margin-bottom: 0.5rem;
    border: 1px solid ${isActive ? '#0ea5e9' : '#d1d5db'};
    background: ${isActive ? '#0ea5e9' : '#ffffff'};
    color: ${isActive ? '#ffffff' : '#4b5563'};
    border-radius: 20px; font-size: 0.85rem; font-weight: 500; cursor: pointer;
">
    ${config.icon} ${config.name}
</button>`;
        }).join('');
    }

    /**
     * Helper: Build Model Buttons
     */
    function buildModelButtons() {
        const models = [
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4.5', icon: '🧠', desc: 'Best for empathetic drafting' },
            { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', icon: '🔬', desc: 'Superior medical reasoning' }
        ];

        return models.map(model => {
            const isActive = healthState.selectedModel === model.id;
            return `
<button onclick="window.setHealthModel('${model.id}')" style="
    display: inline-block; padding: 0.6rem 1rem; margin-right: 0.5rem;
    border: 2px solid ${isActive ? '#10b981' : '#e5e7eb'};
    background: ${isActive ? '#10b981' : '#ffffff'};
    color: ${isActive ? '#ffffff' : '#374151'};
    border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer;
" title="${model.desc}">
    ${model.icon} ${model.name}
</button>`;
        }).join('');
    }

    // -- State Setters --

    window.setHealthType = function (type) {
        if (RESPONSE_TYPES[type]) {
            healthState.type = type;
            healthState.selectedModel = RESPONSE_TYPES[type].defaultModel;
            startHealthWizard();
        }
    };

    window.setHealthTone = function (tone) {
        if (CLINICAL_TONES[tone]) {
            healthState.tone = tone;
            startHealthWizard();
        }
    };

    window.setHealthModel = function (model) {
        healthState.selectedModel = model;
        startHealthWizard();
    };

    /**
     * Show Help
     */
    function showHealthHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `
<div style="padding: 1rem;">
    <h3>⚕️ HealthGuard Help</h3>
    <ul style="line-height: 1.6;">
        <li><code>/health start</code> - Open the assistant</li>
        <li><strong>Privacy:</strong> We process data locally/securely via Puter. Avoid direct identifiers.</li>
        <li><strong>Disclaimer:</strong> AI drafts are suggestions. YOU (the provider) are responsible for the final message.</li>
    </ul>
</div>`
        });
    }

    console.log('✅ HealthGuard Response Writer loaded');
})();
