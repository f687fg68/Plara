/**
 * PriorAuthGuard AI Engine
 * Logic for Pre-Service Appeals & Peer-to-Peer Scripts.
 */

(function () {
    'use strict';

    window.runPAGeneration = async function (type) {
        // Collect Data
        const authID = document.getElementById('pa-auth-id')?.value;
        const procedure = document.getElementById('pa-proc')?.value;
        const reason = document.getElementById('pa-reason')?.value;
        const rationale = document.getElementById('pa-rationale')?.value;
        const payer = document.getElementById('pa-payer')?.value || 'generic';
        const icd = document.getElementById('pa-icd')?.value || '';
        const cpt = document.getElementById('pa-cpt')?.value || '';
        const logic = (document.querySelector('input[name="pa-logic"]:checked')?.value) || (type === 'p2p' ? 'p2p' : 'clinical');
        const denialCode = document.getElementById('pa-code')?.value?.trim() || '';

        if (!procedure || !rationale) {
            showNotification('Procedure and Rationale fields are required.', 'warning');
            return;
        }

        const state = { authID, procedure, reason, rationale, type, payer, icd, cpt, logic, denialCode };

        // UI Loading
        appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="pa-loading" style="padding: 1rem; border: 1px solid #cbd5e1; background: white; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 10px; font-weight: 600; color: #be185d;">
                    <span style="animation: bounce 1s infinite;">🗣️</span>
                    Preparing ${type === 'p2p' ? 'Medical Director Script' : 'Expedited Appeal'}...
                </div>
            </div>
            <style>@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }</style>`
        });

        try {
            // Step 1: Guideline Analysis (Gemini)
            const analysis = await analyzeGuidelines(state);

            // Step 2: Draft Content (Claude)
            const draft = await draftPAContent(state, analysis);

            // Step 3: Track generation stats
            try { await savePAStats(state, analysis); } catch (e) { console.warn('PA stats save failed', e); }

            // Cleanup
            const loader = document.getElementById('pa-loading');
            if (loader) loader.closest('.message').remove();

            // Display
            if (window.displayPAResult) {
                window.displayPAResult(draft, state.type, analysis);
            }

        } catch (e) {
            console.error("PA AI Error", e);
            const loader = document.getElementById('pa-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
        }
    };

    const PA_DENIAL_CODES = {
        'CO-197': { code: 'CO-197', title: 'Prior authorization absent', suggestLogic: 'clinical', notes: 'If services rendered, consider retro auth/urgent circumstances; include evidence of attempts and medical necessity.' },
        'PR-50': { code: 'PR-50', title: 'Not medically necessary', suggestLogic: 'clinical', notes: 'Map evidence to payer criteria; include objective metrics and failed conservative therapy.' },
        'OA-18': { code: 'OA-18', title: 'Duplicate claim/service', suggestLogic: 'admin', notes: 'Administrative; not typical for PA reversal.' }
    };

    const PAYER_RULES = {
        generic: { name: 'Generic', personality: 'standard', notes: 'Default policy', focuses: [] },
        aetna: { name: 'Aetna', personality: 'criteria-focused', notes: 'Strict MCG/InterQual adherence; emphasize conservative therapy documentation', focuses: ['conservative_therapy','safety'] },
        cigna: { name: 'Cigna', personality: 'step-therapy', notes: 'Often enforces fail-first; highlight contraindications and previous failures', focuses: ['step_therapy','contraindication'] },
        uhc: { name: 'UnitedHealthcare', personality: 'utilization-review', notes: 'Heavy on utilization review; cite medical necessity and patient risk', focuses: ['medical_necessity','risk'] },
        bcbs: { name: 'BCBS', personality: 'documentation', notes: 'Documentation completeness critical; include objective metrics and dates', focuses: ['documentation','objective_metrics'] }
    };

    async function analyzeGuidelines(state) {
        console.log('💊 Analyzing Guidelines with Gemini 3.0 Pro');

        const payerInfo = PAYER_RULES[state.payer] || PAYER_RULES.generic;
       const prompt = `
You are a Medical Director Assistant.
Analyze this Prior Auth denial for "${state.procedure}" due to "${state.reason}".${state.denialCode ? ` Denial Code: ${state.denialCode}.` : ''}

PAYER: ${payerInfo.name} (${payerInfo.personality})
ICD-10: ${state.icd || 'N/A'}
CPT/HCPCS: ${state.cpt || 'N/A'}
SELECTED LOGIC: ${state.logic}

CLINICAL EVIDENCE SUMMARY: "${state.rationale}"

TASK:
1. Identify typical "Criteria for Approval" used for this procedure/drug (e.g., MCG, InterQual) tailored to the payer personality.
2. Evaluate whether the provided evidence satisfies medical necessity and/or supports the selected logic (clinical rebuttal vs exception).
3. Suggest 2-3 "Key Talking Points" for a Medical Director call, aligned to ${payerInfo.name}.

If denial code provided (${state.denialCode || 'none'}), incorporate any standard guidance for that code: ${(state.denialCode && PA_DENIAL_CODES[state.denialCode]) ? PA_DENIAL_CODES[state.denialCode].notes : 'general medical necessity'}.

OUTPUT FORMAT (JSON only):
{
 "standard_criteria": "String",
 "rationale_strength": "String",
 "talking_points": ["String"],
 "payer_considerations": "String"
}`;

        try {
            const response = await puter.ai.chat(prompt, {
                model: 'gemini-3-pro-preview',
                response_format: { type: 'json_object' }
            });
            let txt = response?.message?.content || response;
            if (typeof txt === 'string') txt = txt.replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(txt);
        } catch (e) {
            console.warn("PA Analysis fallback", e);
            return { standard_criteria: "General Medical Necessity", rationale_strength: "Medium", talking_points: ["Patient unique check", "Standard care failed", "Urgency"] };
        }
    }

    async function draftPAContent(state, analysis) {
        const isP2P = state.type === 'p2p';
        console.log(`📝 Drafting ${isP2P ? 'Peer-to-Peer' : 'Appeal'} with Claude Sonnet 4.5`);

        const payerInfo = PAYER_RULES[state.payer] || PAYER_RULES.generic;
       const systemPrompt = `You are a Chief Medical Officer / Physician Advisor.
Draft ${isP2P ? 'a Peer-to-Peer Script (MD-to-MD Call)' : (state.logic === 'exception' ? 'an Exception Request Letter' : 'a Prior Authorization Appeal Letter')}.

PROCEDURE: ${state.procedure}
ICD-10: ${state.icd || 'N/A'}
CPT/HCPCS: ${state.cpt || 'N/A'}
PAYER: ${payerInfo.name}
DENIAL: ${state.reason}
SELECTED LOGIC: ${state.logic}
TALKING POINTS: ${(analysis.talking_points || []).join('; ')}

INSTRUCTIONS:
${isP2P ? `
- Create a concise script for a doctor calling a payer Medical Director.
- Intro: Professional greeting, patient reference.
- The "Ask": Clear statement of what is needed.
- The Argument: Rapid-fire clinical reasons why denial is wrong/unsafe.
- Closing: Demand for immediate reversal or Reference Number.
` : state.logic === 'exception' ? `
- Structure as a formal exception/medical necessity override request.
- Cite why standard rule should not apply: contraindication(s), risk of harm, urgency, prior failures.
- Reference payer personality: ${payerInfo.notes}.
- Include objective metrics, dates of conservative therapy, and safety concerns.
` : `
- Formal PA appeal letter structure.
- Map patient evidence to standard criteria (MCG/InterQual) tailored for ${payerInfo.name}.
- Emphasize medical necessity and documentation completeness.
- Include objective metrics, dates of conservative therapy, and imaging.
`}
`;

        const userPrompt = `Draft the content for ${state.procedure}. Evidence Summary: ${state.rationale}`;

        const response = await puter.ai.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], {
            model: 'claude-sonnet',
            stream: false
        });

        return response?.message?.content || response;
    }

    // Lightweight success tracking by payer and logic
   async function savePAStats(state, analysis) {
       try {
           const key = 'prior_auth_stats';
           const raw = await puter.kv.get(key);
           const stats = raw ? JSON.parse(raw) : { total: 0, byPayer: {}, byLogic: {} };
           stats.total += 1;
           stats.byPayer[state.payer] = (stats.byPayer[state.payer] || 0) + 1;
           stats.byLogic[state.logic] = (stats.byLogic[state.logic] || 0) + 1;
           await puter.kv.set(key, JSON.stringify(stats));
       } catch (e) { console.warn('stats persist error', e); }
   }

   console.log('✅ PriorAuthGuard AI Engine loaded');
})();
