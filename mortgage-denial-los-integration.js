/**
 * Mortgage Denial LOS (Loan Origination System) Integration
 * Supports integration with major LOS platforms and custom REST APIs
 */

class MortgageLOSIntegration {
    constructor() {
        this.adapters = {
            'fannie_du': new FannieMaeLOSAdapter(),
            'freddie_lpa': new FreddieMacLOSAdapter(),
            'encompass': new EncompassLOSAdapter(),
            'custom_rest': new CustomRESTAdapter()
        };
        
        this.activeAdapter = null;
        this.config = {};
    }

    /**
     * Configure LOS integration
     */
    configure(losType, config) {
        if (!this.adapters[losType]) {
            throw new Error(`Unsupported LOS type: ${losType}`);
        }
        
        this.activeAdapter = this.adapters[losType];
        this.config = config;
        this.activeAdapter.configure(config);
        
        return { success: true, losType: losType };
    }

    /**
     * Pull application data from LOS
     */
    async pullApplicationData(applicationId) {
        if (!this.activeAdapter) {
            throw new Error('LOS adapter not configured');
        }
        
        try {
            const rawData = await this.activeAdapter.getApplication(applicationId);
            const normalized = this.normalizeApplicationData(rawData);
            return { success: true, data: normalized };
        } catch (error) {
            console.error('Error pulling from LOS:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Push generated letter back to LOS
     */
    async pushLetterToLOS(applicationId, letterData) {
        if (!this.activeAdapter) {
            throw new Error('LOS adapter not configured');
        }
        
        try {
            const result = await this.activeAdapter.updateApplication(applicationId, {
                denial_letter: letterData.content,
                denial_letter_generated_at: new Date().toISOString(),
                compliance_score: letterData.complianceScore,
                denial_letter_status: 'GENERATED'
            });
            
            return { success: true, result: result };
        } catch (error) {
            console.error('Error pushing to LOS:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Normalize application data from different LOS formats
     */
    normalizeApplicationData(rawData) {
        return {
            application_id: rawData.applicationId || rawData.app_id || rawData.loanNumber,
            application_date: rawData.applicationDate || rawData.submittedDate,
            applicant_name: this.extractApplicantName(rawData),
            co_applicant: this.extractCoApplicantName(rawData),
            applicant_address: rawData.propertyAddress?.street || rawData.address?.street,
            applicant_city: rawData.propertyAddress?.city || rawData.address?.city,
            applicant_state: rawData.propertyAddress?.state || rawData.address?.state,
            applicant_zip: rawData.propertyAddress?.zip || rawData.address?.zip,
            loan_type: rawData.loanType || rawData.productType,
            loan_amount: rawData.loanAmount || rawData.requestedAmount,
            property_address: rawData.subjectPropertyAddress || rawData.propertyAddress,
            loan_purpose: rawData.loanPurpose || rawData.purpose,
            credit_score: rawData.creditScore || rawData.fico,
            credit_bureau: rawData.creditBureau || 'Equifax',
            denial_reasons_codes: rawData.denialCodes || rawData.adverseActionCodes || []
        };
    }

    extractApplicantName(data) {
        if (data.borrower) {
            return `${data.borrower.firstName} ${data.borrower.lastName}`;
        }
        return data.applicantName || data.borrowerName || '';
    }

    extractCoApplicantName(data) {
        if (data.coBorrower) {
            return `${data.coBorrower.firstName} ${data.coBorrower.lastName}`;
        }
        return data.coApplicantName || '';
    }

    /**
     * Get available LOS integrations
     */
    getAvailableIntegrations() {
        return [
            { id: 'fannie_du', name: 'Fannie Mae Desktop Underwriter', type: 'fannie_du' },
            { id: 'freddie_lpa', name: 'Freddie Mac Loan Product Advisor', type: 'freddie_lpa' },
            { id: 'encompass', name: 'Ellie Mae Encompass', type: 'encompass' },
            { id: 'custom_rest', name: 'Custom REST API', type: 'custom_rest' }
        ];
    }
}

/**
 * Base LOS Adapter
 */
class BaseLOSAdapter {
    constructor() {
        this.config = {};
    }

    configure(config) {
        this.config = config;
    }

    async makeRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`LOS API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }
}

/**
 * Fannie Mae Desktop Underwriter Adapter
 */
class FannieMaeLOSAdapter extends BaseLOSAdapter {
    async getApplication(applicationId) {
        const response = await this.makeRequest(`/applications/${applicationId}`, 'GET');
        return response;
    }

    async updateApplication(applicationId, updates) {
        return await this.makeRequest(`/applications/${applicationId}`, 'PATCH', updates);
    }
}

/**
 * Freddie Mac Loan Product Advisor Adapter
 */
class FreddieMacLOSAdapter extends BaseLOSAdapter {
    async getApplication(applicationId) {
        const response = await this.makeRequest(`/loans/${applicationId}`, 'GET');
        return response;
    }

    async updateApplication(applicationId, updates) {
        return await this.makeRequest(`/loans/${applicationId}`, 'PUT', updates);
    }
}

/**
 * Ellie Mae Encompass Adapter
 */
class EncompassLOSAdapter extends BaseLOSAdapter {
    async getApplication(applicationId) {
        const response = await this.makeRequest(`/encompass/v1/loans/${applicationId}`, 'GET');
        return response;
    }

    async updateApplication(applicationId, updates) {
        return await this.makeRequest(`/encompass/v1/loans/${applicationId}`, 'PATCH', updates);
    }
}

/**
 * Custom REST API Adapter
 */
class CustomRESTAdapter extends BaseLOSAdapter {
    async getApplication(applicationId) {
        const endpoint = this.config.getEndpoint || `/api/applications/${applicationId}`;
        return await this.makeRequest(endpoint, 'GET');
    }

    async updateApplication(applicationId, updates) {
        const endpoint = this.config.updateEndpoint || `/api/applications/${applicationId}`;
        return await this.makeRequest(endpoint, this.config.updateMethod || 'PUT', updates);
    }
}

/**
 * Webhook Handler for LOS events
 */
class LOSWebhookHandler {
    constructor(mortgageApp) {
        this.mortgageApp = mortgageApp;
        this.handlers = {
            'application.denied': this.handleApplicationDenied.bind(this),
            'application.updated': this.handleApplicationUpdated.bind(this),
            'document.required': this.handleDocumentRequired.bind(this)
        };
    }

    /**
     * Process incoming webhook
     */
    async processWebhook(eventType, payload) {
        console.log(`📥 Webhook received: ${eventType}`, payload);
        
        const handler = this.handlers[eventType];
        if (handler) {
            return await handler(payload);
        }
        
        console.warn(`No handler for webhook event: ${eventType}`);
        return { success: false, message: 'No handler found' };
    }

    /**
     * Handle application denied event
     */
    async handleApplicationDenied(payload) {
        console.log('🚫 Application denied, auto-generating letter...');
        
        // Extract application data
        const applicationData = {
            application_id: payload.applicationId,
            applicant_name: payload.applicantName,
            loan_amount: payload.loanAmount,
            // ... map other fields
        };

        // Extract denial reasons
        const denialReasons = payload.denialReasons || [];

        // Auto-generate letter
        try {
            const result = await this.mortgageApp.aiEngine.generateDenialLetter(
                applicationData,
                denialReasons,
                { model: 'gpt-4o' }
            );

            if (result.success) {
                // Save letter
                await this.mortgageApp.storage.saveLetter({
                    applicationId: applicationData.application_id,
                    lenderId: payload.lenderId || 'default',
                    content: result.content,
                    denialReasons: denialReasons,
                    complianceScore: result.validation.compliance_score,
                    validation: result.validation,
                    model: 'gpt-4o'
                });

                return { success: true, letterId: result.metadata.applicationId };
            }
        } catch (error) {
            console.error('Auto-generation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async handleApplicationUpdated(payload) {
        console.log('📝 Application updated:', payload.applicationId);
        return { success: true };
    }

    async handleDocumentRequired(payload) {
        console.log('📄 Document required:', payload);
        return { success: true };
    }
}

/**
 * Audit Logger
 */
class MortgageAuditLogger {
    constructor(storage) {
        this.storage = storage;
    }

    /**
     * Log action with full context
     */
    async log(action, context = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            action: action,
            user: context.user || 'system',
            application_id: context.applicationId,
            letter_id: context.letterId,
            ip_address: context.ipAddress || 'unknown',
            user_agent: context.userAgent || navigator.userAgent,
            details: context.details || {},
            compliance_score: context.complianceScore,
            model_used: context.model
        };

        try {
            await this.storage.logAudit(entry);
            console.log(`📋 Audit log: ${action}`, entry);
        } catch (error) {
            console.error('Audit logging failed:', error);
        }
    }

    /**
     * Get audit trail for application
     */
    async getAuditTrail(applicationId, options = {}) {
        try {
            const dateStr = new Date().toISOString().split('T')[0];
            const auditFile = `${this.storage.paths.audit}${dateStr}_audit.jsonl`;
            
            const blob = await puter.fs.read(auditFile);
            const text = await blob.text();
            const lines = text.trim().split('\n');
            
            const entries = lines
                .map(line => JSON.parse(line))
                .filter(entry => entry.application_id === applicationId);
            
            return { success: true, entries: entries };
        } catch (error) {
            console.error('Error reading audit trail:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Export audit logs
     */
    async exportAuditLogs(startDate, endDate) {
        const logs = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const auditFile = `${this.storage.paths.audit}${dateStr}_audit.jsonl`;
            
            try {
                const blob = await puter.fs.read(auditFile);
                const text = await blob.text();
                const lines = text.trim().split('\n');
                
                lines.forEach(line => {
                    if (line) logs.push(JSON.parse(line));
                });
            } catch (error) {
                // File might not exist for this date
            }
        }
        
        return { success: true, logs: logs, count: logs.length };
    }
}

/**
 * Batch Processing for high-volume lenders
 */
class MortgageBatchProcessor {
    constructor(mortgageApp) {
        this.mortgageApp = mortgageApp;
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 5;
    }

    /**
     * Add application to batch queue
     */
    addToQueue(applicationData, denialReasons, options = {}) {
        const job = {
            id: `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            applicationData: applicationData,
            denialReasons: denialReasons,
            options: options,
            status: 'queued',
            createdAt: new Date().toISOString()
        };
        
        this.queue.push(job);
        return job.id;
    }

    /**
     * Process batch queue
     */
    async processBatch() {
        if (this.processing) {
            console.log('Batch already processing...');
            return;
        }

        this.processing = true;
        console.log(`📦 Starting batch process: ${this.queue.length} jobs`);

        while (this.queue.length > 0) {
            // Process in chunks
            const chunk = this.queue.splice(0, this.maxConcurrent);
            
            await Promise.all(chunk.map(job => this.processJob(job)));
        }

        this.processing = false;
        console.log('✅ Batch processing complete');
    }

    /**
     * Process individual job
     */
    async processJob(job) {
        job.status = 'processing';
        job.startedAt = new Date().toISOString();

        try {
            const result = await this.mortgageApp.aiEngine.generateDenialLetter(
                job.applicationData,
                job.denialReasons,
                job.options
            );

            if (result.success) {
                await this.mortgageApp.storage.saveLetter({
                    applicationId: job.applicationData.application_id,
                    lenderId: job.options.lenderId || 'default',
                    content: result.content,
                    denialReasons: job.denialReasons,
                    complianceScore: result.validation.compliance_score,
                    validation: result.validation,
                    model: job.options.model || 'gpt-4o'
                });

                job.status = 'completed';
                job.result = result;
            } else {
                job.status = 'failed';
                job.error = result.error;
            }
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
        }

        job.completedAt = new Date().toISOString();
        console.log(`Job ${job.id}: ${job.status}`);
    }

    /**
     * Get batch status
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            processing: this.processing,
            queued: this.queue.filter(j => j.status === 'queued').length,
            processing: this.queue.filter(j => j.status === 'processing').length,
            completed: this.queue.filter(j => j.status === 'completed').length,
            failed: this.queue.filter(j => j.status === 'failed').length
        };
    }
}
