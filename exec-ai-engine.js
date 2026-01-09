/**
 * ExecWriter AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 * Focus: Style/Voice Analysis, Nuance Control, and High-Stakes Drafting.
 */

(function () {
    'use strict';

    /**
     * Generate Executive Communication
     */
    window.generateExecResponseWithAI = async function () {
        const state = window.execState || {};
        const context = document.getElementById('exec-context')?.value || '';
        const voiceSample = document.getElementById('exec-voice-sample')?.value || '';

        if (!context) throw new Error("Please tell me what you need to say.");

        // Step 1: Analyze Voice (if provided) using Gemini 3.0 Pro
        // Gemini analyzes the linguistic patterns
        let styleProfile = "Standard Professional";
        if (voiceSample && voiceSample.length > 50) {
            styleProfile = await analyzeStyleWithGemini(voiceSample);
            window.execState.styleAnalysis = styleProfile;
        }

        // Step 2: Draft Communication using Claude 4.5 Sonnet
        // Claude 4.5 is best for capturing effective, nuanced human tone
        const draft = await draftExecWithClaude(context, styleProfile, state);

        return draft;
    };

    /**
     * Helper: Analyze Style (Gemini)
     */
    async function analyzeStyleWithGemini(sample) {
        const prompt = `
You are a Linguistic Analyst.
Analyze the following writing sample to determine the author's "Voice".

SAMPLE:
"${sample}"

TASK:
Identify 3-4 key stylistic traits.
- Sentence structure (Short/punchy vs. Long/flowing)
- Vocabulary (Simple/Direct vs. Academic/Elevated)
- Tone (Warm, Cold, Urgent, Relaxed)
- Greeting/Sign-off style

OUTPUT:
A concise paragraph (2-3 sentences) describing this persona. Start with "Voice Profile:".
        `;

        try {
            console.log('✒️ Analyzing Voice with Gemini 3.0 Pro...');
            const response = await puter.ai.chat(prompt, {
                model: 'gemini-3-pro-preview'
            });

            return response?.message?.content || "Voice Profile: Standard Corporate Professional.";
        } catch (e) {
            console.error("Style Analysis Error:", e);
            return "Voice Profile: Standard Corporate Professional (Analysis Failed).";
        }
    }

    /**
     * Helper: Draft Email (Claude)
     */
    async function draftExecWithClaude(context, styleProfile, state) {
        // Map Nuance (1-10) to instructions
        const nuance = state.nuance;
        let toneInst = "Balanced and clear.";
        if (nuance < 4) toneInst = "Direct, blunt, and efficient. Avoid fluff.";
        if (nuance > 7) toneInst = "Highly diplomatic, nuanced, and careful. Soften hard news.";

        const systemPrompt = `You are a Ghostwriter for a Fortune 500 CEO.
Your job is to draft a sensitive email.

AUDIENCE: ${state.audience}
SCENARIO: ${state.type}
TONE SETTING: ${toneInst}

VOICE MATCH INSTRUCTIONS:
${styleProfile}
(You MUST mimic this voice profile in your draft)

FORMATTING:
- Subject Line: [Draft 3-4 options]
- Body: The email text.
- No placeholders.`;

        const userPrompt = `
DRAFTING CONTEXT / TOPIC:
"${context}"

Write the email.
        `;

        // Streaming Draft
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            console.log('✒️ Drafting with Claude Sonnet 4.5...');
            const stream = await puter.ai.chat(messages, {
                model: 'claude-sonnet',
                stream: true,
                temperature: 0.6 // Slightly higher temp for creative writing/voice matching
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
                if (window.onExecStreamUpdate) {
                    window.onExecStreamUpdate(text);
                }
            }
            return fullResponse;

        } catch (error) {
            console.error("Drafting Error:", error);
            throw error;
        }
    }

    console.log('✅ ExecWriter AI Engine loaded');
})();
