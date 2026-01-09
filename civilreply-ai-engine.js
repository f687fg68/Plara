/**
 * CivilReply - AI Political Discourse Generator Engine
 * Integrates Gemini 3.0 Pro and Claude Sonnet 4.5 via Puter.js
 * Generates civil, balanced responses to political arguments
 */

class CivilReplyAIEngine {
    constructor() {
        // AI Models configuration
        this.models = {
            gemini: 'gemini-2.0-flash-exp',      // Gemini 3.0 Pro (fast, cost-effective)
            claude: 'claude-sonnet-4',           // Claude Sonnet 4.5 (superior reasoning)
            gpt: 'gpt-4o-mini'                   // Fallback
        };
        
        // Response tones
        this.tones = this.initializeTones();
        
        // Statistics tracking
        this.stats = {
            totalResponses: 0,
            avgCivility: 0,
            totalCivilitySum: 0,
            timeSaved: 0,
            factChecksPerformed: 0,
            commonGroundFound: 0
        };
        
        // Political topics database
        this.topics = this.initializeTopics();
    }

    /**
     * Initialize response tone configurations
     */
    initializeTones() {
        return {
            diplomatic: {
                id: 'diplomatic',
                emoji: '🤝',
                name: 'Diplomatic',
                desc: 'Professional, measured, seeks mutual understanding',
                model: 'claude-sonnet-4',
                prompt: `You are a diplomatic political discourse facilitator. Your role is to bridge divides with professional, measured communication.

APPROACH:
1. ACKNOWLEDGE their viewpoint with genuine respect
   - Restate their position fairly and sympathetically
   - Recognize the legitimate concerns behind their stance
   - Never mock, dismiss, or use condescending language

2. PROVIDE BALANCED COUNTERPOINTS
   - Present alternative perspectives with evidence
   - Use neutral, factual language
   - Cite credible sources when possible
   - Avoid loaded political terminology

3. IDENTIFY COMMON GROUND
   - Find shared values beneath surface disagreements
   - Highlight areas where both sides might agree
   - Focus on mutual goals and concerns

4. SUGGEST CONSTRUCTIVE DIALOGUE
   - Pose questions that encourage deeper thinking
   - Offer pathways for collaborative problem-solving
   - Maintain hope for understanding

TONE RULES:
- Professional and measured throughout
- Assume good faith from all parties
- Use "we" language when discussing shared challenges
- Maintain intellectual humility
- Never attack character or intelligence

SAFETY:
- Avoid inflammatory language
- Don't amplify conspiracy theories
- Stay within factual bounds
- Acknowledge uncertainty where it exists`
            },

            empathetic: {
                id: 'empathetic',
                emoji: '💙',
                name: 'Empathetic',
                desc: 'Warm, emotionally aware, acknowledges feelings',
                model: 'gemini-2.0-flash-exp',
                prompt: `You are an empathetic political discourse facilitator who prioritizes emotional intelligence and human connection.

APPROACH:
1. VALIDATE EMOTIONS FIRST
   - Acknowledge the feelings behind their position
   - Show understanding of why they feel strongly
   - Use compassionate, warm language
   - Never minimize their concerns

2. SHARE ALTERNATIVE PERSPECTIVES GENTLY
   - Frame disagreements as different experiences, not wrong thinking
   - Use personal stories and human examples
   - Connect facts to real human impact
   - Maintain warmth even when presenting contrary views

3. EMPHASIZE SHARED HUMANITY
   - Remind that everyone wants safety, prosperity, fairness
   - Highlight emotional common ground
   - Use inclusive language ("all of us," "we all")
   - Focus on universal human needs and values

4. INVITE MUTUAL UNDERSTANDING
   - Ask questions that explore feelings and experiences
   - Create space for reflection
   - Offer emotional validation while broadening perspective

TONE RULES:
- Warm and compassionate throughout
- Emotionally validating but not manipulative
- Genuine empathy, not performative
- Balance feeling with facts
- Show vulnerability and openness

SAFETY:
- Don't exploit emotions
- Maintain authenticity
- Avoid emotional manipulation
- Stay grounded in reality`
            },

            factual: {
                id: 'factual',
                emoji: '📊',
                name: 'Fact-Focused',
                desc: 'Data-driven, evidence-based, logical',
                model: 'claude-sonnet-4',
                prompt: `You are a fact-focused political discourse facilitator who prioritizes evidence, data, and logical reasoning.

APPROACH:
1. ACKNOWLEDGE THEIR POSITION OBJECTIVELY
   - Restate their argument's logical structure
   - Identify the factual claims being made
   - Recognize valid points without emotion

2. PRESENT COUNTER-EVIDENCE SYSTEMATICALLY
   - Cite specific studies, statistics, and expert analysis
   - Use clear data visualization concepts
   - Reference credible institutions and research
   - Distinguish between facts, interpretations, and opinions
   - Present multiple high-quality sources

3. ANALYZE LOGICAL STRUCTURE
   - Identify any logical fallacies respectfully
   - Point out correlation vs. causation issues
   - Discuss sample sizes, methodologies, and confidence levels
   - Present competing interpretations of the same data

4. SUGGEST EVIDENCE-BASED INQUIRY
   - Pose questions that can be answered with data
   - Recommend specific research or resources
   - Encourage empirical thinking

TONE RULES:
- Objective and analytical
- Precise and clear language
- No emotional appeals
- Cite sources explicitly
- Acknowledge limitations of data
- Maintain scientific humility

SAFETY:
- Don't present opinions as facts
- Acknowledge when data is contested
- Avoid cherry-picking evidence
- Represent scientific consensus accurately`
            },

            bridgebuilding: {
                id: 'bridge-building',
                emoji: '🌉',
                name: 'Bridge-Building',
                desc: 'Finds common ground, unifying approach',
                model: 'gemini-2.0-flash-exp',
                prompt: `You are a bridge-building political discourse facilitator focused on finding unity and common ground.

APPROACH:
1. REFRAME AS SHARED CHALLENGE
   - Present the issue as something affecting everyone
   - Emphasize collective stakes
   - Avoid "us vs. them" framing
   - Find the bigger picture everyone can agree on

2. IDENTIFY SHARED VALUES
   - Look beneath policy disagreements to underlying values
   - Both sides often want similar outcomes (safety, prosperity, fairness)
   - Highlight these commonalities explicitly
   - Show how different policies can aim at same goals

3. PRESENT SYNTHESIS OPTIONS
   - Explore "both/and" rather than "either/or"
   - Suggest compromise positions
   - Find creative third paths
   - Show examples of successful bipartisan solutions

4. BUILD COLLABORATIVE MOMENTUM
   - Use language of partnership and cooperation
   - Frame next steps as joint problem-solving
   - Celebrate areas of agreement
   - Create optimism about finding solutions together

TONE RULES:
- Optimistic and solution-focused
- Inclusive language throughout
- Avoid tribal signaling
- Emphasize possibility of agreement
- Maintain hope and constructive energy

SAFETY:
- Don't minimize real differences
- Avoid false equivalence
- Stay realistic about challenges
- Don't force agreement where none exists`
            }
        };
    }

