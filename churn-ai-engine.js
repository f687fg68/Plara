/**
 * ChurnGuard AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 * Focus: Risk Analysis, Sentiment Analysis, and Retention Drafting.
 */

(function () {
    'use strict';

    /**
     * Generate Churn Analysis and Response
     */
    window.generateChurnResponseWithAI = async function () {
        const state = window.churnState || {};
        const ticket = document.getElementById('churn-ticket-input')?.value || '';
        const arr = document.getElementById('churn-arr')?.value || 0;
        const usage = document.getElementById('churn-usage')?.value || 'flat';

        if (!ticket) throw new Error("Customer ticket content is required.");

        // Step 1: Analyze Risk using Gemini 3.0 Pro
        // Gemini is excellent at classification and reasoning
        const analysis = await analyzeRiskWithGemini(ticket, arr, usage);
        window.churnState.analysis = analysis; // Store for display

        // Step 2: Draft Response using Claude 4.5 Sonnet
        // Claude excels at tone, empathy, and writing like a human
        const draft = await draftResponseWithClaude(ticket, analysis, state.strategy);

        return draft;
    };

    /**
     * Helper: Analyze Risk (Gemini)
     */
    async function analyzeRiskWithGemini(ticket, arr, usage) {
        const prompt = `
You are a Customer Success Risk Analyst.
Analyze the following customer ticket and data to assess Churn Risk.

CUSTOMER TICKET:
"${ticket}"

DATA:
- Annual Value (ARR): $${arr}
- Usage Trend: ${usage}

TASK:
1. Determine Sentiment (Angry, Frustrated, Disappointed, Confused).
2. Identify Root Cause (Price, Bug, Missing Feature, Support Issue).
3. Calculate Risk Score (0-100), where 100 is certain churn. Consider High ARR and Dropping usage as amplifiers.
4. Recommend Action (e.g., "Offer discount", "Escalate to Engineering").

OUTPUT FORMAT (JSON only):
{
    "sentiment": "String",
    "root_cause": "String",
    "risk_score": Number,
    "action": "String"
}
        `;

        try {
            console.log('🛡️ Analyzing Risk with Gemini 3.0 Pro...');
            const response = await puter.ai.chat(prompt, {
                model: 'gemini-3-pro-preview',
                response_format: { type: 'json_object' }
            });

            // Handle if response is string or object
            let result = response?.message?.content || response;
            if (typeof result === 'string') {
                // Clean markdown code blocks if present
                result = result.replace(/```json/g, '').replace(/```/g, '');
                return JSON.parse(result);
            }
            return result;
        } catch (e) {
            console.error("Analysis Error:", e);
            return { sentiment: "Unknown", root_cause: "Analysis Failed", risk_score: 50, action: "Manual Review" };
        }
    }

    /**
     * Helper: Draft Response (Claude)
     */
    async function draftResponseWithClaude(ticket, analysis, strategy) {
        const systemPrompt = `You are an Expert Customer Success Manager specializing in retention.
Your goal is to save the customer account using High-EQ communication.
tone: Empathetic, Professional, Solution-Oriented.
Strategy: ${strategy}
Risk Level: ${analysis.risk_score}/100
Root Cause: ${analysis.root_cause}

STRATEGY GUIDANCE:
- 'de-escalation': Apologize sincerely. Validate feelings. Offer immediate fix path.
- 'value-reinforcement': Remind them of the ROI. Do not drop price immediately unless necessary.
- 'feature-gap': Be transparent. Offer a workaround or beta access if plausible.
- 'executive-outreach': "I have cc'd our VP of Product to ensure this gets visibility."`;

        const userPrompt = `
CUSTOMER TICKET:
"${ticket}"

Write a reply email.
        `;

        // Streaming Draft
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            console.log('🛡️ Drafting with Claude Sonnet 4.5...');
            const stream = await puter.ai.chat(messages, {
                model: 'claude-sonnet', // Using 'claude-sonnet' mapping which should point to newest available
                stream: true,
                temperature: 0.5
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
                if (window.onChurnStreamUpdate) {
                    window.onChurnStreamUpdate(text);
                }
            }
            return fullResponse;

        } catch (error) {
            console.error("Drafting Error:", error);
            throw error;
        }
    }

    console.log('✅ ChurnGuard AI Engine loaded');
})();
