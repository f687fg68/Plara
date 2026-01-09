/**
 * PatentProse Chat Backend
 * Real-time chat interface for patent response generation
 * Integrates with dual AI engine (Gemini 3.0 Pro + Claude Sonnet 4.5)
 */

class PatentProseChat {
    constructor(aiEngine) {
        this.aiEngine = aiEngine;
        this.conversationHistory = [];
        this.currentContext = null;
        this.activeResponse = null;
        this.streamingEnabled = true;
        
        // Chat modes
        this.modes = {
            CONSULTATION: 'consultation', // Ask questions about strategy
            GENERATION: 'generation',     // Generate response
            REVIEW: 'review',             // Review and refine
            RESEARCH: 'research'          // Legal research
        };
        
        this.currentMode = this.modes.CONSULTATION;
    }

    /**
     * Initialize chat backend
     */
    async initialize() {
        try {
            console.log('💬 Initializing PatentProse Chat Backend...');
            
            // Initialize AI engine if not already done
            if (!this.aiEngine.puterInitialized) {
                await this.aiEngine.initialize();
            }

            // Load conversation history from Puter KV
            await this.loadConversationHistory();

            console.log('✅ Chat backend initialized');
            return true;
        } catch (error) {
            console.error('❌ Chat initialization error:', error);
            throw error;
        }
    }

    /**
     * Send message to AI and get response
     * @param {string} message - User message
     * @param {Object} context - Current office action context
     * @param {Function} onChunk - Streaming callback
     * @returns {Promise<Object>} AI response
     */
    async sendMessage(message, context = null, onChunk = null) {
        try {
            // Update context if provided
            if (context) {
                this.currentContext = context;
            }

            // Add user message to history
            this.addToHistory('user', message);

            // Determine intent and route to appropriate handler
            const intent = await this.detectIntent(message);
            
            let response;
            
            switch (intent.type) {
                case 'strategy_question':
                    response = await this.handleStrategyQuestion(message, intent, onChunk);
                    break;
                    
                case 'generate_response':
                    response = await this.handleGenerateResponse(message, intent, onChunk);
                    break;
                    
                case 'review_content':
                    response = await this.handleReviewContent(message, intent, onChunk);
                    break;
                    
                case 'legal_research':
                    response = await this.handleLegalResearch(message, intent, onChunk);
                    break;
                    
                case 'examiner_analysis':
                    response = await this.handleExaminerAnalysis(message, intent, onChunk);
                    break;
                    
                case 'claim_amendment':
                    response = await this.handleClaimAmendment(message, intent, onChunk);
                    break;
                    
                default:
                    response = await this.handleGeneralQuestion(message, onChunk);
            }

            // Add AI response to history
            this.addToHistory('assistant', response.text, response.metadata);

            // Save conversation
            await this.saveConversationHistory();

            return response;

        } catch (error) {
            console.error('❌ Message handling error:', error);
            return {
                text: 'I encountered an error processing your request. Please try again.',
                error: true,
                metadata: { error: error.message }
            };
        }
    }

