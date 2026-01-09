/**
 * Mortgage Denial Application - Main Controller
 * Integrates AI engine, storage, and UI
 */

class MortgageDenialApp {
    constructor() {
        this.aiEngine = new MortgageDenialAIEngine();
        this.storage = new MortgageDenialStorage();
        this.currentPage = 'dashboard';
        this.currentLetterId = null;
        this.formData = {};
        
        // Initialize on load
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Initializing Mortgage Denial AI Platform...');
        
        // Check Puter.js availability
        if (!window.puter) {
            this.showError('Puter.js not available. Please reload the page.');
            return;
        }

        // Initialize storage
        await this.storage.initialize();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load dashboard
        await this.loadDashboard();
        
        console.log('✅ Application initialized successfully');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    async navigateTo(page) {
        this.currentPage = page;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'generate': 'Generate Denial Letter',
            'letters': 'All Letters',
            'appeals': 'Appeals',
            'compliance': 'Compliance',
            'lenders': 'Lenders'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;
        
        // Load page content
        const contentArea = document.getElementById('contentArea');
        
        switch(page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'generate':
                await this.loadGeneratePage();
                break;
            case 'letters':
                await this.loadLettersPage();
                break;
            case 'appeals':
                await this.loadAppealsPage();
                break;
            case 'compliance':
                await this.loadCompliancePage();
                break;
            case 'lenders':
                await this.loadLendersPage();
                break;
        }
    }

    async loadDashboard() {
        const stats = await this.storage.getStats();
        const recentLetters = await this.storage.getLetters({ limit: 10 });
        
        const html = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <i class="fas fa-file-signature"></i>
                    </div>
                    <div class="stat-value">${stats.total_generated || 0}</div>
                    <div class="stat-label">Letters Generated</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-value">${stats.compliance_rate ? (stats.compliance_rate * 100).toFixed(1) : '0'}%</div>
                    <div class="stat-label">Compliance Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-value">${this.aiEngine.stats.avgGenerationTime ? (this.aiEngine.stats.avgGenerationTime / 1000).toFixed(1) : '0'} sec</div>
                    <div class="stat-label">Avg. Generation Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon cyan">
                        <i class="fas fa-rotate-left"></i>
                    </div>
                    <div class="stat-value">${stats.total_appeals || 0}</div>
                    <div class="stat-label">Appeals</div>
                </div>
            </div>

            <div class="quick-actions">
                <div class="quick-action-btn" onclick="mortgageApp.navigateTo('generate')">
                    <i class="fas fa-plus-circle"></i>
                    <span>New Denial Letter</span>
                </div>
                <div class="quick-action-btn" onclick="mortgageApp.navigateTo('letters')">
                    <i class="fas fa-list"></i>
                    <span>View All Letters</span>
                </div>
                <div class="quick-action-btn" onclick="mortgageApp.navigateTo('compliance')">
                    <i class="fas fa-shield-halved"></i>
                    <span>Compliance Check</span>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-envelope-open-text"></i>
                        Recent Letters
                    </h3>
                    <button class="btn btn-secondary" onclick="mortgageApp.navigateTo('letters')">View All</button>
                </div>
                <div class="card-body">
                    ${recentLetters.letters && recentLetters.letters.length > 0 ? 
                        this.renderLettersTable(recentLetters.letters) : 
                        '<p style="text-align: center; color: var(--text-muted);">No letters generated yet</p>'}
                </div>
            </div>
        `;
        
        document.getElementById('contentArea').innerHTML = html;
    }

    async loadGeneratePage() {
        const html = `
            <div class="generate-wizard">
                <div class="wizard-steps">
                    <div class="wizard-step active" data-step="1">
                        <div class="step-number">1</div>
                        <span>Application Info</span>
                    </div>
                    <div class="wizard-connector"></div>
                    <div class="wizard-step" data-step="2">
                        <div class="step-number">2</div>
                        <span>Denial Reasons</span>
                    </div>
                    <div class="wizard-connector"></div>
                    <div class="wizard-step" data-step="3">
                        <div class="step-number">3</div>
                        <span>Generate & Review</span>
                    </div>
                </div>

                <!-- Step 1: Application Info -->
                <div class="wizard-content" id="step1" style="display: block;">
                    ${this.renderStep1Form()}
                </div>

                <!-- Step 2: Denial Reasons -->
                <div class="wizard-content" id="step2" style="display: none;">
                    ${this.renderStep2Form()}
                </div>

                <!-- Step 3: Generate & Review -->
                <div class="wizard-content" id="step3" style="display: none;">
                    ${this.renderStep3Form()}
                </div>
            </div>
        `;
        
        document.getElementById('contentArea').innerHTML = html;
        this.setupGenerateFormListeners();
    }

    renderStep1Form() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-user"></i>
                        Applicant & Application Information
                    </h3>
                </div>
                <div class="card-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Application ID <span class="required">*</span></label>
                            <input type="text" class="form-input" id="applicationId" placeholder="APP-2025-XXXXX" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Application Date <span class="required">*</span></label>
                            <input type="date" class="form-input" id="applicationDate" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Loan Type <span class="required">*</span></label>
                            <select class="form-input" id="loanType">
                                <option value="conventional">Conventional</option>
                                <option value="fha">FHA</option>
                                <option value="va">VA</option>
                                <option value="usda">USDA</option>
                                <option value="jumbo">Jumbo</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Primary Applicant Name <span class="required">*</span></label>
                            <input type="text" class="form-input" id="applicantName" placeholder="Full Legal Name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Co-Applicant Name</label>
                            <input type="text" class="form-input" id="coApplicantName" placeholder="Full Legal Name (if applicable)">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Street Address <span class="required">*</span></label>
                            <input type="text" class="form-input" id="applicantAddress" placeholder="Street Address" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">City <span class="required">*</span></label>
                            <input type="text" class="form-input" id="applicantCity" placeholder="City" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">State <span class="required">*</span></label>
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
                            <label class="form-label">ZIP Code <span class="required">*</span></label>
                            <input type="text" class="form-input" id="applicantZip" placeholder="ZIP" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Loan Amount <span class="required">*</span></label>
                            <input type="number" class="form-input" id="loanAmount" placeholder="Amount" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Property Address <span class="required">*</span></label>
                            <input type="text" class="form-input" id="propertyAddress" placeholder="Property Address" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Loan Purpose <span class="required">*</span></label>
                            <select class="form-input" id="loanPurpose">
                                <option value="purchase">Purchase</option>
                                <option value="refinance">Refinance</option>
                                <option value="cash-out">Cash-Out Refinance</option>
                            </select>
                        </div>
                    </div>

                    <div style="text-align: right; margin-top: 24px;">
                        <button class="btn btn-primary" onclick="mortgageApp.goToStep(2)">
                            Continue to Denial Reasons
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderStep2Form() {
        const reasons = this.aiEngine.getDenialReasons();
        const reasonsHtml = reasons.map(reason => `
            <div class="denial-reason-card" data-code="${reason.code}">
                <input type="checkbox" name="denial_reason" value="${reason.code}" id="reason_${reason.code}">
                <label for="reason_${reason.code}">
                    <div class="reason-header">
                        <span class="reason-code">${reason.code}</span>
                        <span class="reason-label">${reason.label}</span>
                    </div>
                    <p class="reason-desc">${reason.description}</p>
                </label>
            </div>
        `).join('');

        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        Select Denial Reasons (Max 4)
                    </h3>
                    <span class="status-badge status-pending">
                        <i class="fas fa-info-circle"></i>
                        FCRA/ECOA Compliant
                    </span>
                </div>
                <div class="card-body">
                    <div class="denial-reasons-grid">
                        ${reasonsHtml}
                    </div>

                    <div class="form-group" style="margin-top: 24px;">
                        <label class="form-label">AI Model</label>
                        <select class="form-input" id="aiModel">
                            <option value="gpt-4o">GPT-4o (Recommended)</option>
                            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                            <option value="gemini-3-pro">Gemini 3.0 Pro</option>
                        </select>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-top: 24px;">
                        <button class="btn btn-secondary" onclick="mortgageApp.goToStep(1)">
                            <i class="fas fa-arrow-left"></i>
                            Back
                        </button>
                        <button class="btn btn-primary" onclick="mortgageApp.generateLetter()">
                            Generate Letter with AI
                            <i class="fas fa-wand-magic-sparkles"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderStep3Form() {
        return `
            <div class="ai-processing" id="aiProcessing">
                <div class="loading-spinner" style="width: 80px; height: 80px; border-width: 4px;"></div>
                <h3 style="margin-top: 24px;">Generating FCRA-Compliant Denial Letter...</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">AI is crafting a legally compliant adverse action notice</p>
            </div>

            <div id="letterResult" style="display: none;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-file-alt"></i>
                            Generated Denial Letter
                        </h3>
                        <div class="btn-group">
                            <button class="btn btn-secondary" onclick="mortgageApp.downloadLetter()">
                                <i class="fas fa-download"></i>
                                Download
                            </button>
                            <button class="btn btn-success" onclick="mortgageApp.saveLetter()">
                                <i class="fas fa-save"></i>
                                Save to Cloud
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="letter-preview" id="letterContent"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-shield-check"></i>
                            Compliance Validation
                        </h3>
                        <span class="status-badge" id="complianceStatus"></span>
                    </div>
                    <div class="card-body">
                        <div id="complianceDetails"></div>
                    </div>
                </div>
            </div>
        `;
    }

    setupGenerateFormListeners() {
        // Handle denial reason selection
        document.querySelectorAll('.denial-reason-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const checkbox = card.querySelector('input');
                    checkbox.checked = !checkbox.checked;
                }
                
                const selected = document.querySelectorAll('.denial-reason-card input:checked').length;
                if (selected > 4) {
                    e.preventDefault();
                    this.showWarning('Maximum 4 denial reasons recommended by ECOA');
                }
            });
        });
    }

    goToStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.wizard-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Show current step
        document.getElementById(`step${stepNumber}`).style.display = 'block';
        
        // Update step indicators
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === stepNumber) {
                step.classList.add('active');
            }
        });

        // Collect form data from step 1 before moving forward
        if (stepNumber === 2) {
            this.collectStep1Data();
        }
    }

    collectStep1Data() {
        this.formData = {
            application_id: document.getElementById('applicationId').value,
            application_date: document.getElementById('applicationDate').value,
            loan_type: document.getElementById('loanType').value,
            applicant_name: document.getElementById('applicantName').value,
            co_applicant: document.getElementById('coApplicantName').value,
            applicant_address: document.getElementById('applicantAddress').value,
            applicant_city: document.getElementById('applicantCity').value,
            applicant_state: document.getElementById('applicantState').value,
            applicant_zip: document.getElementById('applicantZip').value,
            loan_amount: parseInt(document.getElementById('loanAmount').value),
            property_address: document.getElementById('propertyAddress').value,
            loan_purpose: document.getElementById('loanPurpose').value
        };
    }

    async generateLetter() {
        // Collect selected denial reasons
        const selectedReasons = [];
        document.querySelectorAll('.denial-reason-card input:checked').forEach(checkbox => {
            selectedReasons.push({
                code: checkbox.value,
                // Add mock details - in production, collect from form
                details: 'Specific details would be collected from additional form fields'
            });
        });

        if (selectedReasons.length === 0) {
            this.showError('Please select at least one denial reason');
            return;
        }

        const model = document.getElementById('aiModel').value;
        
        // Move to step 3
        this.goToStep(3);

        // Show processing
        document.getElementById('aiProcessing').style.display = 'flex';
        document.getElementById('letterResult').style.display = 'none';

        try {
            // Generate letter using AI
            const result = await this.aiEngine.generateDenialLetter(
                this.formData,
                selectedReasons,
                { 
                    model: model,
                    onProgress: (chunk, fullText) => {
                        // Could show streaming progress here
                    }
                }
            );

            if (result.success) {
                this.currentGeneratedLetter = result;
                this.displayGeneratedLetter(result);
            } else {
                this.showError('Failed to generate letter: ' + result.error);
            }
        } catch (error) {
            console.error('Generation error:', error);
            this.showError('Error generating letter: ' + error.message);
        }
    }

    displayGeneratedLetter(result) {
        document.getElementById('aiProcessing').style.display = 'none';
        document.getElementById('letterResult').style.display = 'block';
        
        // Display letter content
        document.getElementById('letterContent').innerHTML = 
            `<pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif; line-height: 1.8;">${result.content}</pre>`;
        
        // Display compliance status
        const validation = result.validation;
        const statusBadge = document.getElementById('complianceStatus');
        
        if (validation.is_compliant) {
            statusBadge.className = 'status-badge status-completed';
            statusBadge.innerHTML = '<i class="fas fa-check"></i> Compliant';
        } else {
            statusBadge.className = 'status-badge status-denied';
            statusBadge.innerHTML = '<i class="fas fa-exclamation"></i> Issues Found';
        }
        
        // Display compliance details
        let detailsHtml = `
            <div class="compliance-score-bar">
                <div class="score-label">Compliance Score: ${validation.compliance_score}/100</div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${validation.compliance_score}%"></div>
                </div>
            </div>
        `;
        
        if (validation.critical_errors.length > 0) {
            detailsHtml += '<h4 style="color: var(--danger); margin-top: 24px;">Critical Issues:</h4><ul>';
            validation.critical_errors.forEach(error => {
                detailsHtml += `<li style="margin-bottom: 8px;">${error}</li>`;
            });
            detailsHtml += '</ul>';
        }
        
        if (validation.warnings.length > 0) {
            detailsHtml += '<h4 style="color: var(--warning); margin-top: 24px;">Warnings:</h4><ul>';
            validation.warnings.forEach(warning => {
                detailsHtml += `<li style="margin-bottom: 8px;">${warning}</li>`;
            });
            detailsHtml += '</ul>';
        }
        
        if (validation.passed_checks.length > 0) {
            detailsHtml += '<h4 style="color: var(--success); margin-top: 24px;">Passed Checks:</h4><ul>';
            validation.passed_checks.forEach(check => {
                detailsHtml += `<li style="margin-bottom: 8px;">${check}</li>`;
            });
            detailsHtml += '</ul>';
        }
        
        document.getElementById('complianceDetails').innerHTML = detailsHtml;
    }

    async saveLetter() {
        if (!this.currentGeneratedLetter) {
            this.showError('No letter to save');
            return;
        }

        const result = await this.storage.saveLetter({
            applicationId: this.formData.application_id,
            lenderId: 'default',
            content: this.currentGeneratedLetter.content,
            denialReasons: this.currentGeneratedLetter.metadata.denial_reasons,
            complianceScore: this.currentGeneratedLetter.validation.compliance_score,
            validation: this.currentGeneratedLetter.validation,
            model: this.currentGeneratedLetter.metadata.model
        });

        if (result.success) {
            this.showSuccess('Letter saved to cloud storage!');
            await this.storage.updateStats({ 
                generated: true, 
                model: this.currentGeneratedLetter.metadata.model,
                lenderId: 'default'
            });
        } else {
            this.showError('Failed to save: ' + result.error);
        }
    }

    downloadLetter() {
        if (!this.currentGeneratedLetter) {
            this.showError('No letter to download');
            return;
        }

        const blob = new Blob([this.currentGeneratedLetter.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `denial_letter_${this.formData.application_id}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async loadLettersPage() {
        const result = await this.storage.getLetters();
        
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-envelope-open-text"></i>
                        All Denial Letters
                    </h3>
                    <button class="btn btn-primary" onclick="mortgageApp.navigateTo('generate')">
                        <i class="fas fa-plus"></i>
                        New Letter
                    </button>
                </div>
                <div class="card-body">
                    ${result.letters && result.letters.length > 0 ? 
                        this.renderLettersTable(result.letters) : 
                        '<p style="text-align: center; color: var(--text-muted);">No letters found</p>'}
                </div>
            </div>
        `;
        
        document.getElementById('contentArea').innerHTML = html;
    }

    renderLettersTable(letters) {
        return `
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>Application ID</th>
                        <th>Generated</th>
                        <th>Status</th>
                        <th>Compliance</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${letters.map(letter => `
                        <tr>
                            <td>${letter.application_id}</td>
                            <td>${new Date(letter.generated_at).toLocaleDateString()}</td>
                            <td><span class="status-badge status-${letter.status.toLowerCase()}">${letter.status}</span></td>
                            <td>${letter.compliance_score}/100</td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="mortgageApp.viewLetter('${letter.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadAppealsPage() {
        document.getElementById('contentArea').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-rotate-left"></i>
                        Appeals Management
                    </h3>
                </div>
                <div class="card-body">
                    <p style="text-align: center; color: var(--text-muted);">Appeals feature coming soon</p>
                </div>
            </div>
        `;
    }

    async loadCompliancePage() {
        const stats = await this.storage.getStats();
        
        document.getElementById('contentArea').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-shield-halved"></i>
                        Compliance Overview
                    </h3>
                </div>
                <div class="card-body">
                    <h4>Regulatory Compliance Status</h4>
                    <div style="margin-top: 24px;">
                        <div class="compliance-item">
                            <i class="fas fa-check-circle" style="color: var(--success);"></i>
                            <span>FCRA Section 615(a) - Adverse Action Notices</span>
                        </div>
                        <div class="compliance-item">
                            <i class="fas fa-check-circle" style="color: var(--success);"></i>
                            <span>ECOA/Regulation B (12 CFR 1002)</span>
                        </div>
                        <div class="compliance-item">
                            <i class="fas fa-check-circle" style="color: var(--success);"></i>
                            <span>CFPB Requirements</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadLendersPage() {
        document.getElementById('contentArea').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-building-columns"></i>
                        Lender Management
                    </h3>
                </div>
                <div class="card-body">
                    <p style="text-align: center; color: var(--text-muted);">Lender configuration coming soon</p>
                </div>
            </div>
        `;
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showWarning(message) {
        alert('Warning: ' + message);
    }

    showSuccess(message) {
        alert('Success: ' + message);
    }
}

// Initialize app when page loads
let mortgageApp;
window.addEventListener('DOMContentLoaded', () => {
    mortgageApp = new MortgageDenialApp();
});
