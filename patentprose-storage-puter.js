/**
 * PatentProse Storage Integration with Puter.js
 * Handles document storage, case management, and response history
 */

class PatentProseStorage {
    constructor() {
        this.initialized = false;
        this.currentUser = null;

        // Storage prefixes for organization
        this.prefixes = {
            RESPONSES: 'patent_response_',
            CASES: 'patent_case_',
            DOCUMENTS: 'patent_doc_',
            TEMPLATES: 'patent_template_',
            SETTINGS: 'patent_settings_',
            ANALYTICS: 'patent_analytics_'
        };

        // File system paths
        this.paths = {
            ROOT: '/PatentProse',
            RESPONSES: '/PatentProse/Responses',
            OFFICE_ACTIONS: '/PatentProse/OfficeActions',
            CASES: '/PatentProse/Cases',
            TEMPLATES: '/PatentProse/Templates',
            EXPORTS: '/PatentProse/Exports'
        };
    }

    /**
     * Initialize storage system
     */
    async initialize() {
        try {
            console.log('💾 Initializing PatentProse Storage...');

            if (typeof puter === 'undefined') {
                throw new Error('Puter.js not loaded');
            }

            // Wait for auth
            await puter.auth.ready();

            if (puter.auth.isSignedIn()) {
                this.currentUser = await puter.auth.getUser();
                console.log('✅ Storage initialized for user:', this.currentUser.username);
            } else {
                console.log('⚠️ Storage in demo mode - data will not persist');
            }

            // Create directory structure
            await this.createDirectoryStructure();

            this.initialized = true;
            console.log('✅ PatentProse Storage ready');
            return true;
        } catch (error) {
            console.error('❌ Storage initialization error:', error);
            throw error;
        }
    }

