/**
 * Mortgage Denial Letter Compliance Validator
 * Validates FCRA, ECOA, and CFPB compliance requirements
 */

class MortgageComplianceValidator {
    constructor() {
        // FCRA Section 615(a) requirements
        this.fcraRequirements = {
            credit_score_disclosure: {
                name: 'Credit Score Disclosure',
                description: 'If credit score used, must disclose exact score',
                weight: 25
            },
            credit_bureau_contact: {
                name: 'Credit Bureau Contact Info',
                description: 'Must include CRA name, address, phone, website',
                weight: 20
            },
            reason_score_not_higher: {
                name: 'Credit Score Explanation',
                description: 'Must explain why credit score is not higher',
                weight: 15
            },
            consumer_rights_notice: {
                name: 'Consumer Rights Notice',
                description: 'Must include FCRA consumer rights summary',
                weight: 20
            },
            free_report_notice: {
                name: 'Free Credit Report Notice',
                description: 'Must inform of right to free report within 60 days',
                weight: 20
            }
        };

        // ECOA/Regulation B requirements
        this.ecoaRequirements = {
            specific_reasons: {
                name: 'Specific Denial Reasons',
                description: 'Must cite 1-4 specific principal reasons',
                weight: 30
            },
            no_vague_language: {
                name: 'No Vague Language',
                description: 'Cannot use vague terms or internal policies',
                weight: 30
            },
            non_discrimination_notice: {
                name: 'Non-Discrimination Notice',
                description: 'Must include ECOA non-discrimination notice',
                weight: 20
            },
            timely_notification: {
                name: 'Timely Notification',
                description: 'Must be sent within 30 days of decision',
                weight: 20
            }
        };

        // Prohibited vague phrases (CFPB guidance)
        this.vaguePhrasesProhibited = [
            'failed to meet our standards',
            'internal policy',
            'creditor\'s guidelines',
            'internal standards',
            'credit scoring system',
            'doesn\'t meet requirements',
            'doesn\'t meet our requirements',
            'policy requirements',
            'our criteria',
            'underwriting policy',
            'lending standards',
            'failed to qualify',
            'does not satisfy',
            'inadequate credit'
        ];

        // Required elements for complete letter
        this.requiredElements = [
            'adverse action',
            'denial',
            'principal reason',
            'FCRA',
            'credit report',
            'dispute',
            'Equal Credit Opportunity'
        ];
    }

    /**
     * Comprehensive validation of denial letter
     * @param {string} letterContent - Generated letter text
     * @param {Object} applicationData - Application information
     * @param {Array} denialReasons - Denial reasons used
     * @returns {Object} Validation results
     */
    validateLetter(letterContent, applicationData, denialReasons) {
        const validation = {
            is_compliant: true,
            critical_errors: [],
            warnings: [],
            passed_checks: [],
            compliance_score: 100,
            fcra_score: 100,
            ecoa_score: 100,
            details: {}
        };

        const lowerContent = letterContent.toLowerCase();

        // 1. FCRA Validation (if credit was used)
        const creditUsed = this.isCreditUsed(denialReasons);
        if (creditUsed) {
            this.validateFCRA(letterContent, lowerContent, applicationData, validation);
        } else {
            validation.passed_checks.push('Credit not used in decision - FCRA credit disclosures not required');
        }

        // 2. ECOA/Regulation B Validation
        this.validateECOA(letterContent, lowerContent, denialReasons, validation);

        // 3. Specificity Checks
        this.validateSpecificity(letterContent, denialReasons, validation);

        // 4. Required Elements Check
        this.validateRequiredElements(letterContent, lowerContent, validation);

        // 5. Vague Language Check
        this.checkVagueLanguage(letterContent, lowerContent, validation);

        // Calculate final scores
        this.calculateScores(validation);

        return validation;
    }

    /**
     * Check if credit was used in decision
     */
    isCreditUsed(denialReasons) {
        return denialReasons.some(reason => 
            reason.code && reason.code.startsWith('CR')
        );
    }

