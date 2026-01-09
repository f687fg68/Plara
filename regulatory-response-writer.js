/**
 * AI Regulatory Response Writer - Complete Puter.js Integration
 * Handles government notices, warning letters, licensing objections, and audit follow-ups
 * Features: PDF/DOCX upload, AI generation with streaming, version history, export
 */

// ===================== STATE MANAGEMENT =====================
const RegulatoryResponseWriter = {
    state: {
        currentDocument: null,
        documentContent: '',
        currentResponse: '',
        uploadedFile: null,
        versions: [],
        isGenerating: false,
        formData: {
            noticeType: '',
            companyName: '',
            tone: 'formal',
            model: 'gemini-3-pro-preview', // Default to Gemini 3 Pro for advanced reasoning
            jurisdiction: '',
            additionalContext: ''
        },

        // Available AI models - Gemini 3.0 Pro & Claude Sonnet 4.5 prioritized
        availableModels: [
            { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', description: 'Advanced reasoning, best for complex regulatory analysis', provider: 'google' },
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4.5', description: 'Superior legal writing and nuanced analysis', provider: 'anthropic' },
            { id: 'claude-opus-4', name: 'Claude Opus 4', description: 'Most capable Claude - Best for high-stakes regulatory matters', provider: 'anthropic' },
            { id: 'claude-haiku', name: 'Claude Haiku', description: 'Fast Claude - Quick responses with good quality', provider: 'anthropic' },
            { id: 'gpt-4o', name: 'GPT-4o', description: 'Fast and reliable for standard responses', provider: 'openai' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Efficient responses for simpler notices', provider: 'openai' }
        ]
    },

    // KV Storage keys
    KV_KEYS: {
        formData: 'regwriter_form_data',
        versions: 'regwriter_versions',
        currentDoc: 'regwriter_current_doc'
    },

    // Initialize the module
    async init() {
        console.log('Initializing Regulatory Response Writer...');
        await this.loadSavedState();
        this.setupEventListeners();
        this.setupSlashCommands();
        
        // Initialize translation backend
        await this.initializeTranslation();
        
        console.log('Regulatory Response Writer ready');
    },

    // Initialize translation backend
    async initializeTranslation() {
        try {
            if (window.regulatoryTranslation) {
                await window.regulatoryTranslation.initialize();
                this.translationBackend = window.regulatoryTranslation;
                console.log('✅ Translation backend integrated');
            } else {
                console.warn('Translation backend not loaded');
            }
        } catch (error) {
            console.error('Failed to initialize translation:', error);
        }
    },

    // Load saved state from Puter KV
    async loadSavedState() {
        try {
            const saved = await puter.kv.get(this.KV_KEYS.formData);
            if (saved) {
                this.state.formData = JSON.parse(saved);
                console.log('Loaded saved form data');
            }

            const versions = await puter.kv.get(this.KV_KEYS.versions);
            if (versions) {
                this.state.versions = JSON.parse(versions);
                console.log(`Loaded ${this.state.versions.length} versions`);
            }
        } catch (error) {
            console.warn('Failed to load saved state:', error);
        }
    },

    // Save form data to KV
    async saveFormData() {
        try {
            await puter.kv.set(this.KV_KEYS.formData, JSON.stringify(this.state.formData));
        } catch (error) {
            console.error('Failed to save form data:', error);
        }
    },

    // Save version to history
    async saveVersion(response, metadata) {
        const version = {
            id: Date.now(),
            content: response,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                wordCount: response.split(/\s+/).length
            }
        };

        this.state.versions.unshift(version);

        // Keep only last 50 versions
        if (this.state.versions.length > 50) {
            this.state.versions = this.state.versions.slice(0, 50);
        }

        try {
            await puter.kv.set(this.KV_KEYS.versions, JSON.stringify(this.state.versions));
            console.log('Version saved to history');
        } catch (error) {
            console.error('Failed to save version:', error);
        }
    },

    // Setup event listeners (to be called after DOM is ready)
    setupEventListeners() {
        console.log('Setting up Regulatory Response Writer event listeners');
        // Event listeners will be added when UI is created
    },

    // Setup slash commands for chat integration
    setupSlashCommands() {
        // Register /regulatory command handler
        window.regulatoryCommandHandler = async (raw) => {
            const match = raw.match(/^\s*\/regulatory(?:\s+(.+))?$/i);
            if (!match) return false;

            const subcommand = (match[1] || '').trim();

            if (!subcommand || subcommand === 'help') {
                this.showHelp();
                return true;
            }

            if (subcommand === 'generate' || subcommand === 'gen') {
                await this.handleGenerateCommand();
                return true;
            }

            // Dual-AI comparison command
            if (subcommand === 'compare' || subcommand === 'dual') {
                await this.generateDualAI();
                return true;
            }

            if (subcommand.startsWith('type ')) {
                const type = subcommand.substring(5).trim();
                this.setNoticeType(type);
                return true;
            }

            if (subcommand.startsWith('tone ')) {
                const tone = subcommand.substring(5).trim();
                this.setTone(tone);
                return true;
            }

            if (subcommand.startsWith('model ')) {
                const modelInput = subcommand.substring(6).trim().toLowerCase();
                // Allow shorthand model names
                let modelId = modelInput;

                // Gemini shortcuts
                if (modelInput === 'gemini' || modelInput === 'gemini-3') {
                    modelId = 'gemini-3-pro-preview';
                }
                // GPT shortcuts - using correct Puter.js model IDs
                else if (modelInput === 'gpt' || modelInput === 'gpt-4' || modelInput === 'gpt-4o') {
                    modelId = 'gpt-4o';
                } else if (modelInput === 'gpt-mini' || modelInput === 'gpt-4o-mini') {
                    modelId = 'gpt-4o-mini';
                }
                // Claude shortcuts - using correct Puter.js model IDs
                else if (modelInput === 'claude' || modelInput === 'sonnet' || modelInput === 'claude-sonnet') {
                    modelId = 'claude-sonnet-4';
                } else if (modelInput === 'opus' || modelInput === 'claude-opus') {
                    modelId = 'claude-opus-4';
                } else if (modelInput === 'haiku' || modelInput === 'claude-haiku') {
                    modelId = 'claude-haiku';
                }

                this.setModel(modelId);
                return true;
            }

            return false;
        };

        // Register /translate command handler
        window.translateCommandHandler = async (raw) => {
            const match = raw.match(/^\s*\/translate(?:\s+(.+))?$/i);
            if (!match) return false;

            const subcommand = (match[1] || '').trim();

            // Show help
            if (!subcommand || subcommand === 'help') {
                this.showTranslateHelp();
                return true;
            }

            // List languages: /translate list [region]
            if (subcommand.startsWith('list')) {
                const region = subcommand.substring(4).trim();
                await this.listLanguages(region);
                return true;
            }

            // Set model: /translate model <model>
            if (subcommand.startsWith('model ')) {
                const modelName = subcommand.substring(6).trim().toLowerCase();
                let modelId = modelName;

                if (modelName === 'gemini' || modelName === 'gemini-3') {
                    modelId = 'gemini-3-pro-preview';
                } else if (modelName === 'claude' || modelName === 'sonnet') {
                    modelId = 'claude-sonnet-4';
                } else if (modelName === 'opus') {
                    modelId = 'claude-opus-4';
                }

                await this.setTranslationModel(modelId);
                return true;
            }

            // Dual-AI translation: /translate compare <language>
            if (subcommand.startsWith('compare ')) {
                const language = subcommand.substring(8).trim();
                await this.translateDocumentDualAI(language);
                return true;
            }

            // Translate current document: /translate <language>
            await this.translateDocument(subcommand);
            return true;
        };
    },

    // ===================== FILE UPLOAD & TEXT EXTRACTION =====================

    async handleFileUpload(file) {
        try {
            showNotification('Processing file...', 'info');

            // Validate file
            const maxSize = 25 * 1024 * 1024; // 25MB
            if (file.size > maxSize) {
                throw new Error('File too large. Maximum size is 25MB');
            }

            this.state.uploadedFile = file;

            // Check if it's an image (for Gemini 3 Pro multimodal)
            const isImage = file.type.startsWith('image/');

            if (isImage) {
                // Store image for multimodal processing
                this.state.uploadedImage = file;
                showNotification('Image uploaded. Use Gemini 3 Pro for multimodal analysis.', 'success');
                return;
            }

            // Extract text based on file type
            let extractedText = '';
            const fileName = file.name.toLowerCase();

            if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
                extractedText = await this.extractPdfText(file);
            } else if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
                extractedText = await file.text();
            } else if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                extractedText = await this.extractDocxText(file);
            } else {
                // Try to read as text
                extractedText = await file.text();
            }

            this.state.documentContent = extractedText;

            // Upload to Puter FS for persistence
            if (window.puter && puter.fs) {
                try {
                    const puterPath = `/regulatory-notices/${Date.now()}_${file.name}`;
                    await puter.fs.write(puterPath, file);
                    console.log('File uploaded to Puter FS:', puterPath);
                } catch (fsError) {
                    console.warn('Failed to upload to Puter FS:', fsError);
                }
            }

            showNotification(`Document loaded: ${file.name}`, 'success');
            return extractedText;

        } catch (error) {
            console.error('File upload error:', error);
            showNotification('Error processing file: ' + error.message, 'error');
            throw error;
        }
    },

    async extractPdfText(file) {
        if (!window.pdfjsLib) {
            throw new Error('PDF.js library not loaded');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    // Set worker
                    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    }

                    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
                    let fullText = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n\n';
                    }

                    resolve(fullText);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read PDF file'));
            reader.readAsArrayBuffer(file);
        });
    },

    async extractDocxText(file) {
        // Simple DOCX text extraction (for production, use mammoth.js)
        const arrayBuffer = await file.arrayBuffer();
        const text = new TextDecoder().decode(arrayBuffer);

        // Extract text from XML structure
        const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
        const extractedText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');

        if (!extractedText) {
            throw new Error('Could not extract text from DOCX file');
        }

        return extractedText;
    },

    // ===================== AI SYSTEM PROMPTS =====================

    getSystemPrompt(noticeType, tone, companyName, jurisdiction, model) {
        // Enhanced prompts for different AI models
        const isGemini3Pro = model === 'gemini-3-pro-preview';
        const isClaude4 = model.startsWith('claude-') && (model.includes('4-5') || model.includes('4-1'));
        const isClaudeOpus = model.includes('opus');

        // Gemini 3 Pro enhancement
        const geminiEnhancement = isGemini3Pro ? `

🧠 ADVANCED REASONING INSTRUCTIONS (Gemini 3 Pro):
Use your advanced reasoning capabilities to:
1. Analyze the notice for implicit legal implications and unstated concerns
2. Identify potential cascading compliance issues
3. Anticipate follow-up questions or requests from regulators
4. Assess risk levels and recommend priority actions
5. Consider jurisdiction-specific regulatory nuances
6. Propose proactive measures beyond minimum compliance
7. Use adaptive reasoning depth based on complexity of each issue

Your response should demonstrate:
- Deep understanding of regulatory intent
- Strategic thinking about long-term compliance posture
- Risk-aware decision making
- Contextual awareness of industry standards` : '';

        // Claude 4.5 enhancement
        const claudeEnhancement = isClaude4 ? `

📝 CLAUDE 4.5 LEGAL EXCELLENCE INSTRUCTIONS:
Leverage your enhanced capabilities for regulatory response writing:
1. PRECISION: Use exact legal terminology and citations
2. NUANCE: Carefully balance cooperation with protection of legal position
3. COHERENCE: Ensure logical flow from acknowledgment through commitment
4. TONE CALIBRATION: Match ${tone} tone while maintaining professionalism
5. RISK MITIGATION: Frame responses to minimize liability exposure
6. STRATEGIC FRAMING: Position company favorably without misrepresentation
7. CITATION ACCURACY: Reference specific regulations and standards correctly
8. EVIDENCE ORGANIZATION: Structure supporting documentation references clearly

${isClaudeOpus ? `
🎯 OPUS ADDITIONAL CAPABILITIES:
- Complex legal reasoning across multiple regulatory domains
- Sophisticated risk-benefit analysis
- Multi-stakeholder perspective consideration
- Long-term compliance strategy development
` : ''}

Your response should exemplify:
- Legal precision and accuracy
- Persuasive but honest communication
- Professional respect for regulatory authority
- Client-protective language choices
- Clear organizational structure
- Evidence-based reasoning` : '';

        const basePrompts = {
            government: `You are a senior regulatory compliance specialist drafting a formal response to a government warning letter.

CRITICAL REQUIREMENTS:
- This is a RESPONSE DRAFT, not legal advice
- Acknowledge receipt with proper reference numbers
- Address all specific points raised in the notice
- Outline corrective actions with timeline and responsible parties
- Maintain ${tone} tone throughout
- Use legally cautious language (avoid admissions of liability)
- Include commitment to cooperation and compliance

STRUCTURE:
1. Acknowledgment & Reference Details
2. Summary of Issues Addressed
3. Detailed Response to Each Point
4. Corrective Action Plan (CAP) with owners and dates
5. Monitoring & Verification Procedures
6. Employee Training & Communication
7. Professional Closing with Contact Information${geminiEnhancement}${claudeEnhancement}`,

            licensing: `You are a senior licensing compliance specialist drafting a response to a licensing objection.

CRITICAL REQUIREMENTS:
- Acknowledge the objection and cite application/license numbers
- Address each objection point with supporting evidence
- Demonstrate commitment to regulatory requirements
- Provide corrective measures if applicable
- Include timeline for implementation
- Maintain ${tone} and professional tone

STRUCTURE:
1. Acknowledgment of Objection
2. Point-by-Point Response
3. Supporting Documentation References
4. Corrective/Enhancement Measures
5. Implementation Timeline
6. Professional Closing${geminiEnhancement}${claudeEnhancement}`,

            audit: `You are a senior audit compliance specialist drafting a response to an audit follow-up.

CRITICAL REQUIREMENTS:
- Acknowledge the audit report and findings
- Address each finding systematically
- Explain root causes (factually, not defensively)
- Provide comprehensive corrective and preventive actions (CAPA)
- Include verification and effectiveness measures
- Maintain ${tone} tone

STRUCTURE:
1. Acknowledgment of Audit Report
2. Executive Summary
3. Finding-by-Finding Response (with root cause analysis)
4. Corrective Action Plan (CAPA)
5. Preventive Measures
6. Verification & Effectiveness Checks
7. Timeline & Responsibilities${geminiEnhancement}${claudeEnhancement}`,

            compliance: `You are a senior compliance specialist drafting a response to a regulatory compliance notice.

CRITICAL REQUIREMENTS:
- Acknowledge the compliance notice
- Demonstrate understanding of requirements
- Outline specific steps to achieve/maintain compliance
- Provide evidence of good faith efforts
- Include timeline and monitoring procedures
- Maintain ${tone} tone

STRUCTURE:
1. Acknowledgment
2. Understanding of Requirements
3. Current Compliance Status
4. Gap Analysis (if applicable)
5. Compliance Action Plan
6. Timeline & Milestones
7. Ongoing Monitoring${geminiEnhancement}${claudeEnhancement}`,

            violation: `You are a senior regulatory compliance specialist drafting a response to a violation notice.

CRITICAL REQUIREMENTS:
- Acknowledge the violation notice
- Take appropriate responsibility (without unnecessary admissions)
- Explain circumstances factually (not as excuses)
- Outline immediate remediation steps
- Provide preventive measures for future
- Maintain ${tone} but respectful tone

STRUCTURE:
1. Acknowledgment of Violation Notice
2. Factual Summary
3. Immediate Actions Taken
4. Root Cause Analysis
5. Corrective Action Plan
6. Preventive Measures
7. Timeline & Commitment${geminiEnhancement}${claudeEnhancement}`,

            inspection: `You are a senior inspection response specialist drafting a response to an inspection report.

CRITICAL REQUIREMENTS:
- Acknowledge the inspection report
- Address each finding systematically
- Explain any disagreements professionally (if applicable)
- Provide detailed corrective action plan
- Include verification procedures
- Maintain ${tone} tone

STRUCTURE:
1. Acknowledgment of Inspection
2. Summary of Findings
3. Response to Each Finding
4. Corrective Actions with Timeline
5. Verification Plan
6. Professional Closing${geminiEnhancement}${claudeEnhancement}`,

            environmental: `You are a senior environmental compliance specialist drafting a response to an environmental notice.

CRITICAL REQUIREMENTS:
- Acknowledge the environmental notice
- Demonstrate environmental responsibility
- Outline compliance steps and remediation
- Provide monitoring and verification procedures
- Show commitment to sustainability
- Maintain ${tone} tone

STRUCTURE:
1. Acknowledgment
2. Environmental Context
3. Compliance Position & Actions
4. Remediation Plan (if applicable)
5. Monitoring & Verification
6. Long-term Environmental Commitment${geminiEnhancement}${claudeEnhancement}`,

            labor: `You are a senior labor/safety compliance specialist drafting a response to a labor or safety notice.

CRITICAL REQUIREMENTS:
- Acknowledge the labor/safety notice
- Address safety concerns thoroughly
- Outline immediate and long-term remedial measures
- Demonstrate commitment to worker protection
- Include training and monitoring procedures
- Maintain ${tone} tone

STRUCTURE:
1. Acknowledgment
2. Safety/Labor Issue Summary
3. Immediate Actions Taken
4. Comprehensive Remedial Plan
5. Training & Communication
6. Ongoing Safety Monitoring${geminiEnhancement}${claudeEnhancement}`,

            other: `You are a senior regulatory compliance specialist drafting a professional formal response.

CRITICAL REQUIREMENTS:
- Professional, submission-ready format
- Address all points raised
- Provide corrective action plan
- Include timeline and responsibilities
- Maintain ${tone} tone
- Use legally cautious language`
        };

        const toneGuidance = {
            formal: 'Highly formal, professional, and authoritative',
            cooperative: 'Cooperative and collaborative, emphasizing partnership',
            assertive: 'Confident and assertive while remaining respectful',
            cautious: 'Carefully worded, reserving legal positions'
        };

        const prompt = basePrompts[noticeType] || basePrompts.other;

        return `${prompt}

COMPANY INFORMATION:
Company Name: ${companyName || '[Company Name]'}
Jurisdiction: ${jurisdiction || '[Jurisdiction]'}

TONE GUIDANCE:
${toneGuidance[tone] || toneGuidance.formal}

IMPORTANT DISCLAIMERS:
- This is a draft response for review, NOT final legal advice
- Must be reviewed by qualified legal counsel before submission
- All dates, names, and specific details should be verified
- Attach supporting documentation as referenced

Generate a complete, submission-ready response letter following the structure above.
Include proper business letter formatting with date, addressee, and signature block placeholders.`;
    },

    // ===================== AI RESPONSE GENERATION =====================

    async generateResponse() {
        if (!this.state.documentContent) {
            showNotification('Please upload a document first', 'warning');
            return;
        }

        const { noticeType, companyName, tone, model, jurisdiction, additionalContext } = this.state.formData;

        if (!noticeType || !companyName) {
            showNotification('Please fill in company name and notice type', 'warning');
            return;
        }

        this.state.isGenerating = true;

        // Display model-specific notification
        const modelName = this.availableModels.find(m => m.id === model)?.name || model;
        showNotification(`Generating response with ${modelName}...`, 'info');

        try {
            // Build system prompt with model parameter
            const systemPrompt = this.getSystemPrompt(noticeType, tone, companyName, jurisdiction, model);

            // Build user message
            const userMessage = `${systemPrompt}

NOTICE DOCUMENT:
${this.state.documentContent}

${additionalContext ? `\nADDITIONAL CONTEXT:\n${additionalContext}` : ''}

Please generate the complete formal response letter now.`;

            // Call Puter AI with streaming
            let fullResponse = '';

            // Model-specific optimized settings
            const isGemini3Pro = model === 'gemini-3-pro-preview';
            const isClaude = model.startsWith('claude-');
            const isClaudeSonnet = model === 'claude-sonnet-4';
            const isClaudeOpus = model === 'claude-opus-4';

            let aiOptions = {
                model: model || 'gemini-3-pro-preview',
                stream: true,
                temperature: 0.3,
                max_tokens: 4000
            };

            // Gemini 3.0 Pro optimizations - best for complex regulatory analysis
            if (isGemini3Pro) {
                aiOptions.temperature = 0.4;  // Balanced reasoning
                aiOptions.max_tokens = 8000;   // Extended analysis
                console.log('Using Gemini 3.0 Pro with optimized settings');
            }

            // Claude Sonnet 4.5 optimizations - best for legal writing
            if (isClaudeSonnet) {
                aiOptions.temperature = 0.3;   // Precision and consistency
                aiOptions.max_tokens = 8000;   // Extended legal documents
                console.log('Using Claude Sonnet 4.5 with legal writing optimizations');
            }

            // Claude Opus optimizations - highest capability
            if (isClaudeOpus) {
                aiOptions.temperature = 0.25;  // Maximum precision
                aiOptions.max_tokens = 12000;  // Comprehensive documents
                console.log('Using Claude Opus 4 with maximum capability settings');
            }

            // For Gemini 3 Pro with image: use multimodal
            let requestPayload = userMessage;
            if (isGemini3Pro && this.state.uploadedImage) {
                // Upload image to Puter FS and get path
                try {
                    const imgPath = `/regulatory-notices/images/${Date.now()}_${this.state.uploadedImage.name}`;
                    await puter.fs.write(imgPath, this.state.uploadedImage);

                    // Build multimodal message
                    requestPayload = [
                        {
                            role: 'user', content: [
                                { type: 'text', text: userMessage },
                                { type: 'file', puter_path: imgPath }
                            ]
                        }
                    ];

                    showNotification('Processing image with Gemini 3 Pro...', 'info');
                } catch (imgError) {
                    console.warn('Failed to process image:', imgError);
                }
            }

            const stream = await puter.ai.chat(requestPayload, aiOptions);

            // Stream the response
            for await (const part of stream) {
                if (part?.text) {
                    fullResponse += part.text;
                    // Update UI in real-time if callback is set
                    if (this.onStreamUpdate) {
                        this.onStreamUpdate(fullResponse);
                    }
                }
            }

            this.state.currentResponse = fullResponse;

            // Save to version history
            await this.saveVersion(fullResponse, {
                noticeType,
                companyName,
                tone,
                model,
                jurisdiction
            });

            // Insert into document editor
            await this.insertIntoDocument(fullResponse);

            showNotification('Response generated successfully!', 'success');

            this.state.isGenerating = false;
            return fullResponse;

        } catch (error) {
            console.error('AI generation error:', error);
            showNotification('Error generating response: ' + error.message, 'error');
            this.state.isGenerating = false;
            throw error;
        }
    },

    async insertIntoDocument(response) {
        if (!window.editorjs) {
            console.warn('Editor.js not available');
            return;
        }

        try {
            // Wrap in DOCUMENT_CONTENT block
            const wrapped = `:::DOCUMENT_CONTENT\n${response}\n:::`;

            // Use existing processDocumentContent function
            const handled = await processDocumentContent(wrapped);

            if (!handled) {
                // Fallback: insert as paragraphs
                const paragraphs = response.split(/\n\n+/).filter(p => p.trim());
                for (const p of paragraphs) {
                    await window.editorjs.blocks.insert('paragraph', { text: p.trim() });
                }
            }

            console.log('Response inserted into document');
        } catch (error) {
            console.error('Failed to insert into document:', error);
        }
    },

    // ===================== DUAL-AI COMPARISON GENERATION =====================

    /**
     * Generate responses with both Gemini 3.0 Pro and Claude Sonnet 4.5
     * Allows users to compare regulatory responses from both models
     */
    async generateDualAI() {
        if (!this.state.documentContent) {
            showNotification('Please upload a document first', 'warning');
            return;
        }

        const { noticeType, companyName, tone, jurisdiction, additionalContext } = this.state.formData;

        if (!noticeType || !companyName) {
            showNotification('Please fill in company name and notice type', 'warning');
            return;
        }

        this.state.isGenerating = true;
        showNotification('🔄 Generating dual-AI comparison (Gemini 3.0 Pro + Claude Sonnet 4.5)...', 'info');

        const models = [
            { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', emoji: '🧠' },
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4.5', emoji: '📝' }
        ];

        const results = {};

        try {
            // Build system prompt
            const systemPrompt = this.getSystemPrompt(noticeType, tone, companyName, jurisdiction, 'gemini-3-pro-preview');
            const userMessage = `${systemPrompt}\n\nNOTICE DOCUMENT:\n${this.state.documentContent}\n\n${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}\n\n` : ''}Please generate the complete formal response letter now.`;

            // Generate with both models in parallel
            const promises = models.map(async (modelInfo) => {
                try {
                    const aiOptions = {
                        model: modelInfo.id,
                        stream: false, // Non-streaming for parallel execution
                        temperature: modelInfo.id.includes('gemini') ? 0.4 : 0.3,
                        max_tokens: 8000
                    };

                    const response = await puter.ai.chat(userMessage, aiOptions);
                    const text = typeof response === 'string' ? response : (response?.message?.content || response?.text || response?.toString() || '');

                    return { model: modelInfo, text, success: true };
                } catch (error) {
                    console.error(`Failed to generate with ${modelInfo.name}:`, error);
                    return { model: modelInfo, text: '', success: false, error: error.message };
                }
            });

            const responses = await Promise.all(promises);

            // Build comparison document
            let comparisonDoc = `# Regulatory Response Comparison\n\n`;
            comparisonDoc += `**Notice Type:** ${noticeType}\n`;
            comparisonDoc += `**Company:** ${companyName}\n`;
            comparisonDoc += `**Generated:** ${new Date().toISOString()}\n\n`;
            comparisonDoc += `---\n\n`;

            for (const resp of responses) {
                comparisonDoc += `## ${resp.model.emoji} ${resp.model.name} Response\n\n`;
                if (resp.success) {
                    comparisonDoc += resp.text + '\n\n';
                    results[resp.model.id] = resp.text;
                } else {
                    comparisonDoc += `*Failed to generate: ${resp.error}*\n\n`;
                }
                comparisonDoc += `---\n\n`;
            }

            // Store both responses
            this.state.currentResponse = comparisonDoc;
            this.state.dualAIResults = results;

            // Save to version history
            await this.saveVersion(comparisonDoc, {
                noticeType,
                companyName,
                tone,
                model: 'dual-ai-comparison',
                jurisdiction,
                modelsUsed: models.map(m => m.id)
            });

            // Insert into document
            await this.insertIntoDocument(comparisonDoc);

            showNotification('✅ Dual-AI comparison generated successfully!', 'success');
            this.state.isGenerating = false;
            return results;

        } catch (error) {
            console.error('Dual-AI generation error:', error);
            showNotification('Error generating dual-AI comparison: ' + error.message, 'error');
            this.state.isGenerating = false;
            throw error;
        }
    },

    /**
     * Map user-friendly model names to Puter.js model IDs
     */
    mapModelId(modelName) {
        const modelMap = {
            // Gemini models
            'gemini': 'gemini-3-pro-preview',
            'gemini-3': 'gemini-3-pro-preview',
            'gemini-3-pro': 'gemini-3-pro-preview',
            'gemini-3.0-pro': 'gemini-3-pro-preview',

            // Claude models
            'claude': 'claude-sonnet-4',
            'sonnet': 'claude-sonnet-4',
            'claude-sonnet': 'claude-sonnet-4',
            'claude-sonnet-4.5': 'claude-sonnet-4',
            'opus': 'claude-opus-4',
            'claude-opus': 'claude-opus-4',
            'haiku': 'claude-haiku',
            'claude-haiku': 'claude-haiku',

            // GPT models
            'gpt': 'gpt-4o',
            'gpt-4': 'gpt-4o',
            'gpt-4o': 'gpt-4o',
            'gpt-mini': 'gpt-4o-mini',
            'gpt-4o-mini': 'gpt-4o-mini'
        };

        const normalized = (modelName || '').toLowerCase().trim();
        return modelMap[normalized] || normalized;
    },

    // ===================== EXPORT FUNCTIONALITY =====================

    async exportAsDocx() {
        if (!this.state.currentResponse) {
            showNotification('No response to export', 'warning');
            return;
        }

        try {
            // Create simple DOCX-compatible HTML
            const html = `<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; margin: 1in; }
h1 { font-size: 14pt; font-weight: bold; }
h2 { font-size: 13pt; font-weight: bold; }
p { margin-bottom: 12pt; }
</style>
</head>
<body>
<pre style="white-space: pre-wrap; font-family: inherit;">${this.escapeHtml(this.state.currentResponse)}</pre>
</body>
</html>`;

            const blob = new Blob([html], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `regulatory_response_${Date.now()}.doc`;
            a.click();
            URL.revokeObjectURL(url);

            showNotification('Response exported as DOCX', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showNotification('Failed to export', 'error');
        }
    },

    async exportAsPdf() {
        showNotification('PDF export: Use browser Print > Save as PDF for best results', 'info');

        // Open print dialog
        if (window.editorjs) {
            window.print();
        }
    },

    async copyToClipboard() {
        if (!this.state.currentResponse) {
            showNotification('No response to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.state.currentResponse);
            showNotification('Response copied to clipboard!', 'success');
        } catch (error) {
            console.error('Copy error:', error);
            showNotification('Failed to copy to clipboard', 'error');
        }
    },

    // ===================== HELPER FUNCTIONS =====================

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    setNoticeType(type) {
        this.state.formData.noticeType = type;
        this.saveFormData();
        showNotification(`Notice type set to: ${type}`, 'success');
    },

    setTone(tone) {
        this.state.formData.tone = tone;
        this.saveFormData();
        showNotification(`Tone set to: ${tone}`, 'success');
    },

    setModel(modelId) {
        const model = this.availableModels.find(m => m.id === modelId);
        if (!model) {
            showNotification(`Unknown model: ${modelId}`, 'error');
            return;
        }

        this.state.formData.model = modelId;
        this.saveFormData();
        showNotification(`Model set to: ${model.name} - ${model.description}`, 'success');
    },

    showHelp() {
        const helpText = `📋 **AI Regulatory Response Writer Commands**

🤖 **AI Models:**
/regulatory model gemini - Use Gemini 3.0 Pro (best for complex analysis)
/regulatory model claude - Use Claude Sonnet 4.5 (best for legal writing)
/regulatory model gpt - Use GPT-4o

⚙️ **Configuration:**
/regulatory type <type> - Set notice type (government, licensing, audit, compliance, violation, inspection, environmental, labor)
/regulatory tone <tone> - Set response tone (formal, cooperative, assertive, cautious)

📝 **Generation:**
/regulatory generate - Generate response with selected model
/regulatory compare - Generate dual-AI comparison (Gemini + Claude side-by-side)

❓ **Help:**
/regulatory help - Show this help

**Workflow:**
1. Upload regulatory notice (PDF/DOCX/TXT) via attachment button
2. Set notice type: /regulatory type government
3. Set company: (uses saved profile or defaults)
4. Generate: /regulatory generate OR /regulatory compare
5. Review and edit in document editor
6. Export as DOCX/PDF

**Notice Types:**
• government - Government warning letters
• licensing - Licensing objections  
• audit - Audit follow-ups
• compliance - Compliance notices
• violation - Violation notices
• inspection - Inspection reports
• environmental - Environmental notices
• labor - Labor/safety notices

⚠️ NOT legal advice. Just response drafting.`;

        if (window.editorjs) {
            window.editorjs.blocks.insert('paragraph', { text: helpText });
        }
        showNotification('Regulatory Response Writer help displayed', 'info');
    },

    async handleGenerateCommand() {
        if (!this.state.documentContent) {
            showNotification('Please upload a document first using the file attachment', 'warning');
            return;
        }
        await this.generateResponse();
    },

    // ===================== TRANSLATION METHODS =====================

    /**
     * Translate current document to target language
     */
    async translateDocument(targetLanguage, options = {}) {
        if (!this.translationBackend) {
            showNotification('Translation backend not available', 'error');
            return;
        }

        // Get text to translate from current document or response
        let textToTranslate = this.state.currentResponse || this.state.documentContent;

        if (!textToTranslate) {
            showNotification('No document content to translate. Generate a response first.', 'warning');
            return;
        }

        const { model = this.translationBackend.state.defaultModel, stream = true } = options;

        try {
            showNotification(`🌐 Translating to ${targetLanguage}...`, 'info');

            const translated = await this.translationBackend.translateText(
                textToTranslate,
                targetLanguage,
                {
                    model: model,
                    stream: stream,
                    context: 'regulatory',
                    onProgress: (progress) => {
                        // Update UI with streaming translation
                        if (this.onTranslationProgress) {
                            this.onTranslationProgress(progress);
                        }
                    }
                }
            );

            // Insert translated document
            await this.insertTranslatedDocument(translated, targetLanguage);

            showNotification(`✅ Document translated to ${targetLanguage}!`, 'success');
            return translated;

        } catch (error) {
            console.error('Translation error:', error);
            showNotification(`Translation failed: ${error.message}`, 'error');
            throw error;
        }
    },

    /**
     * Translate with dual-AI comparison (Gemini + Claude)
     */
    async translateDocumentDualAI(targetLanguage) {
        if (!this.translationBackend) {
            showNotification('Translation backend not available', 'error');
            return;
        }

        let textToTranslate = this.state.currentResponse || this.state.documentContent;

        if (!textToTranslate) {
            showNotification('No document content to translate. Generate a response first.', 'warning');
            return;
        }

        try {
            showNotification(`🔄 Dual-AI translation to ${targetLanguage}...`, 'info');

            const result = await this.translationBackend.translateDualAI(
                textToTranslate,
                targetLanguage,
                { context: 'regulatory' }
            );

            // Insert comparison document
            await this.insertTranslatedDocument(result.comparison, targetLanguage, true);

            showNotification(`✅ Dual-AI translation comparison complete!`, 'success');
            return result;

        } catch (error) {
            console.error('Dual-AI translation error:', error);
            showNotification(`Dual-AI translation failed: ${error.message}`, 'error');
            throw error;
        }
    },

    /**
     * Insert translated document into editor
     */
    async insertTranslatedDocument(translatedText, targetLanguage, isDualAI = false) {
        if (!window.editorjs) {
            console.warn('Editor.js not available');
            return;
        }

        try {
            const header = isDualAI 
                ? `Translation Comparison - ${targetLanguage}` 
                : `Translation - ${targetLanguage}`;

            // Add header
            await window.editorjs.blocks.insert('header', { 
                text: header, 
                level: 2 
            });

            // Wrap in DOCUMENT_CONTENT block
            const wrapped = `:::DOCUMENT_CONTENT\n${translatedText}\n:::`;

            // Use existing processDocumentContent function
            const handled = await processDocumentContent(wrapped);

            if (!handled) {
                // Fallback: insert as paragraphs
                const paragraphs = translatedText.split(/\n\n+/).filter(p => p.trim());
                for (const p of paragraphs) {
                    await window.editorjs.blocks.insert('paragraph', { text: p.trim() });
                }
            }

            console.log('Translation inserted into document');
        } catch (error) {
            console.error('Failed to insert translation:', error);
        }
    },

    /**
     * List available languages
     */
    async listLanguages(region = '') {
        if (!this.translationBackend) {
            showNotification('Translation backend not available', 'error');
            return;
        }

        const languages = region 
            ? this.translationBackend.getLanguagesByRegion(region)
            : this.translationBackend.state.supportedLanguages;

        let languageList = region 
            ? `# Available Languages - ${region}\n\n`
            : `# All Available Languages (${languages.length})\n\n`;

        // Group by region
        const grouped = {};
        for (const lang of languages) {
            if (!grouped[lang.region]) {
                grouped[lang.region] = [];
            }
            grouped[lang.region].push(lang);
        }

        for (const [regionName, langs] of Object.entries(grouped)) {
            languageList += `## ${regionName}\n\n`;
            for (const lang of langs) {
                languageList += `- **${lang.name}** (${lang.native}) - Code: \`${lang.code}\`\n`;
            }
            languageList += '\n';
        }

        languageList += `\n**Usage:** \`/translate <language>\` or \`/translate <code>\`\n`;
        languageList += `**Example:** \`/translate Spanish\` or \`/translate es\`\n`;

        // Insert into document
        if (window.editorjs) {
            await window.editorjs.blocks.insert('paragraph', { text: languageList });
        }

        showNotification(`${languages.length} languages available`, 'success');
    },

    /**
     * Set translation model
     */
    async setTranslationModel(modelId) {
        if (!this.translationBackend) {
            showNotification('Translation backend not available', 'error');
            return;
        }

        try {
            await this.translationBackend.setDefaultModel(modelId);
            const modelInfo = this.translationBackend.getModelInfo(modelId);
            showNotification(`Translation model: ${modelInfo.name}`, 'success');
        } catch (error) {
            showNotification(`Invalid model: ${modelId}`, 'error');
        }
    },

    /**
     * Show translation help
     */
    showTranslateHelp() {
        const helpText = `🌐 **AI Translation System - Free & Unlimited**

**Powered by Puter.js + AI Models:**
- 🧠 Gemini 3.0 Pro - Best for complex regulatory documents
- 📝 Claude Sonnet 4.5 - Excellent for legal/formal language
- 🎯 Claude Opus 4 - Highest quality for critical translations

**Basic Translation:**
\`/translate <language>\` - Translate current document
\`/translate Spanish\` - Translate to Spanish
\`/translate es\` - Translate to Spanish (using language code)
\`/translate Chinese\` - Translate to Chinese

**Dual-AI Comparison:**
\`/translate compare <language>\` - Get translations from both Gemini and Claude
\`/translate compare French\` - Compare Gemini vs Claude translations

**Configuration:**
\`/translate model gemini\` - Use Gemini 3.0 Pro
\`/translate model claude\` - Use Claude Sonnet 4.5
\`/translate model opus\` - Use Claude Opus 4

**Language Discovery:**
\`/translate list\` - Show all 40+ languages
\`/translate list Europe\` - Show European languages
\`/translate list Asia\` - Show Asian languages

**Supported Languages Include:**
- European: Spanish, French, German, Italian, Portuguese, Dutch, Polish, Russian...
- Asian: Chinese, Japanese, Korean, Thai, Vietnamese, Hindi, Bengali...
- Middle Eastern: Arabic, Hebrew, Persian, Urdu...
- And many more!

**Features:**
✅ Context-aware regulatory translation
✅ Preserves legal terminology and formatting
✅ Streaming translations for long documents
✅ Free unlimited usage (user-pays model)
✅ 50+ languages supported
✅ Dual-AI comparison mode

**Workflow:**
1. Generate regulatory response: \`/regulatory generate\`
2. Translate to target language: \`/translate Spanish\`
3. Or compare translations: \`/translate compare Spanish\`
4. Export translated document

**Note:** Translations are AI-powered and context-aware but should be reviewed by qualified translators for final submission.`;

        if (window.editorjs) {
            window.editorjs.blocks.insert('paragraph', { text: helpText });
        }
        showNotification('Translation help displayed', 'info');
    }
};

// Export for global access
window.RegulatoryResponseWriter = RegulatoryResponseWriter;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        RegulatoryResponseWriter.init();
    });
} else {
    RegulatoryResponseWriter.init();
}

