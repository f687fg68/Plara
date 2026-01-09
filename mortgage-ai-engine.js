/**
 * MortgageGuard AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 * Focus: FCRA/CFPB Compliance, Clarity, and Regulatory Guidelines.
 */

(function () {
    'use strict';

    /**
     * Generate Mortgage Denial Letter
     */
    window.generateMortgageLetterWithAI = async function () {
        const state = window.mortgageState || {};
        const details = document.getElementById('mortgage-details')?.value || '';

        // Update state with text area val
        state.denialDetails = details;

        if (!state.applicantName) throw new Error("Applicant Name is required.");
        if (!details) throw new Error("Specific denial details are required for compliance.");

        // Step 1: Compliance Check & Code Mapping using Gemini 3.0 Pro
        const analysis = await analyzeComplianceWithGemini(details, state.denialReason);
        window.mortgageState.analysis = analysis;

        // Step 2: Draft Adverse Action Notice using Claude 4.5 Sonnet
        const draft = await draftMortgageLetterWithClaude(state, analysis);

        return draft;
    };

    /**
     * Helper: Analyze Compliance (Gemini)
     */
    async function analyzeComplianceWithGemini(details, category) {
        const prompt = `
You are a Mortgage Compliance Officer (FCRA/CFPB Expert).
Analyze these denial details for a "${category}" rejection.

DETAILS: "${details}"

TASK:
1. Identify the specific Adverse Action Reasons (e.g., "Credits score below minimum", "Excessive obligations").
2. Check if the explanation is specific enough for FCRA/ECOA requirements (Yes/No).
3. Suggest the "Actionable Steps" the consumer can take.

OUTPUT FORMAT (JSON only):
{
    "specific_reasons": ["String"],
    "is_compliant_explanation": Boolean,
    "actionable_steps": ["String"]
}
        `;

        try {
            console.log('🏦 Analyzing Compliance with Gemini 3.0 Pro...');
            const response = await puter.ai.chat(prompt, {
                model: 'gemini-3-pro-preview',
                response_format: { type: 'json_object' }
            });

            let result = response?.message?.content || response;
            if (typeof result === 'string') {
                result = result.replace(/```json/g, '').replace(/```/g, '');
                return JSON.parse(result);
            }
            return result;
        } catch (e) {
            console.error("Compliance Analysis Error:", e);
            return { specific_reasons: [details], is_compliant_explanation: true, actionable_steps: ["Contact lender for details."] };
        }
    }

    /**
     * Helper: Draft Letter (Claude)
     */
    async function draftMortgageLetterWithClaude(state, analysis) {

        const systemPrompt = `You are a Mortgage Lender Compliance Processor.
Draft a Formal Adverse Action Notice (Denial Letter).

APPLICANT: ${state.applicantName}
LOAN TYPE: ${state.loanType}
DATE: ${new Date().toLocaleDateString()}

DENIAL REASONS (Official):
${analysis.specific_reasons.map(r => "- " + r).join('\n')}

ACTIONABLE ADVICE:
${analysis.actionable_steps.map(s => "- " + s).join('\n')}

INSTRUCTIONS:
- Use formal, regulated language (FCRA/ECOA standards).
- Be clear and direct but polite.
- Include standard placeholders for [Credit Bureau Contact Info] if relevant.
- Do NOT apologize excessively; state the decision as a factual underwriting conclusion.
`;

        const userPrompt = `
Generate the Adverse Action Notice for ${state.applicantName}.
Ensure clearly stated reasons and rights.
        `;

        // Streaming Draft
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            console.log('🏦 Drafting Letter with Claude Sonnet 4.5...');
            const stream = await puter.ai.chat(messages, {
                model: 'claude-sonnet',
                stream: true,
                temperature: 0.2 // Low temperature for high precision/consistency
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
                if (window.onMortgageStreamUpdate) {
                    window.onMortgageStreamUpdate(text);
                }
            }
            return fullResponse;

        } catch (error) {
            console.error("Drafting Error:", error);
            throw error;
        }
    }

    console.log('✅ MortgageGuard AI Engine loaded');
})();
