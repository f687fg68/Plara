/**
 * LegalMind AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 * Focus: FRCP Compliance, Objection Identification, and Legal Drafting.
 */

(function () {
    'use strict';

    /**
     * Generate Discovery Analysis and Response
     */
    window.generateDiscoveryResponseWithAI = async function () {
        const state = window.discoveryState || {};
        const requestText = document.getElementById('discovery-input')?.value || '';
        const context = document.getElementById('discovery-context')?.value || '';

        if (!requestText) throw new Error("Discovery request text is required.");

        // Step 1: Analyze Requests using Gemini 3.0 Pro
        // Identify individual requests and potential objections for each
        const analysis = await analyzeRequestsWithGemini(requestText, context);
        window.discoveryState.analysis = analysis;

        // Step 2: Draft Response using Claude 4.5 Sonnet
        // Draft format: Response to Request No. X: Objection... Response...
        const draft = await draftLegalResponseWithClaude(analysis, state.strategy, context);

        return draft;
    };

    /**
     * Helper: Analyze Requests (Gemini)
     */
    async function analyzeRequestsWithGemini(text, context) {
        const prompt = `
You are a Senior Litigation Paralegal.
Analyze the following Discovery Requests (Interrogatories, RFPs, or RFAs).

CONTEXT FACTS:
"${context}"

REQUESTS:
"${text}"

TASK:
1. Parse identifying numbers (e.g., "Request No. 1").
2. For each request, identify potential objections based on Federal Rules of Civil Procedure (FRCP):
   - Overbroad?
   - Vague/Ambiguous?
   - Undue Burden?
   - Attorney-Client Privilege/Work Product?
   - Irrelevant?
3. Summarize the "Gist" of what is being asked.

OUTPUT FORMAT (JSON Array):
[
    {
        "id": "Request No. 1",
        "text": "Full text...",
        "gist": "Asking for...",
        "objections": ["Vague", "Overbroad"],
        "reasoning": "Term 'all documents' is overbroad..."
    }
]
        `;

        try {
            console.log('⚖️ Analyzing Requests with Gemini 3.0 Pro...');
            const response = await puter.ai.chat(prompt, {
                model: 'gemini-3-pro-preview',
                response_format: { type: 'json_object' }
            });

            // Clean/Parse JSON
            let result = response?.message?.content || response;
            if (typeof result === 'string') {
                result = result.replace(/```json/g, '').replace(/```/g, '');
                // Try to find the array start/end if there's text around it
                const start = result.indexOf('[');
                const end = result.lastIndexOf(']') + 1;
                if (start !== -1 && end !== -1) {
                    result = result.substring(start, end);
                }
                return JSON.parse(result);
            }
            return result;
        } catch (e) {
            console.error("Discovery Analysis Error:", e);
            // Fallback: Treat whole text as one item
            return [{ id: "Requests", text: text, gist: "Full text", objections: ["General Objection"], reasoning: "Analysis failed." }];
        }
    }

    /**
     * Helper: Draft Response (Claude)
     */
    async function draftLegalResponseWithClaude(analysis, strategy, context) {
        const systemPrompt = `You are an Expert Defense Attorney.
Draft formal responses to discovery requests.

STRATEGY: ${strategy.toUpperCase()}
- 'Standard': State objections clearly but explain what IS being provided/answered. "Subject to and without waiving..."
- 'Aggressive': Maximize objections. Refuse to answer if any grounds exist.
- 'Cooperative': Fail to object unless privileged. Provide full details.

FORMATTING:
- Use standard legal pleading format.
- Bold the Request Number and Text.
- "RESPONSE TO QUESTION NO. X:"
- If objecting, start with "Objection."
- Use professional, precise legal language.

CASE CONTEXT:
${context}`;

        const userPrompt = `
Here are the analyzed requests. Draft the full response document.

REQUESTS & ANALYSIS:
${JSON.stringify(analysis, null, 2)}
        `;

        // Streaming Draft
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            console.log('⚖️ Drafting with Claude Sonnet 4.5...');
            const stream = await puter.ai.chat(messages, {
                model: 'claude-sonnet',
                stream: true,
                temperature: 0.3 // Low temp for legal precision
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
                if (window.onDiscoveryStreamUpdate) {
                    window.onDiscoveryStreamUpdate(text);
                }
            }
            return fullResponse;

        } catch (error) {
            console.error("Drafting Error:", error);
            throw error;
        }
    }

    console.log('✅ LegalMind AI Engine loaded');
})();
