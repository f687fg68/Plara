/**
 * ========================================
 * SAFERESPONSE AI ENGINE
 * ========================================
 * AI-powered de-escalation response generator for online harassment
 * Integrated with Gemini 3.0 Pro and Claude Sonnet 4.5
 */

(function() {
    'use strict';

    // ====================================
    // Configuration & Constants
    // ====================================

    const AI_MODELS = {
        'claude-sonnet-4.5': {
            puterModel: 'claude-sonnet',
            name: 'Claude Sonnet 4.5',
            bestFor: 'Most empathetic and emotionally intelligent responses',
            temperature: 0.7,
            maxTokens: 500
        },
        'gemini-3-pro': {
            puterModel: 'gemini-3-pro-preview',
            name: 'Gemini 3.0 Pro',
            bestFor: 'Comprehensive analysis with strategic de-escalation',
            temperature: 0.7,
            maxTokens: 500
        },
        'gpt-4o': {
            puterModel: 'gpt-4o',
            name: 'GPT-4o',
            bestFor: 'Fast, professional boundary-setting responses',
            temperature: 0.6,
            maxTokens: 400
        }
    };

    const HARASSMENT_PATTERNS = {
        sexual: ['sexual', 'explicit', 'body', 'assault', 'rape', 'harass', 'nudes', 'sexy', 'hot'],
        racial: ['race', 'racist', 'slur', 'ethnic', 'discrimination', 'color'],
        threats: ['kill', 'hurt', 'harm', 'attack', 'violence', 'die', 'destroy', 'find you', 'come after'],
        identity: ['gay', 'lesbian', 'trans', 'religion', 'muslim', 'jew', 'disability', 'fat', 'retard'],
        personal: ['ugly', 'stupid', 'worthless', 'loser', 'idiot', 'failure', 'pathetic', 'trash'],
        cyberbullying: ['shame', 'embarrass', 'expose', 'reveal', 'leak', 'post', 'everyone knows']
    };

    const TOXICITY_THRESHOLDS = {
        low: 0.3,
        medium: 0.6,
        high: 0.85
    };

    const PLATFORM_LIMITS = {
        twitter: 280,
        instagram: 2200,
        facebook: 8000,
        reddit: 10000,
        discord: 2000,
        email: 5000,
        general: 500
    };

    // ====================================
    // Message Analysis Functions
    // ====================================

    /**
     * Comprehensive harassment message analysis
     * @param {string} message - The harassing message to analyze
     * @returns {Promise<Object>} Analysis results with toxicity, risk, and recommendations
     */
    window.analyzeHarassmentMessage = async function(message) {
        const analysis = {
            toxicityScore: 0,
            toxicityLevel: 'low',
            harassmentTypes: [],
            riskLevel: 'low',
            containsThreat: false,
            recommendedAction: 'respond',
            sentiment: 'negative',
            urgency: 'low',
            keyPhrases: [],
            triggerWords: []
        };

        try {
            console.log('🔍 Analyzing harassment message...');

            // Step 1: Detect harassment types
            analysis.harassmentTypes = detectHarassmentTypes(message);
            console.log('✓ Harassment types detected:', analysis.harassmentTypes);

            // Step 2: Calculate toxicity score
            analysis.toxicityScore = calculateToxicityScore(message);
            console.log('✓ Toxicity score:', (analysis.toxicityScore * 100).toFixed(1) + '%');

            // Step 3: Determine toxicity level
            if (analysis.toxicityScore >= TOXICITY_THRESHOLDS.high) {
                analysis.toxicityLevel = 'high';
                analysis.riskLevel = 'high';
                analysis.urgency = 'high';
            } else if (analysis.toxicityScore >= TOXICITY_THRESHOLDS.medium) {
                analysis.toxicityLevel = 'medium';
                analysis.riskLevel = 'medium';
                analysis.urgency = 'medium';
            } else {
                analysis.toxicityLevel = 'low';
                analysis.riskLevel = 'low';
                analysis.urgency = 'low';
            }

            // Step 4: Check for direct threats
            analysis.containsThreat = detectThreats(message);
            if (analysis.containsThreat) {
                analysis.riskLevel = 'critical';
                analysis.urgency = 'critical';
                analysis.recommendedAction = 'report_immediately';
            }

            // Step 5: Extract key problematic phrases
            analysis.triggerWords = extractTriggerWords(message);
            
            // Step 6: Determine recommended action
            analysis.recommendedAction = determineRecommendedAction(analysis);

            console.log('✅ Analysis complete:', analysis.riskLevel, 'risk');
            return analysis;

        } catch (error) {
            console.error('❌ Analysis error:', error);
            // Return safe defaults
            return analysis;
        }
    };

    /**
     * Detect types of harassment present in message
     */
    function detectHarassmentTypes(message) {
        const lowerMessage = message.toLowerCase();
        const detected = new Set();

        for (const [type, keywords] of Object.entries(HARASSMENT_PATTERNS)) {
            for (const keyword of keywords) {
                if (lowerMessage.includes(keyword)) {
                    detected.add(type);
                    break;
                }
            }
        }

        return detected.size > 0 ? Array.from(detected) : ['general'];
    }

    /**
     * Calculate toxicity score (0-1 scale) using heuristics
     */
    function calculateToxicityScore(message) {
        const lowerMessage = message.toLowerCase();
        let score = 0;

        // Profanity and toxic words (weighted heavily)
        const toxicWords = [
            'hate', 'kill', 'die', 'stupid', 'idiot', 'loser', 'ugly',
            'worthless', 'pathetic', 'disgusting', 'trash', 'scum', 'bitch',
            'whore', 'slut', 'fag', 'retard', 'cunt', 'fuck'
        ];

        for (const word of toxicWords) {
            if (lowerMessage.includes(word)) {
                score += 0.15;
            }
        }

        // All caps (shouting indicator)
        const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
        if (capsRatio > 0.5 && message.length > 10) {
            score += 0.1;
        }

        // Excessive punctuation (aggression indicator)
        const exclamCount = (message.match(/!/g) || []).length;
        if (exclamCount > 3) {
            score += 0.1;
        }

        // Personal attack patterns
        const personalAttackPatterns = [
            /you\s+(are|'re)\s+(a|an|so|such|the)/i,
            /nobody\s+(likes|wants|cares)/i,
            /everyone\s+(hates|knows|thinks)/i,
            /you\s+should\s+(die|kill|hurt)/i
        ];

        for (const pattern of personalAttackPatterns) {
            if (pattern.test(message)) {
                score += 0.2;
            }
        }

        // Dehumanizing language
        const dehumanizingWords = ['thing', 'it', 'creature', 'animal', 'subhuman'];
        for (const word of dehumanizingWords) {
            if (lowerMessage.includes(word)) {
                score += 0.15;
            }
        }

        return Math.min(score, 1.0);
    }

    /**
     * Detect direct threats in message
     */
    function detectThreats(message) {
        const threatPatterns = [
            /kill\s+(you|yourself|ur)/i,
            /gonna\s+(hurt|harm|get)\s+you/i,
            /i'll\s+(find|hurt|get|kill)\s+you/i,
            /you're\s+(dead|gonna\s+die)/i,
            /watch\s+your\s+back/i,
            /come\s+(after|for)\s+you/i,
            /i\s+know\s+where\s+you/i,
            /see\s+you\s+(soon|irl|in\s+person)/i
        ];

        return threatPatterns.some(pattern => pattern.test(message));
    }

    /**
     * Extract specific trigger words for context
     */
    function extractTriggerWords(message) {
        const words = message.toLowerCase().split(/\s+/);
        const triggers = [];

        const allToxicWords = [
            ...HARASSMENT_PATTERNS.sexual,
            ...HARASSMENT_PATTERNS.racial,
            ...HARASSMENT_PATTERNS.threats,
            ...HARASSMENT_PATTERNS.identity,
            ...HARASSMENT_PATTERNS.personal,
            ...HARASSMENT_PATTERNS.cyberbullying
        ];

        for (const word of words) {
            if (allToxicWords.includes(word) && !triggers.includes(word)) {
                triggers.push(word);
            }
        }

        return triggers.slice(0, 5); // Top 5 triggers
    }

    /**
     * Determine recommended action based on analysis
     */
    function determineRecommendedAction(analysis) {
        if (analysis.riskLevel === 'critical') {
            return 'report_immediately';
        } else if (analysis.riskLevel === 'high') {
            return 'report_and_block';
        } else if (analysis.riskLevel === 'medium') {
            return 'respond_or_ignore';
        } else {
            return 'respond';
        }
    }

    // ====================================
    // De-escalation Response Generation
    // ====================================

    /**
     * Generate AI-powered de-escalation response
     * @param {Object} params - Generation parameters
     * @returns {Promise<Object>} Generated response with alternatives
     */
    window.generateDeescalationResponse = async function(params) {
        const {
            message,
            analysis,
            style = 'professional',
            platform = 'general',
            selectedModel = 'claude-sonnet-4.5'
        } = params;

        const modelConfig = AI_MODELS[selectedModel];
        const puterModel = modelConfig.puterModel;
        const charLimit = PLATFORM_LIMITS[platform];

        // Build comprehensive system prompt
        const systemPrompt = buildDeescalationSystemPrompt(style, analysis, platform, charLimit);

        // Build user prompt with context
        const userPrompt = buildDeescalationUserPrompt(message, analysis);

        try {
            console.log(`🤖 Generating de-escalation response with ${modelConfig.name}...`);

            let fullResponse = '';

            // Call Puter AI with streaming support
            if (window.onSafeResponseStreamUpdate) {
                const stream = await puter.ai.chat(userPrompt, {
                    model: puterModel,
                    system: systemPrompt,
                    temperature: modelConfig.temperature,
                    max_tokens: modelConfig.maxTokens,
                    stream: true
                });

                for await (const chunk of stream) {
                    const text = chunk?.text || '';
                    fullResponse += text;
                    window.onSafeResponseStreamUpdate(text);
                }
            } else {
                const response = await puter.ai.chat(userPrompt, {
                    model: puterModel,
                    system: systemPrompt,
                    temperature: modelConfig.temperature,
                    max_tokens: modelConfig.maxTokens,
                    stream: false
                });

                if (typeof response === 'object' && response.message) {
                    fullResponse = response.message.content || response.message;
                } else {
                    fullResponse = response;
                }
            }

            console.log('✅ De-escalation response generated');

            // Generate alternative approaches
            const alternatives = await generateAlternatives(message, analysis, style, selectedModel);

            return {
                main: fullResponse.trim(),
                alternatives: alternatives,
                model: selectedModel,
                style: style,
                characterCount: fullResponse.trim().length,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Response generation failed:', error);
            
            // Fallback to template-based response
            return generateTemplateResponse(analysis, style, charLimit);
        }
    };

    /**
     * Build comprehensive system prompt for de-escalation
     */
    function buildDeescalationSystemPrompt(style, analysis, platform, charLimit) {
        const basePrompt = `You are SafeResponse, a professional de-escalation assistant specialized in helping people respond to online harassment with dignity and composure.

YOUR MISSION:
Generate calm, boundary-setting responses that de-escalate conflict without escalating harm.

CORE PRINCIPLES:
1. NEVER insult, attack, or demean the harasser
2. NEVER use profanity or aggressive language
3. NEVER make threats or violent statements
4. ALWAYS maintain dignity and composure
5. Focus on setting boundaries, not winning arguments

DE-ESCALATION TECHNIQUES YOU MUST USE:
• Active Listening Language: "I understand you feel strongly..."
• Validation Without Agreement: "I hear your concern, but..."
• Clear Boundary Setting: "This type of communication isn't acceptable"
• Emotional Neutrality: Avoid reactive or defensive phrasing
• Offer to Disengage: "I'm choosing to step away from this conversation"
• Dignity Preservation: Focus on YOUR dignity, not the harasser's behavior`;

        const styleModifiers = {
            professional: `\n\nSTYLE: Professional and formal. Use complete sentences, business-appropriate tone. Example: "I appreciate your reaching out, however, this communication style doesn't align with productive dialogue."`,
            
            firm: `\n\nSTYLE: Firm and direct without aggression. Clear boundaries with authority. Example: "This behavior is unacceptable. I will not engage with messages of this nature."`,
            
            empathetic: `\n\nSTYLE: Empathetic and understanding while maintaining boundaries. Acknowledge emotions without accepting abuse. Example: "I sense you're upset, and I'm open to respectful conversation. This approach, however, isn't working."`,
            
            humorous: `\n\nSTYLE: Light, tasteful humor to defuse tension. NEVER sarcastic or mocking. Example: "I appreciate the passion, but let's try this conversation again when we're both feeling more zen."`,
            
            minimal: `\n\nSTYLE: Brief and concise. 1-2 sentences maximum. Direct and clear. Example: "Not engaging with this. Reach out if you'd like a respectful conversation."`
        };

        const riskModifiers = {
            critical: `\n\n⚠️ CRITICAL SAFETY NOTICE: This message contains serious threats. Your response MUST:
- Be EXTREMELY brief (1 sentence max)
- Clearly state non-engagement
- Suggest reporting to authorities
- Prioritize user safety above all
Example: "This is threatening and unacceptable. I'm documenting this and reporting it."`,
            
            high: `\n\n⚠️ HIGH SEVERITY: This is serious harassment. Keep response brief and avoid detailed engagement. Focus purely on boundary-setting.`,
            
            medium: `\n\nNOTE: Moderate harassment. Balance firmness with de-escalation. Set clear boundaries while leaving door open for respectful dialogue.`,
            
            low: `\n\nNOTE: Low-level negativity. You can be more conversational and potentially redirect positively.`
        };

        const platformConstraint = `\n\nIMPORTANT CONSTRAINT: Maximum ${charLimit} characters for ${platform} platform. Stay well under this limit.`;

        return basePrompt 
            + styleModifiers[style]
            + riskModifiers[analysis.riskLevel]
            + platformConstraint;
    }

    /**
     * Build user prompt with context
     */
    function buildDeescalationUserPrompt(message, analysis) {
        return `I received this harassing message online:

"${message}"

ANALYSIS:
- Toxicity Level: ${analysis.toxicityLevel} (${(analysis.toxicityScore * 100).toFixed(0)}%)
- Harassment Types: ${analysis.harassmentTypes.join(', ')}
- Risk Level: ${analysis.riskLevel}
- Contains Threats: ${analysis.containsThreat ? 'YES' : 'No'}
- Recommended Action: ${analysis.recommendedAction}

Generate a de-escalating response that:
1. Sets a clear boundary without being aggressive
2. Maintains MY dignity (not the harasser's)
3. Does NOT engage with the harassment content
4. Uses appropriate de-escalation techniques
5. Stays calm and composed

De-escalation Response:`;
    }

    /**
     * Generate alternative response approaches
     */
    async function generateAlternatives(message, analysis, style, model) {
        // Generate 2 quick alternatives with different tones
        const alternativeStyles = {
            professional: ['firm', 'empathetic'],
            firm: ['professional', 'minimal'],
            empathetic: ['professional', 'firm'],
            humorous: ['professional', 'empathetic'],
            minimal: ['firm', 'professional']
        };

        const alts = alternativeStyles[style] || ['professional', 'firm'];
        const alternatives = [];

        try {
            for (const altStyle of alts.slice(0, 2)) {
                const altSystemPrompt = buildDeescalationSystemPrompt(altStyle, analysis, 'general', 500);
                const altUserPrompt = `Generate a brief de-escalation response (under 100 words) for: "${message.substring(0, 100)}..."`;

                const response = await puter.ai.chat(altUserPrompt, {
                    model: AI_MODELS[model].puterModel,
                    system: altSystemPrompt,
                    temperature: 0.8,
                    max_tokens: 150,
                    stream: false
                });

                const text = typeof response === 'object' ? (response.message?.content || response.message) : response;
                alternatives.push({
                    style: altStyle,
                    text: text.trim()
                });
            }
        } catch (error) {
            console.warn('Alternative generation failed:', error);
        }

        return alternatives;
    }

    /**
     * Fallback template-based responses
     */
    function generateTemplateResponse(analysis, style, charLimit) {
        const templates = {
            professional: {
                low: "I've noted your message. I prefer to keep conversations respectful and productive. If you have constructive feedback, I'm happy to discuss it professionally.",
                medium: "This type of communication isn't constructive. I'm not engaging with hostile messages. Please reach out if you'd like to have a respectful conversation.",
                high: "I don't engage with abusive messages. This conversation is over.",
                critical: "This is threatening and unacceptable. I'm documenting this and reporting it to the appropriate authorities."
            },
            firm: {
                low: "Not interested in this kind of interaction. Move on.",
                medium: "This is harassment. Stop contacting me.",
                high: "You're blocked. This is being reported.",
                critical: "This is a direct threat. Reported to law enforcement."
            },
            empathetic: {
                low: "I sense you're upset. I'm open to constructive conversation, but this approach isn't working for either of us.",
                medium: "I understand you may be frustrated, but this type of message isn't okay. I'm choosing not to engage further.",
                high: "Whatever you're going through, this isn't the way to handle it. I'm stepping back from this conversation.",
                critical: "This has crossed into threatening territory. I'm taking this seriously and reporting it."
            },
            humorous: {
                low: "I appreciate the passion, but let's try this conversation again when we're both feeling more zen.",
                medium: "This energy could power a small city. Maybe redirect it to something more productive?",
                high: "I'm gonna pass on this interaction. Take care.",
                critical: "This isn't funny. This is serious and I'm reporting it."
            },
            minimal: {
                low: "Not engaging with this.",
                medium: "This isn't acceptable. Done.",
                high: "Blocked and reported.",
                critical: "Threat reported."
            }
        };

        const responseText = templates[style]?.[analysis.riskLevel] || templates.professional[analysis.riskLevel];
        
        // Truncate if over limit
        const finalText = responseText.length > charLimit 
            ? responseText.substring(0, charLimit - 3) + '...'
            : responseText;

        return {
            main: finalText,
            alternatives: [],
            model: 'template',
            style: style,
            characterCount: finalText.length,
            generatedAt: new Date().toISOString(),
            fallback: true
        };
    }

    // ====================================
    // Reporting Guidance Generator
    // ====================================

    /**
     * Generate platform-specific reporting guidance
     */
    window.generateReportingGuidance = function(analysis, platform) {
        const guidance = {
            shouldReport: analysis.riskLevel !== 'low',
            urgency: analysis.riskLevel === 'critical' ? 'immediate' : 'recommended',
            steps: [],
            resources: [],
            legalOptions: []
        };

        // Platform-specific reporting steps
        const platformSteps = {
            twitter: [
                "1. Click the ⋯ icon on the tweet or message",
                "2. Select 'Report Tweet' or 'Report Message'",
                "3. Choose 'Abusive or harmful'",
                "4. Select specific violation (harassment, threats, etc.)",
                "5. Provide additional context if prompted",
                "6. Submit the report"
            ],
            instagram: [
                "1. Tap ⋯ above the post, comment, or in the message thread",
                "2. Select 'Report'",
                "3. Choose 'Bullying or harassment'",
                "4. Select specific type of harassment",
                "5. Follow the reporting flow",
                "6. Block the account after reporting"
            ],
            facebook: [
                "1. Click ⋯ on the post, comment, or message",
                "2. Select 'Find support or report'",
                "3. Choose appropriate category (harassment, hate speech, threats)",
                "4. Provide details about the violation",
                "5. Submit the report",
                "6. Consider blocking the person"
            ],
            reddit: [
                "1. Click 'Report' under the comment or post",
                "2. Select 'Harassment'",
                "3. Choose specific violation type",
                "4. Provide additional context",
                "5. Submit report",
                "6. Block user and consider messaging moderators"
            ],
            discord: [
                "1. Right-click the message (desktop) or long-press (mobile)",
                "2. Select 'Report'",
                "3. Choose violation type (harassment, threats, etc.)",
                "4. Provide details and evidence",
                "5. Submit to Discord Trust & Safety",
                "6. Block user and leave server if needed"
            ],
            email: [
                "1. Do NOT delete the email (keep as evidence)",
                "2. Forward to abuse@[email-provider-domain]",
                "3. File report with your email provider",
                "4. If threats present, forward to local authorities",
                "5. Block sender's email address",
                "6. Consider changing email if harassment continues"
            ]
        };

        guidance.steps = platformSteps[platform] || [
            "1. Take screenshots with timestamps visible",
            "2. Use the platform's built-in reporting feature",
            "3. Block the harasser immediately",
            "4. Document all incidents with dates/times",
            "5. Report to platform moderators/support",
            "6. If threats are present, contact local authorities"
        ];

        // Add critical threat guidance
        if (analysis.containsThreat) {
            guidance.steps.unshift("⚠️ URGENT: This contains credible threats. Contact law enforcement IMMEDIATELY.");
            guidance.legalOptions.push("Contact local police non-emergency line to file report");
            guidance.legalOptions.push("File online report with FBI IC3: https://www.ic3.gov");
            guidance.legalOptions.push("Document everything: screenshots, timestamps, context");
        }

        // Universal resources
        guidance.resources = [
            {
                name: "Cyber Civil Rights Initiative",
                url: "https://cybercivilrights.org",
                description: "Support for victims of non-consensual intimate images and online abuse"
            },
            {
                name: "Online Hate and Harassment Hotline",
                url: "https://onlineharassmenthotline.org",
                description: "Free, confidential support for online harassment victims"
            },
            {
                name: "National Suicide Prevention Lifeline",
                url: "https://988lifeline.org",
                phone: "988",
                description: "24/7 crisis support if harassment is affecting your mental health"
            }
        ];

        if (analysis.harassmentTypes.includes('sexual')) {
            guidance.resources.push({
                name: "RAINN (Rape, Abuse & Incest National Network)",
                url: "https://www.rainn.org",
                phone: "1-800-656-4673",
                description: "Support for sexual harassment and assault victims"
            });
        }

        if (analysis.harassmentTypes.includes('identity') || analysis.harassmentTypes.includes('racial')) {
            guidance.resources.push({
                name: "Anti-Defamation League",
                url: "https://www.adl.org/online-harassment",
                description: "Resources for identity-based harassment and hate speech"
            });
        }

        return guidance;
    };

    // ====================================
    // Utility Functions
    // ====================================

    /**
     * Get all available AI models
     */
    window.getSafeResponseModels = function() {
        return Object.keys(AI_MODELS).map(key => ({
            id: key,
            ...AI_MODELS[key]
        }));
    };

    /**
     * Get recommended model for use case
     */
    window.getRecommendedSafeResponseModel = function(analysis) {
        if (analysis.riskLevel === 'critical' || analysis.riskLevel === 'high') {
            return 'claude-sonnet-4.5'; // Most empathetic for serious cases
        } else if (analysis.toxicityLevel === 'medium') {
            return 'gemini-3-pro'; // Comprehensive analysis
        } else {
            return 'gpt-4o'; // Fast for low-risk cases
        }
    };

    console.log('✅ SafeResponse AI Engine loaded - Gemini 3.0 Pro & Claude Sonnet 4.5 ready');

})();