    /**
     * Validate FCRA compliance
     */
    validateFCRA(letterContent, lowerContent, applicationData, validation) {
        // Check 1: Credit score disclosure
        if (applicationData.credit_score) {
            if (letterContent.includes(applicationData.credit_score.toString())) {
                validation.passed_checks.push('✓ FCRA: Credit score disclosed');
                validation.details.credit_score_disclosed = true;
            } else {
                validation.critical_errors.push('❌ FCRA §615(a): Credit score value not disclosed');
                validation.is_compliant = false;
                validation.details.credit_score_disclosed = false;
            }
        }

        // Check 2: Credit bureau identification
        const bureaus = ['equifax', 'experian', 'transunion'];
        const bureauFound = bureaus.some(bureau => lowerContent.includes(bureau));
        
        if (bureauFound) {
            validation.passed_checks.push('✓ FCRA: Credit bureau identified');
            validation.details.credit_bureau_identified = true;
        } else {
            validation.critical_errors.push('❌ FCRA §615(a): Credit bureau name not disclosed');
            validation.is_compliant = false;
            validation.details.credit_bureau_identified = false;
        }

        // Check 3: Credit bureau contact info
        const hasPhone = /1-8\d{2}-\d{3}-\d{4}/.test(letterContent);
        const hasAddress = /P\.O\. Box|P\.?O\.? Box/i.test(letterContent);
        
        if (hasPhone && hasAddress) {
            validation.passed_checks.push('✓ FCRA: Credit bureau contact information complete');
            validation.details.bureau_contact_complete = true;
        } else {
            if (!hasPhone) {
                validation.warnings.push('⚠️ FCRA: Credit bureau phone number may be missing');
                validation.details.bureau_phone_missing = true;
            }
            if (!hasAddress) {
                validation.warnings.push('⚠️ FCRA: Credit bureau address may be missing');
                validation.details.bureau_address_missing = true;
            }
        }

        // Check 4: Explanation of why score is not higher
        const hasExplanation = 
            lowerContent.includes('why') || 
            lowerContent.includes('factors') ||
            lowerContent.includes('negatively impact') ||
            lowerContent.includes('affect');
        
        if (hasExplanation) {
            validation.passed_checks.push('✓ FCRA: Credit score explanation provided');
            validation.details.score_explanation = true;
        } else {
            validation.warnings.push('⚠️ FCRA: Should explain why credit score is not higher');
            validation.details.score_explanation = false;
        }

        // Check 5: Free credit report notice
        const hasFreeReport = 
            (lowerContent.includes('free') && lowerContent.includes('credit report')) ||
            lowerContent.includes('60 days');
        
        if (hasFreeReport) {
            validation.passed_checks.push('✓ FCRA: Free credit report notice included');
            validation.details.free_report_notice = true;
        } else {
            validation.critical_errors.push('❌ FCRA §612: Must inform of right to free credit report within 60 days');
            validation.is_compliant = false;
            validation.details.free_report_notice = false;
        }

        // Check 6: Dispute rights
        const hasDisputeRights = lowerContent.includes('dispute');
        if (hasDisputeRights) {
            validation.passed_checks.push('✓ FCRA: Dispute rights mentioned');
            validation.details.dispute_rights = true;
        } else {
            validation.warnings.push('⚠️ FCRA: Should mention right to dispute inaccurate information');
            validation.details.dispute_rights = false;
        }
    }

