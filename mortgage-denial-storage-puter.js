/**
 * Mortgage Denial Storage System - Puter.js Integration
 * Handles all data persistence using Puter.js KV store and file system
 */

class MortgageDenialStoragePuter {
    constructor() {
        this.initialized = false;
        this.currentUser = null;
        this.storagePrefix = 'mortgage_denial_';
    }

    /**
     * Initialize storage and authenticate user
     */
    async initialize() {
        console.log('📦 Initializing Puter.js storage...');
        
        try {
            // Check if Puter is available
            if (!window.puter) {
                throw new Error('Puter.js not loaded');
            }
            
            // Get or create user session
            await this.authenticateUser();
            
            // Initialize default data structures
            await this.initializeDefaults();
            
            this.initialized = true;
            console.log('✅ Storage initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Storage initialization failed:', error);
            throw error;
        }
    }

    /**
     * Authenticate user with Puter
     */
    async authenticateUser() {
        try {
            // Check if user is signed in
            if (!puter.auth.isSignedIn()) {
                console.log('🔐 Signing in to Puter...');
                await puter.auth.signIn();
            }
            
            // Get user info
            this.currentUser = await puter.auth.getUser();
            console.log('✅ Authenticated as:', this.currentUser.username);
            
            return this.currentUser;
            
        } catch (error) {
            console.warn('⚠️ Authentication skipped:', error.message);
            // Create anonymous session
            this.currentUser = {
                username: 'anonymous',
                uuid: 'anon-' + Date.now()
            };
        }
    }

    /**
     * Initialize default data structures
     */
    async initializeDefaults() {
        try {
            // Check if stats exist, if not create
            const existingStats = await puter.kv.get(this.storagePrefix + 'stats');
            if (!existingStats) {
                await this.createDefaultStats();
            }
            
            // Check if lenders exist
            const existingLenders = await puter.kv.get(this.storagePrefix + 'lenders');
            if (!existingLenders) {
                await this.createDefaultLenders();
            }
            
        } catch (error) {
            console.error('Failed to initialize defaults:', error);
        }
    }

    /**
     * Create default statistics
     */
    async createDefaultStats() {
        const defaultStats = {
            totalGenerated: 0,
            totalAppeals: 0,
            complianceRate: 100,
            avgGenerationTime: 0,
            byLender: {},
            byModel: {},
            lastUpdated: new Date().toISOString()
        };
        
        await puter.kv.set(this.storagePrefix + 'stats', JSON.stringify(defaultStats));
        return defaultStats;
    }

    /**
     * Create default lenders
     */
    async createDefaultLenders() {
        const defaultLenders = [
            {
                id: 'lender_001',
                name: 'First National Mortgage',
                nmls: '123456',
                address: '1234 Financial Plaza, Suite 500',
                city: 'Chicago',
                state: 'IL',
                zip: '60601',
                phone: '1-800-555-LOAN',
                website: 'www.firstnationalmortgage.com',
                active: true,
                createdAt: new Date().toISOString()
            }
        ];
        
        await puter.kv.set(this.storagePrefix + 'lenders', JSON.stringify(defaultLenders));
        return defaultLenders;
    }

