/**
 * Mortgage Denial Letter AI Engine
 * Supports multiple AI models: GPT-4o, Claude Sonnet 4.5, Gemini 3.0 Pro
 * Generates FCRA/ECOA/CFPB compliant denial letters
 */

class MortgageDenialAIEngine {
    constructor() {
        this.models = {
            'gpt-4o': { name: 'GPT-4o', provider: 'openai', available: true },
            'claude-3-5-sonnet': { name: 'Claude 3.5 Sonnet', provider: 'anthropic', available: true },
            'gemini-3-pro': { name: 'Gemini 3.0 Pro', provider: 'google', available: true }
        };
        
        this.defaultModel = 'gpt-4o';
        this.complianceValidator = new MortgageComplianceValidator();
        this.denialReasonLibrary = this.initializeDenialReasons();
        
        // Track generation stats
        this.stats = {
            totalGenerated: 0,
            byModel: {},
            complianceRate: 0,
            avgGenerationTime: 0
        };
    }

    /**
     * Initialize comprehensive denial reason library
     */
    initializeDenialReasons() {
        return {
            // Credit-Related Reasons
            'CR01': {
                code: 'CR01',
                category: 'Credit',
                label: 'Credit Score Insufficient',
                description: 'Credit score does not meet minimum requirements for this loan program',
                fcraCompliant: true,
                requiresSpecifics: ['credit_score', 'min_required', 'credit_bureau']
            },
            'CR02': {
                code: 'CR02',
                category: 'Credit',
                label: 'Delinquent Credit History',
                description: 'Payment history shows pattern of late or missed payments',
                fcraCompliant: true,
                requiresSpecifics: ['num_delinquencies', 'severity']
            },
            'CR03': {
                code: 'CR03',
                category: 'Credit',
                label: 'Insufficient Credit History',
                description: 'Credit file does not contain sufficient history to evaluate creditworthiness',
                fcraCompliant: true,
                requiresSpecifics: ['months_history', 'min_required']
            },
            'CR04': {
                code: 'CR04',
                category: 'Credit',
                label: 'High Debt-to-Credit Ratio',
                description: 'Proportion of balances to credit limits is too high',
                fcraCompliant: true,
                requiresSpecifics: ['utilization_pct', 'max_allowed']
            },
            
            // Income/Employment Reasons
            'IE01': {
                code: 'IE01',
                category: 'Income',
                label: 'Insufficient Income',
                description: 'Income is insufficient to support the requested loan amount',
                fcraCompliant: true,
                requiresSpecifics: ['monthly_income', 'required_income']
            },
            'IE02': {
                code: 'IE02',
                category: 'Employment',
                label: 'Employment Instability',
                description: 'Employment history does not demonstrate sufficient stability',
                fcraCompliant: true,
                requiresSpecifics: ['months_employed', 'required_months']
            },
            'IE03': {
                code: 'IE03',
                category: 'Income',
                label: 'Unable to Verify Income',
                description: 'Income documentation could not be verified through normal channels',
                fcraCompliant: true,
                requiresSpecifics: ['documents_requested', 'reason']
            },
            'IE04': {
                code: 'IE04',
                category: 'DTI',
                label: 'Debt-to-Income Ratio Too High',
                description: 'Debt-to-income ratio exceeds program guidelines',
                fcraCompliant: true,
                requiresSpecifics: ['dti_ratio', 'max_dti', 'monthly_debt', 'monthly_income']
            },
            
            // Collateral/Property Reasons
            'CO01': {
                code: 'CO01',
                category: 'Collateral',
                label: 'Appraisal Value Insufficient',
                description: 'Property appraisal does not support requested loan amount',
                fcraCompliant: true,
                requiresSpecifics: ['appraised_value', 'requested_amount']
            },
            'CO02': {
                code: 'CO02',
                category: 'Collateral',
                label: 'Loan-to-Value Ratio Too High',
                description: 'Loan-to-value ratio exceeds maximum for this loan program',
                fcraCompliant: true,
                requiresSpecifics: ['ltv_ratio', 'max_ltv']
            },
            'CO03': {
                code: 'CO03',
                category: 'Property',
                label: 'Property Does Not Meet Standards',
                description: 'Subject property does not meet minimum property standards',
                fcraCompliant: true,
                requiresSpecifics: ['deficiencies', 'standards_violated']
            },
            'CO04': {
                code: 'CO04',
                category: 'Property',
                label: 'Ineligible Property Type',
                description: 'Property type is not eligible for this loan program',
                fcraCompliant: true,
                requiresSpecifics: ['property_type', 'eligible_types']
            },
            
            // Cash/Reserves Reasons
            'CA01': {
                code: 'CA01',
                category: 'Cash',
                label: 'Insufficient Cash for Down Payment',
                description: 'Available funds insufficient to meet down payment requirements',
                fcraCompliant: true,
                requiresSpecifics: ['available_cash', 'required_down_payment']
            },
            'CA02': {
                code: 'CA02',
                category: 'Cash',
                label: 'Insufficient Cash Reserves',
                description: 'Cash reserves do not meet program requirements after closing',
                fcraCompliant: true,
                requiresSpecifics: ['available_reserves', 'required_reserves']
            }
        };
    }