    /**
     * Validate ECOA/Regulation B compliance
     */
    validateECOA(letterContent, lowerContent, denialReasons, validation) {
        // Check 1: Number of reasons (1-4 recommended)
        if (denialReasons.length >= 1 && denialReasons.length <= 4) {
            validation.passed_checks.push(`✓ ECOA: Appropriate number of reasons (${denialReasons.length})`);
            validation.details.reason_count_appropriate = true;
        } else if (denialReasons.length === 0) {
            validation.critical_errors.push('❌ ECOA §1002.9: Must provide at least one principal reason');
            validation.is_compliant = false;
            validation.details.reason_count_appropriate = false;
        } else if (denialReasons.length > 4) {
            validation.warnings.push(`⚠️ ECOA: ${denialReasons.length} reasons provided (max 4 recommended)`);
            validation.details.reason_count_appropriate = false;
        }

        // Check 2: Non-discrimination notice
        const hasNonDiscrimination = 
            lowerContent.includes('discrimination') || 
            lowerContent.includes('ecoa') ||
            lowerContent.includes('equal credit opportunity');
        
        if (hasNonDiscrimination) {
            validation.passed_checks.push('✓ ECOA: Non-discrimination notice included');
            validation.details.non_discrimination_notice = true;
        } else {
            validation.critical_errors.push('❌ ECOA §1002.9(a)(2): Must include non-discrimination notice');
            validation.is_compliant = false;
            validation.details.non_discrimination_notice = false;
        }

        // Check 3: Protected classes mentioned
        const protectedClasses = ['race', 'color', 'religion', 'national origin', 'sex', 'marital status', 'age'];
        const mentionedClasses = protectedClasses.filter(cls => lowerContent.includes(cls));
        
        if (mentionedClasses.length >= 5) {
            validation.passed_checks.push('✓ ECOA: Protected classes enumerated');
            validation.details.protected_classes_enumerated = true;
        } else {
            validation.warnings.push('⚠️ ECOA: Should enumerate protected classes (race, color, religion, etc.)');
            validation.details.protected_classes_enumerated = false;
        }

        // Check 4: Statement of rights (60-day appeal period)
        const hasSixtyDays = lowerContent.includes('60 days') || lowerContent.includes('sixty days');
        if (hasSixtyDays) {
            validation.passed_checks.push('✓ ECOA: 60-day appeal period mentioned');
            validation.details.appeal_period = true;
        } else {
            validation.warnings.push('⚠️ ECOA: Should mention 60-day period for requesting reasons');
            validation.details.appeal_period = false;
        }

        // Check 5: Contact information for questions
        const hasContact = 
            /\d{3}-\d{3}-\d{4}/.test(letterContent) || 
            /1-8\d{2}-\d{3}-\d{4}/.test(letterContent);
        
        if (hasContact) {
            validation.passed_checks.push('✓ ECOA: Contact information provided');
            validation.details.contact_info = true;
        } else {
            validation.warnings.push('⚠️ ECOA: Should provide contact information for questions');
            validation.details.contact_info = false;
        }
    }

    /**
     * Validate specificity of reasons
     */
    validateSpecificity(letterContent, denialReasons, validation) {
        // Check for dollar amounts
        const hasDollarAmounts = /\$[\d,]+/.test(letterContent);
        if (hasDollarAmounts) {
            validation.passed_checks.push('✓ Specificity: Dollar amounts included');
            validation.details.has_dollar_amounts = true;
        } else {
            validation.warnings.push('⚠️ Specificity: Consider including specific dollar amounts');
            validation.details.has_dollar_amounts = false;
        }

        // Check for percentages
        const hasPercentages = /\d+\.?\d*%/.test(letterContent);
        if (hasPercentages) {
            validation.passed_checks.push('✓ Specificity: Percentages included');
            validation.details.has_percentages = true;
        } else {
            validation.warnings.push('⚠️ Specificity: Consider including specific percentages');
            validation.details.has_percentages = false;
        }

        // Check for numbers in general
        const hasNumbers = /\d{2,}/.test(letterContent);
        if (hasNumbers) {
            validation.passed_checks.push('✓ Specificity: Specific numbers provided');
            validation.details.has_specific_numbers = true;
        } else {
            validation.warnings.push('⚠️ Specificity: Reasons appear vague - add specific numbers');
            validation.details.has_specific_numbers = false;
        }
    }

    /**
     * Validate required elements are present
     */
    validateRequiredElements(letterContent, lowerContent, validation) {
        const missingElements = [];
        
        for (const element of this.requiredElements) {
            if (!lowerContent.includes(element.toLowerCase())) {
                missingElements.push(element);
            }
        }

        if (missingElements.length === 0) {
            validation.passed_checks.push('✓ All required elements present');
            validation.details.all_elements_present = true;
        } else {
            missingElements.forEach(element => {
                validation.warnings.push(`⚠️ Missing element: "${element}"`);
            });
            validation.details.all_elements_present = false;
            validation.details.missing_elements = missingElements;
        }
    }

