/**
 * SafeSpace AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 * Focus: Threat Analysis, Safety Reporting, and De-Escalation.
 */

(function () {
    'use strict';

    /**
     * Generate Safety Analysis and Response
     */
    window.generateSafetyResponseWithAI = async function () {
        const state = window.safetyState || {};
        const input = document.getElementById('safety-input')?.value || '';
        const context = document.getElementById('safety-context')?.value || '';

        if (!input) throw new Error("Please provide the message to analyze.");

        // Step 1: Analyze Threat Level using Gemini 3.0 Pro
        // Gemini scans for intent (Harm, Doxxing, Trolling, Spam)
        const analysis = await analyzeThreatWithGemini(input, context);
        window.safetyState.analysis = analysis;

        // Step 2: Draft Safe Response using Claude 4.5 Sonnet
        // Claude drafts the reply based on the strategy
        const draft = await draftSafetyResponseWithClaude(input, analysis, state);

        return draft;
    };

    /**
     * Helper: Analyze Threat (Gemini)
     */
    async function analyzeThreatWithGemini(message, context) {
        const prompt = `
You are a Trust & Safety Expert.
Analyze the following incoming message for Safety Risks.

MESSAGE: "${message}"
CONTEXT: "${context}"

TASK:
1. Determine Intent (Trolling, Sexual Harassment, Physical Threat, Doxxing, Spam/Bot, General Rudeness).
2. Assign Threat Level (Low, Medium, High, CRITICAL).
3. Recommend Reporting Action (e.g., "Report for Hate Speech", "Block and Ignore", "Contact Authorities").

OUTPUT FORMAT (JSON only):
{
    "intent": "String",
    "threat_level": "String",
    "recommendation": "String"
}
        `;

        try {
            console.log('🛡️ Analyzing Safety with Gemini 3.0 Pro...');
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
            console.error("Safety Analysis Error:", e);
            return { intent: "Unknown", threat_level: "Medium", recommendation: "Block user." };
        }
    }

    /**
     * Helper: Draft Response (Claude)
     */
    async function draftSafetyResponseWithClaude(input, analysis, state) {
        const strategyInstructions = {
            'grey-rock': 'Be incredibly boring. Give one-word answers. Show zero emotion. Do not justify or explain. "Okay." "I see." "Interesting."',
            'firm-boundary': 'State clearly that this communication is unwanted. Do not argue. "Please stop contacting me." "I will not discuss this further."',
            'humorous-deflection': 'Use non-offensive humor to make the aggression seem silly. Do not attack back. Diffuse with absurdity.',
            'empathetic-pivot': 'Assume they are having a bad day (if safe). "I hear you are frustrated..."'
        };

        const systemPrompt = `You are a De-Escalation Specialist.
Your goal is to neutralize an online interaction to protect the user's mental peace.

STRATEGY: ${state.strategy.toUpperCase()} (${strategyInstructions[state.strategy]})
THREAT LEVEL: ${analysis.threat_level}

RULES:
- Never escalate.
- Never attack back.
- If Threat Level is High/Critical, advise the user NOT to reply and to document evidence instead.
- Keep it short.
`;

        const userPrompt = `
HARASSING MESSAGE:
"${input}"

Draft the response (or advice).
        `;

        // Streaming Draft
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            console.log('🛡️ Drafting with Claude Sonnet 4.5...');
            const stream = await puter.ai.chat(messages, {
                model: 'claude-sonnet',
                stream: true,
                temperature: 0.4 // Calm/Stable
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
                if (window.onSafetyStreamUpdate) {
                    window.onSafetyStreamUpdate(text);
                }
            }
            return fullResponse;

        } catch (error) {
            console.error("Drafting Error:", error);
            throw error;
        }
    }

    console.log('✅ SafeSpace AI Engine loaded');
})();
