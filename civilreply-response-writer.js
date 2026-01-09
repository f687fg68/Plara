/**
 * CivilReply - Response Writer Module
 * Integrates with existing chat interface backend
 * Handles response generation with streaming support
 */

class CivilReplyResponseWriter {
    constructor() {
        this.aiEngine = null;
        this.currentMode = 'civilreply';
    }

    /**
     * Initialize the response writer with AI engine
     */
    async initialize(aiEngine) {
        this.aiEngine = aiEngine;
        console.log('✓ CivilReply Response Writer initialized');
        return true;
    }

    /**
     * Generate civil political response
     */
    async generateResponse(options = {}, onStreamCallback = null) {
        if (!options.originalComment || options.originalComment.trim().length === 0) {
            throw new Error('Original comment cannot be empty');
        }

        // Validate comment length
        const validation = this.validateComment(options.originalComment);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        try {
            // Generate response using AI engine
            const result = await this.aiEngine.generateResponse(options);
            
            // Stream response if callback provided
            if (onStreamCallback && typeof onStreamCallback === 'function') {
                // Simulate streaming for smooth UX
                await this.simulateStreaming(result.response, onStreamCallback);
            }
            
            return {
                success: true,
                ...result,
                mode: 'civilreply',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('CivilReply generation error:', error);
            throw error;
        }
    }

    /**
     * Generate response with real-time streaming
     */
    async generateResponseStreaming(options = {}, onStreamCallback) {
        if (!options.originalComment || options.originalComment.trim().length === 0) {
            throw new Error('Original comment cannot be empty');
        }

        const {
            originalComment,
            userStance = 'neutral',
            tone = 'diplomatic',
            platform = 'general',
            userContext = '',
            model = null
        } = options;

        // Get tone configuration
        const toneConfig = this.aiEngine.tones[tone] || this.aiEngine.tones.diplomatic;
        
        // Determine model
        const selectedModel = model || toneConfig.model;
        
        // Detect topic and analyze comment
        const topicData = this.aiEngine.detectTopic(originalComment);
        const analysis = this.aiEngine.analyzeComment(originalComment);
        
        // Build prompt
        const prompt = this.aiEngine.buildPrompt({
            originalComment,
            userStance,
            toneConfig,
            platform,
            userContext,
            topicData,
            analysis
        });

        try {
            // Call Puter AI with streaming
            const stream = await puter.ai.chat(prompt, {
                model: selectedModel,
                stream: true,
                temperature: 0.7,
                max_tokens: 1500
            });

            let fullResponse = '';

            // Stream tokens
            for await (const chunk of stream) {
                if (chunk?.text) {
                    fullResponse += chunk.text;
                    
                    // Call streaming callback
                    if (onStreamCallback && typeof onStreamCallback === 'function') {
                        onStreamCallback(chunk.text, fullResponse);
                    }
                }
            }

            // Parse final response
            const parsed = this.aiEngine.parseResponse(fullResponse, topicData, analysis);
            
            // Update statistics
            this.aiEngine.updateStats(parsed.civilityScore);
            await this.aiEngine.saveStats();

            return {
                success: true,
                ...parsed,
                model: selectedModel,
                tone: toneConfig.name,
                analysis,
                topicData,
                mode: 'civilreply',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Streaming generation error:', error);
            throw error;
        }
    }

    /**
     * Simulate streaming for smooth UX (when not using real streaming)
     */
    async simulateStreaming(text, callback) {
        const words = text.split(' ');
        let accumulated = '';
        
        for (let i = 0; i < words.length; i++) {
            accumulated += (i > 0 ? ' ' : '') + words[i];
            callback(words[i], accumulated);
            
            // Small delay for smooth effect
            await new Promise(resolve => setTimeout(resolve, 30));
        }
    }

    /**
     * Modify response length
     */
    async modifyResponseLength(originalResponse, modification = 'shorter', options = {}) {
        const modificationPrompts = {
            shorter: 'Make this response more concise while keeping the same civil tone, key points, and common ground. Reduce by approximately 30-40%.',
            longer: 'Expand this response with more detail, examples, and nuance while maintaining the same civil tone. Add approximately 30-50% more content.',
            simplify: 'Rewrite this response in simpler language suitable for a general audience, avoiding jargon.',
            formal: 'Make this response more formal and professional in tone.',
            casual: 'Make this response more conversational and accessible.'
        };

        const prompt = `${modificationPrompts[modification] || modificationPrompts.shorter}

Original response:
"${originalResponse}"

Provide ONLY the modified response text, no explanation or metadata.`;

        try {
            const model = options.model || this.aiEngine.models.gemini;
            
            const response = await puter.ai.chat(prompt, {
                model: model,
                stream: false,
                temperature: 0.7
            });

            return {
                success: true,
                response: response.trim(),
                modification,
                wordCount: response.trim().split(/\s+/).filter(w => w).length,
                charCount: response.trim().length
            };

        } catch (error) {
            console.error('Modification error:', error);
            throw error;
        }
    }

    /**
     * Regenerate response with different approach
     */
    async regenerateResponse(originalOptions, changeType = 'tone') {
        // Clone options
        const newOptions = { ...originalOptions };
        
        // Apply changes based on type
        switch (changeType) {
            case 'tone':
                // Cycle to next tone
                const tones = ['diplomatic', 'empathetic', 'factual', 'bridge-building'];
                const currentIndex = tones.indexOf(newOptions.tone || 'diplomatic');
                newOptions.tone = tones[(currentIndex + 1) % tones.length];
                break;
                
            case 'model':
                // Switch model
                if (newOptions.model === 'gemini-2.0-flash-exp') {
                    newOptions.model = 'claude-sonnet-4';
                } else {
                    newOptions.model = 'gemini-2.0-flash-exp';
                }
                break;
                
            case 'stance':
                // Switch stance
                const stances = ['neutral', 'agree', 'disagree'];
                const stanceIndex = stances.indexOf(newOptions.userStance || 'neutral');
                newOptions.userStance = stances[(stanceIndex + 1) % stances.length];
                break;
        }
        
        // Generate new response
        return await this.generateResponse(newOptions);
    }

    /**
     * Validate political comment
     */
    validateComment(comment) {
        if (!comment || comment.trim().length === 0) {
            return { valid: false, error: 'Comment cannot be empty' };
        }

        if (comment.length > 5000) {
            return { valid: false, error: 'Comment too long (max 5000 characters)' };
        }

        if (comment.length < 10) {
            return { valid: false, error: 'Comment too short (minimum 10 characters)' };
        }

        return { valid: true };
    }

    /**
     * Extract political claims for fact-checking
     */
    extractClaims(text) {
        // Simple claim extraction (in production, use more sophisticated NLP)
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        
        // Filter for factual claims
        const claims = sentences.filter(s => {
            const lower = s.toLowerCase();
            
            // Exclude opinions
            if (lower.includes('i think') || lower.includes('i believe') || 
                lower.includes('in my opinion') || lower.includes('seems like')) {
                return false;
            }
            
            // Include statements with factual indicators
            return lower.includes('studies show') || 
                   lower.includes('research') ||
                   lower.includes('statistics') ||
                   lower.includes('data') ||
                   lower.includes('according to') ||
                   s.length > 20; // Longer sentences more likely factual
        });
        
        return claims.map(c => c.trim());
    }

    /**
     * Format response for chat interface display
     */
    formatForChat(responseData) {
        return {
            content: responseData.response,
            metadata: {
                mode: 'civilreply',
                tone: responseData.tone,
                model: responseData.model,
                civilityScore: responseData.civilityScore,
                wordCount: responseData.wordCount,
                charCount: responseData.charCount,
                commonGround: responseData.commonGround,
                suggestedQuestions: responseData.suggestedQuestions,
                factChecks: responseData.factChecks,
                analysis: responseData.analysis,
                topic: responseData.topicData?.topic
            }
        };
    }

    /**
     * Get available tones for UI
     */
    getTones() {
        if (!this.aiEngine) return [];
        return this.aiEngine.getTones();
    }

    /**
     * Get statistics
     */
    getStats() {
        if (!this.aiEngine) {
            return {
                totalResponses: 0,
                avgCivility: 0,
                timeSaved: 0
            };
        }
        return this.aiEngine.getStats();
    }

    /**
     * Calculate estimated reading time
     */
    calculateReadingTime(text) {
        const words = text.split(/\s+/).filter(w => w).length;
        const minutes = Math.ceil(words / 200); // Average reading speed
        return `${minutes} min read`;
    }

    /**
     * Check if response fits platform limits
     */
    checkPlatformLimit(text, platform) {
        const limits = {
            twitter: 280,
            facebook: 2000,
            reddit: 10000,
            linkedin: 3000,
            general: 5000
        };
        
        const limit = limits[platform] || limits.general;
        const length = text.length;
        
        return {
            fitsLimit: length <= limit,
            length: length,
            limit: limit,
            percentage: Math.round((length / limit) * 100)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CivilReplyResponseWriter;
}