    /**
     * Check for prohibited vague language
     */
    checkVagueLanguage(letterContent, lowerContent, validation) {
        const foundVagueTerms = [];
        
        for (const phrase of this.vaguePhrasesProhibited) {
            if (lowerContent.includes(phrase.toLowerCase())) {
                foundVagueTerms.push(phrase);
                validation.critical_errors.push(`❌ CFPB: Vague language detected: "${phrase}"`);
                validation.is_compliant = false;
            }
        }

        if (foundVagueTerms.length === 0) {
            validation.passed_checks.push('✓ No prohibited vague language detected');
            validation.details.no_vague_language = true;
        } else {
            validation.details.no_vague_language = false;
            validation.details.vague_terms_found = foundVagueTerms;
        }
    }

    /**
     * Calculate compliance scores
     */
    calculateScores(validation) {
        // Base score starts at 100
        let score = 100;

        // Deduct points for critical errors (25 points each)
        score -= validation.critical_errors.length * 25;

        // Deduct points for warnings (5 points each)
        score -= validation.warnings.length * 5;

        // Ensure score doesn't go below 0
        score = Math.max(0, score);

        validation.compliance_score = score;

        // Calculate FCRA-specific score
        const fcraChecks = Object.keys(validation.details).filter(k => 
            k.includes('credit') || k.includes('bureau') || k.includes('score') || 
            k.includes('report') || k.includes('dispute')
        );
        const fcraPassedCount = fcraChecks.filter(k => validation.details[k] === true).length;
        validation.fcra_score = fcraChecks.length > 0 ? 
            Math.round((fcraPassedCount / fcraChecks.length) * 100) : 100;

        // Calculate ECOA-specific score
        const ecoaChecks = Object.keys(validation.details).filter(k => 
            k.includes('reason') || k.includes('discrimination') || k.includes('appeal') ||
            k.includes('contact') || k.includes('protected')
        );
        const ecoaPassedCount = ecoaChecks.filter(k => validation.details[k] === true).length;
        validation.ecoa_score = ecoaChecks.length > 0 ? 
            Math.round((ecoaPassedCount / ecoaChecks.length) * 100) : 100;

        // Determine compliance status
        validation.is_compliant = validation.critical_errors.length === 0;
    }

    /**
     * Generate human-readable compliance report
     */
    generateComplianceReport(validation) {
        let report = `COMPLIANCE VALIDATION REPORT\n`;
        report += `${'='.repeat(50)}\n\n`;
        
        report += `Overall Status: ${validation.is_compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}\n`;
        report += `Compliance Score: ${validation.compliance_score}/100\n`;
        report += `FCRA Score: ${validation.fcra_score}/100\n`;
        report += `ECOA Score: ${validation.ecoa_score}/100\n\n`;

        if (validation.critical_errors.length > 0) {
            report += `CRITICAL ISSUES (${validation.critical_errors.length}):\n`;
            validation.critical_errors.forEach(error => {
                report += `  ${error}\n`;
            });
            report += `\n`;
        }

        if (validation.warnings.length > 0) {
            report += `WARNINGS (${validation.warnings.length}):\n`;
            validation.warnings.forEach(warning => {
                report += `  ${warning}\n`;
            });
            report += `\n`;
        }

        if (validation.passed_checks.length > 0) {
            report += `PASSED CHECKS (${validation.passed_checks.length}):\n`;
            validation.passed_checks.forEach(check => {
                report += `  ${check}\n`;
            });
            report += `\n`;
        }

        return report;
    }

    /**
     * Quick compliance check (lightweight version)
     */
    quickCheck(letterContent) {
        const lowerContent = letterContent.toLowerCase();
        const issues = [];

        // Check for vague language
        for (const phrase of this.vaguePhrasesProhibited) {
            if (lowerContent.includes(phrase.toLowerCase())) {
                issues.push(`Vague language: "${phrase}"`);
            }
        }

        // Check for required terms
        if (!lowerContent.includes('adverse action')) {
            issues.push('Missing "Adverse Action" notice');
        }
        if (!lowerContent.includes('equal credit opportunity')) {
            issues.push('Missing ECOA reference');
        }

        return {
            passed: issues.length === 0,
            issues: issues
        };
    }
}
