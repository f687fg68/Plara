/**
 * Puter.js Key-Value Store Integration Module
 * Provides persistent storage for user preferences, chat history, document metadata, and more
 * Integrates seamlessly with chat and document editor backend
 */

class PuterKVManager {
    constructor() {
        this.isInitialized = false;
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.pendingWrites = new Map();
        
        // Configuration
        this.config = {
            // Cache settings
            cacheEnabled: true,
            cacheTTL: 300000, // 5 minutes in milliseconds
            
            // Batch write settings
            batchWriteEnabled: true,
            batchWriteDelay: 1000, // 1 second
            
            // Key prefixes for organization
            prefixes: {
                userPrefs: 'pref_',
                chatHistory: 'chat_',
                docMeta: 'doc_',
                sessionState: 'session_',
                analytics: 'analytics_',
                cache: 'cache_',
                temp: 'temp_'
            },
            
            // Size limits (from Puter.js)
            maxKeySize: 1024, // 1 KB
            maxValueSize: 409600 // 400 KB
        };
        
        // Statistics tracking
        this.stats = {
            reads: 0,
            writes: 0,
            deletes: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0
        };
        
        this.init();
    }
    
    /**
     * Initialize Puter.js KV
     */
    async init() {
        try {
            if (!window.puter || !puter.kv) {
                throw new Error('Puter.js KV not loaded');
            }
            
            // Verify KV is accessible
            await this.ping();
            
            this.isInitialized = true;
            console.log('✅ PuterKV Manager initialized');
            
            // Load user preferences on init
            await this.loadUserPreferences();
            
            return true;
        } catch (error) {
            console.error('❌ PuterKV initialization failed:', error);
            return false;
        }
    }
    
    /**
     * Ping KV store to verify connectivity
     */
    async ping() {
        try {
            const testKey = this.config.prefixes.temp + 'ping';
            await puter.kv.set(testKey, Date.now());
            await puter.kv.del(testKey);
            return true;
        } catch (error) {
            throw new Error('KV store not accessible: ' + error.message);
        }
    }
    
    // ==================== CORE KV OPERATIONS ====================
    
    /**
     * Set a key-value pair
     */
    async set(key, value, options = {}) {
        try {
            this.validateKey(key);
            this.validateValue(value);
            
            const { expireAt, skipCache = false } = options;
            
            // Batch write if enabled
            if (this.config.batchWriteEnabled && !expireAt) {
                this.queueWrite(key, value);
                if (!skipCache) this.updateCache(key, value);
                return true;
            }
            
            // Direct write
            const result = await puter.kv.set(key, value, expireAt);
            
            if (!skipCache) this.updateCache(key, value);
            this.stats.writes++;
            
            return result;
        } catch (error) {
            this.stats.errors++;
            console.error('❌ KV set error:', error);
            throw error;
        }
    }
    
    /**
     * Get a value by key
     */
    async get(key, options = {}) {
        try {
            const { skipCache = false } = options;
            
            // Check cache first
            if (!skipCache && this.config.cacheEnabled) {
                const cached = this.getFromCache(key);
                if (cached !== undefined) {
                    this.stats.cacheHits++;
                    return cached;
                }
                this.stats.cacheMisses++;
            }
            
            // Fetch from KV store
            const value = await puter.kv.get(key);
            
            if (value !== null && !skipCache) {
                this.updateCache(key, value);
            }
            
            this.stats.reads++;
            return value;
        } catch (error) {
            this.stats.errors++;
            console.error('❌ KV get error:', error);
            throw error;
        }
    }
    
    /**
     * Delete a key
     */
    async delete(key) {
        try {
            await puter.kv.del(key);
            this.removeFromCache(key);
            this.stats.deletes++;
            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('❌ KV delete error:', error);
            throw error;
        }
    }
    
    /**
     * Increment a numeric value
     */
    async increment(key, amount = 1) {
        try {
            const newValue = await puter.kv.incr(key, amount);
            this.updateCache(key, newValue);
            return newValue;
        } catch (error) {
            this.stats.errors++;
            console.error('❌ KV increment error:', error);
            throw error;
        }
    }
    
