/**
 * ProviderGuard AI - Healthcare Claim Denial Appeal Generator (B2B)
 * Target Audience: Healthcare Providers, Billing Specialists, RCM Teams.
 * Function: Automates "Letter of Medical Necessity" and Formal Appeals.
 */

(function () {
    'use strict';

    // Appeal Types
    const APPEAL_TYPES = {
        'medical_necessity': 'Medical Necessity (CO-50)',
        'prior_auth': 'Prior Authorization Absent/Expired (CO-197)',
        'coding_error': 'Coding/Bundling Error (CO-97)',
        'timely_filing': 'Timely Filing Limit',
        'experimental': 'Experimental/Investigational'
    };

    // State
    let providerState = {
        step: 'init',
        patientID: '',
        claimNumber: '',
        denialCode: 'medical_necessity',
        clinicalContext: '',
        payerName: '',
        history: []
    };

    window.providerState = providerState;

    // --- Command Handler ---
    window.providerCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startProviderWizard();
                break;
            case 'help':
                showProviderHelp();
                break;
            default:
                await startProviderWizard();
        }
    };

    // --- Wizard UI ---
    async function startProviderWizard() {
        appendNotionMessage({
            role: 'assistant',
            content: buildProviderWizardUI()
        });
    }

    function buildProviderWizardUI() {
        return `
<div class="provider-wizard" style="font-family: 'Segoe UI', Roboto, sans-serif;">
    <div style="background: #0f766e; color: white; padding: 1.5rem; border-radius: 8px 8px 0 0; display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 1.8rem;">🏥</div>
        <div>
            <h2 style="margin: 0; font-size: 1.3rem; font-weight: 600;">ProviderGuard RCM</h2>
            <div style="font-size: 0.8rem; opacity: 0.9;">AI Denial Management & Appeal Generator</div>
        </div>
    </div>

    <div style="padding: 1.5rem; border: 1px solid #e5e7eb; border-top: none; background: white; border-radius: 0 0 8px 8px;">
        
        <!-- Step 1: Patient & Claim Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Patient Ref / MRN</label>
                <input type="text" id="prov-patient-id" placeholder="e.g. PT-8829" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            </div>
             <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Claim #</label>
                <input type="text" id="prov-claim-id" placeholder="e.g. CLM-2024-X9" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            </div>
        </div>

        <!-- Step 2: Payer & Denial Type -->
        <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Payer Name</label>
            <input type="text" id="prov-payer" placeholder="e.g. BlueCross BlueShield, UHC, Aetna" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px;">
            
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Denial Reason (Category)</label>
            <select id="prov-denial-code" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white;">
                ${Object.entries(APPEAL_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
            </select>
        </div>

        <!-- Step 3: Clinical Context (The "Why") -->
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Clinical Rationale / Notes</label>
            <textarea id="prov-clinical-context" rows="4" placeholder="Paste clinical summary, relevant CPT codes, and why this service was medically necessary..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">* HIPAA Warning: Do not include full name/DOB in cloud context if not authorized. Use MRN.</div>
        </div>

        <button onclick="window.runProviderAppealGeneration()" style="width: 100%; padding: 12px; background: #0f766e; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 1rem;">
            Generate Medical Appeal Packet
        </button>
    </div>
</div>`;
    }

    function showProviderHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `<p>Use <code>/provider start</code> to generate B2B medical appeals. Supports Medical Necessity, Prior Auth, and Coding denial appeals.</p>`
        });
    }

    console.log('✅ ProviderGuard Response Writer loaded');
})();
