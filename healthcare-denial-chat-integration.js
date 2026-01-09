/**
 * Healthcare Denial Chat Integration
 * Real-time chat interface with dual AI backend (Gemini + Claude)
 * Integrated with document generation system
 */

class HealthcareDenialChatIntegration {
    constructor(dualAIEngine) {
        this.aiEngine = dualAIEngine;
        this.conversationHistory = [];
        this.maxHistoryLength = 30;
        this.currentContext = null; // Current denial being discussed
        this.activeDenialData = {}; // Store denial data extracted from chat
        
        this.quickResponses = this.initializeQuickResponses();
    }

    /**
     * Initialize quick response templates
     */
    initializeQuickResponses() {
        return {
            'medical_necessity': {
                trigger: ['medical necessity', 'why denied', 'not medically necessary'],
                response: 'This denial is for medical necessity. I can help you build a strong appeal by:\n1. Gathering clinical evidence\n2. Reviewing payer policies\n3. Generating an evidence-based appeal letter\n\nWhat information do you have about the patient\'s condition?'
            },
            'prior_auth': {
                trigger: ['prior auth', 'authorization', 'precert', 'PA required'],
                response: 'This is a prior authorization issue. We can pursue:\n1. Retroactive authorization request\n2. Appeal based on urgent/emergent circumstances\n3. Documentation of good faith effort\n\nWas this an emergency or urgent situation?'
            },
            'documentation': {
                trigger: ['missing docs', 'documentation', 'records', 'information missing'],
                response: 'This appears to be a documentation issue. I can help you:\n1. Identify exactly what\'s missing\n2. Gather the required documentation\n3. Format a proper resubmission\n\nWhat documents do you currently have?'
            },
            'timely_filing': {
                trigger: ['time limit', 'too late', 'timely filing', 'deadline'],
                response: 'Timely filing denials can be challenging. Your options:\n1. Good cause exception (if applicable)\n2. Demonstrate timely submission to clearinghouse\n3. Appeal based on payer delay\n\nWhen was the service rendered and when did you submit?'
            }
        };
    }

    /**
     * Process chat message with intelligent routing
     */
    async processMessage(userMessage, options = {}) {
        const startTime = Date.now();
        
        try {
            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage,
                timestamp: new Date().toISOString()
            });
            
            // Trim history if too long
            if (this.conversationHistory.length > this.maxHistoryLength) {
                this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
            }
            
            // Extract denial information from message
            await this.extractDenialInfo(userMessage);
            
            // Detect intent
            const intent = this.detectIntent(userMessage);
            
            // Select optimal AI engine based on intent
            const engine = this.selectEngineForIntent(intent);
            
            // Build context-aware prompt
            const prompt = this.buildChatPrompt(userMessage, intent, engine);
            
            // Get response from selected engine
            const response = await this.getAIResponse(engine, prompt, options);
            
