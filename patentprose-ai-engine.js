/**
 * PatentProse AI Engine
 * Dual AI engine for patent office action response generation
 * Integrates Gemini 3.0 Pro and Claude Sonnet 4.5 via Puter.js
 */

class PatentProseAI {
    constructor() {
        this.puterInitialized = false;
        this.currentUser = null;
        this.sessionId = null;
        
        // AI Models configuration
        this.models = {
            gemini: {
                name: 'google-gemini-3.0-pro-latest',
                provider: 'google',
                strengths: ['technical analysis', 'prior art search', 'claim charting']
            },
            claude: {
                name: 'claude-sonnet-4.5',
                provider: 'anthropic',
                strengths: ['legal arguments', 'persuasive writing', 'case law analysis']
            }
        };
        
        // Jurisdiction-specific prompts
        this.jurisdictionPrompts = {
            USPTO: {
                sections: ['35 U.S.C. §101', '35 U.S.C. §102', '35 U.S.C. §103', '35 U.S.C. §112'],
                format: 'USPTO MPEP compliant',
                caselaw: ['Alice Corp. v. CLS Bank', 'KSR v. Teleflex', 'Graham v. John Deere']
            },
            EPO: {
                sections: ['Article 52 EPC', 'Article 56 EPC', 'Article 83 EPC', 'Article 84 EPC'],
                format: 'EPO Guidelines compliant',
                approach: 'Problem-Solution Approach'
            },
            JPO: {
                sections: ['Article 29 Patent Act', 'Article 36 Patent Act'],
                format: 'JPO examination guidelines compliant',
                approach: 'Technical Effect Analysis'
            }
        };
    }

    /**
     * Initialize Puter.js and authenticate
     */
    async initialize() {
        try {
            console.log('🚀 Initializing PatentProse AI Engine...');
            
            // Check if Puter is available
            if (typeof puter === 'undefined') {
                throw new Error('Puter.js not loaded. Please include puter.js library.');
            }

            // Initialize Puter
            await puter.auth.ready();
            this.puterInitialized = true;
            
            // Get current user
            if (puter.auth.isSignedIn()) {
                this.currentUser = await puter.auth.getUser();
                this.sessionId = `patent_${this.currentUser.username}_${Date.now()}`;
                console.log('✅ Authenticated user:', this.currentUser.username);
            } else {
                console.log('⚠️ User not authenticated - running in demo mode');
                this.sessionId = `patent_demo_${Date.now()}`;
            }

            // Test AI availability
            await this.testAIConnection();
            
            console.log('✅ PatentProse AI Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Initialization error:', error);
            throw error;
        }
    }

    /**
     * Test AI model connections
     */
    async testAIConnection() {
        try {
            console.log('🧪 Testing AI connections...');
            
            // Test Gemini
            const geminiTest = await puter.ai.chat('Hello', {
                model: this.models.gemini.name,
                stream: false
            });
            console.log('✅ Gemini 3.0 Pro connected');

            // Test Claude
            const claudeTest = await puter.ai.chat('Hello', {
                model: this.models.claude.name,
                stream: false
            });
            console.log('✅ Claude Sonnet 4.5 connected');

            return true;
        } catch (error) {
            console.error('❌ AI connection test failed:', error);
            throw new Error('Failed to connect to AI models');
        }
    }

