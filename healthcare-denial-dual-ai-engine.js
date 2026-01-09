/**
 * Healthcare Prior Authorization Denial Response System
 * Dual AI Engine Integration - Gemini 3.0 Pro + Claude Sonnet 4.5
 * Built with Puter.js for serverless, HIPAA-compliant operation
 */

class HealthcareDenialDualAIEngine {
    constructor() {
        this.initialized = false;
        this.currentModel = 'gemini-3-pro'; // Default to Gemini
        this.fallbackModel = 'claude-sonnet-4';
        
        // AI Engine Configuration
        this.engines = {
            gemini: {
                name: 'Gemini 3.0 Pro',
                model: 'gemini-3-pro',
                strengths: ['medical_research', 'clinical_analysis', 'policy_interpretation'],
                maxTokens: 8000,
                temperature: 0.3 // Lower for medical accuracy
            },
            claude: {
                name: 'Claude Sonnet 4.5',
                model: 'claude-sonnet-4',
                strengths: ['legal_writing', 'appeal_letters', 'compliance_review'],
                maxTokens: 8000,
                temperature: 0.4
            }
        };
        
        // Denial code database (CARC/RARC)
        this.denialCodes = this.initializeDenialCodes();
        
        // Payer-specific rules
        this.payerRules = this.initializePayerRules();
        
        // Performance tracking
        this.stats = {
            totalRequests: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            geminiUsage: 0,
            claudeUsage: 0,
            averageResponseTime: 0,
            modelPreferences: {}
        };
        
        this.loadStats();
    }