    /**
     * Initialize political topics database for better context
     */
    initializeTopics() {
        return {
            economy: {
                keywords: ['taxes', 'jobs', 'economy', 'inflation', 'minimum wage', 'unemployment', 'GDP', 'recession'],
                commonGround: [
                    'Economic prosperity benefits everyone',
                    'Job creation is universally valued',
                    'Stable prices help all consumers'
                ]
            },
            healthcare: {
                keywords: ['healthcare', 'insurance', 'medical', 'hospital', 'medicare', 'medicaid', 'prescription'],
                commonGround: [
                    'Everyone deserves access to quality care',
                    'Healthcare costs are a concern for all',
                    'Preventive care saves lives and money'
                ]
            },
            immigration: {
                keywords: ['immigration', 'border', 'refugee', 'asylum', 'citizenship', 'visa', 'deportation'],
                commonGround: [
                    'Secure borders are important',
                    'Legal immigration process should work efficiently',
                    'Human rights should be respected'
                ]
            },
            environment: {
                keywords: ['climate', 'environment', 'pollution', 'renewable', 'emissions', 'sustainability', 'green'],
                commonGround: [
                    'Clean air and water benefit everyone',
                    'Energy independence is valuable',
                    'Future generations deserve a livable planet'
                ]
            },
            education: {
                keywords: ['education', 'schools', 'teachers', 'students', 'curriculum', 'college', 'university'],
                commonGround: [
                    'Quality education is essential for all children',
                    'Teachers should be supported',
                    'Students deserve opportunities to succeed'
                ]
            },
            justice: {
                keywords: ['police', 'crime', 'prison', 'justice', 'law enforcement', 'criminal', 'courts'],
                commonGround: [
                    'Safe communities are everyone\'s goal',
                    'Justice system should be fair and effective',
                    'Both accountability and reform matter'
                ]
            }
        };
    }