    /**
     * Decrement a numeric value
     */
    async decrement(key, amount = 1) {
        try {
            const newValue = await puter.kv.decr(key, amount);
            this.updateCache(key, newValue);
            return newValue;
        } catch (error) {
            this.stats.errors++;
            console.error('❌ KV decrement error:', error);
            throw error;
        }
    }
    
    /**
     * List keys with optional pattern
     */
    async list(pattern = '*', returnValues = false) {
        try {
            return await puter.kv.list(pattern, returnValues);
        } catch (error) {
            this.stats.errors++;
            console.error('❌ KV list error:', error);
            throw error;
        }
    }
    
    /**
     * Flush all keys (careful!)
     */
    async flush() {
        try {
            await puter.kv.flush();
            this.clearCache();
            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('❌ KV flush error:', error);
            throw error;
        }
    }
    
    /**
     * Set expiration time (TTL in seconds)
     */
    async expire(key, ttlSeconds) {
        try {
            return await puter.kv.expire(key, ttlSeconds);
        } catch (error) {
            this.stats.errors++;
            console.error('❌ KV expire error:', error);
            throw error;
        }
    }
    
    /**
     * Set expiration at specific timestamp
     */
    async expireAt(key, timestampSeconds) {
        try {
            return await puter.kv.expireAt(key, timestampSeconds);
        } catch (error) {
            this.stats.errors++;
            console.error('❌ KV expireAt error:', error);
            throw error;
        }
    }
    
    // ==================== USER PREFERENCES ====================
    
    /**
     * Load user preferences
     */
    async loadUserPreferences() {
        try {
            const prefs = await this.get(this.config.prefixes.userPrefs + 'settings');
            if (prefs) {
                window.userPreferences = prefs;
                console.log('✅ Loaded user preferences');
            }
            return prefs || {};
        } catch (error) {
            console.warn('Could not load user preferences:', error);
            return {};
        }
    }
    
    /**
     * Save user preferences
     */
    async saveUserPreferences(prefs) {
        try {
            await this.set(this.config.prefixes.userPrefs + 'settings', prefs);
            window.userPreferences = prefs;
            console.log('💾 Saved user preferences');
            return true;
        } catch (error) {
            console.error('Failed to save user preferences:', error);
            return false;
        }
    }
    
    /**
     * Get a specific preference
     */
    async getPreference(key, defaultValue = null) {
        const prefs = await this.loadUserPreferences();
        return prefs[key] !== undefined ? prefs[key] : defaultValue;
    }
    
    /**
     * Set a specific preference
     */
    async setPreference(key, value) {
        const prefs = await this.loadUserPreferences();
        prefs[key] = value;
        return await this.saveUserPreferences(prefs);
    }
    
    // ==================== CHAT HISTORY ====================
    
    /**
     * Save chat history
     */
    async saveChatHistory(conversationId, messages) {
        try {
            const key = this.config.prefixes.chatHistory + conversationId;
            const data = {
                id: conversationId,
                messages: messages,
                timestamp: Date.now(),
                messageCount: messages.length
            };
            
            await this.set(key, data);
            console.log('💬 Saved chat history:', conversationId);
            return true;
        } catch (error) {
            console.error('Failed to save chat history:', error);
            return false;
        }
    }
    
    /**
     * Load chat history
     */
    async loadChatHistory(conversationId) {
        try {
            const key = this.config.prefixes.chatHistory + conversationId;
            const data = await this.get(key);
            return data ? data.messages : [];
        } catch (error) {
            console.error('Failed to load chat history:', error);
            return [];
        }
    }
    
    /**
     * List all chat conversations
     */
    async listChatConversations() {
        try {
            const pattern = this.config.prefixes.chatHistory + '*';
            const results = await this.list(pattern, true);
            
            return results.map(item => ({
                id: item.key.replace(this.config.prefixes.chatHistory, ''),
                messageCount: item.value.messageCount || 0,
                timestamp: item.value.timestamp,
                preview: this.getChatPreview(item.value.messages)
            })).sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to list chat conversations:', error);
            return [];
        }
    }
    
