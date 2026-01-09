/**
 * PatentGuard AI Engine
 * Logic for drafting Patent Office Action Responses.
 */

(function () {
    'use strict';

    window.runPatentGeneration = async function () {
        // Collect Data
        const appNo = document.getElementById('pat-app-no')?.value;
        const jurisdiction = document.getElementById('pat-jurisdiction')?.value;
        const type = document.getElementById('pat-rejection-type')?.value;
        const priorArt = document.getElementById('pat-prior-art')?.value;
        const details = document.getElementById('pat-details')?.value;

        if (!details) {
            showNotification('Technical distinguishing details are required.', 'warning');
            return;
        }

        const state = { appNo, jurisdiction, type, priorArt, details };

        // UI Loading
        appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="pat-loading" style="padding: 1rem; border: 1px solid #cbd5e1; background: white; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 10px; font-weight: 600; color: #1e3a8a;">
                    <span style="animation: spin 2s linear infinite;">⚖️</span>
                    Analyzing MPEP & Drafting Remarks...
                </div>
            </div>
            <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>`
        });

        try {
            // Step 1: Legal Argument Formulation (Gemini)
            // Analyzes the text to see if TSM (Teaching-Suggestion-Motivation) or other legal frameworks apply.
            const strategy = await formulateLegalStrategy(state);

            // Step 2: Draft Remarks (Claude)
            const draft = await draftPatentResponse(state, strategy);

            // Cleanup
            const loader = document.getElementById('pat-loading');
            if (loader) loader.closest('.message').remove();

            // Display
            if (window.displayPatentResult) {
                window.displayPatentResult(draft, state);
            }

        } catch (e) {
            console.error("Patent AI Error", e);
            const loader = document.getElementById('pat-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
        }
    };

    async function formulateLegalStrategy(state) {
        console.log('⚖️ Formulating Strategy with Gemini 3.0 Pro');

        const prompt = `
You are a Senior Patent Attorney.
Analyze the following technical distinction to formulate a ${state.jurisdiction} legal argument against a §${state.type} rejection.

PRIOR ART: ${state.priorArt}
INVENTION/DISTINCTION: "${state.details}"

TASK:
1. Identify the core legal argument (e.g., "Teaching Away", "No Motivation to Combine", "Missing Element").
2. Suggest 1-2 relevant MPEP (or EPO Guidelines) citations.
3. Assess the strength of the argument ("Strong", "Weak", "Procedural").

OUTPUT FORMAT (JSON only):
{
    "legal_argument": "String",
    "citations": ["String"],
    "strength": "String"
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
            console.warn("Patent Strategy fallback", e);
            return { legal_argument: "Prima Facie Case Not Estabished", citations: ["MPEP 2143"], strength: "Medium" };
        }
    }

    async function draftPatentResponse(state, strategy) {
        console.log('✍️ Drafting Response with Claude Sonnet 4.5');

        const systemPrompt = `You are a Patent Prosecutor (Attorney).
Draft the "Remarks" section of an Office Action Response.

JURISDICTION: ${state.jurisdiction}
REJECTION TYPE: §${state.type}
LEGAL ARGUMENT: ${strategy.legal_argument}
CITATIONS: ${strategy.citations.join(', ')}

INSTRUCTIONS:
1. Use formal, deferential but firm tone ("It is respectfully submitted...").
2. Clearly distinguish the Pending Claims from the Cited References.
3. Apply the '${strategy.legal_argument}' framework meticulously.
4. Conclude with a request for withdrawal of the rejection.

TECHNICAL FACTS:
${state.details}
`;

        const userPrompt = `Draft the Remarks for Application ${state.appNo}.`;

        const response = await puter.ai.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], {
            model: 'claude-sonnet',
            stream: false
        });

        return response?.message?.content || response;
    }

    console.log('✅ PatentGuard AI Engine loaded');
})();
