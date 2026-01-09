/**
 * Mortgage Denial Letter Storage Manager
 * Uses Puter.js FS and KV for persistence
 */

class MortgageDenialStorage {
    constructor() {
        this.basePath = '/mortgage_denial/';
        this.paths = {
            letters: this.basePath + 'letters/',
            templates: this.basePath + 'templates/',
            lenders: this.basePath + 'lenders/',
            audit: this.basePath + 'audit/',
            appeals: this.basePath + 'appeals/'
        };
        
        this.kvKeys = {
            letterIndex: 'mortgage_letters_index',
            lenderConfigs: 'mortgage_lender_configs',
            stats: 'mortgage_stats',
            complianceLog: 'mortgage_compliance_log'
        };
    }

    /**
     * Initialize storage structure
     */
    async initialize() {
        try {
            // Create directory structure
            for (const [key, path] of Object.entries(this.paths)) {
                try {
                    await puter.fs.mkdir(path, { createMissingParents: true });
                } catch (e) {
                    // Directory might already exist
                }
            }

            // Initialize default templates
            await this.initializeDefaultTemplates();
            
            return { success: true, message: 'Storage initialized' };
        } catch (error) {
            console.error('Storage initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save generated letter
     */
    async saveLetter(letterData) {
        try {
            const timestamp = new Date().toISOString();
            const dateStr = timestamp.split('T')[0];
            const letterId = `LTR-${Date.now()}`;
            
            const letterRecord = {
                id: letterId,
                application_id: letterData.applicationId,
                lender_id: letterData.lenderId || 'default',
                content: letterData.content,
                denial_reasons: letterData.denialReasons,
                compliance_score: letterData.complianceScore,
                validation: letterData.validation,
                model_used: letterData.model,
                generated_at: timestamp,
                status: 'GENERATED',
                sent_at: null,
                delivered_at: null
            };

            // Save to filesystem
            const filename = `${this.paths.letters}${letterId}_${dateStr}.json`;
            await puter.fs.write(filename, JSON.stringify(letterRecord, null, 2));

            // Update index in KV
            await this.addToIndex(letterId, letterRecord);

            // Log to audit trail
            await this.logAudit({
                action: 'LETTER_GENERATED',
                letter_id: letterId,
                application_id: letterData.applicationId,
                timestamp: timestamp,
                compliance_score: letterData.complianceScore
            });

            return { success: true, letterId: letterId, filename: filename };
        } catch (error) {
            console.error('Error saving letter:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load letter by ID
     */
    async loadLetter(letterId) {
        try {
            const index = await this.getIndex();
            const letterInfo = index.find(l => l.id === letterId);
            
            if (!letterInfo) {
                throw new Error('Letter not found');
            }

            const blob = await puter.fs.read(letterInfo.filename);
            const text = await blob.text();
            return { success: true, data: JSON.parse(text) };
        } catch (error) {
            console.error('Error loading letter:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all letters (with filters)
     */
    async getLetters(filters = {}) {
        try {
            const index = await this.getIndex();
            let letters = [...index];

            // Apply filters
            if (filters.lenderId) {
                letters = letters.filter(l => l.lender_id === filters.lenderId);
            }
            if (filters.status) {
                letters = letters.filter(l => l.status === filters.status);
            }
            if (filters.fromDate) {
                letters = letters.filter(l => l.generated_at >= filters.fromDate);
            }
            if (filters.toDate) {
                letters = letters.filter(l => l.generated_at <= filters.toDate);
            }

            // Sort by date (newest first)
            letters.sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));

            return { success: true, letters: letters, count: letters.length };
        } catch (error) {
            console.error('Error getting letters:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update letter status
     */
    async updateLetterStatus(letterId, status, metadata = {}) {
        try {
            const result = await this.loadLetter(letterId);
            if (!result.success) {
                return result;
            }

            const letter = result.data;
            letter.status = status;
            
            if (status === 'SENT') {
                letter.sent_at = new Date().toISOString();
            } else if (status === 'DELIVERED') {
                letter.delivered_at = new Date().toISOString();
            }

            // Merge additional metadata
            Object.assign(letter, metadata);

            // Save updated letter
            const index = await this.getIndex();
            const letterInfo = index.find(l => l.id === letterId);
            await puter.fs.write(letterInfo.filename, JSON.stringify(letter, null, 2));

            // Update index
            await this.updateIndex(letterId, { status: status });

            return { success: true, message: 'Status updated' };
        } catch (error) {
            console.error('Error updating status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save lender configuration
     */
    async saveLenderConfig(lenderId, config) {
        try {
            const configFile = `${this.paths.lenders}${lenderId}_config.json`;
            await puter.fs.write(configFile, JSON.stringify(config, null, 2));

            // Update configs index
            const configs = await puter.kv.get(this.kvKeys.lenderConfigs) || {};
            configs[lenderId] = {
                name: config.name,
                nmls: config.nmls,
                updated_at: new Date().toISOString()
            };
            await puter.kv.set(this.kvKeys.lenderConfigs, configs);

            return { success: true, message: 'Lender config saved' };
        } catch (error) {
            console.error('Error saving lender config:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load lender configuration
     */
    async loadLenderConfig(lenderId) {
        try {
            const configFile = `${this.paths.lenders}${lenderId}_config.json`;
            const blob = await puter.fs.read(configFile);
            const text = await blob.text();
            return { success: true, config: JSON.parse(text) };
        } catch (error) {
            console.error('Error loading lender config:', error);
            // Return default config
            return { 
                success: true, 
                config: this.getDefaultLenderConfig(lenderId),
                isDefault: true
            };
        }
    }

    /**
     * Get default lender configuration
     */
    getDefaultLenderConfig(lenderId) {
        return {
            lender_id: lenderId,
            name: 'Unknown Lender',
            nmls: '000000',
            address: '123 Financial Plaza, San Francisco, CA 94111',
            phone: '1-800-555-0123',
            email: 'compliance@lender.com',
            branding: {
                logo_url: null,
                primary_color: '#2563eb',
                secondary_color: '#0f172a'
            },
            compliance: {
                default_model: 'gpt-4o',
                require_dual_review: false,
                auto_send: false
            }
        };
    }

    /**
     * Manage index in KV store
     */
    async addToIndex(letterId, letterRecord) {
        try {
            const index = await puter.kv.get(this.kvKeys.letterIndex) || [];
            
            index.unshift({
                id: letterId,
                application_id: letterRecord.application_id,
                lender_id: letterRecord.lender_id,
                status: letterRecord.status,
                compliance_score: letterRecord.compliance_score,
                generated_at: letterRecord.generated_at,
                filename: `${this.paths.letters}${letterId}_${letterRecord.generated_at.split('T')[0]}.json`
            });

            // Keep only last 1000 in index
            if (index.length > 1000) {
                index.length = 1000;
            }

            await puter.kv.set(this.kvKeys.letterIndex, index);
        } catch (error) {
            console.error('Error updating index:', error);
        }
    }

    async getIndex() {
        return await puter.kv.get(this.kvKeys.letterIndex) || [];
    }

    async updateIndex(letterId, updates) {
        const index = await this.getIndex();
        const letterIdx = index.findIndex(l => l.id === letterId);
        if (letterIdx !== -1) {
            Object.assign(index[letterIdx], updates);
            await puter.kv.set(this.kvKeys.letterIndex, index);
        }
    }

    /**
     * Audit logging
     */
    async logAudit(auditEntry) {
        try {
            const dateStr = new Date().toISOString().split('T')[0];
            const auditFile = `${this.paths.audit}${dateStr}_audit.jsonl`;
            
            const logLine = JSON.stringify(auditEntry) + '\n';
            await puter.fs.write(auditFile, logLine, { append: true });
        } catch (error) {
            console.error('Error logging audit:', error);
        }
    }

    /**
     * Initialize default templates
     */
    async initializeDefaultTemplates() {
        const templates = {
            'standard_conventional': {
                id: 'standard_conventional',
                name: 'Standard Conventional Denial',
                loan_types: ['conventional'],
                template: 'Standard denial letter for conventional loans'
            },
            'fha_denial': {
                id: 'fha_denial',
                name: 'FHA Denial',
                loan_types: ['fha'],
                template: 'FHA-specific denial with HUD disclosures'
            }
        };

        for (const [key, template] of Object.entries(templates)) {
            try {
                const filename = `${this.paths.templates}${key}.json`;
                await puter.fs.write(filename, JSON.stringify(template, null, 2));
            } catch (e) {
                // Template might exist
            }
        }
    }

    /**
     * Update statistics
     */
    async updateStats(statsUpdate) {
        try {
            const stats = await puter.kv.get(this.kvKeys.stats) || {
                total_generated: 0,
                total_sent: 0,
                total_appeals: 0,
                compliance_rate: 0,
                by_model: {},
                by_lender: {}
            };

            if (statsUpdate.generated) {
                stats.total_generated++;
            }
            if (statsUpdate.model) {
                stats.by_model[statsUpdate.model] = (stats.by_model[statsUpdate.model] || 0) + 1;
            }
            if (statsUpdate.lenderId) {
                stats.by_lender[statsUpdate.lenderId] = (stats.by_lender[statsUpdate.lenderId] || 0) + 1;
            }

            await puter.kv.set(this.kvKeys.stats, stats);
            return { success: true };
        } catch (error) {
            console.error('Error updating stats:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get statistics
     */
    async getStats() {
        return await puter.kv.get(this.kvKeys.stats) || {
            total_generated: 0,
            total_sent: 0,
            total_appeals: 0,
            compliance_rate: 0,
            by_model: {},
            by_lender: {}
        };
    }
}