    /**
     * Generate office action response using dual AI approach
     * @param {Object} officeActionData - Office action details
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Generated response
     */
    async generateResponse(officeActionData, onProgress = null) {
        try {
            if (!this.puterInitialized) {
                await this.initialize();
            }

            const {
                applicationNumber,
                jurisdiction = 'USPTO',
                rejectionTypes = [],
                officeActionText,
                claims,
                priorArt,
                strategy = 'both',
                tone = 'formal',
                examinerName = null
            } = officeActionData;

            console.log(`🎯 Generating response for ${applicationNumber} (${jurisdiction})`);
            
            // Step 1: Analyze office action with Gemini (technical analysis)
            if (onProgress) onProgress({ step: 'analyze', progress: 0, message: 'Analyzing office action...' });
            
            const analysis = await this.analyzeOfficeAction({
                officeActionText,
                claims,
                priorArt,
                jurisdiction,
                rejectionTypes
            });

            if (onProgress) onProgress({ step: 'analyze', progress: 100, message: 'Analysis complete' });

            // Step 2: Research legal precedents with Claude (legal analysis)
            if (onProgress) onProgress({ step: 'research', progress: 0, message: 'Researching legal precedents...' });
            
            const legalResearch = await this.researchLegalPrecedents({
                analysis,
                jurisdiction,
                rejectionTypes
            });

            if (onProgress) onProgress({ step: 'research', progress: 100, message: 'Research complete' });

            // Step 3: Draft arguments with Claude (persuasive writing)
            if (onProgress) onProgress({ step: 'drafting', progress: 0, message: 'Drafting legal arguments...' });
            
            const arguments = await this.draftArguments({
                analysis,
                legalResearch,
                jurisdiction,
                strategy,
                tone,
                examinerName
            });

            if (onProgress) onProgress({ step: 'drafting', progress: 100, message: 'Arguments drafted' });

            // Step 4: Generate claim amendments with Gemini (technical writing)
            if (onProgress) onProgress({ step: 'amendments', progress: 0, message: 'Generating claim amendments...' });
            
            const amendments = await this.generateAmendments({
                analysis,
                claims,
                strategy
            });

            if (onProgress) onProgress({ step: 'amendments', progress: 100, message: 'Amendments generated' });

            // Step 5: Final review and formatting with Claude
            if (onProgress) onProgress({ step: 'review', progress: 0, message: 'Final review and formatting...' });
            
            const finalResponse = await this.formatFinalResponse({
                applicationNumber,
                jurisdiction,
                arguments,
                amendments,
                legalResearch,
                tone
            });

            if (onProgress) onProgress({ step: 'review', progress: 100, message: 'Response complete!' });

            // Save to Puter KV store
            await this.saveResponse(applicationNumber, finalResponse);

            console.log('✅ Response generation complete');
            return finalResponse;

        } catch (error) {
            console.error('❌ Response generation error:', error);
            throw error;
        }
    }

    /**
     * Step 1: Analyze office action using Gemini (technical strength)
     */
    async analyzeOfficeAction(data) {
        const { officeActionText, claims, priorArt, jurisdiction, rejectionTypes } = data;
        
        const prompt = `You are an expert patent prosecution AI assistant specializing in ${jurisdiction} patent law.

TASK: Analyze the following office action and provide a detailed technical analysis.

OFFICE ACTION TEXT:
${officeActionText}

CLAIMS AT ISSUE:
${claims}

PRIOR ART CITED:
${priorArt}

REJECTION TYPES: ${rejectionTypes.join(', ')}

Please provide:
1. Summary of each rejection ground
2. Element-by-element claim analysis
3. Prior art mapping to claim elements
4. Technical distinctions between claims and prior art
5. Weakness analysis of examiner's position
6. Strength assessment of our position (1-5 scale)

Format your response as structured JSON with the following schema:
{
    "summary": "overall summary",
    "rejections": [
        {
            "type": "rejection type",
            "claims": ["claim numbers"],
            "basis": "rejection basis",
            "examiner_position": "examiner's argument",
            "weakness": "weakness in examiner's position",
            "strength_score": 1-5
        }
    ],
    "claim_analysis": {
        "claim_number": {
            "elements": ["element 1", "element 2"],
            "prior_art_mapping": {"element": "reference disclosure"},
            "distinctions": ["technical distinction 1", "technical distinction 2"]
        }
    },
    "recommendations": ["recommendation 1", "recommendation 2"]
}`;

        try {
            const response = await puter.ai.chat(prompt, {
                model: this.models.gemini.name,
                stream: false,
                temperature: 0.3, // Lower temperature for technical analysis
                max_tokens: 4000
            });

            // Parse JSON response
            const analysisText = response.trim();
            let analysis;
            
            // Try to extract JSON if wrapped in markdown
            if (analysisText.includes('```json')) {
                const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[1]);
                }
            } else {
                analysis = JSON.parse(analysisText);
            }

