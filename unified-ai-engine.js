/**
 * Unified AI Response Generator Engine
 * Integrates Gemini 3.0 Pro and Claude Sonnet 4.5 via Puter.js
 * Supports both De-escalation (SafeResponse) and Scam Baiting modes
 */

class UnifiedAIEngine {
    constructor() {
        this.models = {
            gemini: 'gemini-3-pro-preview', // Default to Gemini 3.0 Pro
            claude: 'claude-sonnet-4',      // Sonnet 4.5
            flash: 'gemini-1.5-flash',      // Fallback
            gpt: 'gpt-4o-mini'
        };

        this.currentMode = 'deescalation'; // 'deescalation' or 'scambaiting'
        this.stats = {
            totalGenerated: 0,
            harassmentResponses: 0,
            scamBaitResponses: 0,
            timeWasted: 0
        };
    }

    /**
     * Initialize the engine and load user data
     */
    async initialize() {
        try {
            await this.loadStats();
            console.log('✓ Unified AI Engine initialized');
            return true;
        } catch (error) {
            console.error('Engine initialization error:', error);
            return false;
        }
    }

    /**
     * Set the current mode (deescalation or scambaiting)
     */
    setMode(mode) {
        if (mode !== 'deescalation' && mode !== 'scambaiting') {
            throw new Error('Invalid mode. Must be "deescalation" or "scambaiting"');
        }
        this.currentMode = mode;
        console.log(`Mode switched to: ${mode}`);
    }

    /**
     * Generate AI response based on current mode
     */
    async generateResponse(input, options = {}) {
        if (!input || input.trim().length === 0) {
            throw new Error('Input cannot be empty');
        }

        const config = {
            model: options.model || (this.currentMode === 'deescalation' ? this.models.claude : this.models.gemini),
            tone: options.tone || 'professional',
            style: options.style || 'standard',
            stream: options.stream !== false,
            platform: options.platform || 'general',
            ...options
        };

        try {
            if (this.currentMode === 'deescalation') {
                return await this.generateDeescalationResponse(input, config);
            } else {
                return await this.generateScamBaitResponse(input, config);
            }
        } catch (error) {
            console.error('Response generation error:', error);
            throw error;
        }
    }

    /**
     * Generate de-escalation response for online harassment
     */
    async generateDeescalationResponse(message, config) {
        // Analyze the harassment message first
        const analysis = await this.analyzeHarassment(message);

        // Build system prompt for de-escalation
        const systemPrompt = this.buildDeescalationPrompt(config.tone, analysis, config.platform);

        // Build user prompt
        const userPrompt = `I received this harassing message:

"${message}"

Analysis:
- Toxicity Level: ${analysis.toxicityLevel}
- Harassment Type: ${analysis.harassmentTypes.join(', ')}
- Risk Level: ${analysis.riskLevel}

Generate a de-escalating response that:
1. Sets clear boundaries without aggression
2. Remains calm and composed
3. Does NOT engage with the harassment content
4. Maintains my dignity

Character limit: ${config.charLimit || 500} characters for ${config.platform} platform.`;

        // Call AI with streaming
        const stream = await puter.ai.chat(userPrompt, {
            model: config.model,
            system: systemPrompt,
            stream: config.stream,
            max_tokens: 800
        });

        // Update stats
        this.stats.totalGenerated++;
        this.stats.harassmentResponses++;
        await this.saveStats();

        return {
            stream,
            analysis,
            mode: 'deescalation'
        };
    }

    /**
     * Generate scam baiting response
     */
    async generateScamBaitResponse(scamMessage, config) {
        // Build system prompt for scam baiting
        const systemPrompt = this.buildScamBaitPrompt(config.tone, config);

        // Build user prompt
        const userPrompt = `THE SCAM MESSAGE I RECEIVED:
"""
${scamMessage}
"""

Generate a response from the perspective of ${config.tone}. Make it entertaining, time-wasting, and keep the scammer engaged while being completely safe and legal.`;

        // Call AI with streaming
        const stream = await puter.ai.chat(userPrompt, {
            model: config.model,
            system: systemPrompt,
            stream: config.stream,
            max_tokens: 1000
        });

        // Calculate estimated time wasted
        const timeWasted = Math.ceil(Math.random() * 10) + 5; // 5-15 minutes

        // Update stats
        this.stats.totalGenerated++;
        this.stats.scamBaitResponses++;
        this.stats.timeWasted += timeWasted;
        await this.saveStats();

        return {
            stream,
            timeWasted,
            mode: 'scambaiting'
        };
    }