    /**
     * Generate mortgage denial letter using AI
     * @param {Object} applicationData - Application information
     * @param {Array} denialReasons - Array of denial reason codes with details
     * @param {Object} options - Generation options
     */
    async generateDenialLetter(applicationData, denialReasons, options = {}) {
        const startTime = Date.now();
        const model = options.model || this.defaultModel;
        
        try {
            // Validate inputs
            this.validateInputs(applicationData, denialReasons);
            
            // Build comprehensive prompt
            const prompt = this.buildDenialLetterPrompt(applicationData, denialReasons, options);
            
            // Generate letter using AI
            const letterContent = await this.callAIModel(prompt, model, options);
            
            // Validate compliance
            const validation = this.complianceValidator.validateLetter(
                letterContent, 
                applicationData, 
                denialReasons
            );
            
            // Calculate generation time
            const generationTime = Date.now() - startTime;
            
            // Update stats
            this.updateStats(model, generationTime, validation.is_compliant);
            
            return {
                success: true,
                content: letterContent,
                validation: validation,
                metadata: {
                    model: model,
                    generationTime: generationTime,
                    timestamp: new Date().toISOString(),
                    applicationId: applicationData.application_id,
                    complianceScore: validation.compliance_score
                }
            };
            
        } catch (error) {
            console.error('Error generating denial letter:', error);
            return {
                success: false,
                error: error.message,
                metadata: {
                    model: model,
                    generationTime: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Build comprehensive prompt for denial letter generation
     */
    buildDenialLetterPrompt(applicationData, denialReasons, options) {
        const lenderInfo = options.lenderInfo || {
            name: 'First National Mortgage',
            address: '123 Financial Plaza, San Francisco, CA 94111',
            phone: '1-800-555-0123',
            nmls: '123456'
        };
        
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Build detailed reason descriptions
        const reasonDescriptions = denialReasons.map((reason, index) => {
            const reasonDef = this.denialReasonLibrary[reason.code];
            let desc = `${index + 1}. ${reasonDef.label.toUpperCase()}\n`;
            
            // Add specific details based on reason type
            if (reason.code === 'IE04') {
                desc += `   Your monthly debt obligations of $${reason.monthly_debt.toLocaleString()} represent ${(reason.dti_ratio * 100).toFixed(1)}% of your gross monthly income of $${reason.monthly_income.toLocaleString()}. Our lending guidelines require a maximum debt-to-income ratio of ${(reason.max_dti * 100).toFixed(1)}%. Your obligations exceed this threshold by approximately ${((reason.dti_ratio - reason.max_dti) * 100).toFixed(1)} percentage points.`;
            } else if (reason.code === 'CA01') {
                desc += `   You have indicated available liquid funds of $${reason.available_cash.toLocaleString()} for down payment and closing costs. Our analysis shows that a minimum of $${reason.required_down_payment.toLocaleString()} is required to meet your down payment requirement and closing costs for the requested loan amount. You are short by $${(reason.required_down_payment - reason.available_cash).toLocaleString()}.`;
            } else if (reason.code === 'CR01') {
                desc += `   Your credit score of ${reason.credit_score} is below our minimum lending requirement of ${reason.min_required} for this loan program. This score was obtained from ${reason.credit_bureau}.`;
            } else if (reason.code === 'CO02') {
                desc += `   The requested loan amount of $${applicationData.loan_amount.toLocaleString()} represents a loan-to-value ratio of ${(reason.ltv_ratio * 100).toFixed(1)}%. Our maximum allowable LTV for this program is ${(reason.max_ltv * 100).toFixed(1)}%.`;
            } else if (reason.details) {
                desc += `   ${reason.details}`;
            }
            
            return desc;
        }).join('\n\n');
        
        // Determine if credit was used in decision
        const creditUsed = denialReasons.some(r => r.code.startsWith('CR'));
        
        const prompt = `You are a compliance officer at ${lenderInfo.name} generating a mortgage denial letter (Adverse Action Notice) that must comply with:
- Fair Credit Reporting Act (FCRA) Section 615(a)
- Equal Credit Opportunity Act (ECOA) / Regulation B (12 CFR 1002)
- Consumer Financial Protection Bureau (CFPB) requirements

LOAN APPLICATION DETAILS:
- Application ID: ${applicationData.application_id}
- Application Date: ${applicationData.application_date}
- Applicant Name: ${applicationData.applicant_name}${applicationData.co_applicant ? `\n- Co-Applicant: ${applicationData.co_applicant}` : ''}
- Applicant Address: ${applicationData.applicant_address}, ${applicationData.applicant_city}, ${applicationData.applicant_state} ${applicationData.applicant_zip}
- Loan Type: ${applicationData.loan_type}
- Loan Amount Requested: $${applicationData.loan_amount.toLocaleString()}
- Property Address: ${applicationData.property_address}
- Loan Purpose: ${applicationData.loan_purpose}
- Decision Date: ${today}

PRINCIPAL REASON(S) FOR DENIAL:
${reasonDescriptions}

${creditUsed && applicationData.credit_score ? `CREDIT INFORMATION:
- Credit Score: ${applicationData.credit_score}
- Credit Bureau: ${applicationData.credit_bureau}
- Credit Bureau Address: ${this.getCreditBureauInfo(applicationData.credit_bureau).address}
- Credit Bureau Phone: ${this.getCreditBureauInfo(applicationData.credit_bureau).phone}
- Credit Bureau Website: ${this.getCreditBureauInfo(applicationData.credit_bureau).website}
- Reason Score Not Higher: ${applicationData.credit_explanation || 'Your credit report shows factors that negatively impact your creditworthiness, including payment history and credit utilization.'}` : ''}

COMPLIANCE REQUIREMENTS (MUST INCLUDE):
1. ✓ Professional business letter format with lender letterhead
2. ✓ Clear subject line: "ADVERSE ACTION NOTICE" or "Mortgage Application Decision"
3. ✓ Specific reasons for denial (NOT vague terms like "internal policy" or "credit scoring system")
4. ✓ Include actual numbers, percentages, and dollar amounts for each reason
5. ✓ FCRA Section 615(a) disclosures${creditUsed ? ' with credit bureau contact information' : ''}
6. ✓ ECOA non-discrimination notice (race, color, religion, national origin, sex, marital status, age, public assistance)
7. ✓ Right to receive written statement of reasons (60-day notice)
8. ✓ Appeal/reconsideration process with contact information
9. ✓ Consumer's right to obtain free credit report within 60 days${creditUsed ? ' (since credit was used)' : ''}
10. ✓ Right to dispute inaccurate information in credit report

LENDER CONTACT INFORMATION FOR APPEALS:
${lenderInfo.name}
${lenderInfo.address}
Phone: ${lenderInfo.phone}
NMLS #: ${lenderInfo.nmls}

CRITICAL: DO NOT USE VAGUE LANGUAGE
❌ NEVER say: "failed to meet our standards", "internal policy", "credit scoring system", "creditor guidelines", "doesn't meet our requirements"
✓ ALWAYS use specific facts: exact percentages, dollar amounts, numbers, dates, specific deficiencies

Generate a complete, legally compliant mortgage denial letter now. Use professional, empathetic tone while being factual and specific.`;

        return prompt;
    }

    /**
     * Call AI model through Puter.js
     */
    async callAIModel(prompt, model, options = {}) {
        if (!window.puter || !puter.ai) {
            throw new Error('Puter.js AI not available');
        }
        
        const stream = options.stream !== false;
        
        try {
            const response = await puter.ai.chat(prompt, {
                model: model,
                stream: stream,
                temperature: options.temperature || 0.3, // Lower for compliance
                max_tokens: options.max_tokens || 4000
            });
            
            if (stream) {
                let fullContent = '';
                for await (const chunk of response) {
                    if (chunk?.text) {
                        fullContent += chunk.text;
                        if (options.onProgress) {
                            options.onProgress(chunk.text, fullContent);
                        }
                    }
                }
                return fullContent;
            } else {
                return response;
            }
            
        } catch (error) {
            console.error(`Error calling ${model}:`, error);
            throw new Error(`AI model error: ${error.message}`);
        }
    }

    /**
     * Get credit bureau contact information
     */
    getCreditBureauInfo(bureau) {
        const bureaus = {
            'Equifax': {
                address: 'P.O. Box 740241, Atlanta, GA 30374',
                phone: '1-800-685-1111',
                website: 'www.equifax.com'
            },
            'Experian': {
                address: 'P.O. Box 9701, Allen, TX 75013',
                phone: '1-888-397-3742',
                website: 'www.experian.com'
            },
            'TransUnion': {
                address: 'P.O. Box 1000, Chester, PA 19016',
                phone: '1-800-916-8800',
                website: 'www.transunion.com'
            }
        };
        
        return bureaus[bureau] || bureaus['Equifax'];
    }

    /**
     * Validate inputs
     */
    validateInputs(applicationData, denialReasons) {
        const required = ['application_id', 'applicant_name', 'applicant_address', 
                         'loan_amount', 'loan_type', 'property_address'];
        
        for (const field of required) {
            if (!applicationData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        if (!denialReasons || denialReasons.length === 0) {
            throw new Error('At least one denial reason is required');
        }
        
        if (denialReasons.length > 4) {
            console.warn('ECOA recommends maximum 4 principal reasons. Consider consolidating.');
        }
    }

    /**
     * Update generation statistics
     */
    updateStats(model, generationTime, isCompliant) {
        this.stats.totalGenerated++;
        
        if (!this.stats.byModel[model]) {
            this.stats.byModel[model] = { count: 0, avgTime: 0, complianceRate: 0 };
        }
        
        const modelStats = this.stats.byModel[model];
        modelStats.count++;
        
        // Update average generation time
        const prevAvg = this.stats.avgGenerationTime;
        this.stats.avgGenerationTime = (prevAvg * (this.stats.totalGenerated - 1) + generationTime) / this.stats.totalGenerated;
        
        // Update compliance rate
        const complianceCount = isCompliant ? 1 : 0;
        this.stats.complianceRate = ((this.stats.complianceRate * (this.stats.totalGenerated - 1)) + complianceCount) / this.stats.totalGenerated;
    }

    /**
     * Get available models
     */
    getAvailableModels() {
        return Object.entries(this.models)
            .filter(([_, info]) => info.available)
            .map(([key, info]) => ({ value: key, label: info.name, provider: info.provider }));
    }

    /**
     * Get denial reason library
     */
    getDenialReasons() {
        return Object.values(this.denialReasonLibrary);
    }

    /**
     * Get generation statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
