/**
 * ProviderGuard AI Engine
 * Handles Clinical Validation (Gemini) and Appeal Drafting (Claude).
 */

(function () {
    'use strict';

    window.runProviderAppealGeneration = async function () {
        // Collect Data
        const patientID = document.getElementById('prov-patient-id')?.value;
        const claimID = document.getElementById('prov-claim-id')?.value;
        const payer = document.getElementById('prov-payer')?.value;
        const denialCode = document.getElementById('prov-denial-code')?.value;
        const context = document.getElementById('prov-clinical-context')?.value;

        if (!patientID || !payer || !context) {
            showNotification('Please fill in required fields (Patient, Payer, Context).', 'warning');
            return;
        }

        const state = { patientID, claimID, payer, denialCode, context };

        // UI Loading
        appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="prov-loading" style="padding: 1rem; border: 1px solid #cbd5e1; background: white; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 10px; font-weight: 600; color: #0f766e;">
                    <span style="animation: pulse 1s infinite;">⚕️</span>
                    Analyzing Clinical Guidelines & Coding...
                </div>
            </div>
            <style>@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }</style>`
        });

        try {
            // Step 1: Clinical Analysis (Gemini 3.0 Pro)
            // Checks if the context supports the denial reason or refutes it based on general guidelines (InterQual/Milliman simulation).
            const analysis = await analyzeClinicalContext(state);

            // Step 2: Draft Appeal (Claude Sonnet 4.5)
            const draft = await draftProviderAppeal(state, analysis);

            // Cleanup
            const loader = document.getElementById('prov-loading');
            if (loader) loader.closest('.message').remove();

            // Display
            if (window.displayProviderAppealResult) {
                window.displayProviderAppealResult(draft, analysis);
            }

        } catch (e) {
            console.error("Provider Appeal Error", e);
            const loader = document.getElementById('prov-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
        }
    };

    async function analyzeClinicalContext(state) {
        console.log('⚕️ Analyzing Clinical Context with Gemini 3.0 Pro');

        const prompt = `
You are a Medical Coding & Billing Auditor.
Analyze this clinical context for a "${state.denialCode}" denial from "${state.payer}".

CONTEXT: "${state.context}"

TASK:
1. Identify relevant CPT/ICD-10 codes mentioned or implied.
2. Evaluate if the clinical evidence supports "Medical Necessity" based on standard guidelines (like CMS/LCDs).
3. Identify missing elements (e.g., "Missing conservative treatment history").

OUTPUT FORMAT (JSON only):
{
    "codes_identified": ["String"],
    "strength_of_evidence": "String (Low/Medium/High)",
    "missing_elements": ["String"]
}
        `;

        try {
            const response = await puter.ai.chat(prompt, {
                model: 'gemini-3-pro-preview',
                response_format: { type: 'json_object' }
            });
            let txt = response?.message?.content || response;
            if (typeof txt === 'string') txt = txt.replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(txt);
        } catch (e) {
            console.warn("Analysis fallback", e);
            return { codes_identified: ["Unknown"], strength_of_evidence: "Medium", missing_elements: [] };
        }
    }

    async function draftProviderAppeal(state, analysis) {
        console.log('✍️ Drafting Appeal with Claude Sonnet 4.5');

        const systemPrompt = `You are a Revenue Cycle Management (RCM) Appeal Specialist.
Draft a "Letter of Medical Necessity" / Formal Appeal.

PAYER: ${state.payer}
DENIAL TYPE: ${state.denialCode}
EVIDENCE STRENGTH: ${analysis.strength_of_evidence}

INSTRUCTIONS:
1. Use standard medical appeal format (Subject, Patient Info, Claim Info).
2. Argue specifically against the denial code.
3. Cite the clinical evidence provided.
4. If "Medical Necessity", reference "Standard of Care".
5. If "Prior Auth", reference "Urgent/Emergent" nature or "Retroactive Authorization" rights.
6. Tone: Professional, Clinical, Persuasive.

CLINICAL CONTEXT:
${state.context}
`;

        const userPrompt = `Draft the appeal letter for Patient Ref: ${state.patientID}.`;

        const response = await puter.ai.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], {
            model: 'claude-sonnet',
            stream: false
        });

        return response?.message?.content || response;
    }

    console.log('✅ ProviderGuard AI Engine loaded');
})();