    /**
     * Analyze harassment message for toxicity and risk
     */
    async analyzeHarassment(message) {
        const analysis = {
            toxicityScore: 0,
            toxicityLevel: 'low',
            harassmentTypes: [],
            riskLevel: 'low',
            containsThreat: false,
            recommendedAction: 'respond'
        };

        const lowerMessage = message.toLowerCase();

        // Pattern detection for harassment types
        const patterns = {
            sexual: ['sexual', 'explicit', 'body', 'assault', 'rape', 'harass'],
            racial: ['race', 'racist', 'slur', 'ethnic', 'discrimination'],
            threats: ['kill', 'hurt', 'harm', 'attack', 'violence', 'die', 'destroy'],
            identity: ['gay', 'lesbian', 'trans', 'religion', 'muslim', 'jew', 'disability'],
            personal: ['ugly', 'stupid', 'worthless', 'loser', 'idiot', 'failure'],
            cyberbullying: ['shame', 'embarrass', 'expose', 'reveal', 'leak', 'post']
        };

        // Detect harassment types
        for (const [type, keywords] of Object.entries(patterns)) {
            for (const keyword of keywords) {
                if (lowerMessage.includes(keyword)) {
                    if (!analysis.harassmentTypes.includes(type)) {
                        analysis.harassmentTypes.push(type);
                    }
                    break;
                }
            }
        }

        if (analysis.harassmentTypes.length === 0) {
            analysis.harassmentTypes.push('general');
        }

        // Calculate toxicity score
        const toxicWords = ['hate', 'kill', 'die', 'stupid', 'idiot', 'loser', 'ugly', 'worthless', 'pathetic', 'disgusting'];
        let score = 0;

        toxicWords.forEach(word => {
            if (lowerMessage.includes(word)) score += 0.15;
        });

        // Check for all caps (shouting)
        const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
        if (capsRatio > 0.5) score += 0.1;

        // Check for excessive punctuation
        const exclamCount = (message.match(/!/g) || []).length;
        if (exclamCount > 3) score += 0.1;

        analysis.toxicityScore = Math.min(score, 1.0);

        // Determine levels
        if (analysis.toxicityScore >= 0.85) {
            analysis.toxicityLevel = 'high';
            analysis.riskLevel = 'high';
        } else if (analysis.toxicityScore >= 0.6) {
            analysis.toxicityLevel = 'medium';
            analysis.riskLevel = 'medium';
        } else {
            analysis.toxicityLevel = 'low';
            analysis.riskLevel = 'low';
        }

        // Check for threats
        const threatPatterns = [
            /kill\s+(you|yourself)/i,
            /gonna\s+hurt\s+you/i,
            /i'll\s+find\s+you/i,
            /you're\s+dead/i,
            /watch\s+your\s+back/i
        ];

        analysis.containsThreat = threatPatterns.some(pattern => pattern.test(message));

        if (analysis.containsThreat) {
            analysis.riskLevel = 'critical';
            analysis.recommendedAction = 'report_immediately';
        } else if (analysis.riskLevel === 'high') {
            analysis.recommendedAction = 'report_and_block';
        } else if (analysis.riskLevel === 'medium') {
            analysis.recommendedAction = 'respond_or_ignore';
        } else {
            analysis.recommendedAction = 'respond';
        }

        return analysis;
    }

    /**
     * Build system prompt for de-escalation
     */
    buildDeescalationPrompt(tone, analysis, platform) {
        const basePrompt = `You are a professional de-escalation assistant specialized in helping people respond to online harassment. Your role is to generate calm, boundary-setting responses that:

1. DO NOT escalate the situation
2. Set clear boundaries without being aggressive
3. Demonstrate emotional intelligence and self-control
4. Provide a model of appropriate communication
5. Can optionally redirect positively when appropriate

CRITICAL RULES:
- NEVER insult, attack, or demean the harasser
- NEVER use profanity or aggressive language
- NEVER make threats or violent statements
- ALWAYS maintain dignity and composure
- Focus on setting boundaries, not winning arguments

DE-ESCALATION TECHNIQUES:
• Active listening language: "I understand you're upset..."
• Validation without agreement: "I hear your concern..."
• Clear boundary setting: "This conversation isn't productive..."
• Emotional neutrality: Avoid reactive or defensive language
• Offer to disengage: "I'm going to step away from this..."`;

        const styleModifiers = {
            professional: "\n\nSTYLE: Professional, formal, business-appropriate. Use complete sentences and neutral tone.",
            firm: "\n\nSTYLE: Firm and direct. Be assertive without aggression. Clear boundaries.",
            empathetic: "\n\nSTYLE: Empathetic and understanding. Acknowledge emotions while maintaining boundaries.",
            humorous: "\n\nSTYLE: Light humor to defuse tension. Keep it tasteful and non-sarcastic.",
            minimal: "\n\nSTYLE: Brief and concise. 1-2 sentences maximum. Direct and clear."
        };

        const riskModifiers = {
            critical: "\n\nIMPORTANT: This message contains serious threats. Your response should prioritize safety. Keep it extremely brief and suggest the user report immediately.",
            high: "\n\nNOTE: This is high-severity harassment. Keep response brief and avoid engagement.",
            medium: "\n\nNOTE: This is moderate harassment. Balance firmness with de-escalation.",
            low: "\n\nNOTE: This is low-level negativity. You can be more conversational."
        };

        return basePrompt +
            (styleModifiers[tone] || styleModifiers.professional) +
            (riskModifiers[analysis.riskLevel] || '');
    }

