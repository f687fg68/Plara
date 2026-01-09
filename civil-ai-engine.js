/**
 * CivilMind AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 * Focus: Logical Consistency, Fact-Checking, and De-Escalation.
 */

(function () {
    'use strict';

    /**
     * Generate Civil Response
     */
    window.generateCivilResponseWithAI = async function () {
        const state = window.civilState || {};
        const input = document.getElementById('civil-input')?.value || '';

        if (!input) throw new Error("Please provide the argument to address.");

        // Step 1: Analyze Logic & Facts using Gemini 3.0 Pro
        const analysis = await analyzeArgumentWithGemini(input);
        window.civilState.analysis = analysis;

        // Step 2: Draft Response using Claude 4.5 Sonnet
        const draft = await draftCivilResponseWithClaude(input, analysis, state);

        return draft;
    };

    /**
     * Helper: Analyze Argument (Gemini)
     */
    async function analyzeArgumentWithGemini(argument) {
        const prompt = `
You are a Logic & Fact Checker.
Analyze this political/social argument.

ARGUMENT: "${argument}"

TASK:
1. Identify Logical Fallacies (e.g., Ad Hominem, Strawman, Slippery Slope).
2. Rate "Constructiveness" (High/Medium/Low).
3. Identify Key Claims that need fact-checking (if any).

OUTPUT FORMAT (JSON only):
{
    "fallacies": ["String"],
    "constructiveness": "String",
    "key_claims": ["String"]
}
        `;

        try {
            console.log('🏛️ Analyzing Argument with Gemini 3.0 Pro...');
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
            console.error("Civil Analysis Error:", e);
            return { fallacies: ["Unknown"], constructiveness: "Low" };
        }
    }

    /**
     * Helper: Draft Response (Claude)
     */
    async function draftCivilResponseWithClaude(input, analysis, state) {
        const toneInstructions = {
            'socratic': 'Ask 2-3 thoughtful questions that gently challenge the underlying assumptions. Do not lecture. Make them think.',
            'fact-based': 'Politely correct factual errors. Cite general consensus or data. Avoid emotional language. Be objective.',
            'common-ground': 'Start by agreeing with the emotion or a shared value (e.g., "We both want safety"). Then pivot to your perspective.'
        };

        const systemPrompt = `You are a Diplomat and Expert Debater.
Your goal is to RESPOND to a heating argument constructively.

YOUR STANCE: ${state.userStance}
STRATEGY: ${state.tone}
INSTRUCTIONS: ${toneInstructions[state.tone]}

DETECTED FALLACIES: ${analysis.fallacies ? analysis.fallacies.join(', ') : 'None'}

RULES:
- Never insult.
- Use "I" statements ("I feel", "I think") rather than "You" statements ("You are wrong").
- Keep it under 150 words (succinct).
- Aim to lower the temperature, not win points.
`;

        const userPrompt = `
THEIR ARGUMENT:
"${input}"

Draft the response.
        `;

        // Streaming Draft
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            console.log('🏛️ Drafting with Claude Sonnet 4.5...');
            const stream = await puter.ai.chat(messages, {
                model: 'claude-sonnet',
                stream: true,
                temperature: 0.5 // Balanced creativity/logic
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
                if (window.onCivilStreamUpdate) {
                    window.onCivilStreamUpdate(text);
                }
            }
            return fullResponse;

        } catch (error) {
            console.error("Drafting Error:", error);
            throw error;
        }
    }

    console.log('✅ CivilMind AI Engine loaded');
})();
