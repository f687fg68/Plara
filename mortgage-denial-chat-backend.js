/**
 * Mortgage Denial Chat Backend
 * AI-powered chat assistant for mortgage denial compliance
 * Integrates with Gemini 3.0 Pro and Claude Sonnet 4.5
 */

class MortgageDenialChatBackend {
    constructor() {
        this.currentModel = 'gemini-2.0-flash-exp';
        this.conversationHistory = [];
        this.maxHistoryLength = 20;
        this.systemPrompt = this.buildSystemPrompt();
        
        // Load conversation history from storage
        this.loadHistory();
    }

    /**
     * Build system prompt for chat assistant
     */
    buildSystemPrompt() {
        return `You are an expert AI assistant specializing in mortgage lending compliance, specifically:
- Fair Credit Reporting Act (FCRA)
- Equal Credit Opportunity Act (ECOA) / Regulation B
- Consumer Financial Protection Bureau (CFPB) requirements
- Mortgage denial letter generation
- Adverse action notices

Your role:
1. Answer questions about mortgage lending regulations
2. Help draft compliant denial reasons
3. Explain compliance requirements
4. Review denial letters for compliance issues
5. Provide specific, actionable guidance

Communication style:
- Professional but conversational
- Use specific examples and citations
- Break down complex regulations into simple terms
- Provide step-by-step guidance when helpful
- Use emojis sparingly for clarity (✅, ⚠️, 📋, etc.)

Critical rules:
- Always prioritize legal compliance
- Cite specific regulations when relevant
- Never suggest discriminatory practices
- Emphasize the importance of documentation
- Recommend legal review for complex situations`;
    }

    /**
     * Send message to AI and get response
     */
    async sendMessage(userMessage, options = {}) {
        try {
            // Add user message to history
            this.addToHistory('user', userMessage);
            
            // Build conversation context
            const messages = this.buildConversationContext();
            
            // Determine if streaming
            const useStreaming = options.stream !== false;
            
            if (useStreaming && options.onChunk) {
                return await this.sendStreamingMessage(messages, options.onChunk);
            } else {
                return await this.sendNonStreamingMessage(messages);
            }
            
        } catch (error) {
            console.error('❌ Chat error:', error);
            throw error;
        }
    }

    /**
     * Send streaming message
     */
    async sendStreamingMessage(messages, onChunk) {
        let fullResponse = '';
        
        try {
            const stream = await puter.ai.chat(messages, {
                model: this.currentModel,
                stream: true,
                temperature: 0.7,
                max_tokens: 2000
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
    async sendNonStreamingMessage(messages) {
        try {
            const response = await puter.ai.chat(messages, {
                model: this.currentModel,
                stream: false,
                temperature: 0.7,
                max_tokens: 2000
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
    buildConversationContext() {
        // Start with system prompt
        let context = this.systemPrompt + '\n\n';
        
        // Add recent conversation history
        const recentHistory = this.conversationHistory.slice(-10); // Last 10 messages
        
        if (recentHistory.length > 0) {
            context += 'Recent conversation:\n';
            recentHistory.forEach(msg => {
                const role = msg.role === 'user' ? 'User' : 'Assistant';
                context += `${role}: ${msg.content}\n`;
            });
            context += '\n';
        }
        
        // Get the last user message
        const lastUserMessage = this.conversationHistory[this.conversationHistory.length - 1];
        
        return `${context}Respond to: ${lastUserMessage.content}`;
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
        
        // Save to storage
        this.saveHistory();
    }

    /**
     * Process quick prompts with context
     */
    async processQuickPrompt(promptType) {
        const prompts = {
            'fcra': 'Can you explain the key requirements of FCRA Section 615(a) for adverse action notices in mortgage lending?',
            'denial_reasons': 'What are the most common FCRA-compliant denial reasons for mortgage applications, and how should they be worded?',
            'compliance_check': 'What are the critical compliance checkpoints I should review in every mortgage denial letter?',
            'ecoa': 'Explain the ECOA requirements for adverse action notices, including the anti-discrimination language that must be included.',
            'dti': 'How should I properly explain a debt-to-income ratio denial reason with specific numbers?',
            'credit_score': 'What information must be included when denying based on credit score under FCRA?'
        };
        
        const prompt = prompts[promptType] || promptType;
        return await this.sendMessage(prompt, { stream: false });
    }

    /**
     * Analyze denial letter for compliance
     */
    async analyzeLetter(letterContent) {
        const analysisPrompt = `Please analyze this mortgage denial letter for FCRA/ECOA compliance. Check for:

1. ✅ Required FCRA disclosures (if credit was used)
2. ✅ ECOA anti-discrimination notice (exact required language)
3. ✅ Specific reasons for denial (not vague)
4. ✅ Contact information for questions
5. ✅ Reconsideration process
6. ✅ 60-day timeline mention
7. ✅ Professional tone and format

Letter to analyze:
---
${letterContent}
---

Provide a detailed compliance analysis with:
- Overall compliance rating (Pass/Needs Work/Fail)
- List of requirements met ✅
- List of missing requirements ❌
- Specific recommendations for improvement
- Risk assessment (Low/Medium/High)`;

        return await this.sendMessage(analysisPrompt, { stream: false });
    }

    /**
     * Generate denial reason explanation
     */
    async generateReasonExplanation(reasonCode, details) {
        const prompt = `Generate a specific, FCRA-compliant explanation for denial reason ${reasonCode}.

Details provided:
${JSON.stringify(details, null, 2)}

Requirements:
- Include specific numbers, percentages, or dollar amounts
- Be clear and factual
- Avoid vague language
- Use professional but understandable language
- Follow FCRA/ECOA guidelines
- Keep to 2-3 sentences

Generate the explanation:`;

        return await this.sendMessage(prompt, { stream: false });
    }

    /**
     * Get suggestions for improving denial letter
     */
    async getSuggestions(letterContent, issues) {
        const prompt = `I have a mortgage denial letter with the following compliance issues:

${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

Original letter excerpt:
---
${letterContent.substring(0, 500)}...
---

Please provide specific, actionable suggestions to fix each issue while maintaining the professional tone and structure of the letter.`;

        return await this.sendMessage(prompt, { stream: false });
    }

    /**
     * Switch AI model
     */
    switchModel(modelKey) {
        const validModels = ['gemini-2.0-flash-exp', 'claude-sonnet-4', 'gpt-4o'];
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
            await puter.kv.set('mortgage_chat_history', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }

    /**
     * Load history from Puter.js storage
     */
    async loadHistory() {
        try {
            const data = await puter.kv.get('mortgage_chat_history');
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
            const role = msg.role === 'user' ? '👤 User' : '🤖 AI Assistant';
            return `[${timestamp}] ${role}:\n${msg.content}\n`;
        }).join('\n---\n\n');
        
        return `Mortgage Denial AI Chat - Conversation Export
Generated: ${new Date().toLocaleString()}
Model: ${this.currentModel}

${formatted}`;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.MortgageDenialChatBackend = MortgageDenialChatBackend;
}
