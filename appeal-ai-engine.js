/**
 * AppealGuard AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 */

(function () {
    'use strict';

    /**
     * System Prompt Templates for Different AI Models
     */
    const SYSTEM_PROMPTS = {
        base: `You are an expert Academic Defense Attorney and University General Counsel with 15+ years of experience handling student appeals. Your expertise includes:

- Academic integrity proceedings
- Financial aid appeals
- Grade disputes
- Disciplinary sanctions
- University policy interpretation
- Due process requirements

Your task is to transform a student's raw, emotional explanation into a formal, structured, and persuasive academic appeal letter that maximizes the chance of a favorable outcome.`,

        structure: `
REQUIRED LETTER STRUCTURE:

1. FORMAL HEADER
   - Date (use current date)
   - Committee/Office name
   - Institution name
   - Subject line

2. INTRODUCTION (2-3 sentences)
   - State what is being appealed
   - Reference any case numbers or dates
   - Brief statement of desired outcome

3. CONTEXT & BACKGROUND (1-2 paragraphs)
   - Objective chronology of events
   - Relevant academic history
   - No emotional language

4. CORE ARGUMENT (2-3 paragraphs)
   - Primary reason appeal should be granted
   - Supporting evidence or mitigating factors
   - Policy or procedural references if applicable

5. REMEDIAL PLAN (if admitting fault) (1 paragraph)
   - Specific, concrete steps already taken
   - Future preventative measures
   - Demonstration of learning/growth

6. CONCLUSION (1 paragraph)
   - Respectful summary
   - Restatement of requested outcome
   - Thanks for consideration

7. FORMAL CLOSING
   - "Respectfully submitted,"
   - [Student Name]
   - [Student ID]`,

        formatting: `
FORMATTING REQUIREMENTS:

- Use formal business letter format
- Professional academic tone throughout
- No contractions (use "I am" not "I'm")
- No slang or colloquialisms
- Active voice where possible
- Concrete specifics over vague statements
- Use [STUDENT NAME] and [STUDENT ID] as placeholders
- Present date as [DATE]
- Use proper paragraphing and spacing`,

        tonalGuidelines: {
            contrite: `
TONE: CONTRITE & REFORM-ORIENTED

Strategy:
- Admit fault immediately and clearly
- Express genuine remorse and understanding of seriousness
- Emphasize lack of intent to deceive or harm
- Focus on personal growth and maturity gained
- Provide specific, measurable remedial actions
- Reference university values and community

Key Phrases:
- "I take full responsibility for..."
- "I understand the seriousness of..."
- "I have learned that..."
- "Moving forward, I will..."
- "I am committed to..."

Avoid:
- Making excuses
- Blaming others or circumstances
- Minimizing the offense
- Demanding or entitled language`,

            factual: `
TONE: FACTUAL & EVIDENCE-BASED

Strategy:
- State facts objectively and chronologically
- Reference specific syllabus/handbook provisions
- Cite procedural irregularities if present
- Present documentary evidence
- Use precise dates, times, and details
- Remain respectful but firm

Key Phrases:
- "According to the syllabus dated..."
- "The student handbook section X.Y states..."
- "The evidence demonstrates that..."
- "I respectfully submit that..."
- "The facts of this case show..."

Avoid:
- Emotional appeals
- Accusations of bad faith
- Absolute statements without proof
- Speculation about motives`,

            desperate: `
TONE: URGENT & NEED-BASED

Strategy:
- Open with changed circumstances that trigger SAP exception
- Provide specific financial/personal hardship details
- Demonstrate how aid loss prevents degree completion
- Show academic improvement or plan for improvement
- Reference specific financial aid policies
- Include quantifiable data (medical bills, income loss, etc.)

Key Phrases:
- "Due to a significant change in circumstances..."
- "My family's income decreased by X% when..."
- "Without aid restoration, I cannot afford..."
- "My academic performance was directly impacted by..."
- "I have taken the following steps to address..."

Avoid:
- Vague hardship claims
- Blame without evidence
- Demands or threats
- Failure to acknowledge academic responsibility`,

            procedural: `
TONE: PROCEDURAL & TECHNICAL

Strategy:
- Identify specific policy violations in the process
- Reference exact handbook sections and dates
- Cite constitutional/statutory due process rights if applicable
- Present timeline showing procedural defects
- Request specific remedies (rehearing, record correction, etc.)
- Maintain professional, non-accusatory tone

Key Phrases:
- "The procedures outlined in Section X were not followed..."
- "I was not provided the required notice as stated in..."
- "The investigation timeline exceeded the maximum..."
- "I respectfully request that..."
- "The record should reflect that..."

Avoid:
- Personal attacks on administrators
- Conspiracy theories
- Overstating legal rights
- Threatening litigation (save for attorney)`
        }
    };

    /**
     * Generate Appeal Letter using AI
     */
    window.generateAppealWithAI = async function () {
        const state = window.appealState || {};

        // Build the system prompt
        const systemPrompt = buildSystemPrompt(state.type, state.tone);

        // Build the user prompt with all context
        const userPrompt = buildUserPrompt(state);

        // Select AI model and make request
        const model = state.selectedModel || 'claude-sonnet-4';

        let messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        // Call Puter AI with streaming
        let fullResponse = '';

        const aiOptions = {
            model: model,
            stream: true,
            temperature: 0.7,
            max_tokens: 2500
        };

        try {
            const stream = await puter.ai.chat(messages, aiOptions);

            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
            }

            return fullResponse;

        } catch (error) {
            console.error('AI Generation Error:', error);
            throw new Error(`Failed to generate appeal: ${error.message}`);
        }
    };

    /**
     * Build comprehensive system prompt
     */
    function buildSystemPrompt(appealType, tone) {
        let prompt = SYSTEM_PROMPTS.base + '\n\n';
        prompt += SYSTEM_PROMPTS.structure + '\n\n';
        prompt += SYSTEM_PROMPTS.formatting + '\n\n';

        // Add tone-specific guidelines
        if (SYSTEM_PROMPTS.tonalGuidelines[tone]) {
            prompt += SYSTEM_PROMPTS.tonalGuidelines[tone] + '\n\n';
        }

        // Add appeal-type specific guidance
        prompt += getAppealTypeGuidance(appealType);

        return prompt;
    }

    /**
     * Get appeal-type specific guidance
     */
    function getAppealTypeGuidance(type) {
        const guidance = {
            misconduct: `
ACADEMIC MISCONDUCT SPECIFIC GUIDANCE:

Focus Areas:
- Distinguish between intent and mistake
- Address academic integrity education gaps
- Propose specific integrity training/workshops
- Reference honor code understanding
- Discuss cultural/first-generation student factors if relevant

Common Mitigating Factors:
- Unclear assignment instructions
- First offense
- High stress/mental health crisis (with documentation)
- Misunderstanding of collaboration rules
- Technical issues (for online submissions)

Remedial Actions:
- Academic integrity workshop completion
- Regular meetings with academic advisor
- Use of writing center for all future work
- Citation management software training`,

            financial: `
FINANCIAL AID APPEAL SPECIFIC GUIDANCE:

Required Elements:
- What changed? (job loss, death, medical emergency, divorce)
- When did it change? (specific dates)
- How does it affect ability to pay? (dollar amounts)
- Why did SAP metrics suffer? (direct connection to circumstance)
- What's different now? (why you'll succeed going forward)

Documentation to Reference:
- Doctor's notes
- Death certificates
- Termination letters
- Court documents
- Medical bills

Academic Plan Requirements:
- Specific GPA target with timeline
- Course load reduction plan
- Tutoring/support services commitment
- Major/advisor consultation`,

            grade: `
GRADE APPEAL SPECIFIC GUIDANCE:

Evidence Required:
- Specific assignment(s) in question
- Grading rubric or syllabus grading policy
- Your work vs. rubric comparison
- Similar work that received higher grade (if applicable)
- Email correspondence with instructor

Valid Grounds:
- Calculation error (verify with grade breakdown)
- Inconsistent application of rubric
- Graded work not returned for review
- Extenuating circumstances policy violation
- Discrimination or bias (requires strong evidence)

Invalid Grounds (acknowledge if trying anyway):
- Disagreement with instructor judgment
- "I need this grade" (for scholarship, graduation, etc.)
- Comparison to other students' effort
- Late policy application (if clear in syllabus)`,

            disciplinary: `
DISCIPLINARY ACTION APPEAL SPECIFIC GUIDANCE:

Appeal Grounds:
- Sanction disproportionate to offense
- Mitigating circumstances not considered
- Procedural violations
- New evidence
- Rehabilitation/remorse

Sanction Arguments:
- Compare to precedent (if available)
- Impact on academic/career future
- Steps already taken toward remediation
- Character references
- Clean prior record

Due Process Issues:
- Notice timing
- Evidence access
- Witness/representative limitations
- Hearing procedures
- Bias of decision-maker`
        };

        return guidance[type] || '';
    }

    /**
     * Build user prompt with all context
     */
    function buildUserPrompt(state) {
        return `
APPEAL REQUEST:

Appeal Type: ${state.type}
Desired Tone: ${state.tone}
Institution: ${state.institution || '[INSTITUTION NAME]'}
Specific Issue: ${state.allegation || '[ALLEGATION/ISSUE]'}

STUDENT'S RAW EXPLANATION:
"""
${state.rawInput}
"""

TASK:
Transform the above raw explanation into a formal, structured appeal letter following all guidelines. The letter should be ready for submission to a university appeals committee.

Output the complete letter in plain text format, ready to be copied and pasted into an official submission.
`;
    }

    /**
     * Generate appeal with specific model (for testing/comparison)
     */
    window.generateAppealWithModel = async function (modelId) {
        const previousModel = window.appealState.selectedModel;
        window.appealState.selectedModel = modelId;

        try {
            const result = await window.generateAppealWithAI();
            return result;
        } finally {
            window.appealState.selectedModel = previousModel;
        }
    };

    /**
     * Compare outputs from multiple models
     */
    window.compareAppealModels = async function () {
        const models = ['claude-sonnet-4', 'gemini-3-pro-preview', 'gpt-4o'];
        const results = {};

        showNotification('Generating with all models for comparison...', 'info');

        for (const model of models) {
            try {
                results[model] = await generateAppealWithModel(model);
            } catch (error) {
                results[model] = `Error: ${error.message}`;
            }
        }

        return results;
    };

    console.log('✅ AppealGuard AI Engine loaded');
})();
