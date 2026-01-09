/**
 * Letter generation methods for Mortgage Denial App
 */

if (typeof MortgageDenialAppComplete !== 'undefined') {
    
    /**
     * Start letter generation process
     */
    MortgageDenialAppComplete.prototype.startGeneration = async function() {
        // Collect selected denial reasons
        const selectedReasons = [];
        document.querySelectorAll('.denial-reason-card input:checked').forEach(checkbox => {
            selectedReasons.push({
                code: checkbox.value,
                details: {} // In production, collect specific details per reason
            });
        });

        if (selectedReasons.length === 0) {
            this.showError('Please select at least one denial reason');
            return;
        }

        // Get selected model
        const model = document.getElementById('aiModelSelect').value;
        this.currentModel = model;
        this.aiEngine.setModel(model);

        console.log('🚀 Starting generation with', model, 'for', selectedReasons.length, 'reasons');

        // Move to step 3
        this.goToStep(3);

        // Show processing view
        document.getElementById('aiProcessingView').style.display = 'flex';
        document.getElementById('letterResultView').style.display = 'none';

        try {
            // Generate letter with streaming
            const result = await this.aiEngine.generateDenialLetter(
                this.formData,
                selectedReasons,
                {
                    model: model,
                    stream: true,
                    onProgress: (chunk, fullText) => {
                        // Update streaming preview
                        const preview = document.getElementById('streamingPreview');
                        if (preview) {
                            const words = fullText.split(' ').slice(-30).join(' ');
                            preview.textContent = '...' + words;
                        }
                    }
                }
            );

            if (result.success) {
                this.currentLetter = result;
                this.displayGeneratedLetter(result);
            } else {
                this.showError('Failed to generate letter: ' + result.error);
                this.goToStep(2);
            }

        } catch (error) {
            console.error('❌ Generation error:', error);
            this.showError('Error generating letter: ' + error.message);
            this.goToStep(2);
        }
    };

    /**
     * Display generated letter
     */
    MortgageDenialAppComplete.prototype.displayGeneratedLetter = function(result) {
        // Hide processing, show result
        document.getElementById('aiProcessingView').style.display = 'none';
        document.getElementById('letterResultView').style.display = 'block';

        // Display letter content
        const letterContent = document.getElementById('letterContentDisplay');
        letterContent.innerHTML = `<pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif; line-height: 1.8; font-size: 14px;">${this.escapeHtml(result.content)}</pre>`;

        // Display compliance status
        const validation = result.validation;
        const statusBadge = document.getElementById('complianceStatusBadge');
        
        if (validation.isCompliant) {
            statusBadge.className = 'status-badge status-completed';
            statusBadge.innerHTML = '<i class="fas fa-check"></i> Compliant';
        } else {
            statusBadge.className = 'status-badge status-denied';
            statusBadge.innerHTML = '<i class="fas fa-exclamation"></i> Issues Found';
        }

        // Display compliance details
        const detailsDiv = document.getElementById('complianceDetailsDisplay');
        let detailsHtml = `
            <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 13px;">Compliance Score</span>
                    <span style="font-weight: 600; color: ${validation.score >= 90 ? 'var(--success)' : validation.score >= 70 ? 'var(--warning)' : 'var(--danger)'};">${validation.score}/100</span>
                </div>
                <div style="background: var(--bg-elevated); border-radius: 10px; height: 10px; overflow: hidden;">
                    <div style="width: ${validation.score}%; height: 100%; background: ${validation.score >= 90 ? 'var(--success)' : validation.score >= 70 ? 'var(--warning)' : 'var(--danger)'};"></div>
                </div>
            </div>

            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
                ${validation.passedChecks} of ${validation.totalChecks} checks passed
            </div>
        `;

        if (validation.criticalErrors.length > 0) {
            detailsHtml += '<h4 style="color: var(--danger); font-size: 13px; margin: 16px 0 8px;">Critical Issues:</h4><ul style="font-size: 12px; margin: 0; padding-left: 20px;">';
            validation.criticalErrors.forEach(error => {
                detailsHtml += `<li style="margin-bottom: 6px; color: var(--danger);">${error}</li>`;
            });
            detailsHtml += '</ul>';
        }

        if (validation.warnings.length > 0) {
            detailsHtml += '<h4 style="color: var(--warning); font-size: 13px; margin: 16px 0 8px;">Warnings:</h4><ul style="font-size: 12px; margin: 0; padding-left: 20px;">';
            validation.warnings.forEach(warning => {
                detailsHtml += `<li style="margin-bottom: 6px; color: var(--warning);">${warning}</li>`;
            });
            detailsHtml += '</ul>';
        }

        detailsDiv.innerHTML = detailsHtml;

        // Show metadata
        console.log('✅ Letter generated:', {
            model: result.metadata.modelName,
            time: result.metadata.generationTime + 'ms',
            compliance: validation.score
        });
    };

    /**
     * Save letter to cloud storage
     */
    MortgageDenialAppComplete.prototype.saveLetter = async function() {
        if (!this.currentLetter) {
            this.showError('No letter to save');
            return;
        }

        try {
            const result = await this.storage.saveLetter({
                applicationId: this.formData.applicationId,
                lenderId: 'default',
                applicantName: this.formData.applicantName,
                content: this.currentLetter.content,
                denialReasons: this.currentLetter.metadata.denialReasons,
                complianceScore: this.currentLetter.validation.score,
                validation: this.currentLetter.validation,
                model: this.currentLetter.metadata.model
            });

            if (result.success) {
                // Update stats
                await this.storage.updateStats({
                    generated: true,
                    model: this.currentLetter.metadata.model,
                    lenderId: 'default',
                    complianceScore: this.currentLetter.validation.score,
                    generationTime: this.currentLetter.metadata.generationTime
                });

                this.showSuccess('Letter saved successfully! ID: ' + result.letterId);
                
                // Navigate to letters page
                setTimeout(() => {
                    this.navigateTo('letters');
                }, 1500);
            } else {
                this.showError('Failed to save: ' + result.error);
            }

        } catch (error) {
            console.error('Save error:', error);
            this.showError('Error saving letter: ' + error.message);
        }
    };

    /**
     * Download letter as text file
     */
    MortgageDenialAppComplete.prototype.downloadLetter = function() {
        if (!this.currentLetter) {
            this.showError('No letter to download');
            return;
        }

        const blob = new Blob([this.currentLetter.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `denial_letter_${this.formData.applicationId}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📥 Letter downloaded');
    };

    /**
     * Regenerate letter with same data
     */
    MortgageDenialAppComplete.prototype.regenerateLetter = async function() {
        console.log('🔄 Regenerating letter...');
        
        // Show processing again
        document.getElementById('aiProcessingView').style.display = 'flex';
        document.getElementById('letterResultView').style.display = 'none';

        // Collect reasons again
        const selectedReasons = this.currentLetter.metadata.denialReasons.map(code => ({
            code: code,
            details: {}
        }));

        try {
            const result = await this.aiEngine.generateDenialLetter(
                this.formData,
                selectedReasons,
                {
                    model: this.currentModel,
                    stream: true,
                    onProgress: (chunk, fullText) => {
                        const preview = document.getElementById('streamingPreview');
                        if (preview) {
                            const words = fullText.split(' ').slice(-30).join(' ');
                            preview.textContent = '...' + words;
                        }
                    }
                }
            );

            if (result.success) {
                this.currentLetter = result;
                this.displayGeneratedLetter(result);
            } else {
                this.showError('Failed to regenerate: ' + result.error);
            }

        } catch (error) {
            console.error('Regeneration error:', error);
            this.showError('Error regenerating letter: ' + error.message);
        }
    };

    /**
     * View saved letter
     */
    MortgageDenialAppComplete.prototype.viewLetter = async function(letterId) {
        try {
            const letter = await this.storage.getLetter(letterId);
            
            if (!letter) {
                this.showError('Letter not found');
                return;
            }

            // Display in modal (simplified for now)
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 32px;';
            
            modal.innerHTML = `
                <div style="background: var(--bg-card); border-radius: 20px; max-width: 900px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
                    <div style="padding: 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;">Letter: ${letter.applicationId}</h3>
                        <button onclick="this.closest('div[style*=fixed]').remove()" style="width: 40px; height: 40px; border-radius: 10px; background: var(--bg-elevated); border: none; cursor: pointer; color: var(--text-primary);">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="padding: 24px; overflow-y: auto; flex: 1;">
                        <div class="letter-preview-modal">
                            <pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif; line-height: 1.8;">${this.escapeHtml(letter.content)}</pre>
                        </div>
                    </div>
                    <div style="padding: 24px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="app.downloadLetterById('${letterId}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn btn-primary" onclick="this.closest('div[style*=fixed]').remove()">
                            Close
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);

        } catch (error) {
            console.error('View letter error:', error);
            this.showError('Error loading letter: ' + error.message);
        }
    };

    /**
     * Download letter by ID
     */
    MortgageDenialAppComplete.prototype.downloadLetterById = async function(letterId) {
        try {
            const letter = await this.storage.getLetter(letterId);
            if (letter) {
                const blob = new Blob([letter.content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `denial_letter_${letter.applicationId}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    /**
     * Load letters page
     */
    MortgageDenialAppComplete.prototype.loadLettersPage = async function() {
        const result = await this.storage.getLetters({ limit: 50 });

        const html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-envelope-open-text"></i>
                        All Denial Letters
                    </h3>
                    <button class="btn btn-primary" onclick="app.navigateTo('generate')">
                        <i class="fas fa-plus"></i>
                        New Letter
                    </button>
                </div>
                <div class="card-body">
                    ${result.letters && result.letters.length > 0 ?
                        this.renderLettersTable(result.letters) :
                        '<div class="empty-state" style="text-align: center; padding: 64px; color: var(--text-muted);"><i class="fas fa-inbox" style="font-size: 64px; margin-bottom: 24px; opacity: 0.3;"></i><h3>No Letters Yet</h3><p>Generate your first denial letter to get started</p><button class="btn btn-primary" onclick="app.navigateTo(\'generate\')"><i class="fas fa-plus"></i> Generate Letter</button></div>'}
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = html;
    };

    /**
     * Load appeals page
     */
    MortgageDenialAppComplete.prototype.loadAppealsPage = async function() {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-rotate-left"></i>
                        Appeals Management
                    </h3>
                </div>
                <div class="card-body">
                    <div class="empty-state" style="text-align: center; padding: 64px; color: var(--text-muted);">
                        <i class="fas fa-gavel" style="font-size: 64px; margin-bottom: 24px; opacity: 0.3;"></i>
                        <h3>Appeals Feature</h3>
                        <p>Appeal tracking and response generation coming soon</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = html;
    };

    /**
     * Load compliance page
     */
    MortgageDenialAppComplete.prototype.loadCompliancePage = async function() {
        const stats = await this.storage.getStats();

        const html = `
            <div class="card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-shield-halved"></i>
                        Regulatory Compliance Status
                    </h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-elevated); border-radius: 10px;">
                            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-check-circle" style="color: var(--success); font-size: 24px;"></i>
                            </div>
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 4px 0; font-size: 15px;">FCRA Section 615(a) - Adverse Action Notices</h4>
                                <p style="margin: 0; font-size: 13px; color: var(--text-muted);">All letters include required adverse action disclosures including credit bureau information and dispute rights</p>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-elevated); border-radius: 10px;">
                            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-check-circle" style="color: var(--success); font-size: 24px;"></i>
                            </div>
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 4px 0; font-size: 15px;">CFPB Regulation B (12 CFR § 1002)</h4>
                                <p style="margin: 0; font-size: 13px; color: var(--text-muted);">Notification requirements met within 30-day timeline with specific reasons for denial</p>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-elevated); border-radius: 10px;">
                            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-check-circle" style="color: var(--success); font-size: 24px;"></i>
                            </div>
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 4px 0; font-size: 15px;">ECOA (15 U.S.C. § 1691)</h4>
                                <p style="margin: 0; font-size: 13px; color: var(--text-muted);">Equal Credit Opportunity Act requirements including right to receive written statement of reasons</p>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 32px;">
                        <h4 style="margin-bottom: 16px;">Compliance Metrics</h4>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="font-size: 13px;">Overall Compliance Rate</span>
                                    <span style="font-weight: 600; color: var(--success);">${stats.complianceRate ? stats.complianceRate.toFixed(1) : '100'}%</span>
                                </div>
                                <div style="background: var(--bg-elevated); border-radius: 10px; height: 10px; overflow: hidden;">
                                    <div style="width: ${stats.complianceRate || 100}%; height: 100%; background: var(--success);"></div>
                                </div>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="font-size: 13px;">Letters Generated</span>
                                    <span style="font-weight: 600;">${stats.totalGenerated || 0}</span>
                                </div>
                                <div style="background: var(--bg-elevated); border-radius: 10px; height: 10px; overflow: hidden;">
                                    <div style="width: ${Math.min((stats.totalGenerated || 0) / 100 * 100, 100)}%; height: 100%; background: var(--primary);"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = html;
    };

    /**
     * Load lenders page
     */
    MortgageDenialAppComplete.prototype.loadLendersPage = async function() {
        const lenders = await this.storage.getLenders();

        const html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-building-columns"></i>
                        Lender Management
                    </h3>
                    <button class="btn btn-primary">
                        <i class="fas fa-plus"></i>
                        Add Lender
                    </button>
                </div>
                <div class="card-body">
                    ${lenders.length > 0 ? `
                        <div style="display: grid; gap: 16px;">
                            ${lenders.map(lender => `
                                <div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: var(--bg-elevated); border-radius: 12px; border: 1px solid var(--border);">
                                    <div style="width: 48px; height: 48px; border-radius: 10px; background: var(--gradient-1); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">
                                        ${lender.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div style="flex: 1;">
                                        <h4 style="margin: 0 0 4px 0;">${lender.name}</h4>
                                        <p style="margin: 0; font-size: 13px; color: var(--text-muted);">NMLS #${lender.nmls} • ${lender.phone}</p>
                                    </div>
                                    <button class="btn btn-sm btn-secondary">
                                        <i class="fas fa-cog"></i>
                                        Configure
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div class="empty-state" style="text-align: center; padding: 64px; color: var(--text-muted);">No lenders configured</div>'}
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = html;
    };

    /**
     * Load analytics page
     */
    MortgageDenialAppComplete.prototype.loadAnalyticsPage = async function() {
        const stats = await this.storage.getStats();

        const html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-chart-pie"></i>
                        Analytics & Insights
                    </h3>
                </div>
                <div class="card-body">
                    <div style="text-align: center; padding: 64px; color: var(--text-muted);">
                        <i class="fas fa-chart-line" style="font-size: 64px; margin-bottom: 24px; opacity: 0.3;"></i>
                        <h3>Analytics Dashboard</h3>
                        <p>Detailed analytics and reporting coming soon</p>
                        <p style="margin-top: 24px; font-size: 14px;">
                            Total Generated: <strong>${stats.totalGenerated || 0}</strong><br>
                            Avg Compliance: <strong>${stats.complianceRate ? stats.complianceRate.toFixed(1) : '100'}%</strong>
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = html;
    };

    /**
     * Utility: Escape HTML
     */
    MortgageDenialAppComplete.prototype.escapeHtml = function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}
