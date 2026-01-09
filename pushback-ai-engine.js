/**
 * PushbackPro AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 */

(function () {
    'use strict';

    /**
     * System Prompt Templates for Contract Negotiation
     */
    const SYSTEM_PROMPTS = {
        base: `You are an expert business negotiation consultant with 25+ years of experience in contract management, vendor negotiations, and procurement. Your expertise includes:

- Contract law and standard business practices
- Vendor relationship management
- Strategic negotiation tactics
- Financial analysis and cost justification
- Risk assessment and mitigation
- Professional business communication

Your task is to transform raw business concerns into professional, strategic pushback responses that achieve favorable outcomes while maintaining business relationships.`,

        structure: `
REQUIRED RESPONSE STRUCTURE:

1. SUBJECT LINE
   - Clear, professional, action-oriented

2. OPENING (1-2 sentences)
   - Acknowledge receipt
   - Brief context reference

3. ISSUE STATEMENT (2-3 sentences)
   - State the specific concern clearly
   - Reference contract terms/agreements
   - Quantify impact where possible

4. EVIDENCE & REASONING (2-3 paragraphs)
   - Present factual arguments
   - Cite specific contract clauses
   - Reference industry standards
   - Include relevant data/metrics
   - Leverage points

5. PROPOSED SOLUTION (1-2 paragraphs)
   - Primary position
   - Alternative options if applicable
   - Compromise suggestions
   - Timeline for resolution

6. CALL TO ACTION (1 paragraph)
   - Specific next steps
   - Clear deadline
   - Meeting/call request if appropriate

7. PROFESSIONAL CLOSING
   - Express continued partnership interest
   - Signature block placeholder`,

        formatting: `
FORMATTING REQUIREMENTS:

- Professional business email format
- Use formal but approachable language
- No contractions in formal sections
- Active voice preferred
- Specific over vague (use numbers, dates, percentages)
- Bold key points for emphasis
- Use bullet points for lists
- Include [YOUR NAME], [TITLE], [COMPANY] placeholders
- Professional sign-off (Best regards, Sincerely, etc.)`,

        toneGuidelines: {
            diplomatic: `
TONE: DIPLOMATIC & COLLABORATIVE

Strategy:
- Emphasize partnership and mutual benefit
- Use "we" and "our shared goals" language
- Frame issues as opportunities for improvement
- Show empathy for vendor's position
- Propose win-win solutions
- Maintain warm, cooperative tone

Key Phrases:
- "We value our partnership..."
- "I understand the challenges..."
- "Let's work together to find..."
- "This could benefit both parties..."
- "We're committed to a mutually beneficial outcome..."

Avoid:
- Accusatory language
- Ultimatums
- Threatening tone
- Adversarial positioning`,

            firm: `
TONE: FIRM & PROFESSIONAL

Strategy:
- State position clearly and confidently
- Use data and facts to support arguments
- Reference contractual obligations
- Be direct but respectful
- Set clear expectations and boundaries
- Professional throughout

Key Phrases:
- "Per our agreement dated..."
- "We require clarification on..."
- "This is inconsistent with..."
- "We expect resolution by..."
- "As outlined in Section X..."

Avoid:
- Wishy-washy language
- Apologies for standing firm
- Overly accommodating tone
- Leaving position ambiguous`,

            assertive: `
TONE: ASSERTIVE & DIRECT

Strategy:
- Make demands clear and specific
- Use strong, definitive language
- Reference consequences of non-compliance
- Show you're prepared to take action
- Demonstrate you know your rights
- Maintain professionalism

Key Phrases:
- "We must insist that..."
- "This is not acceptable..."
- "We require immediate..."
- "Failure to address this will result in..."
- "We are prepared to escalate..."

Avoid:
- Threats of legal action (unless advised by counsel)
- Personal attacks
- Emotional language
- Burning bridges unnecessarily`,

            'final-warning': `
TONE: FINAL WARNING & ULTIMATUM

Strategy:
- Document everything meticulously
- Reference all previous communications
- State this is the final attempt
- Specify exact consequences
- Set hard deadlines
- Prepare for escalation or termination

Key Phrases:
- "This is our final attempt to resolve..."
- "As documented in our communications on [dates]..."
- "Without resolution by [specific date]..."
- "We will have no choice but to..."
- "We are prepared to pursue all available remedies..."

Avoid:
- Empty threats
- Vague consequences
- Leaving room for continued delay
- Failing to document timeline`
        }
    };

    /**
     * Response Type Specific Prompts
     */
    const RESPONSE_TYPE_PROMPTS = {
        'price-increase': `
PRICE INCREASE NEGOTIATION GUIDANCE:

Focus Areas:
- Quantify the percentage increase
- Challenge cost justification
- Reference market rates
- Leverage customer tenure
- Propose alternatives (smaller increase, phased, cap)
- Mention competitive options if applicable

Key Arguments:
- "The proposed X% increase exceeds market standards"
- "No substantial service improvements justify this cost"
- "Our X-year relationship deserves better consideration"
- "Competitive analysis shows rates 20-30% lower"

Data Points to Include:
- Current monthly/annual cost
- Proposed new cost
- Percentage increase
- Years as customer
- Competitive alternatives researched
- Industry standard pricing

Alternative Proposals:
1. Smaller increase (cap at 5-10%)
2. Phased implementation over 6-12 months
3. Multi-year commitment for rate lock
4. Volume-based pricing adjustments
5. Feature reduction for lower cost`,

        'unfair-clause': `
UNFAIR CONTRACT CLAUSE CHALLENGE:

Focus Areas:
- Identify specific clause language
- Explain one-sided nature
- Reference standard industry practice
- Propose balanced alternative language
- Cite fairness principles
- Mutual benefit emphasis

Valid Objection Points:
- Unlimited liability exposure
- One-sided termination rights
- Unreasonable auto-renewal terms
- Excessive early termination fees
- Unilateral price change rights
- Overly broad IP/data ownership
- Imbalanced indemnification

Proposed Solutions:
1. Mutual application of clause
2. Reasonable caps and limits
3. Adequate notice requirements
4. Balanced risk allocation
5. Industry-standard language

Supporting Arguments:
- "This clause creates disproportionate risk..."
- "Standard industry practice dictates..."
- "Mutual protection would ensure..."
- "We propose the following revision..."`,

        'sla-violation': `
SLA VIOLATION RESPONSE GUIDANCE:

Focus Areas:
- Document specific violation with dates
- Quantify business impact
- Reference SLA commitments
- Calculate service credits owed
- Demand remediation plan
- Set accountability measures

Required Elements:
- Exact SLA commitment (e.g., 99.9% uptime)
- Actual performance (e.g., 96.5% uptime)
- Duration of violation
- Incident dates and times
- Number of occurrences
- Business impact metrics

Remedies to Request:
1. Service credits per SLA terms
2. Financial compensation for losses
3. Detailed root cause analysis
4. Prevention plan with specifics
5. Enhanced monitoring/reporting
6. Penalty-free termination option

Business Impact Documentation:
- Revenue loss: $X
- Customer complaints: X number
- Operational hours disrupted: X
- Reputation damage
- Employee productivity loss`,

        'termination': `
TERMINATION NOTICE RESPONSE:

Focus Areas:
- Acknowledge notice professionally
- Clarify termination terms and timeline
- Address outstanding obligations
- Negotiate favorable transition
- Request waivers if applicable
- Leave door open (if desired)

Response Goals:
1. Negotiate extension: Present compelling reasons
2. Better transition terms: More time, support, data transfer
3. Waive penalties: Justify based on circumstances
4. Professional closure: Acknowledge and move forward
5. Dispute terms: Challenge improper termination

Transition Checklist:
- Final payment reconciliation
- Data export and transfer
- Outstanding deliverables
- Knowledge transfer
- Return of materials
- Final documentation

Professional Handling:
- Express appreciation for past partnership
- Avoid blame or negativity
- Focus on smooth transition
- Confirm all final details in writing
- Request formal termination confirmation`,

        'payment-terms': `
PAYMENT TERMS NEGOTIATION:

Focus Areas:
- Current terms vs. requested terms
- Business justification for change
- Cash flow considerations
- Relationship value
- Volume/loyalty leverage

Common Requests:
- Extend from Net 30 to Net 60/90
- Add early payment discount (2/10 Net 30)
- Milestone-based payments
- Reduce deposit requirements
- Remove late payment penalties

Justification Strategies:
- Industry standard terms
- Seasonal cash flow challenges
- Recent business circumstances
- Long-term customer value
- Competitive terms offered by others

Compromise Options:
- Partial extension (Net 45 instead of 60)
- First 90 days extended, then revert
- Early payment discount option
- Automatic payment setup
- Increased commitment for better terms`,

        'scope-creep': `
SCOPE CREEP RESPONSE:

Focus Areas:
- Define original scope clearly
- Identify specific additions
- Quantify additional work
- Reference change order process
- Propose fair pricing for extras
- Set boundaries for future

Documentation Needed:
- Original SOW/contract scope
- Specific additions requested
- Hours/effort for new work
- Fair market pricing
- Impact on timeline

Response Strategy:
- Acknowledge request professionally
- Clarify it's outside original scope
- Provide pricing for additional work
- Establish change order process
- Protect original scope boundaries

Pricing Approaches:
- Hourly rate for additions
- Fixed bid for new scope
- Monthly retainer expansion
- Project-based add-ons
- Discounted bundled pricing`,

        'auto-renewal': `
AUTO-RENEWAL DISPUTE:

Focus Areas:
- Review cancellation notice requirements
- Document your cancellation attempt
- Challenge inadequate notice disclosure
- Reference consumer protection standards
- Request retroactive cancellation

Valid Objection Grounds:
- Inadequate notice of auto-renewal
- Notice requirement buried in fine print
- Did not receive renewal reminder
- Cancellation submitted within notice period
- Technical issues with cancellation process

Evidence to Present:
- Dates of cancellation attempts
- Confirmation emails/tickets
- Contract clause about notice
- Industry standards (30-60 days typical)
- Consumer protection laws in jurisdiction

Remedies to Request:
1. Retroactive cancellation to original date
2. Refund of charges post-cancellation
3. Waive early termination fees
4. Pro-rated charges to cancellation date
5. Immediate termination without penalty`,

        'liability-cap': `
LIABILITY CAP NEGOTIATION:

Focus Areas:
- Proportionality to contract value
- Industry standard caps
- Mutual limitation of liability
- Carve-outs for specific damages
- Insurance requirements

Standard Positions:
- Cap should be 1-2x annual contract value
- Minimum: Equal to annual fees
- Mutual application (both parties capped equally)
- Exclude willful misconduct, IP infringement
- Require adequate insurance coverage

Negotiation Points:
- "Cap should be proportional to contract value"
- "Propose mutual limitation at $X"
- "Industry standard is 12-24 months of fees"
- "Exclude fraud, willful misconduct from cap"
- "Both parties should carry insurance"

Carve-Outs (Unlimited Liability):
- Fraud or willful misconduct
- IP infringement
- Data breach/confidentiality
- Gross negligence
- Criminal acts

Compromise Solutions:
- Tiered caps based on violation type
- Higher cap for critical issues
- Insurance as backstop
- Mutual indemnification
- Escrow for high-risk scenarios`
    };

    /**
     * Generate Pushback Response using AI with proper model support
     */
    window.generatePushbackWithAI = async function () {
        const state = window.pushbackState || {};

        // Build the system prompt
        const systemPrompt = buildSystemPrompt(state.responseType, state.negotiationTone);

        // Build the user prompt with all context
        const userPrompt = buildUserPrompt(state);

        // Select AI model - support both Gemini 3.0 Pro and Claude Sonnet 4.5
        const model = state.selectedModel || 'claude-sonnet-4';

        // Map model names to Puter.js model identifiers
        const modelMap = {
            'claude-sonnet-4': 'claude-sonnet',
            'claude-sonnet-4.5': 'claude-sonnet',
            'claude-3.5-sonnet': 'claude-sonnet',
            'gemini-3-pro-preview': 'gemini-3-pro-preview',
            'gemini-3-pro': 'gemini-3-pro-preview',
            'gpt-4o': 'gpt-4o',
            'gpt-5-nano': 'gpt-5-nano'
        };

        const puterModel = modelMap[model] || 'claude-sonnet';

        // Build messages array with system prompt integration
        let messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        // Call Puter AI with streaming
        let fullResponse = '';

        const aiOptions = {
            model: puterModel,
            stream: true,
            temperature: 0.7,
            max_tokens: 2500
        };

        try {
            // Show which model is being used
            console.log(`🤖 Generating pushback with ${model} (Puter: ${puterModel})`);

            const stream = await puter.ai.chat(messages, aiOptions);

            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;

                // Update UI in real-time if callback exists
                if (window.onPushbackStreamUpdate) {
                    window.onPushbackStreamUpdate(text);
                }
            }

            return fullResponse;

        } catch (error) {
            console.error('AI Generation Error:', error);
            throw new Error(`Failed to generate pushback response: ${error.message}`);
        }
    };

    /**
     * Build comprehensive system prompt
     */
    function buildSystemPrompt(responseType, tone) {
        let prompt = SYSTEM_PROMPTS.base + '\n\n';
        prompt += SYSTEM_PROMPTS.structure + '\n\n';
        prompt += SYSTEM_PROMPTS.formatting + '\n\n';

        // Add tone-specific guidelines
        if (SYSTEM_PROMPTS.toneGuidelines[tone]) {
            prompt += SYSTEM_PROMPTS.toneGuidelines[tone] + '\n\n';
        }

        // Add response-type specific guidance
        if (RESPONSE_TYPE_PROMPTS[responseType]) {
            prompt += RESPONSE_TYPE_PROMPTS[responseType] + '\n\n';
        }

        return prompt;
    }

    /**
     * Build user prompt with all context
     */
    function buildUserPrompt(state) {
        const formData = state.formData || {};

        let prompt = `
NEGOTIATION REQUEST:

Response Type: ${state.responseType}
Negotiation Tone: ${state.negotiationTone}
Vendor: ${formData.vendorName || '[VENDOR NAME]'}
Your Company: ${formData.companyName || '[YOUR COMPANY]'}

ISSUE DESCRIPTION:
${formData.issueDescription || 'No description provided'}

DESIRED OUTCOME:
${formData.desiredOutcome || 'Favorable resolution'}
`;

        // Add leverage points if any
        if (state.leveragePoints && state.leveragePoints.length > 0) {
            prompt += `\n\nYOUR LEVERAGE POINTS:\n`;
            const leverageDescriptions = {
                'alternatives': '- We have researched competitive alternatives at better prices',
                'volume': '- We are a high-volume customer with significant business',
                'loyalty': '- We have been a loyal, long-term customer',
                'referrals': '- We provide referrals and positive reviews',
                'contract-violation': '- There are existing contract violations on vendor side',
                'market-data': '- We have market rate data showing better pricing',
                'legal': '- We have strong legal standing on this issue',
                'public-relations': '- Public relations considerations favor our position',
                'growth': '- We have significant growth potential',
                'timing': '- Current timing/circumstances favor our position'
            };

            state.leveragePoints.forEach(point => {
                if (leverageDescriptions[point]) {
                    prompt += leverageDescriptions[point] + '\n';
                }
            });
        }

        // Add additional context if provided
        if (formData.additionalContext) {
            prompt += `\n\nADDITIONAL CONTEXT:\n${formData.additionalContext}\n`;
        }

        prompt += `\n\nTASK:
Write a professional business email/letter response that addresses this situation strategically. 
The response should be ready to send with minimal editing, approximately 400-600 words.
Include a strong subject line.
Use placeholders [YOUR NAME], [TITLE], [COMPANY] for personalization.
Output ONLY the email/letter content, no explanations or commentary.`;

        return prompt;
    }

    /**
     * Generate response with specific model (for comparison)
     */
    window.generatePushbackWithModel = async function (modelId) {
        const previousModel = window.pushbackState.selectedModel;
        window.pushbackState.selectedModel = modelId;

        try {
            const result = await window.generatePushbackWithAI();
            return result;
        } finally {
            window.pushbackState.selectedModel = previousModel;
        }
    };

    /**
     * Generate multiple versions with different tones
     */
    window.generateMultipleTones = async function () {
        const tones = ['diplomatic', 'firm', 'assertive', 'final-warning'];
        const results = {};

        for (const tone of tones) {
            const previousTone = window.pushbackState.negotiationTone;
            window.pushbackState.negotiationTone = tone;

            try {
                results[tone] = await window.generatePushbackWithAI();
            } catch (error) {
                results[tone] = `Error: ${error.message}`;
            }

            window.pushbackState.negotiationTone = previousTone;
        }

        return results;
    };

    /**
     * Calculate estimated savings based on negotiation
     */
    window.calculateNegotiationSavings = function (formData) {
        // Simple savings calculator for price increase scenarios
        if (formData.currentPrice && formData.proposedPrice) {
            const currentAnnual = parseFloat(formData.currentPrice) * 12;
            const proposedAnnual = parseFloat(formData.proposedPrice) * 12;
            const increase = proposedAnnual - currentAnnual;

            // Assume 50% success rate in reducing increase
            const estimatedSavings = increase * 0.5;

            return {
                currentAnnual,
                proposedAnnual,
                increaseAmount: increase,
                increasePercent: ((increase / currentAnnual) * 100).toFixed(1),
                estimatedSavings: estimatedSavings.toFixed(0)
            };
        }
        return null;
    };

    /**
     * Generate negotiation tips based on context
     */
    window.generateNegotiationTips = function (responseType, leveragePoints) {
        const tips = {
            'price-increase': [
                'Research competitor pricing before sending',
                'Have specific alternative quotes ready if asked',
                'Consider requesting a call to discuss in person',
                'Propose phased implementation if full rejection fails',
                'Document all communications in writing'
            ],
            'unfair-clause': [
                'Have an attorney review before finalizing',
                'Be prepared to walk away if terms don\'t improve',
                'Suggest mutual application of problematic clauses',
                'Reference specific industry standards',
                'Keep negotiations documented in writing'
            ],
            'sla-violation': [
                'Keep detailed logs of all incidents with timestamps',
                'Calculate exact financial impact if possible',
                'Request detailed root cause analysis',
                'Set specific performance improvement milestones',
                'Consider termination rights if violations persist'
            ],
            'termination': [
                'Maintain professional tone throughout',
                'Get all final terms in writing',
                'Document transition timeline clearly',
                'Address data/IP ownership explicitly',
                'Leave door open for future relationship if desired'
            ]
        };

        const generalTips = [
            'Send during business hours for faster response',
            'Follow up if no response within 5-7 business days',
            'Be prepared with supporting documentation',
            'Know your BATNA (Best Alternative To Negotiated Agreement)',
            'Consider scheduling a call for complex discussions'
        ];

        const responseTips = tips[responseType] || tips['price-increase'];

        // Add leverage-specific tips
        const leverageTips = [];
        if (leveragePoints.includes('alternatives')) {
            leverageTips.push('Mention specific competitor names if you have them');
        }
        if (leveragePoints.includes('volume')) {
            leverageTips.push('Quantify your business volume in the response');
        }
        if (leveragePoints.includes('legal')) {
            leverageTips.push('Have legal counsel review before threatening action');
        }

        return [...responseTips, ...leverageTips, ...generalTips];
    };

    console.log('✅ PushbackPro AI Engine loaded');
})();