    /**
     * Get chat preview text
     */
    getChatPreview(messages, maxLength = 50) {
        if (!messages || messages.length === 0) return 'Empty conversation';
        
        const lastMessage = messages[messages.length - 1];
        const content = typeof lastMessage.content === 'string' 
            ? lastMessage.content 
            : JSON.stringify(lastMessage.content);
        
        return content.length > maxLength 
            ? content.substring(0, maxLength) + '...' 
            : content;
    }
    
    /**
     * Delete chat history
     */
    async deleteChatHistory(conversationId) {
        try {
            const key = this.config.prefixes.chatHistory + conversationId;
            await this.delete(key);
            console.log('🗑️ Deleted chat history:', conversationId);
            return true;
        } catch (error) {
            console.error('Failed to delete chat history:', error);
            return false;
        }
    }
    
    // ==================== DOCUMENT METADATA ====================
    
    /**
     * Save document metadata
     */
    async saveDocumentMetadata(docId, metadata) {
        try {
            const key = this.config.prefixes.docMeta + docId;
            const data = {
                id: docId,
                ...metadata,
                lastModified: Date.now()
            };
            
            await this.set(key, data);
            console.log('📝 Saved document metadata:', docId);
            return true;
        } catch (error) {
            console.error('Failed to save document metadata:', error);
            return false;
        }
    }
    
    /**
     * Load document metadata
     */
    async loadDocumentMetadata(docId) {
        try {
            const key = this.config.prefixes.docMeta + docId;
            return await this.get(key);
        } catch (error) {
            console.error('Failed to load document metadata:', error);
            return null;
        }
    }
    
    /**
     * List all document metadata
     */
    async listDocumentMetadata() {
        try {
            const pattern = this.config.prefixes.docMeta + '*';
            const results = await this.list(pattern, true);
            
            return results.map(item => item.value)
                .sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error('Failed to list document metadata:', error);
            return [];
        }
    }
    
    /**
     * Delete document metadata
     */
    async deleteDocumentMetadata(docId) {
        try {
            const key = this.config.prefixes.docMeta + docId;
            await this.delete(key);
            return true;
        } catch (error) {
            console.error('Failed to delete document metadata:', error);
            return false;
        }
    }
    
    // ==================== SESSION STATE ====================
    
    /**
     * Save session state
     */
    async saveSessionState(state) {
        try {
            const key = this.config.prefixes.sessionState + 'current';
            await this.set(key, {
                ...state,
                timestamp: Date.now()
            });
            return true;
        } catch (error) {
            console.error('Failed to save session state:', error);
            return false;
        }
    }
    
    /**
     * Load session state
     */
    async loadSessionState() {
        try {
            const key = this.config.prefixes.sessionState + 'current';
            return await this.get(key);
        } catch (error) {
            console.error('Failed to load session state:', error);
            return null;
        }
    }
    
    /**
     * Clear session state
     */
    async clearSessionState() {
        try {
            const key = this.config.prefixes.sessionState + 'current';
            await this.delete(key);
            return true;
        } catch (error) {
            console.error('Failed to clear session state:', error);
            return false;
        }
    }
    
    // ==================== ANALYTICS ====================
    
    /**
     * Track analytics event
     */
    async trackEvent(eventName, eventData = {}) {
        try {
            const key = this.config.prefixes.analytics + eventName;
            
            // Get current count
            const current = await this.get(key) || { count: 0, events: [] };
            
            // Update
            current.count++;
            current.events.push({
                data: eventData,
                timestamp: Date.now()
            });
            
            // Keep only last 100 events
            if (current.events.length > 100) {
                current.events = current.events.slice(-100);
            }
            
            await this.set(key, current);
            return true;
        } catch (error) {
            console.error('Failed to track event:', error);
            return false;
        }
    }
    
    /**
     * Get analytics data
     */
    async getAnalytics(eventName) {
        try {
            const key = this.config.prefixes.analytics + eventName;
            return await this.get(key);
        } catch (error) {
            console.error('Failed to get analytics:', error);
            return null;
        }
    }
    