    /**
     * Build system prompt for scam baiting
     */
    buildScamBaitPrompt(tone, config) {
        const toneConfigs = {
            elderly: {
                name: 'Confused Elderly',
                prompt: 'You are a confused elderly person (75 years old) responding to this scam. You are forgetful, hard of hearing in text form (misread things), ramble about unrelated topics like your grandchildren and pets, ask the same questions multiple times, and take forever to get to the point. Use phrases like "Dearie", "In my day...", "What was that again?", reference old technology confusion.'
            },
            enthusiastic: {
                name: 'Overly Enthusiastic',
                prompt: 'You are EXTREMELY enthusiastic person who is SO EXCITED about this opportunity!!! You use lots of exclamation marks!!!, ask dozens of questions, want to know EVERYTHING, express how this is the BEST thing that ever happened to you, and keep adding more questions and tangents.'
            },
            paranoid: {
                name: 'Paranoid Conspiracy Theorist',
                prompt: 'You are a paranoid conspiracy theorist responding to this scam. You are intrigued but VERY suspicious. You see hidden meanings in their message, ask if they are with "the government" or "the Illuminati", require them to prove they are not robots or aliens, ask for elaborate verification procedures.'
            },
            techilliterate: {
                name: 'Tech Illiterate',
                prompt: 'You are completely tech illiterate responding to this scam. You dont understand email, the internet, or modern banking. Ask them to explain every technical term. Confuse simple concepts. Ask if you need to print the email.'
            },
            bureaucrat: {
                name: 'Bureaucratic Nightmare',
                prompt: 'You are an extremely bureaucratic person who requires proper procedures for EVERYTHING. You need forms to be filled out, reference numbers, official letterheads, notarized documents, and proper channels. Create fictional form numbers and requirements.'
            }
        };

        const toneConfig = toneConfigs[tone] || toneConfigs.elderly;

        const lengthGuide = ['very brief (2-3 sentences)', 'short (1 paragraph)', 'medium (2-3 paragraphs)', 'long (4-5 paragraphs)'];
        const lengthIndex = Math.floor((config.length || 50) / 33);

        return `${toneConfig.prompt}

IMPORTANT SAFETY RULES - FOLLOW THESE EXACTLY:
1. NEVER include real threats or anything illegal
2. NEVER include real personal information
3. Generate ONLY fictional, obviously fake details
4. Keep it entertaining and time-wasting
5. The goal is to waste the scammer's time, not to actually engage

SETTINGS:
- Response Length: ${lengthGuide[lengthIndex]}
${config.fakeDetails ? '- Include fictional personal details (fake names, addresses, humorous "bank problems")' : ''}
${config.questions ? '- Include multiple questions to make them respond more' : ''}
${config.delayTactics ? '- Include reasons for delays (hospital visit, internet problems, bank closed, etc.)' : ''}

Write a response that makes it entertaining, time-wasting, and keeps the scammer engaged while being completely safe and legal.`;
    }

    /**
     * Save stats to Puter.js KV storage
     */
    async saveStats() {
        try {
            await puter.kv.set('unified_ai_stats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Stats save error:', error);
        }
    }

    /**
     * Load stats from Puter.js KV storage
     */
    async loadStats() {
        try {
            const data = await puter.kv.get('unified_ai_stats');
            if (data) {
                this.stats = JSON.parse(data);
            }
        } catch (error) {
            console.error('Stats load error:', error);
        }
    }

    /**
     * Get current statistics
     */
    getStats() {
        return { ...this.stats };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedAIEngine;
}
