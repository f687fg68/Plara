/**
 * Healthcare Appeal Chat Backend
 * AI-powered compliance assistant for healthcare denial appeals
 */

class HealthcareAppealChatBackend {
    constructor() {
        this.currentModel = 'claude-sonnet-4'; // Healthcare expertise
        this.conversationHistory = [];
        this.maxHistoryLength = 30; // Longer for complex medical discussions
        this.systemPrompt = this.buildSystemPrompt();
        
        this.loadHistory();
    }

    /**
     * Build healthcare-specific system prompt
     */
    buildSystemPrompt() {
        return `You are an expert healthcare denial management and appeals specialist with comprehensive knowledge of:

REGULATORY EXPERTISE:
- HIPAA Privacy and Security Rules
- Medicare/Medicaid regulations and LCDs/NCDs
- ERISA and insurance law
- State insurance regulations
- CMS guidelines and updates
- Prior authorization requirements

CLINICAL KNOWLEDGE:
- Medical terminology and procedures
- CPT/HCPCS coding
- ICD-10 diagnosis coding
- Clinical documentation improvement (CDI)
- Medical necessity criteria
- Evidence-based medicine and clinical guidelines

DENIAL MANAGEMENT:
- CARC/RARC denial codes (CO, PR, OA codes)
- Payer-specific appeal processes (Aetna, BCBS, UHC, Cigna, Medicare, etc.)
- Appeal letter writing strategies
- Medical evidence compilation
- Success rate optimization techniques
- Revenue cycle management best practices

YOUR ROLE:
1. Answer questions about denial codes, appeal processes, regulations
2. Provide strategic guidance on appeal approaches
3. Explain medical necessity criteria
4. Help interpret denial letters
5. Suggest clinical evidence to strengthen appeals
6. Guide on payer-specific requirements
7. Assist with coding questions

COMMUNICATION STYLE:
- Professional and knowledgeable
- Use specific examples and citations
- Break down complex regulations clearly
- Provide actionable guidance
- Use healthcare terminology appropriately
- Be empathetic to provider challenges
- Cite specific regulations when relevant (e.g., "Per 42 CFR 405.904...")

CRITICAL RULES:
- Never provide legal advice; recommend legal counsel for complex issues
- Maintain HIPAA awareness (never request specific patient identifiers)
- Stay current with healthcare regulations
- Acknowledge limitations and recommend escalation when needed
- Focus on evidence-based approaches`;
    }

    /**
     * Send message to AI and get response
     */
    async sendMessage(userMessage, options = {}) {
        try {
            // Add user message to history
            this.addToHistory('user', userMessage);
            
            // Build conversation context
            const contextPrompt = this.buildConversationContext(userMessage);
            
            // Determine streaming
            const useStreaming = options.stream !== false;
            
            if (useStreaming && options.onChunk) {
                return await this.sendStreamingMessage(contextPrompt, options.onChunk);
            } else {
                return await this.sendNonStreamingMessage(contextPrompt);
            }
            
        } catch (error) {
            console.error('❌ Chat error:', error);
            throw error;
        }
    }

    /**
     * Send streaming message
     */
    async sendStreamingMessage(prompt, onChunk) {
        let fullResponse = '';
        
        try {
            const stream = await puter.ai.chat(prompt, {
                model: this.currentModel,
                stream: true,
                temperature: 0.6, // Balanced for healthcare
                max_tokens: 3000
            });
            
            for await (const chunk of stream) {
                if (chunk?.text) {
                    fullResponse += chunk.text;
                    if (onChunk) {
                        onChunk(chunk.text, fullResponse);
                    }
                }
            }
            
            // Add AI response to history
            this.addToHistory('assistant', fullResponse);
            
            return {
                success: true,
                message: fullResponse,
                model: this.currentModel
            };
            
        } catch (error) {
            console.error('Streaming error:', error);
            throw error;
        }
    }

