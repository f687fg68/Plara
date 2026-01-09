/**
 * Page rendering methods for Mortgage Denial App
 * Extension of MortgageDenialAppComplete
 */

// Add these methods to the main app class
if (typeof MortgageDenialAppComplete !== 'undefined') {
    
    /**
     * Load generate letter page with wizard
     */
    MortgageDenialAppComplete.prototype.loadGeneratePage = async function() {
        const html = `
            <div class="wizard-container">
                <div class="wizard-steps" style="display: flex; align-items: center; justify-content: center; margin-bottom: 32px; gap: 16px;">
                    <div class="wizard-step active" id="wizardStep1" style="display: flex; align-items: center; gap: 12px;">
                        <div class="step-circle" style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600;">1</div>
                        <span style="font-size: 14px; font-weight: 500;">Application Info</span>
                    </div>
                    <div class="step-connector" style="width: 60px; height: 2px; background: var(--border);"></div>
                    <div class="wizard-step" id="wizardStep2" style="display: flex; align-items: center; gap: 12px;">
                        <div class="step-circle" style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg-elevated); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 600;">2</div>
                        <span style="font-size: 14px; font-weight: 500; color: var(--text-muted);">Denial Reasons</span>
                    </div>
                    <div class="step-connector" style="width: 60px; height: 2px; background: var(--border);"></div>
                    <div class="wizard-step" id="wizardStep3" style="display: flex; align-items: center; gap: 12px;">
                        <div class="step-circle" style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg-elevated); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 600;">3</div>
                        <span style="font-size: 14px; font-weight: 500; color: var(--text-muted);">Generate & Review</span>
                    </div>
                </div>

                <!-- Step 1 -->
                <div id="step1Content" style="display: block;">
                    ${this.renderStep1Form()}
                </div>

                <!-- Step 2 -->
                <div id="step2Content" style="display: none;">
                    ${this.renderStep2Form()}
                </div>

                <!-- Step 3 -->
                <div id="step3Content" style="display: none;">
                    ${this.renderStep3Form()}
                </div>
            </div>
        `;
        
        document.getElementById('contentArea').innerHTML = html;
        this.setupGenerateFormListeners();
    };

    /**
     * Render Step 1: Application Info
     */
    MortgageDenialAppComplete.prototype.renderStep1Form = function() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-user"></i>
                        Applicant & Application Information
                    </h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label class="form-label">Application ID <span style="color: var(--danger);">*</span></label>
                            <input type="text" class="form-input" id="applicationId" placeholder="APP-2025-XXXXX" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Application Date <span style="color: var(--danger);">*</span></label>
                            <input type="date" class="form-input" id="applicationDate" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Loan Type <span style="color: var(--danger);">*</span></label>
                            <select class="form-input" id="loanType" required>
                                <option value="conventional">Conventional</option>
                                <option value="fha">FHA</option>
                                <option value="va">VA</option>
                                <option value="usda">USDA</option>
                                <option value="jumbo">Jumbo</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label class="form-label">Primary Applicant Name <span style="color: var(--danger);">*</span></label>
                            <input type="text" class="form-input" id="applicantName" placeholder="Full Legal Name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Co-Applicant Name</label>
                            <input type="text" class="form-input" id="coApplicantName" placeholder="Full Legal Name (if applicable)">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label class="form-label">Street Address <span style="color: var(--danger);">*</span></label>
                            <input type="text" class="form-input" id="applicantAddress" placeholder="Street Address" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">City <span style="color: var(--danger);">*</span></label>
                            <input type="text" class="form-input" id="applicantCity" placeholder="City" required>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label class="form-label">State <span style="color: var(--danger);">*</span></label>
                            <select class="form-input" id="applicantState" required>
                                <option value="">Select State</option>
                                <option value="AL">Alabama</option>
                                <option value="CA">California</option>
                                <option value="FL">Florida</option>
                                <option value="IL">Illinois</option>
                                <option value="NY">New York</option>
                                <option value="TX">Texas</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">ZIP Code <span style="color: var(--danger);">*</span></label>
                            <input type="text" class="form-input" id="applicantZip" placeholder="ZIP" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Loan Amount <span style="color: var(--danger);">*</span></label>
                            <input type="number" class="form-input" id="loanAmount" placeholder="Amount" required>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div class="form-group">
                            <label class="form-label">Property Address <span style="color: var(--danger);">*</span></label>
                            <input type="text" class="form-input" id="propertyAddress" placeholder="Property Address" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Loan Purpose <span style="color: var(--danger);">*</span></label>
                            <select class="form-input" id="loanPurpose" required>
                                <option value="purchase">Purchase</option>
                                <option value="refinance">Refinance</option>
                                <option value="cash-out">Cash-Out Refinance</option>
                            </select>
                        </div>
                    </div>

                    <div style="text-align: right;">
                        <button class="btn btn-primary" onclick="app.goToStep(2)">
                            Continue to Denial Reasons
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Render Step 2: Denial Reasons
     */
    MortgageDenialAppComplete.prototype.renderStep2Form = function() {
        const reasons = this.aiEngine.getDenialReasons();
        
        const reasonsHtml = reasons.map(reason => `
            <div class="denial-reason-card" data-code="${reason.code}" style="background: var(--bg-elevated); border: 2px solid var(--border); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;">
                <input type="checkbox" name="denial_reason" value="${reason.code}" id="reason_${reason.code}" style="display: none;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <div class="reason-checkbox" style="width: 22px; height: 22px; border: 2px solid var(--border); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-check" style="color: white; font-size: 12px; display: none;"></i>
                    </div>
                    <span style="font-size: 11px; font-weight: 600; color: var(--primary-light); background: rgba(37, 99, 235, 0.15); padding: 2px 8px; border-radius: 4px;">${reason.code}</span>
                    <span style="font-weight: 600; font-size: 14px;">${reason.title}</span>
                </div>
                <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-left: 34px;">${reason.description}</p>
            </div>
        `).join('');

        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        Select Denial Reasons (Max 4 Recommended)
                    </h3>
                    <span class="status-badge status-pending" style="padding: 6px 12px; border-radius: 20px; font-size: 12px;">
                        <i class="fas fa-info-circle"></i>
                        FCRA/ECOA Compliant
                    </span>
                </div>
                <div class="card-body">
                    <p style="color: var(--text-muted); margin-bottom: 24px;">
                        Select the specific reasons for denial. These will be included in the adverse action notice as required by FCRA Section 615(a) and CFPB Regulation B.
                    </p>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
                        ${reasonsHtml}
                    </div>

                    <div class="form-group">
                        <label class="form-label">AI Model Selection</label>
                        <select class="form-input" id="aiModelSelect">
                            <option value="gemini-2.0-flash-exp" selected>Gemini 3.0 Pro (Recommended)</option>
                            <option value="claude-sonnet-4">Claude Sonnet 4.5</option>
                            <option value="gpt-4o">GPT-4o</option>
                        </select>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-top: 24px;">
                        <button class="btn btn-secondary" onclick="app.goToStep(1)">
                            <i class="fas fa-arrow-left"></i>
                            Back
                        </button>
                        <button class="btn btn-primary" onclick="app.startGeneration()">
                            Generate Letter with AI
                            <i class="fas fa-wand-magic-sparkles"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Render Step 3: Generation & Review
     */
    MortgageDenialAppComplete.prototype.renderStep3Form = function() {
        return `
            <div id="aiProcessingView" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px; text-align: center;">
                <div style="width: 80px; height: 80px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <h3 style="margin-top: 24px; font-size: 20px;">Generating FCRA-Compliant Denial Letter...</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">AI is crafting a legally compliant adverse action notice</p>
                <div id="streamingPreview" style="margin-top: 24px; max-width: 600px; text-align: left; font-size: 13px; color: var(--text-secondary);"></div>
            </div>

            <div id="letterResultView" style="display: none;">
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-file-alt"></i>
                                Generated Denial Letter
                            </h3>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-sm btn-secondary" onclick="app.regenerateLetter()">
                                    <i class="fas fa-refresh"></i>
                                    Regenerate
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="app.downloadLetter()">
                                    <i class="fas fa-download"></i>
                                    Download
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="letter-preview-modal" id="letterContentDisplay"></div>
                        </div>
                    </div>

                    <div>
                        <div class="card" style="margin-bottom: 16px;">
                            <div class="card-header">
                                <h3 class="card-title">
                                    <i class="fas fa-shield-check"></i>
                                    Compliance
                                </h3>
                                <span class="status-badge" id="complianceStatusBadge"></span>
                            </div>
                            <div class="card-body">
                                <div id="complianceDetailsDisplay"></div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">
                                    <i class="fas fa-paper-plane"></i>
                                    Actions
                                </h3>
                            </div>
                            <div class="card-body">
                                <button class="btn btn-success" style="width: 100%; margin-bottom: 12px;" onclick="app.saveLetter()">
                                    <i class="fas fa-save"></i>
                                    Save to Cloud
                                </button>
                                <button class="btn btn-secondary" style="width: 100%;" onclick="app.goToStep(2)">
                                    <i class="fas fa-arrow-left"></i>
                                    Back to Reasons
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
    };

    /**
     * Setup form listeners for denial reason selection
     */
    MortgageDenialAppComplete.prototype.setupGenerateFormListeners = function() {
        setTimeout(() => {
            document.querySelectorAll('.denial-reason-card').forEach(card => {
                card.addEventListener('click', function() {
                    const checkbox = this.querySelector('input[type="checkbox"]');
                    const checkIcon = this.querySelector('.reason-checkbox i');
                    const checkBox = this.querySelector('.reason-checkbox');
                    
                    checkbox.checked = !checkbox.checked;
                    
                    if (checkbox.checked) {
                        this.style.borderColor = 'var(--primary)';
                        this.style.background = 'rgba(37, 99, 235, 0.1)';
                        checkBox.style.background = 'var(--primary)';
                        checkBox.style.borderColor = 'var(--primary)';
                        checkIcon.style.display = 'block';
                    } else {
                        this.style.borderColor = 'var(--border)';
                        this.style.background = 'var(--bg-elevated)';
                        checkBox.style.background = 'transparent';
                        checkBox.style.borderColor = 'var(--border)';
                        checkIcon.style.display = 'none';
                    }
                    
                    // Check if more than 4 selected
                    const selected = document.querySelectorAll('.denial-reason-card input:checked').length;
                    if (selected > 4) {
                        checkbox.checked = false;
                        this.style.borderColor = 'var(--border)';
                        this.style.background = 'var(--bg-elevated)';
                        checkBox.style.background = 'transparent';
                        checkIcon.style.display = 'none';
                        alert('⚠️ Maximum 4 denial reasons recommended by ECOA');
                    }
                });
            });
        }, 100);
    };

    /**
     * Navigate between wizard steps
     */
    MortgageDenialAppComplete.prototype.goToStep = function(stepNumber) {
        // Hide all steps
        document.getElementById('step1Content').style.display = 'none';
        document.getElementById('step2Content').style.display = 'none';
        document.getElementById('step3Content').style.display = 'none';
        
        // Show selected step
        document.getElementById(`step${stepNumber}Content`).style.display = 'block';
        
        // Update wizard step indicators
        for (let i = 1; i <= 3; i++) {
            const stepEl = document.getElementById(`wizardStep${i}`);
            const circle = stepEl.querySelector('.step-circle');
            const label = stepEl.querySelector('span');
            
            if (i === stepNumber) {
                circle.style.background = 'var(--primary)';
                circle.style.color = 'white';
                circle.style.border = 'none';
                label.style.color = 'var(--text-primary)';
            } else if (i < stepNumber) {
                circle.style.background = 'var(--success)';
                circle.style.color = 'white';
                circle.style.border = 'none';
                label.style.color = 'var(--text-primary)';
            } else {
                circle.style.background = 'var(--bg-elevated)';
                circle.style.color = 'var(--text-muted)';
                circle.style.border = '2px solid var(--border)';
                label.style.color = 'var(--text-muted)';
            }
        }
        
        // Collect form data when moving forward
        if (stepNumber === 2) {
            this.collectStep1Data();
        }
        
        // Re-setup listeners
        if (stepNumber === 2) {
            this.setupGenerateFormListeners();
        }
    };

    /**
     * Collect Step 1 form data
     */
    MortgageDenialAppComplete.prototype.collectStep1Data = function() {
        this.formData = {
            applicationId: document.getElementById('applicationId').value,
            applicationDate: document.getElementById('applicationDate').value,
            loanType: document.getElementById('loanType').value,
            applicantName: document.getElementById('applicantName').value,
            coApplicantName: document.getElementById('coApplicantName').value,
            applicantAddress: document.getElementById('applicantAddress').value,
            applicantCity: document.getElementById('applicantCity').value,
            applicantState: document.getElementById('applicantState').value,
            applicantZip: document.getElementById('applicantZip').value,
            loanAmount: parseInt(document.getElementById('loanAmount').value),
            propertyAddress: document.getElementById('propertyAddress').value,
            loanPurpose: document.getElementById('loanPurpose').value
        };
        
        console.log('📝 Form data collected:', this.formData);
    };
}
