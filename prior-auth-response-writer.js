/**
 * PriorAuthGuard AI - Pre-Service Denial & Peer-to-Peer Prep
 * Target: Providers dealing with PA denials (Pre-Service).
 */

(function () {
    'use strict';

    // Prior Auth Denial Reasons
    const PA_REASONS = {
        'step_therapy': 'Step Therapy Required (Fail First)',
        'med_necessity': 'Not Medically Necessary (Criteria Not Met)',
        'out_of_network': 'Out of Network Provider/Facility',
        'experimental': 'Experimental / Investigational',
        'admin_error': 'Administrative / Missing Information'
    };

    // State
    let paState = {
        step: 'init',
        authNumber: '',
        patientID: '',
        procedureDrug: '',
        denialReason: 'med_necessity',
        clinicalNuance: '',
        history: []
    };

    window.paState = paState;

    // --- Command Handler ---
    window.priorAuthCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startPAWizard();
                break;
            case 'help':
                showPAHelp();
                break;
            default:
                await startPAWizard();
        }
    };

    // --- Wizard UI ---
    async function startPAWizard() {
        appendNotionMessage({
            role: 'assistant',
            content: buildPAWizardUI()
        });
    }

    function buildPAWizardUI() {
        return `
<div class="pa-wizard" style="font-family: 'Segoe UI', Roboto, sans-serif;">
    <div style="background: #be185d; color: white; padding: 1.5rem; border-radius: 8px 8px 0 0; display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 1.8rem;">🩺</div>
        <div>
            <h2 style="margin: 0; font-size: 1.3rem; font-weight: 600;">PriorAuthGuard AI</h2>
            <div style="font-size: 0.8rem; opacity: 0.9;">Prior Authorization Denial Response (Clinical + Legal)</div>
        </div>
    </div>

    <div style="padding: 1.5rem; border: 1px solid #e5e7eb; border-top: none; background: white; border-radius: 0 0 8px 8px;">
        
        <!-- Step 1: Auth & Drug/Proc Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Auth Ref #</label>
                <input type="text" id="pa-auth-id" placeholder="e.g. PA-9921" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Procedure / Drug</label>
                <input type="text" id="pa-proc" placeholder="e.g. MRI Lumbar, Ozempic" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Denial Code (optional)</label>
                <input type="text" id="pa-code" placeholder="e.g. CO-197" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            </div>
        </div>

        <!-- Step 1b: Payer & Codes -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Payer</label>
                <select id="pa-payer" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white;">
                    <option value="generic">Generic/Unknown</option>
                    <option value="aetna">Aetna</option>
                    <option value="cigna">Cigna</option>
                    <option value="uhc">UnitedHealthcare</option>
                    <option value="bcbs">Blue Cross Blue Shield</option>
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">ICD-10 (optional)</label>
                <input type="text" id="pa-icd" placeholder="e.g. M48.061" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">CPT/HCPCS (optional)</label>
                <input type="text" id="pa-cpt" placeholder="e.g. 22558" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            </div>
        </div>

        <!-- Step 2: Denial Reason -->
        <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Denial Code / Reason</label>
            <select id="pa-reason" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white;">
                ${Object.entries(PA_REASONS).map(([k, v]) => `<option value=\"${k}\">${v}</option>`).join('')}
            </select>
        </div>

        <!-- Step 3: Clinical Evidence -->
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Clinical Evidence Summary</label>
            <textarea id="pa-rationale" rows="4" placeholder="Summarize PT dates and duration, response to therapy, pain scale, imaging findings, contraindications, safety risks, urgency, and previous medications tried/failed." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
        </div>

        <!-- Step 4: Choose Response Logic -->
        <div style="margin-bottom: 1.25rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #374151; margin-bottom: 5px;">Response Logic</label>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <label style="display:flex; align-items:center; gap:6px;"><input type="radio" name="pa-logic" value="clinical" checked> Clinical Rebuttal</label>
                <label style="display:flex; align-items:center; gap:6px;"><input type="radio" name="pa-logic" value="exception"> Exception Request</label>
                <label style="display:flex; align-items:center; gap:6px;"><input type="radio" name="pa-logic" value="p2p"> Peer-to-Peer Script</label>
            </div>
        </div>

        <div style="display: flex; gap: 10px;">
            <button onclick="window.runPAGeneration('appeal')" style="flex: 1; padding: 12px; background: #be185d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                Generate Letter
            </button>
            <button onclick="window.runPAGeneration('p2p')" style="flex: 1; padding: 12px; background: #831843; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                Generate Peer-to-Peer Script
            </button>
        </div>
    </div>
</div>`;
    }

    function showPAHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `<p>Use <code>/prior-auth start</code> for pre-service denials. Supports Peer-to-Peer scripts and Step Therapy overrides.</p>`
        });
    }

    console.log('✅ PriorAuthGuard Response Writer loaded');
})();