    /**
     * Send non-streaming message
     */
    async sendNonStreamingMessage(prompt) {
        try {
            const response = await puter.ai.chat(prompt, {
                model: this.currentModel,
                stream: false,
                temperature: 0.6,
                max_tokens: 3000
            });
            
            // Add AI response to history
            this.addToHistory('assistant', response);
            
            return {
                success: true,
                message: response,
                model: this.currentModel
            };
            
        } catch (error) {
            console.error('Non-streaming error:', error);
            throw error;
        }
    }

    /**
     * Build conversation context with history
     */
    buildConversationContext(currentMessage) {
        let context = this.systemPrompt + '\n\n';
        
        // Add recent conversation history (last 8 messages)
        const recentHistory = this.conversationHistory.slice(-8);
        
        if (recentHistory.length > 0) {
            context += 'CONVERSATION HISTORY:\n';
            recentHistory.forEach(msg => {
                const role = msg.role === 'user' ? 'Healthcare Provider' : 'AI Assistant';
                context += `${role}: ${msg.content}\n`;
            });
            context += '\n';
        }
        
        context += `CURRENT QUESTION:\n${currentMessage}\n\nProvide a helpful, accurate, and actionable response:`;
        
        return context;
    }

    /**
     * Add message to conversation history
     */
    addToHistory(role, content) {
        this.conversationHistory.push({
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        // Trim history if too long
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
        
        this.saveHistory();
    }

    /**
     * Process quick prompts with healthcare context
     */
    async processQuickPrompt(promptType, context = {}) {
        const prompts = {
            'denial_code': `Explain denial code ${context.code || 'CO-50'} in detail. Include: definition, common causes, appeal strategy, success rate, and specific documentation needed.`,
            
            'medical_necessity': `How do I prove medical necessity for ${context.procedure || 'this procedure'}? Include clinical criteria, evidence types, and payer-specific requirements.`,
            
            'appeal_strategy': `What's the best appeal strategy for a ${context.denialReason || 'medical necessity'} denial from ${context.payer || 'a major payer'}? Provide step-by-step guidance.`,
            
            'payer_requirements': `What are ${context.payer || 'UnitedHealthcare'}'s specific appeal requirements? Include timelines, format preferences, and documentation needs.`,
            
            'coding_question': `Explain the coding for ${context.procedure || 'the procedure'} and how to document it to avoid denials.`,
            
            'timely_filing': `How can I appeal a timely filing denial? What are valid reasons and what evidence strengthens the appeal?`,
            
            'prior_auth': `The claim was denied for lack of prior authorization. What are my options and how should I structure the appeal?`,
            
            'evidence_synthesis': `What clinical evidence should I include for ${context.diagnosis || 'this diagnosis'} with ${context.procedure || 'this procedure'}?`
        };
        
        const prompt = prompts[promptType] || promptType;
        return await this.sendMessage(prompt, { stream: false });
    }

    /**
     * Analyze denial letter
     */
    async analyzeDenialLetter(letterText) {
        const analysisPrompt = `Analyze this healthcare claim denial letter. Provide:

1. **Denial Summary:**
   - Primary denial reason and code
   - Secondary issues if any
   - Payer and plan type
   - Appeal deadline

2. **Strengths of Denial:**
   - Valid concerns raised by payer
   - Documentation gaps
   - Policy/coverage issues

3. **Weaknesses of Denial:**
   - Incorrect interpretations
   - Overlooked evidence
   - Policy misapplications

4. **Recommended Appeal Strategy:**
   - Key arguments to make
   - Evidence needed
   - Regulatory/policy citations
   - Success probability (Low/Medium/High)

5. **Action Items:**
   - Specific documents to gather
   - Clinical notes to obtain
   - Research to conduct
   - Timeline considerations

DENIAL LETTER:
---
${letterText}
---

Provide comprehensive analysis:`;

        return await this.sendMessage(analysisPrompt, { stream: false });
    }

    /**
     * Get payer-specific guidance
     */
    async getPayerGuidance(payer, denialType) {
        const prompt = `Provide comprehensive guidance for appealing a ${denialType} denial to ${payer}.

Include:
1. Payer-specific appeal process and timeline
2. Required documentation and format
3. Common pitfalls to avoid
4. Successful appeal strategies
5. Contact information and submission methods
6. Escalation options (internal appeals, external review)
7. Historical success rates and trends

Be specific and actionable.`;

        return await this.sendMessage(prompt, { stream: false });
    }

    /**
     * Review appeal letter draft
     */
    async reviewAppealLetter(letterDraft, denialContext) {
        const reviewPrompt = `Review this healthcare appeal letter draft for quality, compliance, and effectiveness.

DENIAL CONTEXT:
${JSON.stringify(denialContext, null, 2)}

APPEAL LETTER DRAFT:
---
${letterDraft}
---

REVIEW CRITERIA:
1. **Compliance & Format:**
   - Professional business letter format
   - All required elements present
   - HIPAA-appropriate language
   - Proper tone and structure

2. **Clinical Strength:**
   - Medical necessity clearly established
   - Clinical evidence cited
   - Guidelines referenced
   - Patient condition explained

3. **Legal/Policy Arguments:**
   - Coverage criteria addressed
   - Policy language referenced
   - Regulatory requirements cited
   - Denial rationale rebutted

4. **Evidence Quality:**
   - Peer-reviewed citations
   - Clinical guidelines referenced
   - Specific data/outcomes included
   - Expert opinions if relevant

5. **Overall Effectiveness:**
   - Clear and persuasive
   - Addresses all denial points
   - Maintains professional tone
   - Likely to succeed

PROVIDE:
- Overall rating (Excellent/Good/Needs Work/Poor)
- Specific strengths
- Specific weaknesses
- Concrete improvement suggestions
- Missing elements
- Estimated success probability`;

        return await this.sendMessage(reviewPrompt, { stream: false });
    }

    /**
     * Get coding guidance
     */
    async getCodingGuidance(procedure, diagnosis, context) {
        const prompt = `Provide comprehensive coding guidance for:

PROCEDURE: ${procedure}
DIAGNOSIS: ${diagnosis}
CONTEXT: ${context}

Include:
1. Correct CPT/HCPCS codes
2. Appropriate ICD-10 codes
3. Modifier requirements
4. Documentation requirements
5. Common coding errors to avoid
6. Medical necessity linkage
7. Payer-specific considerations

Be specific with code numbers and descriptions.`;

        return await this.sendMessage(prompt, { stream: false });
    }

    /**
     * Switch AI model
     */
    switchModel(modelKey) {
        const validModels = ['claude-sonnet-4', 'gemini-2.0-flash-exp', 'gpt-4o'];
        if (validModels.includes(modelKey)) {
            this.currentModel = modelKey;
            console.log('🔄 Chat model switched to:', modelKey);
        }
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
        this.saveHistory();
    }

    /**
     * Get conversation history
     */
    getHistory() {
        return [...this.conversationHistory];
    }

    /**
     * Save history to Puter.js storage
     */
    async saveHistory() {
        try {
            await puter.kv.set('healthcare_chat_history', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }

    /**
     * Load history from Puter.js storage
     */
    async loadHistory() {
        try {
            const data = await puter.kv.get('healthcare_chat_history');
            if (data) {
                this.conversationHistory = JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    /**
     * Export conversation for documentation
     */
    exportConversation() {
        const formatted = this.conversationHistory.map(msg => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            const role = msg.role === 'user' ? '🏥 Provider' : '🤖 AI Assistant';
            return `[${timestamp}] ${role}:\n${msg.content}\n`;
        }).join('\n---\n\n');
        
        return `Healthcare Appeal AI Chat - Conversation Export
Generated: ${new Date().toLocaleString()}
Model: ${this.currentModel}
HIPAA Notice: This conversation may contain PHI - handle appropriately

${formatted}`;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.HealthcareAppealChatBackend = HealthcareAppealChatBackend;
}
