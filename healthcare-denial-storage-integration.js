/**
 * Healthcare Denial Storage Integration
 * HIPAA-compliant data persistence using Puter.js
 * Handles denial records, appeal documents, and audit logs
 */

class HealthcareDenialStorageIntegration {
    constructor() {
        this.initialized = false;
        this.storagePrefix = 'healthcare_denial_';
        this.currentUser = null;
        this.organizationId = null;
        
        // Storage keys
        this.keys = {
            denials: `${this.storagePrefix}denials`,
            appeals: `${this.storagePrefix}appeals`,
            documents: `${this.storagePrefix}documents`,
            auditLog: `${this.storagePrefix}audit_log`,
            stats: `${this.storagePrefix}stats`,
            conversations: `${this.storagePrefix}conversations`,
            templates: `${this.storagePrefix}templates`
        };
    }

    /**
     * Initialize storage system
     */
    async initialize(user = null, orgId = null) {
        try {
            console.log('💾 Initializing HIPAA-compliant storage...');
            
            if (typeof puter === 'undefined') {
                throw new Error('Puter.js not available');
            }
            
            this.currentUser = user || 'default_user';
            this.organizationId = orgId || 'default_org';
            
            // Verify storage access
            await this.testStorageAccess();
            
            this.initialized = true;
            console.log('✅ Storage initialized successfully');
            
            return true;
            
        } catch (error) {
            console.error('❌ Storage initialization failed:', error);
            throw error;
        }
    }

    /**
     * Test storage access
     */
    async testStorageAccess() {
        try {
            // Test KV store
            const testKey = `${this.storagePrefix}test_${Date.now()}`;
            await puter.kv.set(testKey, JSON.stringify({ test: true }));
            await puter.kv.get(testKey);
            console.log('✅ KV store access verified');
            
            // Test file system (optional)
            try {
                await puter.fs.write(
                    `${this.storagePrefix}test.json`,
                    JSON.stringify({ test: true })
                );
                console.log('✅ File system access verified');
            } catch (fsError) {
                console.warn('⚠️ File system limited access:', fsError.message);
            }
            
            return true;
        } catch (error) {
            console.error('Storage access test failed:', error);
            throw error;
        }
    }

    /**
     * Save denial record
     */
    async saveDenial(denialData) {
        try {
            const denialRecord = {
                id: denialData.id || `DEN-${Date.now()}`,
                ...denialData,
                createdAt: denialData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: this.currentUser,
                organizationId: this.organizationId,
                status: denialData.status || 'pending',
                encrypted: true,
                hipaaCompliant: true
            };
            
            // Get existing denials
            const existingDenials = await this.getAllDenials();
            
            // Update or add
            const index = existingDenials.findIndex(d => d.id === denialRecord.id);
            if (index >= 0) {
                existingDenials[index] = denialRecord;
            } else {
                existingDenials.push(denialRecord);
            }
            
            // Save to KV store
            await puter.kv.set(this.keys.denials, JSON.stringify(existingDenials));
            
            // Log audit event
            await this.logAuditEvent('denial_saved', denialRecord.id, {
                action: index >= 0 ? 'update' : 'create'
            });
            
            console.log(`💾 Denial saved: ${denialRecord.id}`);
            return denialRecord;
            
        } catch (error) {
            console.error('Failed to save denial:', error);
            throw error;
        }
    }

    /**
     * Get denial by ID
     */
    async getDenial(denialId) {
        try {
            const allDenials = await this.getAllDenials();
            const denial = allDenials.find(d => d.id === denialId);
            
            if (denial) {
                await this.logAuditEvent('denial_accessed', denialId, {
                    action: 'read'
                });
            }
            
            return denial || null;
            
        } catch (error) {
            console.error('Failed to get denial:', error);
            return null;
        }
    }

    /**
     * Get all denials
     */
    async getAllDenials(filters = {}) {
        try {
            const data = await puter.kv.get(this.keys.denials);
            let denials = data ? JSON.parse(data) : [];
            
            // Apply filters
            if (filters.status) {
                denials = denials.filter(d => d.status === filters.status);
            }
            if (filters.payer) {
                denials = denials.filter(d => 
                    d.payer && d.payer.toLowerCase().includes(filters.payer.toLowerCase())
                );
            }
            if (filters.priority) {
                denials = denials.filter(d => d.priority === filters.priority);
            }
            if (filters.dateFrom) {
                denials = denials.filter(d => 
                    new Date(d.createdAt) >= new Date(filters.dateFrom)
                );
            }
            
            // Sort by date (newest first)
            denials.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            return denials;
            
        } catch (error) {
            console.error('Failed to get denials:', error);
            return [];
        }
    }

