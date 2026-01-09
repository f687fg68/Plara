/**
 * ScamBaiter AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 * Focus: Creativity, Humor, Safety, and Time-Wasting.
 */

(function () {
    'use strict';

    /**
     * Generate Bait Response
     */
    window.generateScamResponseWithAI = async function () {
        const state = window.scamState || {};
        const input = document.getElementById('scam-input')?.value || '';

        if (!input) throw new Error("Feed me the scammer's email first.");

        // Step 1: Analyze Scam Type using Gemini 3.0 Pro
        const analysis = await analyzeScamWithGemini(input);
        window.scamState.analysis = analysis;

        // Step 2: Draft Bait Response using Claude 4.5 Sonnet
        const draft = await draftBaitWithClaude(input, analysis, state);

        return draft;
    };

    /**
     * Helper: Analyze Scam (Gemini)
     */
    async function analyzeScamWithGemini(message) {
        const prompt = `
You are a Scam Investigator.
Analyze this message.

MESSAGE: "${message}"

TASK:
1. Identify Scam Type (e.g., Romance, 419 Nigerian Prince, Tech Support, Crypto, Lottery).
2. Rate "Scamminess" (1-100%).
3. Extract dummy details they are asking for (e.g., Bank Acct, Address, Gift Card codes).

OUTPUT FORMAT (JSON only):
{
    "type": "String",
    "score": "Number",
    "requested_info": "String"
}
        `;

        try {
            console.log('🎣 Analyzing Scam with Gemini 3.0 Pro...');
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
            console.error("Scam Analysis Error:", e);
            return { type: "General Phishing", score: 99, requested_info: "Money/Data" };
        }
    }

    /**
     * Helper: Draft Bait (Claude)
     */
    async function draftBaitWithClaude(input, analysis, state) {
        const personas = {
            'confused-grandpa': 'You are "Harold", an 85-year-old who confuses emails with letters to his grandson. You are helpful but incredibly slow and get details wrong. Mention your cat "Mr. Whiskers".',
            'eager-victim': 'You are "Debbie", very excited to win/help. But you are incompetent. You keep "accidentally" sending the wrong files or asking if they accept "Target Coupons" instead of Bitcoin.',
            'tech-chaos': 'You are a fake "SysAdmin" who speaks pure nonsense technobabble. "I tried to FTP the mainframe into the RAM slot but the flux capacitor leaked."',
            'storyteller': 'You begin answering their question but immediately drift into a 3-paragraph story about your time in the Navy in 1974 or a recipe for clam chowder. Never actually give the info.'
        };

        const absurdity = state.absurdityLevel; // 1-10
        let instructions = "Be somewhat believable.";
        if (absurdity > 5) instructions = "Get weird. Misunderstand basic concepts.";
        if (absurdity > 8) instructions = "Complete nonsense. Gaslight them. Make up words.";

        const systemPrompt = `You are a Master Scambaiter. 
Your goal is to WASTE THE SCAMMER'S TIME safely.
Do NOT reveal any real info. Use fake names/addresses.

PERSONA: ${personas[state.persona]}
SCAM TYPE: ${analysis.type}
ABSURDITY LEVEL: ${absurdity}/10
INSTRUCTION: ${instructions}

RULES:
- Seem interested so they reply.
- Ask a stupid follow-up question.
- Do NOT give them what they want yet. Stall.
`;

        const userPrompt = `
SCAMMER SAID:
"${input}"

Draft the reply.
        `;

        // Streaming Draft
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            console.log('🎣 Baiting with Claude Sonnet 4.5...');
            const stream = await puter.ai.chat(messages, {
                model: 'claude-sonnet',
                stream: true,
                temperature: 0.8 // High creativity for humor
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
                if (window.onScamStreamUpdate) {
                    window.onScamStreamUpdate(text);
                }
            }
            return fullResponse;

        } catch (error) {
            console.error("Baiting Error:", error);
            throw error;
        }
    }

    console.log('✅ ScamBaiter AI Engine loaded');
})();