    /**
     * List all analytics
     */
    async listAnalytics() {
        try {
            const pattern = this.config.prefixes.analytics + '*';
            const results = await this.list(pattern, true);
            
            return results.map(item => ({
                event: item.key.replace(this.config.prefixes.analytics, ''),
                count: item.value.count,
                lastEvent: item.value.events[item.value.events.length - 1]
            }));
        } catch (error) {
            console.error('Failed to list analytics:', error);
            return [];
        }
    }
    
    // ==================== CACHE MANAGEMENT ====================
    
    /**
     * Update cache
     */
    updateCache(key, value) {
        if (!this.config.cacheEnabled) return;
        
        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + this.config.cacheTTL);
    }
    
    /**
     * Get from cache
     */
    getFromCache(key) {
        if (!this.config.cacheEnabled) return undefined;
        
        const expiry = this.cacheExpiry.get(key);
        if (!expiry || Date.now() > expiry) {
            this.removeFromCache(key);
            return undefined;
        }
        
        return this.cache.get(key);
    }
    
    /**
     * Remove from cache
     */
    removeFromCache(key) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
    }
    
    /**
     * Clear entire cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
    }
    
    /**
     * Clean expired cache entries
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, expiry] of this.cacheExpiry.entries()) {
            if (now > expiry) {
                this.removeFromCache(key);
            }
        }
    }
    
    // ==================== BATCH WRITE ====================
    
    /**
     * Queue a write operation
     */
    queueWrite(key, value) {
        this.pendingWrites.set(key, value);
        
        // Flush after delay
        if (!this._flushTimeout) {
            this._flushTimeout = setTimeout(() => {
                this.flushPendingWrites();
            }, this.config.batchWriteDelay);
        }
    }
    
    /**
     * Flush pending writes
     */
    async flushPendingWrites() {
        clearTimeout(this._flushTimeout);
        this._flushTimeout = null;
        
        if (this.pendingWrites.size === 0) return;
        
        const writes = Array.from(this.pendingWrites.entries());
        this.pendingWrites.clear();
        
        try {
            await Promise.all(
                writes.map(([key, value]) => puter.kv.set(key, value))
            );
            this.stats.writes += writes.length;
            console.log(`💾 Flushed ${writes.length} pending writes`);
        } catch (error) {
            console.error('Failed to flush pending writes:', error);
            this.stats.errors++;
        }
    }
    
    // ==================== VALIDATION ====================
    
    /**
     * Validate key size
     */
    validateKey(key) {
        const size = new Blob([key]).size;
        if (size > this.config.maxKeySize) {
            throw new Error(`Key size (${size} bytes) exceeds maximum (${this.config.maxKeySize} bytes)`);
        }
    }
    
    /**
     * Validate value size
     */
    validateValue(value) {
        const size = new Blob([JSON.stringify(value)]).size;
        if (size > this.config.maxValueSize) {
            throw new Error(`Value size (${size} bytes) exceeds maximum (${this.config.maxValueSize} bytes)`);
        }
    }
    
    // ==================== UTILITIES ====================
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            pendingWrites: this.pendingWrites.size,
            cacheHitRate: this.stats.reads > 0 
                ? (this.stats.cacheHits / this.stats.reads * 100).toFixed(2) + '%'
                : '0%'
        };
    }
    
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            reads: 0,
            writes: 0,
            deletes: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0
        };
    }
    
    /**
     * Export all data
     */
    async exportAllData() {
        try {
            const allData = await this.list('*', true);
            return allData.reduce((acc, item) => {
                acc[item.key] = item.value;
                return acc;
            }, {});
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }
    
    /**
     * Import data
     */
    async importData(data) {
        try {
            const entries = Object.entries(data);
            await Promise.all(
                entries.map(([key, value]) => this.set(key, value))
            );
            console.log(`✅ Imported ${entries.length} entries`);
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
}

// Initialize global instance
window.puterKV = new PuterKVManager();

// Auto-cleanup cache every 5 minutes
setInterval(() => {
    if (window.puterKV) {
        window.puterKV.cleanExpiredCache();
    }
}, 300000);

// Flush pending writes before page unload
window.addEventListener('beforeunload', () => {
    if (window.puterKV && window.puterKV.pendingWrites.size > 0) {
        window.puterKV.flushPendingWrites();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuterKVManager;
}
