/**
 * ScamBaiter Pro - Response Writer Module
 * Integrates with existing chat interface backend
 * Supports Gemini 3.0 Pro and Claude Sonnet 4.5 via Puter.js
 */

class ScamBaiterResponseWriter {
    constructor() {
        this.aiEngine = null;
        this.currentMode = 'scambaiting';
        this.availableModels = {
            gemini: 'gemini-2.0-flash-exp',
            claude: 'claude-sonnet-4',
            gpt: 'gpt-4o-mini'
        };
    }

    /**
     * Initialize the response writer with AI engine
     */
    async initialize(aiEngine) {
        this.aiEngine = aiEngine;
        console.log('✓ ScamBaiter Response Writer initialized');
        return true;
    }

    /**
     * Generate scam bait response with streaming
     * Integrates with existing chat interface
     */
    async generateResponse(scamMessage, options = {}, onStreamCallback = null) {
        if (!scamMessage || scamMessage.trim().length === 0) {
            throw new Error('Scam message cannot be empty');
        }

        // Determine which model to use based on tier
        let model = options.model || this.availableModels.gpt;
        
        // Free/Pro tier: Use Gemini 2.0 Flash (fast, cost-effective)
        // Unlimited tier: Use Claude Sonnet 4 (superior quality)
        if (options.tier === 'free' || options.tier === 'pro') {
            model = this.availableModels.gemini;
        } else if (options.tier === 'unlimited') {
            model = this.availableModels.claude;
        }

        // Get tone configuration
        const toneId = options.tone || 'elderly';
        const toneConfig = this.aiEngine.tones[toneId] || this.aiEngine.tones.elderly;

        // Build comprehensive prompt
        const prompt = this.buildDetailedPrompt(scamMessage, toneConfig, options);

        try {
            // Call Puter AI with streaming enabled
            const stream = await puter.ai.chat(prompt, {
                model: model,
                stream: true,
                max_tokens: options.maxTokens || 1200,
                temperature: options.temperature || 0.8
            });

            let fullResponse = '';

            // Stream the response
            for await (const chunk of stream) {
                if (chunk?.text) {
                    fullResponse += chunk.text;
                    
                    // Call streaming callback if provided
                    if (onStreamCallback && typeof onStreamCallback === 'function') {
                        onStreamCallback(chunk.text, fullResponse);
                    }
                }
            }

            // Calculate time wasted
            const timeWasted = this.calculateTimeWasted(fullResponse);

            // Update statistics
            if (this.aiEngine) {
                this.aiEngine.stats.totalGenerated++;
                this.aiEngine.stats.scamBaitResponses++;
                this.aiEngine.stats.timeWasted += timeWasted;
                await this.aiEngine.saveStats();
            }

            return {
                success: true,
                response: fullResponse,
                tone: toneConfig,
                model: model,
                timeWasted: timeWasted,
                wordCount: fullResponse.split(/\s+/).length,
                mode: 'scambaiting'
            };

        } catch (error) {
            console.error('ScamBaiter generation error:', error);
            throw error;
        }
    }

    /**
     * Build detailed prompt with all options
     */
    buildDetailedPrompt(scamMessage, toneConfig, options) {
        const lengthGuide = [
            'very brief (2-3 sentences)',
            'short (1 paragraph)', 
            'medium (2-3 paragraphs)',
            'long (4-5 paragraphs)',
            'very long (6+ paragraphs)'
        ];
        
        const lengthIndex = Math.min(
            Math.floor((options.length || 50) / 25),
            lengthGuide.length - 1
        );
        const selectedLength = lengthGuide[lengthIndex];

        // Base personality prompt
        let prompt = `${toneConfig.prompt}

CRITICAL SAFETY RULES - MUST FOLLOW:
1. NEVER include real personal information
2. NEVER make actual threats or illegal suggestions
3. Generate ONLY fictional, obviously fake details
4. Keep responses entertaining and time-wasting
5. Stay completely in character at all times
6. The goal is to waste the scammer's time ethically and legally

RESPONSE CONFIGURATION:
- Target Length: ${selectedLength}
- Absurdity Level: ${options.absurdity || 50}% (higher = more ridiculous and time-wasting)
- Personality: ${toneConfig.name}
- Model: Using ${options.model || 'default AI model'} for generation
`;

        // Add optional features based on settings
        if (options.fakeDetails) {
            prompt += `- Include FICTIONAL personal details (fake names like "Gertrude McGillicuddy", fake addresses like "123 Imaginary Lane", humorous "bank problems" like "my pet hamster ate my ATM card")\n`;
        }

        if (options.questions) {
            prompt += `- Include multiple questions to force them to respond and waste more time\n`;
        }

        if (options.delayTactics) {
            prompt += `- Include believable delay reasons: hospital visits, internet issues, bank closed for holidays, traveling, waiting for nephew to help with computer, etc.\n`;
        }

        if (options.multipart) {
            prompt += `- Set up for a follow-up response with a cliffhanger or promise more details later ("I need to go feed my cats but I'll write more tomorrow!")\n`;
        }

        if (options.typos) {
            prompt += `- Include occasional realistic typos to seem more human (but not too many)\n`;
        }

        // Add the scam message
        prompt += `
THE SCAM MESSAGE YOU ARE RESPONDING TO:
"""
${scamMessage}
"""

NOW GENERATE YOUR RESPONSE:
Write as ${toneConfig.name}. Stay completely in character. Make it entertaining, believable enough to keep them engaged, and maximize the time they'll waste. Do not break character or explain you're baiting them. Write as if you're genuinely responding to their message.`;

        return prompt;
    }

    /**
     * Calculate estimated time wasted by scammer
     */
    calculateTimeWasted(responseText) {
        const words = responseText.split(/\s+/).length;
        // Reading time (200 wpm) + thinking time + response time = ~3x read time
        const readMinutes = words / 200;
        const totalMinutes = Math.ceil(readMinutes * 3);
        return Math.max(totalMinutes, 5); // Minimum 5 minutes
    }

    /**
     * Format response for chat interface display
     */
    formatForChat(responseData) {
        return {
            content: responseData.response,
            metadata: {
                mode: 'scambaiting',
                tone: responseData.tone.name,
                model: responseData.model,
                timeWasted: responseData.timeWasted,
                wordCount: responseData.wordCount,
                emoji: responseData.tone.emoji
            }
        };
    }

    /**
     * Get available tones for UI
     */
    getTones() {
        if (!this.aiEngine) return [];
        return Object.values(this.aiEngine.tones);
    }

    /**
     * Get scam templates for UI
     */
    getTemplates() {
        if (!this.aiEngine) return [];
        return this.aiEngine.templates;
    }

    /**
     * Validate scam message before processing
     */
    validateScamMessage(message) {
        if (!message || message.trim().length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }

        if (message.length > 5000) {
            return { valid: false, error: 'Message too long (max 5000 characters)' };
        }

        return { valid: true };
    }

    /**
     * Get statistics
     */
    getStats() {
        if (!this.aiEngine) {
            return {
                totalGenerated: 0,
                timeWasted: 0,
                scamBaitResponses: 0
            };
        }
        return this.aiEngine.getStats();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScamBaiterResponseWriter;
}
