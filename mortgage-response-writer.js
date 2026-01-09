/**
 * MortgageGuard AI - FCRA/CFPB Compliant Adverse Action Generator
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * Generates legally compliant, explainable mortgage denial letters.
 */

(function () {
    'use strict';

    // Loan Types
    const LOAN_TYPES = [
        'Conventional', 'FHA', 'VA', 'USDA', 'Jumbo'
    ];

    // Common Denial Reasons (Adverse Action Codes)
    const DENIAL_REASONS = {
        'credit': 'Credit History / Score (Code 1-9)',
        'dti': 'Debt-to-Income Ratio (Excessive Obligations)',
        'income': 'Income Verification / Stability',
        'collateral': 'Collateral / Appraisal Value',
        'funds': 'Insufficient Funds to Close'
    };

    // State Management
    let mortgageState = {
        applicantName: '',
        loanType: 'Conventional',
        denialReason: 'credit',
        denialDetails: '',
        complianceCheck: true,
        currentDraft: '',
        history: []
    };

    // Initialize global state
    window.mortgageState = mortgageState;

    /**
     * Initialize Mortgage Command Handler
     */
    window.mortgageCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startMortgageWizard();
                break;
            case 'help':
                showMortgageHelp();
                break;
            default:
                await startMortgageWizard();
        }
    };

    /**
     * Start the Wizard UI
     */
    async function startMortgageWizard() {
        appendNotionMessage({
            role: 'assistant',
            content: buildWizardUI()
        });
    }

    /**
     * Build Interactive Wizard UI
     */
    function buildWizardUI() {
        return `
<div class="mortgage-wizard" style="font-family: 'Segoe UI', Roboto, sans-serif;">
    <div style="background: #1e3a8a; color: white; padding: 1.5rem; border-radius: 8px 8px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="font-size: 1.5rem;">🏦</div>
            <div>
                <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Lender Compliance AI</h2>
                <div style="font-size: 0.8rem; opacity: 0.8; letter-spacing: 0.5px;">SECURE ADVERSE ACTION NOTICE GENERATOR</div>
            </div>
        </div>
    </div>

    <div style="padding: 0 1rem 1rem; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background: #f9fafb;">
        
        <!-- Step 1: Applicant Info -->
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                APPLICANT NAME / REF ID
            </label>
            <input type="text" id="mortgage-name" placeholder="e.g., John Doe - Ref #100293" onchange="window.mortgageState.applicantName = this.value" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;">
        </div>

        <!-- Step 2: Loan Type -->
         <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                LOAN TYPE
            </label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${LOAN_TYPES.map(type => `
                    <button onclick="window.setLoanType('${type}')" style="
                        padding: 6px 12px; border-radius: 4px; border: 1px solid ${mortgageState.loanType === type ? '#1e3a8a' : '#d1d5db'};
                        background: ${mortgageState.loanType === type ? '#1e3a8a' : 'white'};
                        color: ${mortgageState.loanType === type ? 'white' : '#4b5563'};
                        cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
                    ">${type}</button>
                `).join('')}
            </div>
        </div>

        <!-- Step 3: Denial Reason Category -->
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                PRIMARY DENIAL REASON
            </label>
            <select onchange="window.setDenialReason(this.value)" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; background: white;">
                ${Object.entries(DENIAL_REASONS).map(([key, label]) =>
            `<option value="${key}" ${mortgageState.denialReason === key ? 'selected' : ''}>${label}</option>`
        ).join('')}
            </select>
        </div>

        <!-- Step 4: Specific Details (Important for AI explainability) -->
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                SPECIFIC DETAILS (Required for FCRA)
            </label>
            <textarea id="mortgage-details" rows="3" placeholder="e.g., Credit score 580 is below minimum of 620. DTI is 55%, maximum allowed is 43%." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit; resize: vertical;"></textarea>
            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">
                * AI will translate this into clear, compliant "Actionable Explanation".
            </div>
        </div>

        <button onclick="window.generateMortgageLetter()" style="width: 100%; padding: 1rem; background: #1e3a8a; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2);">
            Generate Adverse Action Notice
        </button>
    </div>
</div>`;
    }

    // -- State Setters --

    window.setLoanType = function (type) {
        mortgageState.loanType = type;
        startMortgageWizard();
    };

    window.setDenialReason = function (reason) {
        mortgageState.denialReason = reason;
    };

    /**
     * Show Help
     */
    function showMortgageHelp() {
        appendNotionMessage({
            role: 'assistant',
            content: `
<div style="padding: 1rem;">
    <h3>🏦 MortgageGuard Help</h3>
    <ul style="line-height: 1.6;">
        <li><code>/mortgage start</code> - Open the Adverse Action generator.</li>
        <li><strong>Compliance:</strong> Generates letters compliant with FCRA & CFPB.</li>
        <li><strong>Explainability:</strong> AI translates technical denial codes into clear English for the consumer.</li>
    </ul>
</div>`
        });
    }

    console.log('✅ MortgageGuard Response Writer loaded');
})();