    /**
     * Initialize with Puter.js
     */
    async initialize() {
        if (this.initialized) return true;
        
        try {
            console.log('🏥 Initializing Healthcare Denial Dual AI Engine...');
            
            // Verify Puter.js is available
            if (typeof puter === 'undefined') {
                throw new Error('Puter.js not loaded');
            }
            
            // Test AI connections
            await this.testAIConnections();
            
            this.initialized = true;
            console.log('✅ Dual AI Engine initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Test both AI engine connections
     */
    async testAIConnections() {
        const tests = [];
        
        // Test Gemini
        try {
            const geminiResponse = await puter.ai.chat('Respond with "OK"', {
                model: 'gemini-3-pro'
            });
            tests.push({ engine: 'gemini', status: 'ok', response: geminiResponse });
            console.log('✅ Gemini 3.0 Pro connected');
        } catch (error) {
            tests.push({ engine: 'gemini', status: 'error', error: error.message });
            console.warn('⚠️ Gemini connection issue:', error.message);
        }
        
        // Test Claude
        try {
            const claudeResponse = await puter.ai.chat('Respond with "OK"', {
                model: 'claude-sonnet-4'
            });
            tests.push({ engine: 'claude', status: 'ok', response: claudeResponse });
            console.log('✅ Claude Sonnet 4.5 connected');
        } catch (error) {
            tests.push({ engine: 'claude', status: 'error', error: error.message });
            console.warn('⚠️ Claude connection issue:', error.message);
        }
        
        return tests;
    }

    /**
     * Initialize denial code database
     */
    initializeDenialCodes() {
        return {
            'CO-4': {
                code: 'CO-4',
                description: 'Procedure code inconsistent with modifier used',
                category: 'coding_error',
                appealStrategy: 'documentation_clarification',
                aiModel: 'claude' // Better for technical writing
            },
            'CO-11': {
                code: 'CO-11',
                description: 'Diagnosis inconsistent with procedure',
                category: 'medical_necessity',
                appealStrategy: 'clinical_justification',
                aiModel: 'gemini' // Better for clinical analysis
            },
            'CO-16': {
                code: 'CO-16',
                description: 'Claim lacks information',
                category: 'documentation',
                appealStrategy: 'information_supplement',
                aiModel: 'claude'
            },
            'CO-18': {
                code: 'CO-18',
                description: 'Duplicate claim/service',
                category: 'administrative',
                appealStrategy: 'clarification',
                aiModel: 'claude'
            },
            'CO-29': {
                code: 'CO-29',
                description: 'Time limit for filing has expired',
                category: 'timely_filing',
                appealStrategy: 'good_cause_argument',
                aiModel: 'claude'
            },
            'CO-50': {
                code: 'CO-50',
                description: 'Non-covered service',
                category: 'coverage',
                appealStrategy: 'policy_exception',
                aiModel: 'gemini'
            },
            'CO-96': {
                code: 'CO-96',
                description: 'Non-covered charge',
                category: 'coverage',
                appealStrategy: 'medical_necessity',
                aiModel: 'gemini'
            },
            'CO-97': {
                code: 'CO-97',
                description: 'Payment included in another service',
                category: 'bundling',
                appealStrategy: 'unbundling_justification',
                aiModel: 'claude'
            },
            'CO-197': {
                code: 'CO-197',
                description: 'Precertification/authorization absent',
                category: 'prior_authorization',
                appealStrategy: 'retroactive_authorization',
                aiModel: 'gemini'
            },
            'PR-1': {
                code: 'PR-1',
                description: 'Deductible amount',
                category: 'patient_responsibility',
                appealStrategy: 'benefit_verification',
                aiModel: 'claude'
            },
            'PR-2': {
                code: 'PR-2',
                description: 'Coinsurance amount',
                category: 'patient_responsibility',
                appealStrategy: 'benefit_clarification',
                aiModel: 'claude'
            }
        };
    }

    /**
     * Initialize payer-specific rules
     */
    initializePayerRules() {
        return {
            'unitedhealthcare': {
                name: 'UnitedHealthcare',
                code: 'UHC',
                appealDeadline: 180,
                expeditedDeadline: 72,
                preferredFormat: 'formal_letter',
                requiredSections: [
                    'member_information',
                    'claim_details',
                    'clinical_rationale',
                    'policy_reference',
                    'provider_signature'
                ],
                aiModel: 'claude', // Prefers formal legal structure
                guidelines: {
                    tone: 'professional',
                    length: '2-3 pages',
                    citations: 'required',
                    attachments: 'clinical_records'
                }
            },
            'aetna': {
                name: 'Aetna',
                code: 'AET',
                appealDeadline: 180,
                expeditedDeadline: 48,
                preferredFormat: 'structured_appeal',
                requiredSections: [
                    'denial_reference',
                    'medical_necessity',
                    'clinical_evidence',
                    'policy_compliance'
                ],
                aiModel: 'gemini', // Better for clinical evidence
                guidelines: {
                    tone: 'clinical',
                    length: '1-2 pages',
                    citations: 'evidence_based',
                    attachments: 'supporting_documents'
                }
            },
            'bcbs': {
                name: 'Blue Cross Blue Shield',
                code: 'BCBS',
                appealDeadline: 180,
                expeditedDeadline: 72,
                preferredFormat: 'comprehensive_letter',
                requiredSections: [
                    'patient_information',
                    'service_details',
                    'medical_justification',
                    'regulatory_compliance'
                ],
                aiModel: 'gemini',
                guidelines: {
                    tone: 'balanced',
                    length: '2-4 pages',
                    citations: 'guidelines_and_research',
                    attachments: 'comprehensive'
                }
            },
            'cigna': {
                name: 'Cigna',
                code: 'CIG',
                appealDeadline: 180,
                expeditedDeadline: 72,
                preferredFormat: 'clinical_letter',
                requiredSections: [
                    'claim_information',
                    'clinical_rationale',
                    'treatment_alternatives',
                    'outcomes_data'
                ],
                aiModel: 'gemini',
                guidelines: {
                    tone: 'evidence_based',
                    length: '2-3 pages',
                    citations: 'clinical_trials',
                    attachments: 'research_support'
                }
            },
            'humana': {
                name: 'Humana',
                code: 'HUM',
                appealDeadline: 180,
                expeditedDeadline: 72,
                preferredFormat: 'standard_appeal',
                requiredSections: [
                    'member_details',
                    'denial_reason',
                    'clinical_justification',
                    'provider_credentials'
                ],
                aiModel: 'claude',
                guidelines: {
                    tone: 'professional',
                    length: '1-2 pages',
                    citations: 'moderate',
                    attachments: 'standard'
                }
            },
            'medicare': {
                name: 'Medicare',
                code: 'CMS',
                appealDeadline: 120,
                expeditedDeadline: 72,
                preferredFormat: 'cms_compliant',
                requiredSections: [
                    'beneficiary_information',
                    'lcd_ncd_reference',
                    'medical_necessity',
                    'provider_information'
                ],
                aiModel: 'gemini',
                guidelines: {
                    tone: 'regulatory_compliant',
                    length: '2-3 pages',
                    citations: 'cms_guidelines',
                    attachments: 'required_documentation'
                }
            }
        };
    }

    /**
     * Select optimal AI engine based on denial type and payer
     */
    selectOptimalEngine(denialData) {
        const { denialCode, payer, appealType } = denialData;
        
        let selectedEngine = this.currentModel;
        let reason = 'default';
        
        // Check denial code preference
        if (denialCode && this.denialCodes[denialCode]) {
            const codeInfo = this.denialCodes[denialCode];
            if (codeInfo.aiModel === 'gemini') {
                selectedEngine = 'gemini-3-pro';
                reason = 'denial_code_specialty';
            } else if (codeInfo.aiModel === 'claude') {
                selectedEngine = 'claude-sonnet-4';
                reason = 'denial_code_specialty';
            }
        }
        
        // Check payer preference
        if (payer && this.payerRules[payer.toLowerCase()]) {
            const payerInfo = this.payerRules[payer.toLowerCase()];
            if (payerInfo.aiModel === 'gemini') {
                selectedEngine = 'gemini-3-pro';
                reason = 'payer_preference';
            } else if (payerInfo.aiModel === 'claude') {
                selectedEngine = 'claude-sonnet-4';
                reason = 'payer_preference';
            }
        }
        
        // Check appeal type
        if (appealType) {
            if (appealType === 'clinical_analysis' || appealType === 'medical_research') {
                selectedEngine = 'gemini-3-pro';
                reason = 'appeal_type';
            } else if (appealType === 'legal_appeal' || appealType === 'formal_letter') {
                selectedEngine = 'claude-sonnet-4';
                reason = 'appeal_type';
            }
        }
        
        return { engine: selectedEngine, reason };
    }

    /**
     * Save statistics to Puter KV
     */
    async saveStats() {
        try {
            await puter.kv.set('healthcare_denial_stats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Failed to save stats:', error);
        }
    }

    /**
     * Load statistics from Puter KV
     */
    async loadStats() {
        try {
            const data = await puter.kv.get('healthcare_denial_stats');
            if (data) {
                this.stats = JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    /**
     * Generate appeal letter using optimal AI engine
     */
    async generateAppealLetter(denialData, options = {}) {
        const startTime = Date.now();
        this.stats.totalRequests++;
        
        try {
            console.log('🏥 Generating appeal letter...');
            
            // Select optimal engine
            const { engine, reason } = this.selectOptimalEngine(denialData);
            console.log(`🤖 Selected ${engine} (reason: ${reason})`);
            
            // Track engine usage
            if (engine.includes('gemini')) {
                this.stats.geminiUsage++;
            } else {
                this.stats.claudeUsage++;
            }
            
            // Build comprehensive prompt
            const prompt = this.buildAppealPrompt(denialData, engine);
            
            // Generate with selected engine
            const response = await this.callAIEngine(engine, prompt, {
                stream: options.stream || false,
                temperature: engine.includes('gemini') ? 0.3 : 0.4
            });
            
            // Track success
            this.stats.successfulGenerations++;
            const responseTime = Date.now() - startTime;
            this.updateAverageResponseTime(responseTime);
            
            await this.saveStats();
            
            return {
                success: true,
                content: response,
                engine: engine,
                responseTime: responseTime,
                metadata: {
                    denialCode: denialData.denialCode,
                    payer: denialData.payer,
                    selectionReason: reason
                }
            };
            
        } catch (error) {
            this.stats.failedGenerations++;
            await this.saveStats();
            
            console.error('❌ Generation failed:', error);
            
            // Try fallback engine if available
            if (options.allowFallback !== false) {
                console.log('🔄 Attempting fallback engine...');
                return await this.generateWithFallback(denialData, options);
            }
            
            throw error;
        }
    }

    /**
     * Build comprehensive appeal prompt
     */
    buildAppealPrompt(denialData, engine) {
        const {
            patientName,
            memberId,
            dob,
            claimNumber,
            authNumber,
            payer,
            denialCode,
            denialReason,
            procedure,
            cptCode,
            icdCode,
            diagnosis,
            serviceDate,
            claimAmount,
            clinicalJustification,
            priorTreatments
        } = denialData;
        
        // Get payer-specific guidelines
        const payerKey = payer ? payer.toLowerCase().replace(/\s+/g, '') : null;
        const payerInfo = payerKey ? this.payerRules[payerKey] : null;
        
        // Get denial code info
        const denialInfo = this.denialCodes[denialCode];
        
        let prompt = '';
        
        // Engine-specific system context
        if (engine.includes('gemini')) {
            prompt += `You are an expert healthcare denial management specialist with deep knowledge of clinical medicine, medical research, insurance policies, and appeals processes. Generate a comprehensive, evidence-based prior authorization appeal letter.\n\n`;
        } else {
            prompt += `You are an expert healthcare appeals attorney and medical billing specialist with extensive experience crafting legally sound, professionally formatted appeal letters for insurance denials. Generate a formal, compelling appeal letter.\n\n`;
        }
        
        // Core denial information
        prompt += `DENIAL DETAILS:\n`;
        prompt += `- Claim Number: ${claimNumber || 'N/A'}\n`;
        prompt += `- Prior Auth Number: ${authNumber || 'N/A'}\n`;
        prompt += `- Patient: ${patientName} (Member ID: ${memberId})\n`;
        if (dob) prompt += `- Date of Birth: ${dob}\n`;
        prompt += `- Insurance Payer: ${payer}\n`;
        prompt += `- Denial Code: ${denialCode}\n`;
        prompt += `- Denial Reason: ${denialReason || denialInfo?.description || 'Not specified'}\n`;
        prompt += `- Service/Procedure: ${procedure} (CPT: ${cptCode})\n`;
        prompt += `- Diagnosis: ${diagnosis} (ICD-10: ${icdCode})\n`;
        prompt += `- Service Date: ${serviceDate}\n`;
        prompt += `- Claim Amount: ${claimAmount}\n\n`;
        
        // Clinical context
        if (clinicalJustification) {
            prompt += `CLINICAL JUSTIFICATION:\n${clinicalJustification}\n\n`;
        }
        
        if (priorTreatments) {
            prompt += `PRIOR TREATMENTS:\n${priorTreatments}\n\n`;
        }
        
        // Payer-specific requirements
        if (payerInfo) {
            prompt += `PAYER-SPECIFIC REQUIREMENTS (${payerInfo.name}):\n`;
            prompt += `- Appeal Deadline: ${payerInfo.appealDeadline} days\n`;
            prompt += `- Preferred Format: ${payerInfo.preferredFormat}\n`;
            prompt += `- Required Sections: ${payerInfo.requiredSections.join(', ')}\n`;
            prompt += `- Tone: ${payerInfo.guidelines.tone}\n`;
            prompt += `- Length: ${payerInfo.guidelines.length}\n`;
            prompt += `- Citations: ${payerInfo.guidelines.citations}\n\n`;
        }
        
        // Denial-specific guidance
        if (denialInfo) {
            prompt += `APPEAL STRATEGY:\n`;
            prompt += `- Category: ${denialInfo.category}\n`;
            prompt += `- Recommended Strategy: ${denialInfo.appealStrategy}\n\n`;
        }
        
        // Generation instructions
        prompt += `INSTRUCTIONS:\n`;
        prompt += `Generate a professional appeal letter with the following structure:\n\n`;
        prompt += `1. HEADER\n`;
        prompt += `   - Date\n`;
        prompt += `   - Payer address block\n`;
        prompt += `   - RE: Appeal for Claim ${claimNumber}\n\n`;
        prompt += `2. OPENING PARAGRAPH\n`;
        prompt += `   - State purpose of appeal\n`;
        prompt += `   - Reference denial date and reason\n`;
        prompt += `   - Express intent to provide additional information\n\n`;
        prompt += `3. PATIENT AND SERVICE INFORMATION\n`;
        prompt += `   - Patient demographics\n`;
        prompt += `   - Service details and dates\n`;
        prompt += `   - Relevant medical history\n\n`;
        prompt += `4. CLINICAL RATIONALE\n`;
        prompt += `   - Medical necessity argument\n`;
        prompt += `   - Clinical evidence and research support\n`;
        prompt += `   - Treatment alternatives considered\n`;
        prompt += `   - Expected outcomes and benefits\n\n`;
        prompt += `5. POLICY COMPLIANCE\n`;
        prompt += `   - Reference specific policy criteria\n`;
        prompt += `   - Demonstrate how criteria are met\n`;
        prompt += `   - Address any administrative requirements\n\n`;
        prompt += `6. SUPPORTING DOCUMENTATION\n`;
        prompt += `   - List of attached documents\n`;
        prompt += `   - Clinical notes, lab results, imaging\n`;
        prompt += `   - Literature references if applicable\n\n`;
        prompt += `7. CONCLUSION\n`;
        prompt += `   - Restate appeal request\n`;
        prompt += `   - Request for expedited review if urgent\n`;
        prompt += `   - Provider contact information\n\n`;
        prompt += `8. SIGNATURE BLOCK\n`;
        prompt += `   - Provider name and credentials\n`;
        prompt += `   - NPI number\n`;
        prompt += `   - Contact information\n\n`;
        
        if (engine.includes('gemini')) {
            prompt += `Focus on:\n`;
            prompt += `- Clinical evidence and medical research\n`;
            prompt += `- Evidence-based medicine principles\n`;
            prompt += `- Detailed medical reasoning\n`;
            prompt += `- Scientific citations where appropriate\n`;
        } else {
            prompt += `Focus on:\n`;
            prompt += `- Professional legal formatting\n`;
            prompt += `- Clear, persuasive argumentation\n`;
            prompt += `- Regulatory compliance language\n`;
            prompt += `- Formal business letter structure\n`;
        }
        
        prompt += `\nGenerate the complete appeal letter now:`;
        
        return prompt;
    }

    /**
     * Call AI engine with proper error handling
     */
    async callAIEngine(engine, prompt, options = {}) {
        try {
            if (options.stream) {
                // Return streaming response
                return puter.ai.chat(prompt, {
                    model: engine,
                    stream: true,
                    temperature: options.temperature || 0.3
                });
            } else {
                // Return complete response
                const response = await puter.ai.chat(prompt, {
                    model: engine,
                    temperature: options.temperature || 0.3
                });
                return response;
            }
        } catch (error) {
            console.error(`Engine ${engine} failed:`, error);
            throw error;
        }
    }

    /**
     * Generate with fallback engine
     */
    async generateWithFallback(denialData, options = {}) {
        const fallbackEngine = this.currentModel.includes('gemini') 
            ? 'claude-sonnet-4' 
            : 'gemini-3-pro';
        
        console.log(`🔄 Using fallback: ${fallbackEngine}`);
        
        const prompt = this.buildAppealPrompt(denialData, fallbackEngine);
        const response = await this.callAIEngine(fallbackEngine, prompt, options);
        
        return {
            success: true,
            content: response,
            engine: fallbackEngine,
            isFallback: true
        };
    }

    /**
     * Generate clinical analysis using Gemini (medical research specialty)
     */
    async generateClinicalAnalysis(denialData) {
        console.log('🔬 Generating clinical analysis with Gemini...');
        
        const prompt = `As a medical research specialist, provide a detailed clinical analysis for this denied claim:

Procedure: ${denialData.procedure} (${denialData.cptCode})
Diagnosis: ${denialData.diagnosis} (${denialData.icdCode})
Denial Reason: ${denialData.denialReason}

Provide:
1. Medical necessity justification
2. Current evidence-based guidelines
3. Relevant clinical studies and outcomes data
4. Alternative treatments considered and why this is optimal
5. Expected benefits and risk assessment

Focus on clinical evidence and medical literature.`;

        const response = await this.callAIEngine('gemini-3-pro', prompt);
        return response;
    }

    /**
     * Generate legal appeal using Claude (legal writing specialty)
     */
    async generateLegalAppeal(denialData) {
        console.log('⚖️ Generating legal appeal with Claude...');
        
        const prompt = `As a healthcare appeals attorney, draft a formal legal appeal letter for this denial:

${JSON.stringify(denialData, null, 2)}

Create a professionally formatted appeal letter that:
1. Follows proper legal letter format
2. References applicable regulations and policies
3. Builds a persuasive legal argument
4. Addresses procedural compliance
5. Requests specific relief

Use formal legal language and structure.`;

        const response = await this.callAIEngine('claude-sonnet-4', prompt);
        return response;
    }

    /**
     * Peer-to-peer review preparation (uses both engines)
     */
    async generatePeerToPeerScript(denialData) {
        console.log('👥 Generating peer-to-peer script (dual AI)...');
        
        // Use Gemini for clinical talking points
        const clinicalPrompt = `Generate key clinical talking points for a peer-to-peer review call:

Procedure: ${denialData.procedure}
Diagnosis: ${denialData.diagnosis}
Denial: ${denialData.denialReason}

Provide concise, evidence-based points a physician should emphasize.`;

        const clinicalPoints = await this.callAIEngine('gemini-3-pro', clinicalPrompt);
        
        // Use Claude for conversational structure
        const structurePrompt = `Based on these clinical points, create a structured peer-to-peer call script:

${clinicalPoints}

Format as a conversational guide with:
- Opening statement
- Key points to emphasize
- Anticipated objections and responses
- Closing request`;

        const fullScript = await this.callAIEngine('claude-sonnet-4', structurePrompt);
        
        return {
            clinicalPoints: clinicalPoints,
            fullScript: fullScript,
            engines: ['gemini-3-pro', 'claude-sonnet-4']
        };
    }

    /**
     * Update average response time
     */
    updateAverageResponseTime(newTime) {
        const totalTime = this.stats.averageResponseTime * (this.stats.totalRequests - 1);
        this.stats.averageResponseTime = (totalTime + newTime) / this.stats.totalRequests;
    }

    /**
     * Get engine statistics
     */
    getStats() {
        return {
            ...this.stats,
            geminiPercentage: this.stats.totalRequests > 0 
                ? ((this.stats.geminiUsage / this.stats.totalRequests) * 100).toFixed(1) 
                : 0,
            claudePercentage: this.stats.totalRequests > 0 
                ? ((this.stats.claudeUsage / this.stats.totalRequests) * 100).toFixed(1) 
                : 0,
            successRate: this.stats.totalRequests > 0 
                ? ((this.stats.successfulGenerations / this.stats.totalRequests) * 100).toFixed(1) 
                : 0
        };
    }

    /**
     * Get denial code information
     */
    getDenialCodeInfo(code) {
        return this.denialCodes[code] || null;
    }

    /**
     * Get payer rules
     */
    getPayerRules(payerName) {
        const key = payerName ? payerName.toLowerCase().replace(/\s+/g, '') : null;
        return key ? this.payerRules[key] : null;
    }

    /**
     * List all supported payers
     */
    getSupportedPayers() {
        return Object.values(this.payerRules);
    }

    /**
     * List all denial codes
     */
    getSupportedDenialCodes() {
        return Object.values(this.denialCodes);
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.HealthcareDenialDualAIEngine = HealthcareDenialDualAIEngine;
}
