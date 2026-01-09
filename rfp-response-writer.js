/**
 * GovProposal AI - Government RFP Response Writer
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * Specialized module for generating compliant, winning government proposal sections.
 */

(function () {
    'use strict';

    // RFP Section Configurations
    const SECTION_TYPES = {
        'executive-summary': {
            name: 'Executive Summary',
            icon: '📄',
            description: 'High-level overview of solution & value prop',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Key win themes: Low risk, Incumbent experience, Technical innovation. Agency: Dept of Energy.'
        },
        'technical-approach': {
            name: 'Technical Approach',
            icon: '⚙️',
            description: 'Detailed technical methodology & solution',
            defaultModel: 'gemini-3-pro-preview', // Gemini for complex technical reasoning
            placeholder: 'Requirement C.3.1: Cloud Migration Strategy. Describe AWS Govt Cloud architecture and zero-trust security.'
        },
        'management-plan': {
            name: 'Management Plan',
            icon: '👥',
            description: 'Project management, staffing, & quality control',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'PMP-certified PM, Agile methodology (Scrum), CMMI Level 3 processes.'
        },
        'past-performance': {
            name: 'Past Performance',
            icon: '🏆',
            description: 'Relevant past contract experience',
            defaultModel: 'claude-sonnet-4',
            placeholder: 'Contract: Cyber Defense for Navy. Value: $50M. Relevance: Similar scope and size.'
        },
        'compliance-matrix': {
            name: 'Compliance Matrix',
            icon: '✅',
            description: 'Map requirements to proposal sections',
            defaultModel: 'gemini-3-pro-preview', // Strong structure/logic needed
            placeholder: 'Paste Section L & M requirements here to generate a compliance matrix.'
        }
    };

    // Writing Styles / Compliance Modes
    const COMPLIANCE_MODES = {
        'shipley': {
            name: 'Shipley Style',
            icon: '✍️',
            description: 'Best Practice: Benefits-focused, customer-centric',
            modifier: 'Follow Shipley proposal standards. Focus on "Feature -> Benefit -> Proof". Use active voice.'
        },
        'strict-compliance': {
            name: 'Strict Compliance',
            icon: '⚖️',
            description: 'Exact requirement matching (FAR/DFARS)',
            modifier: 'Prioritize strict adherence to requirements. Use exact terminology from the RFP. Quote requirements.'
        },
        'Ghosting': {
            name: 'Ghosting Competitors',
            icon: '👻',
            description: 'Subtly highlight competitor weaknesses',
            modifier: 'Emphasize our strengths where competitors are weak (e.g., we own our IP, others lease it) without naming them.'
        }
    };

    // State Management
    let rfpState = {
        sectionType: 'executive-summary',
        complianceMode: 'shipley',
        selectedModel: 'claude-sonnet-4',
        rfpContext: '', // The requirement text
        companyContext: '', // Company capabilities/resume
        currentDraft: '',
        history: []
    };

    // Initialize global state
    window.rfpState = rfpState;

    /**
     * Initialize RFP Command Handler
     */
    window.rfpCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startRfpWizard();
                break;
            case 'section':
                if (parts[2]) await setRfpSection(parts[2]);
                break;
            case 'mode':
                if (parts[2]) await setRfpMode(parts[2]);
                break;
            case 'model':
                if (parts[2]) await setRfpModel(parts[2]);
                break;
            case 'help':
                showRfpHelp();
                break;
            default:
                await startRfpWizard();
        }
    };

    /**
     * Start the RFP Wizard UI
     */
    async function startRfpWizard() {
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
<div class="rfp-wizard" style="font-family: 'Inter', sans-serif;">
    <div style="background: linear-gradient(135deg, #1e40af 0%, #172554 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🏛️</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">GovProposal AI</h2>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">Government RFP Response Writer • FAR/DFARS Compliant</p>
    </div>

    <div style="padding: 0 1rem 1rem;">
        
        <!-- Step 1: Section Selection -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #1e40af; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 1</span>
                Proposal Section
            </h3>
            ${buildSectionButtons()}
        </div>

        <!-- Step 2: Writing Strategy -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #1e40af; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 2</span>
                Strategy & Compliance
            </h3>
            ${buildModeButtons()}
        </div>

        <!-- Step 3: Model -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #1e40af; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 3</span>
                AI Model
            </h3>
            ${buildModelButtons()}
        </div>

        <!-- Step 4: Requirements & Context -->
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #1e3a5f;">
                <span style="background: #1e40af; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 4</span>
                RFP Requirements & Capabilities
            </h3>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">RFP Requirement (Paste Text)</label>
                <textarea id="rfp-requirement-input" rows="5" placeholder="${SECTION_TYPES[rfpState.sectionType].placeholder}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: 'Courier New', monospace; resize: vertical;"></textarea>
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Our Capabilities / "Proof Points"</label>
                <textarea id="rfp-company-context" rows="3" placeholder="Paste relevant company experience, resume highlights, or technical approach details here." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
            </div>
        </div>

        <button onclick="window.generateRfpResponse()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #1e40af 0%, #172554 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(30, 64, 175, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(30, 64, 175, 0.3)';">
            🏛️ Generate Proposal Section
        </button>
    </div>
</div>`;
    }

    /**
     * Helper: Build Section Buttons
     */
    function buildSectionButtons() {
        return Object.keys(SECTION_TYPES).map(type => {
            const config = SECTION_TYPES[type];
            const isActive = rfpState.sectionType === type;
            return `
<button onclick="window.setRfpSection('${type}')" style="
    display: inline-block; width: 48%; margin-right: 1%; margin-bottom: 0.5rem; padding: 0.75rem;
    border: 2px solid ${isActive ? '#1e40af' : '#e5e7eb'};
    background: ${isActive ? '#eff6ff' : '#ffffff'};
    color: ${isActive ? '#1e40af' : '#374151'};
    border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s ease;
">
    <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">${config.icon} ${config.name}</div>
    <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">${config.description}</div>
</button>`;
        }).join('');
    }

    /**
     * Helper: Build Mode Buttons
     */
    function buildModeButtons() {
        return Object.keys(COMPLIANCE_MODES).map(mode => {
            const config = COMPLIANCE_MODES[mode];
            const isActive = rfpState.complianceMode === mode;
            return `
<button onclick="window.setRfpMode('${mode}')" style="
    display: inline-block; padding: 0.5rem 1rem; margin-right: 0.5rem; margin-bottom: 0.5rem;
    border: 1px solid ${isActive ? '#1e40af' : '#d1d5db'};
    background: ${isActive ? '#1e40af' : '#ffffff'};
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
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4.5', icon: '✍️', desc: 'Best for persuasive narrative' },
            { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', icon: '🧠', desc: 'Best for technical compliance & matrices' }
        ];

        return models.map(model => {
            const isActive = rfpState.selectedModel === model.id;
            return `
<button onclick="window.setRfpModel('${model.id}')" style="
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

    window.setRfpSection = function (type) {
        if (SECTION_TYPES[type]) {
            rfpState.sectionType = type;
            rfpState.selectedModel = SECTION_TYPES[type].defaultModel;
            startRfpWizard();
        }
    };

    window.setRfpMode = function (mode) {
        if (COMPLIANCE_MODES[mode]) {
            rfpState.complianceMode = mode;
            startRfpWizard();
        }
    };

    window.setRfpModel = function (model) {
        rfpState.selectedModel = model;
        startRfpWizard();
    };

    /**
     * Show Help
     */
    function showRfpHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `
<div style="padding: 1rem;">
    <h3>🏛️ GovProposal AI Help</h3>
    <p>Generate compliant government proposal sections.</p>
    <ul style="line-height: 1.6;">
        <li><code>/rfp start</code> or <code>/proposal</code> - Logic wizard</li>
        <li><strong>Best Practice:</strong> Paste the exact text from Section L (Instructions) and Section M (Evaluation Criteria) into the requirement box.</li>
        <li><strong>Models:</strong> Use Claude for narrative/storytelling. Use Gemini for checking compliance or creating matrices.</li>
    </ul>
</div>`
        });
    }

    console.log('✅ GovProposal Response Writer loaded');
})();