    /**
     * Create directory structure in Puter FS
     */
    async createDirectoryStructure() {
        try {
            for (const [key, path] of Object.entries(this.paths)) {
                try {
                    await puter.fs.mkdir(path);
                    console.log(`📁 Created directory: ${path}`);
                } catch (error) {
                    // Directory might already exist
                    if (!error.message.includes('already exists')) {
                        console.warn(`Warning creating ${path}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error('Directory creation error:', error);
        }
    }

    /**
     * Save generated response
     * @param {Object} response - Response object from AI engine
     * @returns {Promise<string>} Storage key
     */
    async saveResponse(response) {
        try {
            const key = `${this.prefixes.RESPONSES}${response.applicationNumber}_${Date.now()}`;

            // Save to KV store (for quick access)
            await puter.kv.set(key, JSON.stringify(response));

            // Also save as file (for long-term storage and export)
            const fileName = `${response.applicationNumber}_Response_${new Date().toISOString().split('T')[0]}.json`;
            const filePath = `${this.paths.RESPONSES}/${fileName}`;

            await puter.fs.write(
                filePath,
                JSON.stringify(response, null, 2)
            );

            // Update response index
            await this.updateResponseIndex(response, key, filePath);

            console.log('✅ Response saved:', key);
            return key;
        } catch (error) {
            console.error('❌ Save response error:', error);
            throw error;
        }
    }

    /**
     * Load response by key
     * @param {string} key - Storage key
     * @returns {Promise<Object>} Response object
     */
    async loadResponse(key) {
        try {
            const data = await puter.kv.get(key);
            if (!data) {
                throw new Error('Response not found');
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Load response error:', error);
            return null;
        }
    }

    /**
     * Save office action document
     * @param {File} file - Office action file
     * @param {Object} metadata - Case metadata
     * @returns {Promise<Object>} Saved file info
     */
    async saveOfficeAction(file, metadata = {}) {
        try {
            const timestamp = Date.now();
            const fileName = `OA_${metadata.applicationNumber || 'unknown'}_${timestamp}_${file.name}`;
            const filePath = `${this.paths.OFFICE_ACTIONS}/${fileName}`;

            // Upload file to Puter FS
            const uploadedFile = await puter.fs.write(filePath, file);

            // Extract text if possible
            let extractedText = null;
            try {
                if (file.type === 'application/pdf') {
                    extractedText = await this.extractTextFromPDF(file);
                } else if (file.type === 'text/plain') {
                    extractedText = await file.text();
                }
            } catch (error) {
                console.warn('Text extraction failed:', error);
            }

            // Save metadata
            const docMetadata = {
                originalName: file.name,
                storedPath: filePath,
                uploadDate: new Date().toISOString(),
                fileSize: file.size,
                fileType: file.type,
                applicationNumber: metadata.applicationNumber,
                jurisdiction: metadata.jurisdiction,
                extractedText,
                ...metadata
            };

            const metadataKey = `${this.prefixes.DOCUMENTS}${timestamp}`;
            await puter.kv.set(metadataKey, JSON.stringify(docMetadata));

            // Update document index
            await this.updateDocumentIndex(docMetadata, metadataKey);

            console.log('✅ Office action saved:', filePath);
            return docMetadata;
        } catch (error) {
            console.error('❌ Save office action error:', error);
            throw error;
        }
    }

    /**
     * Save case information
     * @param {Object} caseData - Case details
     * @returns {Promise<string>} Case ID
     */
    async saveCase(caseData) {
        try {
            const caseId = caseData.id || `case_${Date.now()}`;
            const key = `${this.prefixes.CASES}${caseId}`;

            const caseRecord = {
                id: caseId,
                ...caseData,
                createdAt: caseData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to KV
            await puter.kv.set(key, JSON.stringify(caseRecord));

            // Save case folder structure
            const casePath = `${this.paths.CASES}/${caseData.applicationNumber}`;
            try {
                await puter.fs.mkdir(casePath);
                await puter.fs.mkdir(`${casePath}/OfficeActions`);
                await puter.fs.mkdir(`${casePath}/Responses`);
                await puter.fs.mkdir(`${casePath}/Correspondence`);
            } catch (error) {
                // Folders might exist
            }

            // Update case index
            await this.updateCaseIndex(caseRecord);

            console.log('✅ Case saved:', caseId);
            return caseId;
        } catch (error) {
            console.error('❌ Save case error:', error);
            throw error;
        }
    }

    /**
     * Load case by ID or application number
     * @param {string} identifier - Case ID or application number
     * @returns {Promise<Object>} Case data
     */
    async loadCase(identifier) {
        try {
            // Try direct key lookup
            const key = identifier.startsWith(this.prefixes.CASES)
                ? identifier
                : `${this.prefixes.CASES}${identifier}`;

            const data = await puter.kv.get(key);
            if (data) {
                return JSON.parse(data);
            }

            // Search in case index
            const index = await this.getCaseIndex();
            const caseRecord = index.find(c =>
                c.id === identifier || c.applicationNumber === identifier
            );

            if (caseRecord) {
                return await this.loadCase(caseRecord.key);
            }

            return null;
        } catch (error) {
            console.error('Load case error:', error);
            return null;
        }
    }

    /**
     * Get all cases for current user
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} List of cases
     */
    async getAllCases(filters = {}) {
        try {
            const index = await this.getCaseIndex();
            let cases = index;

            // Apply filters
            if (filters.jurisdiction) {
                cases = cases.filter(c => c.jurisdiction === filters.jurisdiction);
            }
            if (filters.status) {
                cases = cases.filter(c => c.status === filters.status);
            }
            if (filters.client) {
                cases = cases.filter(c => c.clientName === filters.client);
            }

            // Sort by most recent
            cases.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            return cases;
        } catch (error) {
            console.error('Get all cases error:', error);
            return [];
        }
    }

    /**
     * Get all responses
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} List of responses
     */
    async getAllResponses(filters = {}) {
        try {
            const index = await this.getResponseIndex();
            let responses = index;

            if (filters.jurisdiction) {
                responses = responses.filter(r => r.jurisdiction === filters.jurisdiction);
            }
            if (filters.applicationNumber) {
                responses = responses.filter(r => r.applicationNumber === filters.applicationNumber);
            }

            responses.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

            return responses;
        } catch (error) {
            console.error('Get all responses error:', error);
            return [];
        }
    }

    /**
     * Get response index
     */
    async getResponseIndex() {
        try {
            const data = await puter.kv.get('patent_responses_index');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Update response index
     */
    async updateResponseIndex(response, key, filePath) {
        try {
            const index = await this.getResponseIndex();

            index.unshift({
                key,
                filePath,
                applicationNumber: response.applicationNumber,
                jurisdiction: response.jurisdiction,
                generatedAt: response.generatedAt,
                wordCount: response.metadata.wordCount,
                strategy: response.metadata.strategy
            });

            // Keep last 500 entries
            if (index.length > 500) {
                index.length = 500;
            }

            await puter.kv.set('patent_responses_index', JSON.stringify(index));
        } catch (error) {
            console.error('Update response index error:', error);
        }
    }

    /**
     * Get case index
     */
    async getCaseIndex() {
        try {
            const data = await puter.kv.get('patent_cases_index');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Update case index
     */
    async updateCaseIndex(caseRecord) {
        try {
            const index = await this.getCaseIndex();

            // Remove existing entry if updating
            const existingIndex = index.findIndex(c => c.id === caseRecord.id);
            if (existingIndex !== -1) {
                index.splice(existingIndex, 1);
            }

            index.unshift({
                key: `${this.prefixes.CASES}${caseRecord.id}`,
                id: caseRecord.id,
                applicationNumber: caseRecord.applicationNumber,
                title: caseRecord.title,
                jurisdiction: caseRecord.jurisdiction,
                status: caseRecord.status,
                clientName: caseRecord.clientName,
                deadline: caseRecord.deadline,
                createdAt: caseRecord.createdAt,
                updatedAt: caseRecord.updatedAt
            });

            await puter.kv.set('patent_cases_index', JSON.stringify(index));
        } catch (error) {
            console.error('Update case index error:', error);
        }
    }

    /**
     * Get document index
     */
    async getDocumentIndex() {
        try {
            const data = await puter.kv.get('patent_documents_index');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Update document index
     */
    async updateDocumentIndex(docMetadata, key) {
        try {
            const index = await this.getDocumentIndex();

            index.unshift({
                key,
                ...docMetadata
            });

            if (index.length > 1000) {
                index.length = 1000;
            }

            await puter.kv.set('patent_documents_index', JSON.stringify(index));
        } catch (error) {
            console.error('Update document index error:', error);
        }
    }

    /**
     * Save user settings
     * @param {Object} settings - User preferences
     */
    async saveSettings(settings) {
        try {
            const key = `${this.prefixes.SETTINGS}${this.currentUser?.username || 'default'}`;
            await puter.kv.set(key, JSON.stringify(settings));
            console.log('✅ Settings saved');
        } catch (error) {
            console.error('Save settings error:', error);
        }
    }

    /**
     * Load user settings
     * @returns {Promise<Object>} User settings
     */
    async loadSettings() {
        try {
            const key = `${this.prefixes.SETTINGS}${this.currentUser?.username || 'default'}`;
            const data = await puter.kv.get(key);
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (error) {
            return this.getDefaultSettings();
        }
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            defaultJurisdiction: 'USPTO',
            defaultResponseLength: 'standard',
            defaultStrategy: 'both',
            defaultTone: 'formal',
            citationStyle: 'bluebook',
            autoSave: true,
            includeInterview: false,
            theme: 'dark'
        };
    }

    /**
     * Track analytics event
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     */
    async trackAnalytics(eventType, data = {}) {
        try {
            const analyticsKey = `${this.prefixes.ANALYTICS}${new Date().toISOString().split('T')[0]}`;

            let analytics = await puter.kv.get(analyticsKey);
            analytics = analytics ? JSON.parse(analytics) : { events: [] };

            analytics.events.push({
                type: eventType,
                data,
                timestamp: new Date().toISOString()
            });

            // Keep only last 1000 events per day
            if (analytics.events.length > 1000) {
                analytics.events = analytics.events.slice(-1000);
            }

            await puter.kv.set(analyticsKey, JSON.stringify(analytics));
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    /**
     * Get analytics summary
     * @param {number} days - Number of days to analyze
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalytics(days = 30) {
        try {
            const analytics = {
                responsesGenerated: 0,
                casesCreated: 0,
                documentsUploaded: 0,
                totalWordCount: 0,
                jurisdictionBreakdown: {},
                rejectionTypeBreakdown: {}
            };

            // Get data for last N days
            const responses = await this.getAllResponses();
            const cases = await this.getAllCases();

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            responses.forEach(response => {
                if (new Date(response.generatedAt) > cutoffDate) {
                    analytics.responsesGenerated++;
                    analytics.totalWordCount += response.wordCount || 0;

                    analytics.jurisdictionBreakdown[response.jurisdiction] =
                        (analytics.jurisdictionBreakdown[response.jurisdiction] || 0) + 1;
                }
            });

            cases.forEach(caseItem => {
                if (new Date(caseItem.createdAt) > cutoffDate) {
                    analytics.casesCreated++;
                }
            });

            return analytics;
        } catch (error) {
            console.error('Get analytics error:', error);
            return null;
        }
    }

    /**
     * Export response as file
     * @param {string} key - Response key
     * @param {string} format - Export format (pdf, txt)
     * @returns {Promise<Blob>} Exported file
     */
    async exportResponse(key, format = 'txt') {
        try {
            const response = await this.loadResponse(key);
            if (!response) {
                throw new Error('Response not found');
            }

            let content = '';
            let mimeType = 'text/plain';
            let extension = 'txt';

            if (format === 'txt') {
                content = this.formatResponseAsText(response);
                mimeType = 'text/plain';
                extension = 'txt';
            } else if (format === 'pdf') {
                // Generate PDF (would need additional library)
                content = this.formatResponseAsText(response);
                mimeType = 'application/pdf';
                extension = 'pdf';
            }

            const blob = new Blob([content], { type: mimeType });
            const fileName = `Response_${response.applicationNumber}_${Date.now()}.${extension}`;

            // Save to exports folder
            const exportPath = `${this.paths.EXPORTS}/${fileName}`;
            await puter.fs.write(exportPath, blob);

            return { blob, fileName, path: exportPath };
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }

    /**
     * Format response as plain text
     */
    formatResponseAsText(response) {
        return `
OFFICE ACTION RESPONSE
Application Number: ${response.applicationNumber}
Jurisdiction: ${response.jurisdiction}
Generated: ${new Date(response.generatedAt).toLocaleString()}

================================================================================

${response.responseText}

================================================================================

This response was generated using PatentProse AI
Models: ${response.metadata.models.join(', ')}
Word Count: ${response.metadata.wordCount}
`;
    }

    /**
     * Extract text from PDF
     */
    async extractTextFromPDF(file) {
        try {
            // This would use Puter's OCR or PDF processing capabilities
            // For now, return placeholder
            return `[PDF text extraction: ${file.name}]`;
        } catch (error) {
            console.error('PDF extraction error:', error);
            return null;
        }
    }

    /**
     * Delete response
     * @param {string} key - Response key
     */
    async deleteResponse(key) {
        try {
            await puter.kv.del(key);

            // Update index
            const index = await this.getResponseIndex();
            const updatedIndex = index.filter(r => r.key !== key);
            await puter.kv.set('patent_responses_index', JSON.stringify(updatedIndex));

            console.log('✅ Response deleted:', key);
        } catch (error) {
            console.error('Delete response error:', error);
        }
    }

    /**
     * Delete case
     * @param {string} caseId - Case ID
     */
    async deleteCase(caseId) {
        try {
            const key = `${this.prefixes.CASES}${caseId}`;
            await puter.kv.del(key);

            // Update index
            const index = await this.getCaseIndex();
            const updatedIndex = index.filter(c => c.id !== caseId);
            await puter.kv.set('patent_cases_index', JSON.stringify(updatedIndex));

            console.log('✅ Case deleted:', caseId);
        } catch (error) {
            console.error('Delete case error:', error);
        }
    }

    /**
     * Search across all data
     * @param {string} query - Search query
     * @returns {Promise<Object>} Search results
     */
    async search(query) {
        try {
            const results = {
                cases: [],
                responses: [],
                documents: []
            };

            const lowerQuery = query.toLowerCase();

            // Search cases
            const cases = await this.getAllCases();
            results.cases = cases.filter(c =>
                c.applicationNumber?.toLowerCase().includes(lowerQuery) ||
                c.title?.toLowerCase().includes(lowerQuery) ||
                c.clientName?.toLowerCase().includes(lowerQuery)
            );

            // Search responses
            const responses = await this.getAllResponses();
            results.responses = responses.filter(r =>
                r.applicationNumber?.toLowerCase().includes(lowerQuery)
            );

            // Search documents
            const documents = await this.getDocumentIndex();
            results.documents = documents.filter(d =>
                d.originalName?.toLowerCase().includes(lowerQuery) ||
                d.applicationNumber?.toLowerCase().includes(lowerQuery)
            );

            return results;
        } catch (error) {
            console.error('Search error:', error);
            return { cases: [], responses: [], documents: [] };
        }
    }

    /**
     * Get storage statistics
     * @returns {Promise<Object>} Storage stats
     */
    async getStorageStats() {
        try {
            const responses = await this.getAllResponses();
            const cases = await this.getAllCases();
            const documents = await this.getDocumentIndex();

            return {
                totalResponses: responses.length,
                totalCases: cases.length,
                totalDocuments: documents.length,
                totalWordCount: responses.reduce((sum, r) => sum + (r.wordCount || 0), 0),
                oldestResponse: responses[responses.length - 1]?.generatedAt,
                newestResponse: responses[0]?.generatedAt,
                jurisdictionCounts: this.countByJurisdiction(responses),
                statusCounts: this.countByStatus(cases)
            };
        } catch (error) {
            console.error('Storage stats error:', error);
            return null;
        }
    }

    /**
     * Helper: Count by jurisdiction
     */
    countByJurisdiction(items) {
        const counts = {};
        items.forEach(item => {
            counts[item.jurisdiction] = (counts[item.jurisdiction] || 0) + 1;
        });
        return counts;
    }

    /**
     * Helper: Count by status
     */
    countByStatus(items) {
        const counts = {};
        items.forEach(item => {
            counts[item.status] = (counts[item.status] || 0) + 1;
        });
        return counts;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatentProseStorage;
}