    /**
     * Detect user intent from message
     */
    async detectIntent(message) {
        const prompt = `You are an intent classifier for a patent prosecution AI assistant.

User message: "${message}"

Current context: ${this.currentContext ? JSON.stringify({
    hasOfficeAction: !!this.currentContext.officeActionText,
    jurisdiction: this.currentContext.jurisdiction,
    rejectionTypes: this.currentContext.rejectionTypes
}) : 'No active case'}

Classify the intent into one of these categories:
- strategy_question: User asking about prosecution strategy
- generate_response: User wants to generate office action response
- review_content: User wants to review/improve existing content
- legal_research: User asking about case law or statutes
- examiner_analysis: User asking about examiner tendencies
- claim_amendment: User asking about claim amendments
- general_question: General question about patent law

Respond with JSON only:
{
    "type": "intent_type",
    "confidence": 0.0-1.0,
    "entities": {
        "rejection_type": "102/103/etc if mentioned",
        "jurisdiction": "USPTO/EPO/JPO if mentioned",
        "action": "specific action requested"
    }
}`;

        try {
            const response = await puter.ai.chat(prompt, {
                model: this.aiEngine.models.claude.name,
                stream: false,
                temperature: 0.3,
                max_tokens: 500
            });

            const intentText = response.trim();
            if (intentText.includes('```json')) {
                const jsonMatch = intentText.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[1]);
                }
            }
            return JSON.parse(intentText);
        } catch (error) {
            console.error('Intent detection error:', error);
            return { type: 'general_question', confidence: 0.5, entities: {} };
        }
    }

    /**
     * Handle strategy questions
     */
    async handleStrategyQuestion(message, intent, onChunk) {
        const prompt = `You are a senior patent attorney providing strategic advice.

User question: "${message}"

${this.currentContext ? `
Current case context:
- Application: ${this.currentContext.applicationNumber || 'Not specified'}
- Jurisdiction: ${this.currentContext.jurisdiction || 'USPTO'}
- Rejection types: ${this.currentContext.rejectionTypes?.join(', ') || 'Not specified'}
- Office action summary: ${this.currentContext.officeActionText?.substring(0, 500) || 'Not provided'}
` : 'No active case context.'}

Conversation history:
${this.getRecentHistory(3)}

Provide strategic advice addressing:
1. Best approach for this situation
2. Pros and cons of different strategies
3. Success probability estimates
4. Timeline and cost considerations
5. Specific action recommendations

Be conversational, professional, and practical. Use your expertise to guide the practitioner.`;

        try {
            let fullResponse = '';
            const metadata = { intent: intent.type, mode: 'strategy' };

            if (onChunk && this.streamingEnabled) {
                await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.claude.name,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 2000,
                    onStream: (chunk) => {
                        fullResponse += chunk;
                        onChunk({
                            chunk,
                            fullText: fullResponse,
                            done: false
                        });
                    }
                });
                
                if (onChunk) {
                    onChunk({ chunk: '', fullText: fullResponse, done: true });
                }
            } else {
                fullResponse = await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.claude.name,
                    stream: false,
                    temperature: 0.7,
                    max_tokens: 2000
                });
            }

            return { text: fullResponse, metadata };
        } catch (error) {
            console.error('Strategy question error:', error);
            throw error;
        }
    }

    /**
     * Handle generate response request
     */
    async handleGenerateResponse(message, intent, onChunk) {
        if (!this.currentContext || !this.currentContext.officeActionText) {
            return {
                text: "I need the office action details first. Please upload the office action or provide:\n" +
                      "- Application number\n" +
                      "- Rejection types\n" +
                      "- Claims at issue\n" +
                      "- Prior art citations",
                metadata: { needsContext: true }
            };
        }

        // Extract any specific instructions from the message
        const instructions = this.extractInstructions(message);

        const responseText = "I'll generate a comprehensive office action response for you. This will take a few minutes...\n\n";
        
        if (onChunk) {
            onChunk({ chunk: responseText, fullText: responseText, done: false });
        }

        // Start generation with progress updates
        const response = await this.aiEngine.generateResponse(
            this.currentContext,
            (progress) => {
                if (onChunk) {
                    const statusMessage = `\n[${progress.step}] ${progress.message}`;
                    onChunk({
                        chunk: statusMessage,
                        fullText: responseText + statusMessage,
                        done: false,
                        progress
                    });
                }
            }
        );

        this.activeResponse = response;

        const summary = this.formatResponseSummary(response);
        const fullText = responseText + "\n\n✅ **Response Generated Successfully!**\n\n" + summary;

        if (onChunk) {
            onChunk({ chunk: summary, fullText, done: true });
        }

        return {
            text: fullText,
            metadata: {
                response,
                wordCount: response.metadata.wordCount,
                generationTime: response.metadata.generationTime
            }
        };
    }

    /**
     * Handle review/refinement requests
     */
    async handleReviewContent(message, intent, onChunk) {
        if (!this.activeResponse) {
            return {
                text: "I don't see any generated content to review. Please generate a response first or paste the content you'd like me to review.",
                metadata: { needsContent: true }
            };
        }

        const prompt = `You are reviewing a patent office action response for improvements.

User feedback: "${message}"

Current response excerpt:
${this.activeResponse.responseText.substring(0, 2000)}...

Arguments structure:
${JSON.stringify(this.activeResponse.arguments, null, 2)}

Amendments:
${JSON.stringify(this.activeResponse.amendments, null, 2)}

Analyze the response and provide:
1. Specific improvements based on user feedback
2. Strengths of current approach
3. Potential weaknesses to address
4. Suggested revisions with reasoning
5. Alternative argument strategies

Be specific and actionable.`;

        try {
            let fullResponse = '';

            if (onChunk && this.streamingEnabled) {
                await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.claude.name,
                    stream: true,
                    temperature: 0.6,
                    max_tokens: 2500,
                    onStream: (chunk) => {
                        fullResponse += chunk;
                        onChunk({ chunk, fullText: fullResponse, done: false });
                    }
                });
                
                if (onChunk) {
                    onChunk({ chunk: '', fullText: fullResponse, done: true });
                }
            } else {
                fullResponse = await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.claude.name,
                    stream: false,
                    temperature: 0.6,
                    max_tokens: 2500
                });
            }

            return {
                text: fullResponse,
                metadata: { intent: 'review', hasActiveResponse: true }
            };
        } catch (error) {
            console.error('Review error:', error);
            throw error;
        }
    }

    /**
     * Handle legal research questions
     */
    async handleLegalResearch(message, intent, onChunk) {
        const jurisdiction = intent.entities.jurisdiction || this.currentContext?.jurisdiction || 'USPTO';
        const rejectionType = intent.entities.rejection_type || '';

        const prompt = `You are a patent law research expert specializing in ${jurisdiction} law.

Research question: "${message}"

${rejectionType ? `Focus on: ${rejectionType} rejections` : ''}

${this.currentContext ? `
Current case context:
- Jurisdiction: ${this.currentContext.jurisdiction}
- Rejection types: ${this.currentContext.rejectionTypes?.join(', ')}
` : ''}

Provide comprehensive legal research including:
1. Relevant statutes and sections
2. Key case precedents with citations
3. Precedential holdings and quotes
4. Application to patent prosecution
5. Strategic use in office action responses
6. Distinguishing unfavorable precedent

Format with proper legal citations. Be thorough and precise.`;

        try {
            let fullResponse = '';

            if (onChunk && this.streamingEnabled) {
                await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.claude.name,
                    stream: true,
                    temperature: 0.4,
                    max_tokens: 3000,
                    onStream: (chunk) => {
                        fullResponse += chunk;
                        onChunk({ chunk, fullText: fullResponse, done: false });
                    }
                });
                
                if (onChunk) {
                    onChunk({ chunk: '', fullText: fullResponse, done: true });
                }
            } else {
                fullResponse = await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.claude.name,
                    stream: false,
                    temperature: 0.4,
                    max_tokens: 3000
                });
            }

            return {
                text: fullResponse,
                metadata: { intent: 'legal_research', jurisdiction, rejectionType }
            };
        } catch (error) {
            console.error('Legal research error:', error);
            throw error;
        }
    }

    /**
     * Handle examiner analysis requests
     */
    async handleExaminerAnalysis(message, intent, onChunk) {
        const examinerName = this.extractExaminerName(message) || this.currentContext?.examinerName;
        const artUnit = this.currentContext?.artUnit;

        if (!examinerName && !artUnit) {
            return {
                text: "Please provide the examiner's name or art unit number for analysis.",
                metadata: { needsExaminerInfo: true }
            };
        }

        const responseText = `Analyzing examiner behavior patterns${examinerName ? ` for ${examinerName}` : ''}...\n\n`;
        
        if (onChunk) {
            onChunk({ chunk: responseText, fullText: responseText, done: false });
        }

        const analysis = await this.aiEngine.analyzeExaminer(examinerName, artUnit);

        const formattedAnalysis = this.formatExaminerAnalysis(analysis, examinerName);
        const fullText = responseText + formattedAnalysis;

        if (onChunk) {
            onChunk({ chunk: formattedAnalysis, fullText, done: true });
        }

        return {
            text: fullText,
            metadata: { analysis, examinerName, artUnit }
        };
    }

    /**
     * Handle claim amendment requests
     */
    async handleClaimAmendment(message, intent, onChunk) {
        if (!this.currentContext?.claims) {
            return {
                text: "Please provide the claims you'd like me to analyze for amendments.",
                metadata: { needsClaims: true }
            };
        }

        const prompt = `You are a patent claim drafting expert.

User request: "${message}"

Current claims:
${this.currentContext.claims}

${this.currentContext.officeActionText ? `
Office action summary:
${this.currentContext.officeActionText.substring(0, 500)}
` : ''}

Provide:
1. Specific amendment suggestions
2. Claim scope analysis
3. Support from specification (if available)
4. Rationale for each amendment
5. Impact on dependent claims
6. Alternative amendment strategies

Be specific with exact claim language.`;

        try {
            let fullResponse = '';

            if (onChunk && this.streamingEnabled) {
                await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.gemini.name,
                    stream: true,
                    temperature: 0.4,
                    max_tokens: 2500,
                    onStream: (chunk) => {
                        fullResponse += chunk;
                        onChunk({ chunk, fullText: fullResponse, done: false });
                    }
                });
                
                if (onChunk) {
                    onChunk({ chunk: '', fullText: fullResponse, done: true });
                }
            } else {
                fullResponse = await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.gemini.name,
                    stream: false,
                    temperature: 0.4,
                    max_tokens: 2500
                });
            }

            return {
                text: fullResponse,
                metadata: { intent: 'claim_amendment' }
            };
        } catch (error) {
            console.error('Claim amendment error:', error);
            throw error;
        }
    }

    /**
     * Handle general questions
     */
    async handleGeneralQuestion(message, onChunk) {
        const prompt = `You are a helpful patent prosecution AI assistant.

User: "${message}"

Context: ${this.currentContext ? 'User has an active case' : 'No active case'}

Recent conversation:
${this.getRecentHistory(2)}

Provide a helpful, professional response. If the question is outside patent prosecution, politely redirect to patent-related topics.`;

        try {
            let fullResponse = '';

            if (onChunk && this.streamingEnabled) {
                await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.claude.name,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 1500,
                    onStream: (chunk) => {
                        fullResponse += chunk;
                        onChunk({ chunk, fullText: fullResponse, done: false });
                    }
                });
                
                if (onChunk) {
                    onChunk({ chunk: '', fullText: fullResponse, done: true });
                }
            } else {
                fullResponse = await puter.ai.chat(prompt, {
                    model: this.aiEngine.models.claude.name,
                    stream: false,
                    temperature: 0.7,
                    max_tokens: 1500
                });
            }

            return { text: fullResponse, metadata: { intent: 'general' } };
        } catch (error) {
            console.error('General question error:', error);
            throw error;
        }
    }

    /**
     * Quick suggestions based on context
     */
    getQuickSuggestions() {
        const suggestions = [];

        if (!this.currentContext) {
            return [
                "Upload an office action to get started",
                "Ask me about patent prosecution strategy",
                "Tell me about your case"
            ];
        }

        if (!this.activeResponse) {
            suggestions.push("Generate a response to this office action");
            suggestions.push("What's the best strategy for these rejections?");
            suggestions.push("Analyze the examiner's position");
        } else {
            suggestions.push("Review the generated response");
            suggestions.push("Suggest improvements to the arguments");
            suggestions.push("Show me alternative approaches");
        }

        if (this.currentContext.rejectionTypes?.includes('103')) {
            suggestions.push("Research §103 case law for this situation");
        }

        if (this.currentContext.rejectionTypes?.includes('101')) {
            suggestions.push("Help with Alice/Mayo Step 2B analysis");
        }

        return suggestions.slice(0, 3);
    }

    /**
     * Add message to conversation history
     */
    addToHistory(role, content, metadata = {}) {
        this.conversationHistory.push({
            role,
            content,
            metadata,
            timestamp: new Date().toISOString()
        });

        // Keep only last 50 messages
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }
    }

    /**
     * Get recent conversation history
     */
    getRecentHistory(count = 5) {
        return this.conversationHistory
            .slice(-count * 2) // Get last N exchanges
            .map(msg => `${msg.role}: ${msg.content.substring(0, 200)}`)
            .join('\n');
    }

    /**
     * Load conversation from Puter KV
     */
    async loadConversationHistory() {
        try {
            const history = await puter.kv.get('patent_chat_history');
            if (history) {
                this.conversationHistory = JSON.parse(history);
                console.log(`📚 Loaded ${this.conversationHistory.length} messages`);
            }
        } catch (error) {
            console.log('No previous conversation history');
        }
    }

    /**
     * Save conversation to Puter KV
     */
    async saveConversationHistory() {
        try {
            await puter.kv.set('patent_chat_history', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.error('Failed to save conversation:', error);
        }
    }

    /**
     * Clear conversation history
     */
    async clearHistory() {
        this.conversationHistory = [];
        await puter.kv.del('patent_chat_history');
    }

    /**
     * Update current context
     */
    updateContext(context) {
        this.currentContext = { ...this.currentContext, ...context };
    }

    /**
     * Helper: Extract examiner name from message
     */
    extractExaminerName(message) {
        const match = message.match(/examiner\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
        return match ? match[1] : null;
    }

    /**
     * Helper: Extract specific instructions
     */
    extractInstructions(message) {
        return {
            formal: message.toLowerCase().includes('formal'),
            concise: message.toLowerCase().includes('concise'),
            detailed: message.toLowerCase().includes('detailed'),
            includeInterview: message.toLowerCase().includes('interview')
        };
    }

    /**
     * Helper: Format response summary
     */
    formatResponseSummary(response) {
        return `
📊 **Response Summary**

📝 Word Count: ${response.metadata.wordCount}
⚡ Generation Time: ${((Date.now() - response.metadata.generationTime) / 1000).toFixed(1)}s
🤖 AI Models: Gemini 3.0 Pro + Claude Sonnet 4.5
🏛️ Jurisdiction: ${response.jurisdiction}

**Generated Sections:**
${response.arguments.rejection_arguments ? `✅ Legal Arguments (${Object.keys(response.arguments.rejection_arguments).length} rejection types)` : ''}
${response.amendments.amendments?.length > 0 ? `✅ Claim Amendments (${response.amendments.amendments.length} claims)` : ''}
${response.legalResearch ? `✅ Legal Citations & Precedents` : ''}

You can now:
- Review the full response
- Request specific improvements
- Export to Word/PDF
- Save to your case file

Type "show me the response" to view the full text, or ask me to review specific sections.
`;
    }

    /**
     * Helper: Format examiner analysis
     */
    formatExaminerAnalysis(analysis, examinerName) {
        if (!analysis) return "Analysis unavailable.";

        return `
👤 **Examiner Profile: ${examinerName || 'Unknown'}**

📊 **Statistics:**
- Allowance Rate: ${analysis.allowance_rate}
- Avg. Actions to Allowance: ${analysis.avg_actions_to_allowance}
- Argument Receptiveness: ${analysis.argument_receptiveness.toUpperCase()}
- Interview Receptiveness: ${analysis.interview_receptiveness.toUpperCase()}

🎯 **Common Rejections:**
${analysis.common_rejections.map(r => `- ${r}`).join('\n')}

✅ **Successful Strategies:**
${analysis.successful_strategies.map(s => `- ${s}`).join('\n')}

💡 **Strategic Notes:**
${analysis.notes}

**Recommendation:** ${this.generateExaminerRecommendation(analysis)}
`;
    }

    /**
     * Helper: Generate examiner-specific recommendation
     */
    generateExaminerRecommendation(analysis) {
        if (analysis.interview_receptiveness === 'high') {
            return "Consider scheduling an examiner interview before filing your response. This examiner has a strong track record of productive interviews.";
        }
        if (analysis.argument_receptiveness === 'high') {
            return "Strong technical arguments backed by case law are likely to be well-received by this examiner.";
        }
        if (analysis.argument_receptiveness === 'low') {
            return "This examiner may be more receptive to claim amendments than extended arguments. Consider a balanced approach.";
        }
        return "Follow standard prosecution strategy with attention to this examiner's specific patterns.";
    }

    /**
     * Export conversation as document
     */
    async exportConversation(format = 'text') {
        const content = this.conversationHistory
            .map(msg => `[${msg.timestamp}] ${msg.role.toUpperCase()}:\n${msg.content}\n`)
            .join('\n---\n\n');

        const fileName = `patent_consultation_${Date.now()}.${format}`;

        if (format === 'text') {
            return { content, fileName };
        }

        // Could add PDF/Word export using Puter.js capabilities
        return { content, fileName };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatentProseChat;
}