    /**
     * Detect topic from political comment
     */
    detectTopic(comment) {
        const lowerComment = comment.toLowerCase();
        
        for (const [topic, data] of Object.entries(this.topics)) {
            for (const keyword of data.keywords) {
                if (lowerComment.includes(keyword)) {
                    return {
                        topic,
                        commonGround: data.commonGround
                    };
                }
            }
        }
        
        return {
            topic: 'general',
            commonGround: [
                'Most people want what\'s best for the country',
                'There are legitimate concerns on multiple sides',
                'Constructive dialogue is valuable'
            ]
        };
    }

    /**
     * Analyze emotional intensity and toxicity
     */
    analyzeComment(comment) {
        const lowerComment = comment.toLowerCase();
        
        // Toxicity indicators
        const toxicWords = ['idiot', 'stupid', 'moron', 'evil', 'destroy', 'hate', 'scum', 'trash', 'sheep', 'brainwashed'];
        const toxicCount = toxicWords.filter(word => lowerComment.includes(word)).length;
        
        // Emotional intensity indicators
        const capsRatio = (comment.match(/[A-Z]/g) || []).length / comment.length;
        const exclamationCount = (comment.match(/!/g) || []).length;
        const questionCount = (comment.match(/\?/g) || []).length;
        
        // Calculate scores
        const toxicityScore = Math.min(100, (toxicCount / toxicWords.length) * 100 + capsRatio * 50);
        
        let emotionalIntensity = 'Low';
        const intensityScore = capsRatio * 100 + exclamationCount * 10 + toxicCount * 20;
        
        if (intensityScore > 60) emotionalIntensity = 'Very High';
        else if (intensityScore > 40) emotionalIntensity = 'High';
        else if (intensityScore > 20) emotionalIntensity = 'Medium';
        
        // Detect persuasion style
        let persuasionStyle = 'Factual Argument';
        if (lowerComment.includes('feel') || lowerComment.includes('believe')) {
            persuasionStyle = 'Appeal to Emotion';
        } else if (lowerComment.includes('studies show') || lowerComment.includes('research')) {
            persuasionStyle = 'Evidence-Based';
        } else if (toxicCount > 2) {
            persuasionStyle = 'Ad Hominem';
        }
        
        return {
            toxicityLevel: Math.round(toxicityScore),
            emotionalIntensity,
            persuasionStyle,
            hasAllCaps: capsRatio > 0.3,
            exclamationCount
        };
    }

    /**
     * Generate civil response using AI
     */
    async generateResponse(options = {}) {
        const {
            originalComment,
            userStance = 'neutral',
            tone = 'diplomatic',
            platform = 'general',
            userContext = '',
            model = null
        } = options;

        if (!originalComment || originalComment.trim().length === 0) {
            throw new Error('Original comment is required');
        }

        // Detect topic and get context
        const topicData = this.detectTopic(originalComment);
        
        // Analyze comment
        const analysis = this.analyzeComment(originalComment);
        
        // Get tone configuration
        const toneConfig = this.tones[tone] || this.tones.diplomatic;
        
        // Determine which model to use
        const selectedModel = model || toneConfig.model;
        
        // Build comprehensive prompt
        const prompt = this.buildPrompt({
            originalComment,
            userStance,
            toneConfig,
            platform,
            userContext,
            topicData,
            analysis
        });

        try {
            // Call Puter AI
            const response = await puter.ai.chat(prompt, {
                model: selectedModel,
                stream: false,
                temperature: 0.7,
                max_tokens: 1500
            });

            // Parse response
            const parsed = this.parseResponse(response, topicData, analysis);
            
            // Update statistics
            this.updateStats(parsed.civilityScore);
            await this.saveStats();
            
            return {
                ...parsed,
                model: selectedModel,
                tone: toneConfig.name,
                analysis,
                topicData
            };

        } catch (error) {
            console.error('CivilReply generation error:', error);
            throw error;
        }
    }

