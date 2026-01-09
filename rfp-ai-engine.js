/**
 * GovProposal AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 * Focus: FAR Compliance, Shipley Proposal Method, Win Themes
 */

(function () {
    'use strict';

    const SYSTEM_PROMPTS = {
        base: `You are a Senior Proposal Manager and Lead Technical Writer with 20+ years of experience winning US Federal Government contracts.
        
CORE COMPETENCIES:
1. **Compliance**: You adhere strictly to Section L (Instructions) and Section M (Evaluation Criteria). You rely on FAR (Federal Acquisition Regulation) principles.
2. **Shipley Method**: You use "Feature -> Benefit -> Proof" structure. Every claim is substantiated.
3. **Win Themes**: You weave themes (e.g., Low Risk, Innovation, Cost Savings) into the narrative.
4. **Clarity**: You advocate for "one clear voice". Active voice, no passive voice. Concise.
5. **Shalls/Musts**: You ensure every "shall" or "must" in the requirement is explicitly addressed.`,

        structure: `
PROPOSAL SECTION STRUCTURE:
1. **Understanding the Requirement**: Briefly demonstrate you understand what the government needs.
2. **Our Approach**: The detailed solution.
3. **Compliance Mapping**: Explicitly state how you meet the requirements (e.g., "Team X meets this requirement by...").
4. **Benefits/Value**: Why is this approach good for the Government? (e.g., "This reduces risk by...").
5. **Proof Point**: Evidence of past success (e.g., "As demonstrated on Contract Y...").`,

        sectionGuidance: {
            'executive-summary': `
TASK: Write an Executive Summary.
- Focus on the "Why Us?".
- Summarize the solution at a high level.
- Highlight 3-4 Win Themes / Discriminators clearly.
- Map capabilities to Agency goals.`,

            'technical-approach': `
TASK: Write a Technical Approach section.
- Be highly specific. Avoid "fluff".
- Use technical terminology appropriate for the domain (Cloud, Cyber, Engineering, etc.).
- step-by-step methodology.
- Include a "Features and Benefits" summary table concept if applicable.`,

            'management-plan': `
TASK: Write a Management Plan.
- Focus on Low Risk.
- Describe organizational structure, lines of authority, and quality control (QASP).
- Mention industry standards (ISO 9001, CMMI, PMBOK).`,

            'past-performance': `
TASK: Write a Past Performance citation.
- Use the challenge-Action-Result format.
- Explicitly map relevance to the NEW requirement (Scope, Size, Complexity).`,

            'compliance-matrix': `
TASK: Generate a Compliance Matrix.
- Create a Markdown table.
- Columns: "RFP Reference", "Requirement Text", "Proposal Section", "Compliant? (Y/N)".
- Parse the provided text for every "Shall", "Must", "Will".`
        }
    };

    /**
     * Generate RFP Response
     */
    window.generateRfpResponseWithAI = async function () {
        const state = window.rfpState || {};
        const requirement = document.getElementById('rfp-requirement-input')?.value || '';
        const capabilities = document.getElementById('rfp-company-context')?.value || '';

        if (!requirement) throw new Error("RFP Requirement text is required.");

        // Build User Prompt
        const userPrompt = `
RFP REQUIREMENT TEXT (Section L/M):
"""
${requirement}
"""

COMPANY CAPABILITIES / CONTEXT:
"""
${capabilities || 'Assume standard industry capabilities for a qualified government contractor.'}
"""

TASK:
Draft the **${state.sectionType}** section for this proposal.
Compliance Mode: ${state.complianceMode}
        `;

        // Select Prompt Components
        let systemContent = SYSTEM_PROMPTS.base + '\n\n' + SYSTEM_PROMPTS.structure + '\n\n';
        if (SYSTEM_PROMPTS.sectionGuidance[state.sectionType]) {
            systemContent += SYSTEM_PROMPTS.sectionGuidance[state.sectionType];
        }

        // Add Mode Instructions
        const modeInstructions = {
            'shipley': 'Use "Feature -> Benefit -> Proof" format. Highlight "Discriminators". Use Active Voice.',
            'strict-compliance': 'Quote the requirement language. Be extremely literal. Ensure every "Shall" is addressed with "We will...".',
            'Ghosting': 'Subtly highlight risks of alternative approaches (competitors) without naming them. Focus on why OUR specific approach avoids those risks.'
        };
        systemContent += `\n\nSTRATEGY INSTRUCTION: ${modeInstructions[state.complianceMode] || ''}`;

        // Model Selection
        const modelId = state.selectedModel || 'claude-sonnet-4';
        const modelMap = {
            'claude-sonnet-4': 'claude-sonnet',
            'gemini-3-pro-preview': 'gemini-3-pro-preview'
        };
        const puterModel = modelMap[modelId] || 'claude-sonnet';

        // Execute API Call
        const messages = [
            { role: 'system', content: systemContent },
            { role: 'user', content: userPrompt }
        ];

        try {
            console.log(`🏛️ Generating Proposal with ${puterModel}...`);
            const stream = await puter.ai.chat(messages, {
                model: puterModel,
                stream: true,
                temperature: 0.4
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
                if (window.onRfpStreamUpdate) {
                    window.onRfpStreamUpdate(text);
                }
            }
            return fullResponse;

        } catch (error) {
            console.error("RFP AI Error:", error);
            throw error;
        }
    };

    console.log('✅ GovProposal AI Engine loaded');
})();