            // Add to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: response.content,
                engine: response.engine,
                timestamp: new Date().toISOString()
            });
            
            // Save conversation to Puter KV
            await this.saveConversation();
            
            return {
                success: true,
                content: response.content,
                engine: response.engine,
                intent: intent,
                responseTime: Date.now() - startTime,
                suggestions: this.generateSuggestions(intent)
            };
            
        } catch (error) {
            console.error('Chat processing error:', error);
            throw error;
        }
    }

    /**
     * Extract denial information from conversation
     */
    async extractDenialInfo(message) {
        // Look for key patterns
        const patterns = {
            claimNumber: /claim\s*(?:number|#|num)?\s*:?\s*([A-Z0-9-]+)/i,
            patientName: /patient\s*(?:name)?\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
            memberId: /member\s*(?:id|#|num)?\s*:?\s*([A-Z0-9-]+)/i,
            payer: /payer|insurance|carrier\s*:?\s*(UnitedHealthcare|Aetna|Blue\s*Cross|BCBS|Cigna|Humana|Medicare|Medicaid)/i,
            denialCode: /(CO|PR)-\d+/i,
            cptCode: /CPT\s*:?\s*(\d{5})/i,
            icdCode: /ICD[-\s]*10?\s*:?\s*([A-Z]\d{2}\.?\d*)/i,
            procedure: /procedure|service\s*:?\s*([A-Za-z\s]+(?:MRI|CT|surgery|therapy|catheterization)[A-Za-z\s]*)/i,
            diagnosis: /diagnosis|dx\s*:?\s*([A-Za-z\s,]+)/i,
            amount: /amount|charge\s*:?\s*\$?([\d,]+\.?\d{0,2})/i
        };
        
        // Extract and store
        for (const [key, pattern] of Object.entries(patterns)) {
            const match = message.match(pattern);
            if (match) {
                this.activeDenialData[key] = match[1].trim();
                console.log(`📋 Extracted ${key}: ${match[1].trim()}`);
            }
        }
        
        // Check if we have enough data to generate
        if (this.hasMinimumDenialData()) {
            console.log('✅ Sufficient denial data collected for generation');
        }
    }

    /**
     * Check if we have minimum required data
     */
    hasMinimumDenialData() {
        const required = ['patientName', 'payer', 'procedure'];
        return required.every(field => this.activeDenialData[field]);
    }

    /**
     * Detect user intent from message
     */
    detectIntent(message) {
        const lower = message.toLowerCase();
        
        // Intent patterns
        if (lower.match(/generate|create|write|draft|appeal letter/)) {
            return 'generate_appeal';
        }
        if (lower.match(/clinical|medical|evidence|research|studies/)) {
            return 'clinical_analysis';
        }
        if (lower.match(/legal|compliance|regulation|policy|law/)) {
            return 'legal_guidance';
        }
        if (lower.match(/payer|insurance|policy|guidelines|requirements/)) {
            return 'payer_rules';
        }
        if (lower.match(/peer.to.peer|p2p|call|phone/)) {
            return 'peer_to_peer';
        }
        if (lower.match(/deadline|timeline|when|how long|urgent/)) {
            return 'timeline_inquiry';
        }
        if (lower.match(/success|chance|likely|probability|rate/)) {
            return 'success_prediction';
        }
        if (lower.match(/help|how|what|guide|explain/)) {
            return 'guidance';
        }
        
        return 'general_inquiry';
    }

    /**
     * Select optimal engine for intent
     */
    selectEngineForIntent(intent) {
        const engineMap = {
            'clinical_analysis': 'gemini-3-pro',
            'generate_appeal': 'auto', // Let dual engine decide
            'legal_guidance': 'claude-sonnet-4',
            'payer_rules': 'gemini-3-pro',
            'peer_to_peer': 'gemini-3-pro',
            'timeline_inquiry': 'claude-sonnet-4',
            'success_prediction': 'gemini-3-pro',
            'guidance': 'claude-sonnet-4',
            'general_inquiry': 'claude-sonnet-4'
        };
        
        return engineMap[intent] || 'claude-sonnet-4';
    }

    /**
     * Build context-aware chat prompt
     */
    buildChatPrompt(userMessage, intent, engine) {
        let systemContext = '';
        
        // Engine-specific system context
        if (engine.includes('gemini')) {
            systemContext = `You are an expert healthcare denial management specialist with deep knowledge of clinical medicine, medical research, insurance policies, and evidence-based practice. You help healthcare providers understand and appeal insurance denials.`;
        } else {
            systemContext = `You are an expert healthcare appeals consultant with extensive experience in medical billing, insurance regulations, and appeal letter writing. You provide practical, actionable guidance for overturning denials.`;
        }
        
        // Add conversation context
        let prompt = systemContext + '\n\n';
        
        // Add current denial context if available
        if (Object.keys(this.activeDenialData).length > 0) {
            prompt += 'CURRENT DENIAL CONTEXT:\n';
            for (const [key, value] of Object.entries(this.activeDenialData)) {
                prompt += `- ${key}: ${value}\n`;
            }
            prompt += '\n';
        }
        
        // Add recent conversation history (last 5 exchanges)
        const recentHistory = this.conversationHistory.slice(-10);
        if (recentHistory.length > 0) {
            prompt += 'CONVERSATION HISTORY:\n';
            recentHistory.forEach(msg => {
                prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
            });
            prompt += '\n';
        }
        
        // Intent-specific instructions
        prompt += this.getIntentInstructions(intent) + '\n\n';
        
        // Current user message
        prompt += `User: ${userMessage}\n\nAssistant:`;
        
        return prompt;
    }

    /**
     * Get intent-specific instructions
     */
    getIntentInstructions(intent) {
        const instructions = {
            'generate_appeal': 'The user wants to generate an appeal letter. If you have sufficient information, offer to generate it. If not, ask for the missing details (patient name, payer, procedure, denial reason).',
            'clinical_analysis': 'Provide detailed clinical analysis with evidence-based reasoning. Include relevant medical literature, guidelines, and clinical studies.',
            'legal_guidance': 'Provide clear legal guidance on appeal rights, regulations, and compliance requirements. Use formal language.',
            'payer_rules': 'Explain the specific payer\'s appeal requirements, deadlines, and documentation needs. Be specific and practical.',
            'peer_to_peer': 'Help prepare for a peer-to-peer review. Focus on key clinical talking points and anticipated questions.',
            'timeline_inquiry': 'Provide clear timeline information including deadlines, expedited options, and urgency factors.',
            'success_prediction': 'Provide realistic success rate estimates based on the denial type, payer, and available evidence.',
            'guidance': 'Provide step-by-step guidance in clear, practical terms.',
            'general_inquiry': 'Answer the question directly and offer to help with the appeal process.'
        };
        
        return instructions[intent] || 'Provide helpful, accurate information about the denial and appeal process.';
    }

    /**
     * Get AI response from selected engine
     */
    async getAIResponse(engine, prompt, options = {}) {
        try {
            if (engine === 'auto') {
                // Use dual AI engine to select optimal
                const denialData = this.activeDenialData;
                return await this.aiEngine.generateAppealLetter(denialData, options);
            }
            
            // Use specific engine
            if (options.stream) {
                const stream = await puter.ai.chat(prompt, {
                    model: engine,
                    stream: true,
                    temperature: 0.4
                });
                return { content: stream, engine: engine, isStream: true };
            } else {
                const response = await puter.ai.chat(prompt, {
                    model: engine,
                    temperature: 0.4
                });
                return { content: response, engine: engine, isStream: false };
            }
            
        } catch (error) {
            console.error('AI response error:', error);
            throw error;
        }
    }

    /**
     * Generate contextual suggestions
     */
    generateSuggestions(intent) {
        const suggestionMap = {
            'generate_appeal': [
                'Review generated letter for accuracy',
                'Add supporting clinical documentation',
                'Request peer-to-peer review',
                'Check payer-specific requirements'
            ],
            'clinical_analysis': [
                'Generate full appeal letter',
                'Find supporting research studies',
                'Review treatment alternatives',
                'Prepare for peer-to-peer call'
            ],
            'legal_guidance': [
                'Review payer contract terms',
                'Check state appeal rights',
                'Consider external review',
                'Document all communications'
            ],
            'payer_rules': [
                'Check specific appeal deadlines',
                'Review required documentation',
                'Understand expedited options',
                'Find payer contact information'
            ],
            'general_inquiry': [
                'Start building appeal letter',
                'Review denial reason',
                'Check payer requirements',
                'Estimate success probability'
            ]
        };
        
        return suggestionMap[intent] || [
            'Tell me more about the denial',
            'What\'s the procedure/service?',
            'Who is the insurance payer?',
            'Would you like to generate an appeal?'
        ];
    }

    /**
     * Generate appeal from current context
     */
    async generateAppealFromChat(options = {}) {
        if (!this.hasMinimumDenialData()) {
            throw new Error('Insufficient denial data. Please provide at least patient name, payer, and procedure.');
        }
        
        console.log('📝 Generating appeal from chat context...');
        
        return await this.aiEngine.generateAppealLetter(this.activeDenialData, options);
    }

    /**
     * Get clinical analysis from Gemini
     */
    async getClinicalAnalysis() {
        if (!this.activeDenialData.procedure || !this.activeDenialData.diagnosis) {
            throw new Error('Need procedure and diagnosis for clinical analysis');
        }
        
        return await this.aiEngine.generateClinicalAnalysis(this.activeDenialData);
    }

    /**
     * Get legal appeal from Claude
     */
    async getLegalAppeal() {
        if (!this.hasMinimumDenialData()) {
            throw new Error('Insufficient data for legal appeal');
        }
        
        return await this.aiEngine.generateLegalAppeal(this.activeDenialData);
    }

    /**
     * Get peer-to-peer script
     */
    async getPeerToPeerScript() {
        if (!this.activeDenialData.procedure) {
            throw new Error('Need procedure information for peer-to-peer script');
        }
        
        return await this.aiEngine.generatePeerToPeerScript(this.activeDenialData);
    }

    /**
     * Save conversation to Puter KV
     */
    async saveConversation() {
        try {
            const conversationData = {
                history: this.conversationHistory,
                denialData: this.activeDenialData,
                timestamp: new Date().toISOString()
            };
            
            await puter.kv.set(
                `healthcare_denial_chat_${Date.now()}`,
                JSON.stringify(conversationData)
            );
        } catch (error) {
            console.error('Failed to save conversation:', error);
        }
    }

    /**
     * Load previous conversation
     */
    async loadConversation(conversationId) {
        try {
            const data = await puter.kv.get(conversationId);
            if (data) {
                const parsed = JSON.parse(data);
                this.conversationHistory = parsed.history || [];
                this.activeDenialData = parsed.denialData || {};
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load conversation:', error);
            return false;
        }
    }

    /**
     * Clear conversation
     */
    clearConversation() {
        this.conversationHistory = [];
        this.activeDenialData = {};
        console.log('🔄 Conversation cleared');
    }

    /**
     * Get current denial data
     */
    getCurrentDenialData() {
        return { ...this.activeDenialData };
    }

    /**
     * Set denial data directly
     */
    setDenialData(denialData) {
        this.activeDenialData = { ...denialData };
        console.log('📋 Denial data set directly');
    }

    /**
     * Get conversation summary
     */
    getConversationSummary() {
        return {
            messageCount: this.conversationHistory.length,
            denialDataFields: Object.keys(this.activeDenialData).length,
            isReadyForGeneration: this.hasMinimumDenialData(),
            lastMessage: this.conversationHistory[this.conversationHistory.length - 1]
        };
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.HealthcareDenialChatIntegration = HealthcareDenialChatIntegration;
}