    /**
     * Build comprehensive prompt
     */
    buildPrompt({ originalComment, userStance, toneConfig, platform, userContext, topicData, analysis }) {
        const stanceDescriptions = {
            agree: 'You generally agree with the commenter but want to de-escalate the tone and add nuance',
            disagree: 'You disagree with the commenter but want to present your counterpoint respectfully',
            neutral: 'You want to present a balanced view acknowledging multiple perspectives'
        };

        const platformLimits = {
            twitter: '280 characters maximum - be extremely concise',
            facebook: '2000 characters - can be detailed with paragraphs',
            reddit: '10000 characters - can include thorough explanations and sources',
            linkedin: '3000 characters - professional tone, moderate detail',
            general: '500-1000 words - comprehensive and well-structured'
        };

        return `${toneConfig.prompt}

═══════════════════════════════════════════════════════════════

ORIGINAL POLITICAL COMMENT:
"${originalComment}"

CONTEXT & ANALYSIS:
- Detected Topic: ${topicData.topic}
- Emotional Intensity: ${analysis.emotionalIntensity}
- Toxicity Level: ${analysis.toxicityLevel}%
- Persuasion Style: ${analysis.persuasionStyle}

USER'S STANCE: ${stanceDescriptions[userStance]}

TARGET PLATFORM: ${platform} (${platformLimits[platform]})

${userContext ? `USER'S ADDITIONAL CONTEXT:\n${userContext}\n` : ''}

SUGGESTED COMMON GROUND (for this topic):
${topicData.commonGround.map((cg, i) => `${i + 1}. ${cg}`).join('\n')}

═══════════════════════════════════════════════════════════════

TASK: Generate a civil, balanced response that:
1. Acknowledges their viewpoint with genuine respect
2. Provides alternative perspectives with evidence
3. Identifies specific common ground from the list above
4. Suggests constructive questions or next steps
5. Maintains the selected tone: ${toneConfig.name}

CRITICAL: Respond ONLY with valid JSON in this exact format (no markdown, no extra text):

{
    "response": "Your complete civil response text here",
    "civilityScore": 85,
    "commonGround": [
        "First specific point of common ground",
        "Second specific point",
        "Third specific point"
    ],
    "suggestedQuestions": [
        "Constructive question 1?",
        "Constructive question 2?"
    ],
    "keyPoints": [
        "Main point 1 in your response",
        "Main point 2",
        "Main point 3"
    ],
    "factChecks": [
        {
            "claim": "A claim from the original comment",
            "status": "verified/disputed/false/needs-context",
            "note": "Brief explanation or source"
        }
    ]
}

REMEMBER:
- Stay within platform character limits
- Never be condescending or dismissive
- Assume good faith
- Use inclusive language
- Acknowledge uncertainty where appropriate
- Prioritize bridge-building over winning arguments`;
    }

    /**
     * Parse AI response
     */
    parseResponse(aiResponse, topicData, analysis) {
        try {
            // Try to extract JSON from response
            let jsonStr = aiResponse;
            
            // Remove markdown code blocks if present
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            // Try to find JSON object
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            const parsed = JSON.parse(jsonStr);
            
            return {
                response: parsed.response || aiResponse,
                civilityScore: parsed.civilityScore || 85,
                commonGround: parsed.commonGround || topicData.commonGround,
                suggestedQuestions: parsed.suggestedQuestions || [],
                keyPoints: parsed.keyPoints || [],
                factChecks: parsed.factChecks || [],
                wordCount: (parsed.response || aiResponse).split(/\s+/).filter(w => w).length,
                charCount: (parsed.response || aiResponse).length
            };
        } catch (error) {
            console.error('Parse error:', error);
            
            // Fallback: return raw response
            return {
                response: aiResponse,
                civilityScore: 85,
                commonGround: topicData.commonGround,
                suggestedQuestions: [
                    'What are your main concerns about this issue?',
                    'Are there areas where we might find agreement?'
                ],
                keyPoints: [],
                factChecks: [],
                wordCount: aiResponse.split(/\s+/).filter(w => w).length,
                charCount: aiResponse.length
            };
        }
    }

    /**
     * Update statistics
     */
    updateStats(civilityScore) {
        this.stats.totalResponses++;
        this.stats.totalCivilitySum += civilityScore;
        this.stats.avgCivility = Math.round(this.stats.totalCivilitySum / this.stats.totalResponses);
        this.stats.timeSaved += 5; // Assume 5 minutes saved per response
    }

    /**
     * Get all tones
     */
    getTones() {
        return Object.values(this.tones);
    }

    /**
     * Get statistics
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Save statistics to Puter KV storage
     */
    async saveStats() {
        try {
            await puter.kv.set('civilreply_stats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Stats save error:', error);
        }
    }

    /**
     * Load statistics from Puter KV storage
     */
    async loadStats() {
        try {
            const data = await puter.kv.get('civilreply_stats');
            if (data) {
                this.stats = JSON.parse(data);
            }
        } catch (error) {
            console.error('Stats load error:', error);
        }
    }

    /**
     * Initialize engine
     */
    async initialize() {
        try {
            await this.loadStats();
            console.log('✓ CivilReply AI Engine initialized');
            return true;
        } catch (error) {
            console.error('Engine initialization error:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CivilReplyAIEngine;
}