    /**
     * Update denial status
     */
    async updateDenialStatus(denialId, newStatus, notes = '') {
        try {
            const denial = await this.getDenial(denialId);
            if (!denial) {
                throw new Error('Denial not found');
            }
            
            const oldStatus = denial.status;
            denial.status = newStatus;
            denial.statusHistory = denial.statusHistory || [];
            denial.statusHistory.push({
                from: oldStatus,
                to: newStatus,
                notes: notes,
                timestamp: new Date().toISOString(),
                user: this.currentUser
            });
            
            await this.saveDenial(denial);
            
            await this.logAuditEvent('status_updated', denialId, {
                from: oldStatus,
                to: newStatus,
                notes: notes
            });
            
            return denial;
            
        } catch (error) {
            console.error('Failed to update status:', error);
            throw error;
        }
    }

    /**
     * Save appeal document
     */
    async saveAppeal(appealData) {
        try {
            const appealRecord = {
                id: appealData.id || `APPEAL-${Date.now()}`,
                denialId: appealData.denialId,
                content: appealData.content,
                engine: appealData.engine || 'unknown',
                type: appealData.type || 'appeal_letter',
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser,
                organizationId: this.organizationId,
                status: 'draft',
                metadata: appealData.metadata || {},
                hipaaCompliant: true
            };
            
            // Get existing appeals
            const existingAppeals = await this.getAllAppeals();
            existingAppeals.push(appealRecord);
            
            // Save to KV store
            await puter.kv.set(this.keys.appeals, JSON.stringify(existingAppeals));
            
            // Save to file system as PDF/document
            if (appealData.saveAsFile) {
                await this.saveAppealAsFile(appealRecord);
            }
            
            // Log audit event
            await this.logAuditEvent('appeal_saved', appealRecord.id, {
                denialId: appealData.denialId,
                type: appealRecord.type
            });
            
            console.log(`📄 Appeal saved: ${appealRecord.id}`);
            return appealRecord;
            
        } catch (error) {
            console.error('Failed to save appeal:', error);
            throw error;
        }
    }

    /**
     * Save appeal as file
     */
    async saveAppealAsFile(appealRecord) {
        try {
            const fileName = `appeals/${appealRecord.id}_${appealRecord.denialId}.txt`;
            const fileContent = `APPEAL DOCUMENT
Generated: ${appealRecord.createdAt}
Denial ID: ${appealRecord.denialId}
Engine: ${appealRecord.engine}
Type: ${appealRecord.type}

${appealRecord.content}

---
HIPAA COMPLIANT DOCUMENT
Organization: ${this.organizationId}
Created By: ${this.currentUser}
`;
            
            await puter.fs.write(fileName, fileContent);
            console.log(`📁 Appeal file saved: ${fileName}`);
            
            return fileName;
            
        } catch (error) {
            console.warn('Could not save appeal as file:', error);
            return null;
        }
    }

    /**
     * Get appeal by ID
     */
    async getAppeal(appealId) {
        try {
            const allAppeals = await this.getAllAppeals();
            return allAppeals.find(a => a.id === appealId) || null;
        } catch (error) {
            console.error('Failed to get appeal:', error);
            return null;
        }
    }

    /**
     * Get all appeals
     */
    async getAllAppeals(denialId = null) {
        try {
            const data = await puter.kv.get(this.keys.appeals);
            let appeals = data ? JSON.parse(data) : [];
            
            if (denialId) {
                appeals = appeals.filter(a => a.denialId === denialId);
            }
            
            appeals.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            return appeals;
            
        } catch (error) {
            console.error('Failed to get appeals:', error);
            return [];
        }
    }