    /**
     * Save denial letter to storage
     */
    async saveLetter(letterData) {
        try {
            const letterId = 'letter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const letter = {
                id: letterId,
                applicationId: letterData.applicationId,
                lenderId: letterData.lenderId,
                applicantName: letterData.applicantName,
                content: letterData.content,
                denialReasons: letterData.denialReasons,
                complianceScore: letterData.complianceScore,
                validation: letterData.validation,
                model: letterData.model,
                status: 'generated',
                generatedAt: new Date().toISOString(),
                generatedBy: this.currentUser.uuid,
                sentAt: null,
                deliveryMethod: null
            };
            
            // Save to KV store
            const kvKey = this.storagePrefix + 'letter_' + letterId;
            await puter.kv.set(kvKey, JSON.stringify(letter));
            
            // Also save as file for backup
            const fileName = `denial_letters/${letterId}.json`;
            try {
                await puter.fs.write(fileName, JSON.stringify(letter, null, 2));
            } catch (fsError) {
                console.warn('File system save failed:', fsError);
            }
            
            // Add to letters index
            await this.addToLettersIndex(letterId, letter);
            
            console.log('✅ Letter saved:', letterId);
            return { success: true, letterId: letterId };
            
        } catch (error) {
            console.error('❌ Failed to save letter:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add letter to searchable index
     */
    async addToLettersIndex(letterId, letterData) {
        try {
            const indexKey = this.storagePrefix + 'letters_index';
            let index = await puter.kv.get(indexKey);
            
            if (index) {
                index = JSON.parse(index);
            } else {
                index = { letters: [], lastUpdated: null };
            }
            
            // Add to beginning of array (most recent first)
            index.letters.unshift({
                id: letterId,
                applicationId: letterData.applicationId,
                applicantName: letterData.applicantName,
                generatedAt: letterData.generatedAt,
                status: letterData.status,
                complianceScore: letterData.complianceScore
            });
            
            // Keep only last 1000 in index
            if (index.letters.length > 1000) {
                index.letters = index.letters.slice(0, 1000);
            }
            
            index.lastUpdated = new Date().toISOString();
            await puter.kv.set(indexKey, JSON.stringify(index));
            
        } catch (error) {
            console.error('Failed to update letters index:', error);
        }
    }

    /**
     * Get all letters
     */
    async getLetters(options = {}) {
        try {
            const indexKey = this.storagePrefix + 'letters_index';
            let index = await puter.kv.get(indexKey);
            
            if (!index) {
                return { letters: [], total: 0 };
            }
            
            index = JSON.parse(index);
            let letters = index.letters || [];
            
            // Apply filters
            if (options.status) {
                letters = letters.filter(l => l.status === options.status);
            }
            
            if (options.applicationId) {
                letters = letters.filter(l => l.applicationId === options.applicationId);
            }
            
            // Apply limit
            const limit = options.limit || 50;
            letters = letters.slice(0, limit);
            
            return {
                letters: letters,
                total: letters.length
            };
            
        } catch (error) {
            console.error('Failed to get letters:', error);
            return { letters: [], total: 0 };
        }
    }

    /**
     * Get single letter by ID
     */
    async getLetter(letterId) {
        try {
            const kvKey = this.storagePrefix + 'letter_' + letterId;
            const data = await puter.kv.get(kvKey);
            
            if (data) {
                return JSON.parse(data);
            }
            
            return null;
            
        } catch (error) {
            console.error('Failed to get letter:', error);
            return null;
        }
    }

    /**
     * Update letter status
     */
    async updateLetterStatus(letterId, status, metadata = {}) {
        try {
            const letter = await this.getLetter(letterId);
            if (!letter) {
                throw new Error('Letter not found');
            }
            
            letter.status = status;
            letter.updatedAt = new Date().toISOString();
            
            if (metadata.sentAt) letter.sentAt = metadata.sentAt;
            if (metadata.deliveryMethod) letter.deliveryMethod = metadata.deliveryMethod;
            
            const kvKey = this.storagePrefix + 'letter_' + letterId;
            await puter.kv.set(kvKey, JSON.stringify(letter));
            
            return { success: true };
            
        } catch (error) {
            console.error('Failed to update letter:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete letter
     */
    async deleteLetter(letterId) {
        try {
            const kvKey = this.storagePrefix + 'letter_' + letterId;
            await puter.kv.del(kvKey);
            
            // Remove from index
            await this.removeFromLettersIndex(letterId);
            
            return { success: true };
            
        } catch (error) {
            console.error('Failed to delete letter:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove letter from index
     */
    async removeFromLettersIndex(letterId) {
        try {
            const indexKey = this.storagePrefix + 'letters_index';
            let index = await puter.kv.get(indexKey);
            
            if (index) {
                index = JSON.parse(index);
                index.letters = index.letters.filter(l => l.id !== letterId);
                await puter.kv.set(indexKey, JSON.stringify(index));
            }
            
        } catch (error) {
            console.error('Failed to remove from index:', error);
        }
    }

    /**
     * Get statistics
     */
    async getStats() {
        try {
            const data = await puter.kv.get(this.storagePrefix + 'stats');
            if (data) {
                return JSON.parse(data);
            }
            return await this.createDefaultStats();
            
        } catch (error) {
            console.error('Failed to get stats:', error);
            return await this.createDefaultStats();
        }
    }

    /**
     * Update statistics
     */
    async updateStats(updates) {
        try {
            const stats = await this.getStats();
            
            if (updates.generated) {
                stats.totalGenerated++;
                
                // Update by model
                if (updates.model) {
                    if (!stats.byModel[updates.model]) {
                        stats.byModel[updates.model] = 0;
                    }
                    stats.byModel[updates.model]++;
                }
                
                // Update by lender
                if (updates.lenderId) {
                    if (!stats.byLender[updates.lenderId]) {
                        stats.byLender[updates.lenderId] = 0;
                    }
                    stats.byLender[updates.lenderId]++;
                }
            }
            
            if (updates.appeal) {
                stats.totalAppeals++;
            }
            
            if (updates.complianceScore) {
                const prevRate = stats.complianceRate;
                const total = stats.totalGenerated || 1;
                stats.complianceRate = ((prevRate * (total - 1)) + updates.complianceScore) / total;
            }
            
            if (updates.generationTime) {
                const prevAvg = stats.avgGenerationTime;
                const total = stats.totalGenerated || 1;
                stats.avgGenerationTime = ((prevAvg * (total - 1)) + updates.generationTime) / total;
            }
            
            stats.lastUpdated = new Date().toISOString();
            
            await puter.kv.set(this.storagePrefix + 'stats', JSON.stringify(stats));
            return stats;
            
        } catch (error) {
            console.error('Failed to update stats:', error);
            return null;
        }
    }

    /**
     * Get lenders
     */
    async getLenders() {
        try {
            const data = await puter.kv.get(this.storagePrefix + 'lenders');
            if (data) {
                return JSON.parse(data);
            }
            return await this.createDefaultLenders();
            
        } catch (error) {
            console.error('Failed to get lenders:', error);
            return [];
        }
    }

    /**
     * Save lender
     */
    async saveLender(lenderData) {
        try {
            const lenders = await this.getLenders();
            
            const lender = {
                id: lenderData.id || 'lender_' + Date.now(),
                ...lenderData,
                updatedAt: new Date().toISOString()
            };
            
            // Check if updating existing
            const existingIndex = lenders.findIndex(l => l.id === lender.id);
            if (existingIndex >= 0) {
                lenders[existingIndex] = lender;
            } else {
                lenders.push(lender);
            }
            
            await puter.kv.set(this.storagePrefix + 'lenders', JSON.stringify(lenders));
            return { success: true, lender: lender };
            
        } catch (error) {
            console.error('Failed to save lender:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save appeal
     */
    async saveAppeal(appealData) {
        try {
            const appealId = 'appeal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const appeal = {
                id: appealId,
                letterId: appealData.letterId,
                applicationId: appealData.applicationId,
                appealReason: appealData.appealReason,
                additionalDocs: appealData.additionalDocs,
                status: 'pending',
                filedAt: new Date().toISOString(),
                filedBy: appealData.filedBy,
                notes: appealData.notes
            };
            
            const kvKey = this.storagePrefix + 'appeal_' + appealId;
            await puter.kv.set(kvKey, JSON.stringify(appeal));
            
            // Update stats
            await this.updateStats({ appeal: true });
            
            return { success: true, appealId: appealId };
            
        } catch (error) {
            console.error('Failed to save appeal:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Export data for backup
     */
    async exportData() {
        try {
            const stats = await this.getStats();
            const letters = await this.getLetters({ limit: 1000 });
            const lenders = await this.getLenders();
            
            const exportData = {
                exportedAt: new Date().toISOString(),
                exportedBy: this.currentUser.uuid,
                stats: stats,
                letters: letters.letters,
                lenders: lenders
            };
            
            return exportData;
            
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }

    /**
     * Clear all data (for testing)
     */
    async clearAllData() {
        console.warn('⚠️ Clearing all mortgage denial data...');
        try {
            // Clear stats
            await puter.kv.del(this.storagePrefix + 'stats');
            
            // Clear letters index
            await puter.kv.del(this.storagePrefix + 'letters_index');
            
            // Clear lenders
            await puter.kv.del(this.storagePrefix + 'lenders');
            
            // Reinitialize defaults
            await this.initializeDefaults();
            
            console.log('✅ All data cleared');
            return { success: true };
            
        } catch (error) {
            console.error('Failed to clear data:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.MortgageDenialStoragePuter = MortgageDenialStoragePuter;
}
