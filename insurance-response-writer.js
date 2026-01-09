/**
 * InsuranceGuard AI - B2B & B2C Claims Response Platform
 * 
 * MODES:
 * 1. B2B (Insurer): Generates Regulatory Compliant Denial Letters (FCRA/State Regs).
 * 2. B2C (Claimant): Generates Bad-Faith Warning Appeals & Rebuttals.
 */

(function () {
    'use strict';

    // State Management
    let insuranceState = {
        mode: null, // 'insurer' | 'claimant'
        step: 'mode-selection',

        // Common
        claimType: 'Medical', // Auto, Home, Life, Pet, Business

        // B2B State (Insurer)
        applicantName: '',
        policyNumber: '',
        denialReason: '',
        regulatoryBody: 'State DOI',

        // B2C State (Claimant)
        insurerName: '',
        denialText: null, // extracted from OCR
        appealStrategy: 'Standard', // Aggressive, Bad Faith, Emotional (for Life)

        // History
        history: []
    };

    window.insuranceState = insuranceState;

    // --- Command Handler ---
    window.insuranceCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startInsuranceWizard();
                break;
            case 'help':
                showInsuranceHelp();
                break;
            default:
                await startInsuranceWizard();
        }
    };

    // --- Wizard UI ---

    async function startInsuranceWizard() {
        appendNotionMessage({
            role: 'assistant',
            content: buildModeSelectionUI()
        });
    }

    function buildModeSelectionUI() {
        return `
<div class="insurance-wizard" style="font-family: 'Segoe UI', Roboto, sans-serif;">
    <div style="background: #0f172a; color: white; padding: 1.5rem; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 1.4rem;">🛡️ InsuranceGuard AI</h2>
        <p style="opacity: 0.8; font-size: 0.9rem; margin-top: 5px;">Enterprise Claims & Appeals Platform</p>
    </div>

    <div style="padding: 2rem; border: 1px solid #e2e8f0; border-top: none; background: white; border-radius: 0 0 8px 8px;">
        <h3 style="margin-top: 0; color: #334155; text-align: center;">Select Your Role</h3>
        
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <!-- B2B Option -->
            <button onclick="window.setInsuranceMode('insurer')" style="flex: 1; padding: 1.5rem; border: 2px solid #e2e8f0; border-radius: 8px; background: #f8fafc; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#3b82f6'; this.style.background='#eff6ff'" onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏢</div>
                <div style="font-weight: 700; color: #1e40af; margin-bottom: 5px;">Insurer / TPA</div>
                <div style="font-size: 0.8rem; color: #64748b;">Generate Compliant Denial Letters</div>
            </button>

            <!-- B2C Option -->
            <button onclick="window.setInsuranceMode('claimant')" style="flex: 1; padding: 1.5rem; border: 2px solid #e2e8f0; border-radius: 8px; background: #f8fafc; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#10b981'; this.style.background='#ecfdf5'" onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🧑‍⚕️</div>
                <div style="font-weight: 700; color: #047857; margin-bottom: 5px;">Claimant / Broker</div>
                <div style="font-size: 0.8rem; color: #64748b;">Generate Appeals & Rebuttals</div>
            </button>
        </div>
    </div>
</div>`;
    }

    window.setInsuranceMode = function (mode) {
        insuranceState.mode = mode;
        if (mode === 'insurer') {
            appendNotionMessage({ role: 'assistant', content: buildInsurerUI() });
        } else {
            appendNotionMessage({ role: 'assistant', content: buildClaimantUI() });
        }
    };

    // --- Insurer UI (B2B) ---
    function buildInsurerUI() {
        return `
<div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-family: sans-serif;">
    <div style="background: #1e40af; color: white; padding: 10px 15px; font-weight: 600;">
        🏢 Corporate Denial Generator
    </div>
    <div style="padding: 15px; background: #f8fafc;">
        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 5px;">Claimant Name & ID</label>
        <input type="text" id="ins-app-name" placeholder="e.g., Jane Doe #CLM-9928" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px;">

        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 5px;">Denial Reason (Internal Note)</label>
        <textarea id="ins-denial-reason" rows="3" placeholder="e.g., Procedure 99214 not covered under plan exclusions section 4.2 due to being experimental." style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit;"></textarea>

        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 5px;">Compliance Jurisdiction</label>
        <select id="ins-jurisdiction" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;">
            <option value="California (DOI)">California (DOI)</option>
            <option value="New York (DFS)">New York (DFS)</option>
            <option value="Texas (TDI)">Texas (TDI)</option>
            <option value="Federal (ERISA)">Federal (ERISA)</option>
            <option value="General">General / Other</option>
        </select>

        <button onclick="window.runInsuranceGeneration()" style="width: 100%; padding: 10px; background: #1e40af; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
            Generate Compliant Denial Letter
        </button>
    </div>
</div>`;
    }

    // --- Claimant UI (B2C) ---
    function buildClaimantUI() {
        return `
<div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-family: sans-serif;">
    <div style="background: #047857; color: white; padding: 10px 15px; font-weight: 600;">
        🛡️ Appeal & Rebuttal Generator
    </div>
    <div style="padding: 15px; background: #f8fafc;">
        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 5px;">Upload Denial Letter (Image/PDF) OR Paste Text</label>
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <button onclick="document.getElementById('hiddenFileInput').click()" style="padding: 8px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                📎 Upload File
            </button>
            <span style="font-size: 0.8rem; color: #64748b; align-self: center;">(Uses Gemini Vision / OCR)</span>
        </div>

        <textarea id="clm-denial-text" rows="4" placeholder="Or paste the denial text here..." style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit;"></textarea>

        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 5px;">Appeal Strategy</label>
        <select id="clm-strategy" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;">
            <option value="Standard">Standard Appeal (Fact-Based)</option>
            <option value="Aggressive">Aggressive ("Bad Faith" Warning)</option>
            <option value="Medical Necessity">Medical Necessity Focus</option>
            <option value="Procedural">Procedural Error Focus</option>
        </select>

        <button onclick="window.runInsuranceGeneration()" style="width: 100%; padding: 10px; background: #047857; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
            Generate Strong Appeal
        </button>
    </div>
</div>`;
    }

    // --- Help ---
    function showInsuranceHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `<p>Use <code>/insurance start</code> to open the wizard. Choose <b>Insurer</b> for denial letters or <b>Claimant</b> for appeals.</p>`
        });
    }

    console.log('✅ InsuranceGuard Response Writer loaded');
})();