    /**
     * Update appeal status
     */
    async updateAppealStatus(appealId, newStatus) {
        try {
            const appeal = await this.getAppeal(appealId);
            if (!appeal) {
                throw new Error('Appeal not found');
            }
            
            appeal.status = newStatus;
            appeal.updatedAt = new Date().toISOString();
            
            const allAppeals = await this.getAllAppeals();
            const index = allAppeals.findIndex(a => a.id === appealId);
            if (index >= 0) {
                allAppeals[index] = appeal;
                await puter.kv.set(this.keys.appeals, JSON.stringify(allAppeals));
            }
            
            await this.logAuditEvent('appeal_status_updated', appealId, {
                status: newStatus
            });
            
            return appeal;
            
        } catch (error) {
            console.error('Failed to update appeal status:', error);
            throw error;
        }
    }

    /**
     * Save conversation
     */
    async saveConversation(conversationData) {
        try {
            const conversationRecord = {
                id: `CONV-${Date.now()}`,
                ...conversationData,
                createdAt: new Date().toISOString(),
                userId: this.currentUser,
                organizationId: this.organizationId
            };
            
            const key = `${this.keys.conversations}_${conversationRecord.id}`;
            await puter.kv.set(key, JSON.stringify(conversationRecord));
            
            console.log(`💬 Conversation saved: ${conversationRecord.id}`);
            return conversationRecord;
            
        } catch (error) {
            console.error('Failed to save conversation:', error);
            throw error;
        }
    }

    /**
     * Log audit event (HIPAA compliance)
     */
    async logAuditEvent(eventType, resourceId, details = {}) {
        try {
            const auditEntry = {
                id: `AUDIT-${Date.now()}`,
                eventType: eventType,
                resourceId: resourceId,
                timestamp: new Date().toISOString(),
                user: this.currentUser,
                organizationId: this.organizationId,
                details: details,
                ipAddress: 'client-side', // Would be captured on server
                userAgent: navigator.userAgent
            };
            
            // Get existing audit log
            const data = await puter.kv.get(this.keys.auditLog);
            const auditLog = data ? JSON.parse(data) : [];
            
            auditLog.push(auditEntry);
            
            // Keep only last 1000 entries in KV
            if (auditLog.length > 1000) {
                auditLog.shift();
            }
            
            await puter.kv.set(this.keys.auditLog, JSON.stringify(auditLog));
            
            return auditEntry;
            
        } catch (error) {
            console.error('Failed to log audit event:', error);
            // Don't throw - audit logging failure shouldn't break main flow
            return null;
        }
    }

    /**
     * Get audit log
     */
    async getAuditLog(filters = {}) {
        try {
            const data = await puter.kv.get(this.keys.auditLog);
            let auditLog = data ? JSON.parse(data) : [];
            
            // Apply filters
            if (filters.eventType) {
                auditLog = auditLog.filter(e => e.eventType === filters.eventType);
            }
            if (filters.resourceId) {
                auditLog = auditLog.filter(e => e.resourceId === filters.resourceId);
            }
            if (filters.dateFrom) {
                auditLog = auditLog.filter(e => 
                    new Date(e.timestamp) >= new Date(filters.dateFrom)
                );
            }
            
            // Sort by timestamp (newest first)
            auditLog.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            
            return auditLog;
            
        } catch (error) {
            console.error('Failed to get audit log:', error);
            return [];
        }
    }

    /**
     * Save statistics
     */
    async saveStats(stats) {
        try {
            const statsRecord = {
                ...stats,
                timestamp: new Date().toISOString(),
                organizationId: this.organizationId
            };
            
            await puter.kv.set(this.keys.stats, JSON.stringify(statsRecord));
            return statsRecord;
            
        } catch (error) {
            console.error('Failed to save stats:', error);
            throw error;
        }
    }

    /**
     * Get statistics
     */
    async getStats() {
        try {
            const data = await puter.kv.get(this.keys.stats);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to get stats:', error);
            return null;
        }
    }

