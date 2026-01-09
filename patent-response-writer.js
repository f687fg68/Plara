/**
 * PatentGuard AI - Office Action Response Generator
 * Target: Patent Attorneys/Agents (B2B).
 * Focus: Responding to USPTO/EPO Rejections (102, 103, 112).
 */

(function () {
    'use strict';

    // State
    let patentState = {
        step: 'init',
        appNumber: '',
        jurisdiction: 'USPTO', // USPTO, EPO
        rejectionType: '103', // 103 (Obviousness), 102 (Anticipation), 112 (Indefinite)
        claimsRejected: '',
        priorArtRefs: '', // List of citations
        inventionDetails: '',
        history: []
    };

    window.patentState = patentState;

    // --- Command Handler ---
    window.patentCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startPatentWizard();
                break;
            case 'help':
                showPatentHelp();
                break;
            default:
                await startPatentWizard();
        }
    };

    // --- Wizard UI ---
    async function startPatentWizard() {
        appendNotionMessage({
            role: 'assistant',
            content: buildPatentWizardUI()
        });
    }

    function buildPatentWizardUI() {
        return `
<div class="patent-wizard" style="font-family: 'Segoe UI', Roboto, sans-serif;">
    <div style="background: #1e3a8a; color: white; padding: 1.5rem; border-radius: 8px 8px 0 0; display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 1.8rem;">⚖️</div>
        <div>
            <h2 style="margin: 0; font-size: 1.3rem; font-weight: 600;">PatentGuard AI</h2>
            <div style="font-size: 0.8rem; opacity: 0.9;">Office Action Response Drafting</div>
        </div>
    </div>

    <div style="padding: 1.5rem; border: 1px solid #e5e7eb; border-top: none; background: white; border-radius: 0 0 8px 8px;">
        
        <!-- Step 1: Application Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Application No.</label>
                <input type="text" id="pat-app-no" placeholder="e.g. 17/999,999" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            </div>
             <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Jurisdiction</label>
                <select id="pat-jurisdiction" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white;">
                    <option value="USPTO">USPTO (USA)</option>
                    <option value="EPO">EPO (Europe)</option>
                </select>
            </div>
        </div>

        <!-- Step 2: Rejection Details -->
        <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Rejection Type (35 U.S.C.)</label>
            <select id="pat-rejection-type" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white;">
                <option value="103">§ 103 (Obviousness) - Most Common</option>
                <option value="102">§ 102 (Anticipation)</option>
                <option value="112">§ 112 (Written Description/Enablement)</option>
                <option value="101">§ 101 (Subject Matter Eligibility)</option>
            </select>
        </div>

        <!-- Step 3: Prior Art & Invention -->
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Cited Reference(s) (Names/Numbers)</label>
            <input type="text" id="pat-prior-art" placeholder="e.g. Smith '123, Jones '456" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px;">

            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 5px;">Distinguishing Technical Features (The "Invention")</label>
            <textarea id="pat-details" rows="5" placeholder="Explain why the combination of citations fails to teach element X..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
        </div>

        <button onclick="window.runPatentGeneration()" style="width: 100%; padding: 12px; background: #1e3a8a; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 1rem;">
            Draft Office Action Response
        </button>
    </div>
</div>`;
    }

    function showPatentHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `<p>Use <code>/patent start</code> to draft USPTO/EPO responses. Specialized for §102/103 rejections.</p>`
        });
    }

    console.log('✅ PatentGuard Response Writer loaded');
})();