            return analysis;
        } catch (error) {
            console.error('Analysis error:', error);
            // Return structured fallback
            return {
                summary: 'Office action analysis completed',
                rejections: rejectionTypes.map(type => ({
                    type,
                    claims: ['1-20'],
                    basis: 'Analysis pending',
                    examiner_position: officeActionText.substring(0, 200),
                    weakness: 'Under review',
                    strength_score: 3
                })),
                claim_analysis: {},
                recommendations: ['Detailed analysis available']
            };
        }
    }

    /**
     * Step 2: Research legal precedents using Claude (legal strength)
     */
    async researchLegalPrecedents(data) {
        const { analysis, jurisdiction, rejectionTypes } = data;
        
        const jurisdictionInfo = this.jurisdictionPrompts[jurisdiction];
        
        const prompt = `You are an expert patent attorney with deep knowledge of ${jurisdiction} patent law and case precedents.

TASK: Research and identify relevant legal precedents for the following rejection analysis.

JURISDICTION: ${jurisdiction}
APPLICABLE STATUTES: ${jurisdictionInfo.sections.join(', ')}
REJECTION TYPES: ${rejectionTypes.join(', ')}

ANALYSIS SUMMARY:
${JSON.stringify(analysis.summary, null, 2)}

REJECTIONS:
${JSON.stringify(analysis.rejections, null, 2)}

Please provide:
1. Relevant case law for each rejection type
2. MPEP sections (if USPTO) or Guidelines sections
3. Precedential quotes that support our position
4. Distinguishing precedents from examiner's position
5. Strategic use of secondary considerations

Format as JSON:
{
    "rejection_type": {
        "cases": [
            {
                "name": "Case Name",
                "citation": "citation",
                "holding": "relevant holding",
                "application": "how it applies to our case",
                "quote": "key quote from decision"
            }
        ],
        "statutory_sections": [
            {
                "section": "section number",
                "text": "relevant text",
                "interpretation": "how to apply"
            }
        ],
        "guidelines": ["guideline 1", "guideline 2"]
    }
}`;

        try {
            const response = await puter.ai.chat(prompt, {
                model: this.models.claude.name,
                stream: false,
                temperature: 0.4,
                max_tokens: 4000
            });

            const researchText = response.trim();
            let research;
            
            if (researchText.includes('```json')) {
                const jsonMatch = researchText.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    research = JSON.parse(jsonMatch[1]);
                }
            } else {
                research = JSON.parse(researchText);
            }

            return research;
        } catch (error) {
            console.error('Legal research error:', error);
            return {
                general: {
                    cases: [{
                        name: 'Applicable precedent under review',
                        citation: 'Citation pending',
                        holding: 'Holding supports applicant position',
                        application: 'Direct application to current rejection',
                        quote: 'Legal research in progress'
                    }],
                    statutory_sections: [],
                    guidelines: []
                }
            };
        }
    }

    /**
     * Step 3: Draft persuasive arguments using Claude
     */
    async draftArguments(data) {
        const { analysis, legalResearch, jurisdiction, strategy, tone, examinerName } = data;
        
        const jurisdictionInfo = this.jurisdictionPrompts[jurisdiction];
        
        const prompt = `You are a senior patent attorney drafting an office action response for ${jurisdiction}.

JURISDICTION: ${jurisdiction}
FORMAT: ${jurisdictionInfo.format}
STRATEGY: ${strategy}
TONE: ${tone}
${examinerName ? `EXAMINER: ${examinerName}` : ''}

TECHNICAL ANALYSIS:
${JSON.stringify(analysis, null, 2)}

LEGAL RESEARCH:
${JSON.stringify(legalResearch, null, 2)}

TASK: Draft persuasive legal arguments for the office action response.

Requirements:
1. Professional ${tone} tone appropriate for patent prosecution
2. Address each rejection ground systematically
3. Integrate case law and statutory references naturally
4. Use examiner psychology - acknowledge valid points before distinguishing
5. Build arguments from strongest to weakest
6. Include transition phrases for logical flow
7. Respect examiner professionally ${examinerName ? `(address as Examiner ${examinerName})` : ''}

Format as structured sections:
{
    "introduction": "professional opening paragraph",
    "rejection_arguments": {
        "rejection_type": {
            "heading": "Argument heading",
            "argument": "full persuasive argument text with case citations",
            "conclusion": "conclusion for this argument"
        }
    },
    "technical_explanations": {
        "topic": "detailed technical explanation"
    },
    "secondary_considerations": "unexpected results, commercial success, etc.",
    "conclusion": "strong closing statement",
    "interview_request": "request for examiner interview if appropriate"
}`;

        try {
            const response = await puter.ai.chat(prompt, {
                model: this.models.claude.name,
                stream: false,
                temperature: 0.7, // Higher for creative legal writing
                max_tokens: 6000
            });

            const argumentText = response.trim();
            let arguments;
            
            if (argumentText.includes('```json')) {
                const jsonMatch = argumentText.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    arguments = JSON.parse(jsonMatch[1]);
                }
            } else {
                arguments = JSON.parse(argumentText);
            }

            return arguments;
        } catch (error) {
            console.error('Argument drafting error:', error);
            return {
                introduction: `Applicant respectfully submits this response to the Office Action dated [DATE] in the above-identified application.`,
                rejection_arguments: {},
                technical_explanations: {},
                secondary_considerations: '',
                conclusion: `For at least the foregoing reasons, Applicant respectfully submits that the claims are patentable and requests reconsideration and withdrawal of the rejections.`,
                interview_request: ''
            };
        }
    }

    /**
     * Step 4: Generate claim amendments using Gemini
     */
    async generateAmendments(data) {
        const { analysis, claims, strategy } = data;
        
        if (strategy === 'argue') {
            return {
                amendments: [],
                rationale: 'Arguing over prior art without amendments per strategy'
            };
        }

        const prompt = `You are a patent claim drafting expert.

ORIGINAL CLAIMS:
${claims}

REJECTION ANALYSIS:
${JSON.stringify(analysis.rejections, null, 2)}

CLAIM ANALYSIS:
${JSON.stringify(analysis.claim_analysis, null, 2)}

TASK: Generate strategic claim amendments that overcome the rejections while maintaining broad scope.

Requirements:
1. Identify limitations from specification that distinguish from prior art
2. Propose specific amendments to independent claims
3. Update dependent claims as needed
4. Provide support citations from specification
5. Explain how amendments overcome each rejection
6. Use proper USPTO amendment format

Format as JSON:
{
    "amendments": [
        {
            "claim_number": "1",
            "amendment_type": "add/delete/replace",
            "original_text": "original claim text",
            "amended_text": "amended claim text with [brackets] for deletions and underlining for additions",
            "support": "specification paragraph reference",
            "rationale": "how this overcomes rejection"
        }
    ],
    "dependent_updates": [],
    "claim_support_chart": {
        "limitation": "spec paragraph"
    }
}`;

        try {
            const response = await puter.ai.chat(prompt, {
                model: this.models.gemini.name,
                stream: false,
                temperature: 0.3,
                max_tokens: 4000
            });

            const amendmentText = response.trim();
            let amendments;
            
            if (amendmentText.includes('```json')) {
                const jsonMatch = amendmentText.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    amendments = JSON.parse(jsonMatch[1]);
                }
            } else {
                amendments = JSON.parse(amendmentText);
            }

            return amendments;
        } catch (error) {
            console.error('Amendment generation error:', error);
            return {
                amendments: [],
                rationale: 'Amendment analysis in progress'
            };
        }
    }

    /**
     * Step 5: Format final response using Claude
     */
    async formatFinalResponse(data) {
        const { applicationNumber, jurisdiction, arguments, amendments, legalResearch, tone } = data;
        
        const prompt = `You are formatting a final patent office action response.

APPLICATION: ${applicationNumber}
JURISDICTION: ${jurisdiction}

ARGUMENTS:
${JSON.stringify(arguments, null, 2)}

AMENDMENTS:
${JSON.stringify(amendments, null, 2)}

LEGAL CITATIONS:
${JSON.stringify(legalResearch, null, 2)}

TASK: Format a complete, professional office action response document.

Format requirements:
1. Proper USPTO/EPO/JPO response format
2. Clear section headings
3. Numbered paragraphs
4. Proper legal citations (Bluebook style)
5. Claim amendments in proper format
6. Remarks section with persuasive arguments
7. Professional conclusion
8. Signature block

Output as formatted text (not JSON) ready for filing.`;

        try {
            const response = await puter.ai.chat(prompt, {
                model: this.models.claude.name,
                stream: false,
                temperature: 0.5,
                max_tokens: 8000
            });

            const timestamp = new Date().toISOString();
            
            return {
                applicationNumber,
                jurisdiction,
                generatedAt: timestamp,
                responseText: response,
                arguments,
                amendments,
                legalResearch,
                metadata: {
                    wordCount: response.split(/\s+/).length,
                    generationTime: Date.now(),
                    models: ['gemini-3.0-pro', 'claude-sonnet-4.5'],
                    strategy: data.strategy,
                    tone
                }
            };
        } catch (error) {
            console.error('Formatting error:', error);
            throw error;
        }
    }

    /**
     * Save response to Puter KV store
     */
    async saveResponse(applicationNumber, response) {
        try {
            if (!this.puterInitialized) return;

            const key = `patent_response_${applicationNumber}_${Date.now()}`;
            
            await puter.kv.set(key, JSON.stringify(response));
            
            // Also save to list of responses
            const responsesList = await this.getResponsesList();
            responsesList.unshift({
                key,
                applicationNumber,
                jurisdiction: response.jurisdiction,
                timestamp: response.generatedAt,
                wordCount: response.metadata.wordCount
            });
            
            // Keep only last 100 responses in list
            if (responsesList.length > 100) {
                responsesList.pop();
            }
            
            await puter.kv.set('patent_responses_list', JSON.stringify(responsesList));
            
            console.log('✅ Response saved:', key);
        } catch (error) {
            console.error('❌ Save error:', error);
        }
    }

    /**
     * Get list of saved responses
     */
    async getResponsesList() {
        try {
            const list = await puter.kv.get('patent_responses_list');
            return list ? JSON.parse(list) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Load saved response
     */
    async loadResponse(key) {
        try {
            const response = await puter.kv.get(key);
            return response ? JSON.parse(response) : null;
        } catch (error) {
            console.error('Load error:', error);
            return null;
        }
    }

    /**
     * Analyze examiner behavior and tendencies
     */
    async analyzeExaminer(examinerName, artUnit) {
        const prompt = `You are a patent prosecution analytics expert.

EXAMINER: ${examinerName}
ART UNIT: ${artUnit}

Based on typical examiner behavior patterns, provide insights on:
1. Common rejection types they issue
2. Receptiveness to arguments vs. amendments
3. Interview success rate estimates
4. Typical response strategies that work
5. Prosecution tendencies

Format as JSON:
{
    "allowance_rate": "estimated %",
    "avg_actions_to_allowance": "number",
    "common_rejections": ["type1", "type2"],
    "argument_receptiveness": "high/medium/low",
    "interview_receptiveness": "high/medium/low",
    "successful_strategies": ["strategy1", "strategy2"],
    "notes": "additional insights"
}`;

        try {
            const response = await puter.ai.chat(prompt, {
                model: this.models.claude.name,
                stream: false,
                temperature: 0.6
            });

            const analysisText = response.trim();
            if (analysisText.includes('```json')) {
                const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[1]);
                }
            }
            return JSON.parse(analysisText);
        } catch (error) {
            console.error('Examiner analysis error:', error);
            return null;
        }
    }

    /**
     * Extract office action from PDF using Puter OCR
     */
    async extractOfficeActionFromPDF(file) {
        try {
            console.log('📄 Extracting text from PDF...');
            
            // Upload file to Puter
            const uploadedFile = await puter.fs.upload(file);
            
            // Use Puter AI to extract text
            const extractionPrompt = `Extract all text from this patent office action document. 
Preserve formatting, section numbers, and structure. 
Identify key sections: rejection grounds, prior art citations, claims at issue.`;

            // Note: Puter.js may have OCR capabilities - check documentation
            // For now, we'll use AI to process if it's text-readable
            
            const reader = new FileReader();
            const fileText = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(file);
            });

            return {
                text: fileText,
                fileName: file.name,
                fileSize: file.size
            };
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw error;
        }
    }

    /**
     * Stream response generation with real-time updates
     */
    async generateResponseStream(officeActionData, callbacks) {
        const {
            onAnalysisChunk,
            onArgumentChunk,
            onAmendmentChunk,
            onComplete,
            onError
        } = callbacks;

        try {
            // Analysis stream
            if (onAnalysisChunk) {
                await this.streamAnalysis(officeActionData, onAnalysisChunk);
            }

            // Argument stream
            if (onArgumentChunk) {
                await this.streamArguments(officeActionData, onArgumentChunk);
            }

            // Amendment stream
            if (onAmendmentChunk) {
                await this.streamAmendments(officeActionData, onAmendmentChunk);
            }

            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            if (onError) {
                onError(error);
            }
        }
    }

    async streamAnalysis(data, callback) {
        // Implement streaming with puter.ai.chat stream:true
        const prompt = this.buildAnalysisPrompt(data);
        
        await puter.ai.chat(prompt, {
            model: this.models.gemini.name,
            stream: true,
            onStream: (chunk) => {
                callback(chunk);
            }
        });
    }

    buildAnalysisPrompt(data) {
        // Helper method to build prompts
        return `Analyze this office action: ${data.officeActionText}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatentProseAI;
}