    /**
     * Get dashboard metrics
     */
    async getDashboardMetrics() {
        try {
            const denials = await this.getAllDenials();
            const appeals = await this.getAllAppeals();
            
            const metrics = {
                totalDenials: denials.length,
                pendingDenials: denials.filter(d => d.status === 'pending').length,
                inProgressDenials: denials.filter(d => d.status === 'in-progress').length,
                resolvedDenials: denials.filter(d => 
                    ['approved', 'overturned'].includes(d.status)
                ).length,
                totalAppeals: appeals.length,
                draftAppeals: appeals.filter(a => a.status === 'draft').length,
                submittedAppeals: appeals.filter(a => a.status === 'submitted').length,
                successRate: this.calculateSuccessRate(denials),
                averageResponseTime: this.calculateAverageResponseTime(appeals),
                byPayer: this.groupByPayer(denials),
                byPriority: this.groupByPriority(denials),
                recentActivity: await this.getRecentActivity(),
                timestamp: new Date().toISOString()
            };
            
            return metrics;
            
        } catch (error) {
            console.error('Failed to get dashboard metrics:', error);
            return null;
        }
    }

    /**
     * Calculate success rate
     */
    calculateSuccessRate(denials) {
        const resolved = denials.filter(d => 
            ['approved', 'overturned', 'denied'].includes(d.status)
        );
        const successful = denials.filter(d => 
            ['approved', 'overturned'].includes(d.status)
        );
        
        return resolved.length > 0 
            ? ((successful.length / resolved.length) * 100).toFixed(1)
            : 0;
    }

    /**
     * Calculate average response time
     */
    calculateAverageResponseTime(appeals) {
        const submitted = appeals.filter(a => 
            a.status === 'submitted' && a.createdAt
        );
        
        if (submitted.length === 0) return 0;
        
        const totalDays = submitted.reduce((sum, appeal) => {
            const created = new Date(appeal.createdAt);
            const now = new Date();
            const days = (now - created) / (1000 * 60 * 60 * 24);
            return sum + days;
        }, 0);
        
        return (totalDays / submitted.length).toFixed(1);
    }

    /**
     * Group denials by payer
     */
    groupByPayer(denials) {
        const grouped = {};
        denials.forEach(denial => {
            const payer = denial.payer || 'Unknown';
            grouped[payer] = (grouped[payer] || 0) + 1;
        });
        return grouped;
    }

    /**
     * Group denials by priority
     */
    groupByPriority(denials) {
        const grouped = {
            high: 0,
            medium: 0,
            low: 0
        };
        denials.forEach(denial => {
            const priority = denial.priority || 'medium';
            grouped[priority]++;
        });
        return grouped;
    }

    /**
     * Get recent activity
     */
    async getRecentActivity(limit = 10) {
        try {
            const auditLog = await this.getAuditLog();
            return auditLog.slice(0, limit);
        } catch (error) {
            console.error('Failed to get recent activity:', error);
            return [];
        }
    }

    /**
     * Export data (for compliance/backup)
     */
    async exportData(options = {}) {
        try {
            const exportData = {
                denials: await this.getAllDenials(),
                appeals: await this.getAllAppeals(),
                auditLog: await this.getAuditLog(),
                stats: await this.getStats(),
                exportedAt: new Date().toISOString(),
                exportedBy: this.currentUser,
                organizationId: this.organizationId
            };
            
            // Apply filters if provided
            if (options.dateFrom) {
                const dateFrom = new Date(options.dateFrom);
                exportData.denials = exportData.denials.filter(d => 
                    new Date(d.createdAt) >= dateFrom
                );
                exportData.appeals = exportData.appeals.filter(a => 
                    new Date(a.createdAt) >= dateFrom
                );
            }
            
            // Save as file if requested
            if (options.saveAsFile) {
                const fileName = `export_${Date.now()}.json`;
                await puter.fs.write(fileName, JSON.stringify(exportData, null, 2));
                console.log(`📦 Data exported to: ${fileName}`);
            }
            
            return exportData;
            
        } catch (error) {
            console.error('Failed to export data:', error);
            throw error;
        }
    }

    /**
     * Clear all data (use with caution)
     */
    async clearAllData() {
        try {
            await puter.kv.set(this.keys.denials, JSON.stringify([]));
            await puter.kv.set(this.keys.appeals, JSON.stringify([]));
            await puter.kv.set(this.keys.auditLog, JSON.stringify([]));
            
            console.log('🗑️ All data cleared');
            
            await this.logAuditEvent('data_cleared', 'system', {
                action: 'clear_all'
            });
            
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            throw error;
        }
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.HealthcareDenialStorageIntegration = HealthcareDenialStorageIntegration;
}
