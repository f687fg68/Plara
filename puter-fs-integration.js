/**
 * Puter.js File System Integration Module
 * Provides comprehensive cloud storage functionality for Plara
 * Integrates with chat attachments and document editor
 */

class PuterFSManager {
    constructor() {
        this.isInitialized = false;
        this.currentDirectory = '/';
        this.uploadQueue = [];
        this.autoSaveInterval = null;
        this.fileCache = new Map();
        
        // Configuration
        this.config = {
            autoSaveEnabled: true,
            autoSaveInterval: 30000, // 30 seconds
            maxFileSize: 100 * 1024 * 1024, // 100MB
            allowedFileTypes: ['*'], // All types allowed
            documentStoragePath: 'documents/',
            chatAttachmentsPath: 'chat_attachments/',
            tempFilesPath: 'temp/'
        };
        
        this.init();
    }
    
    /**
     * Initialize Puter.js FS
     */
    async init() {
        try {
            if (!window.puter || !puter.fs) {
                throw new Error('Puter.js not loaded');
            }
            
            // Create default directories
            await this.ensureDirectories();
            this.isInitialized = true;
            
            console.log('✅ PuterFS Manager initialized');
            
            // Start auto-save if enabled
            if (this.config.autoSaveEnabled) {
                this.startAutoSave();
            }
            
            return true;
        } catch (error) {
            console.error('❌ PuterFS initialization failed:', error);
            return false;
        }
    }
    
    /**
     * Ensure required directories exist
     */
    async ensureDirectories() {
        const dirs = [
            this.config.documentStoragePath,
            this.config.chatAttachmentsPath,
            this.config.tempFilesPath
        ];
        
        for (const dir of dirs) {
            try {
                await puter.fs.mkdir(dir, { 
                    dedupeName: false,
                    createMissingParents: true 
                });
            } catch (error) {
                // Directory might already exist, that's okay
                if (!error.message?.includes('already exists')) {
                    console.warn(`Directory creation warning for ${dir}:`, error.message);
                }
            }
        }
    }
    
    /**
     * Write a file to Puter FS
     * @param {string} path - File path
     * @param {string|File|Blob} data - File data
     * @param {Object} options - Write options
     */
    async writeFile(path, data, options = {}) {
        try {
            const defaultOptions = {
                overwrite: options.overwrite ?? true,
                dedupeName: options.dedupeName ?? false,
                createMissingParents: options.createMissingParents ?? true
            };
            
            const result = await puter.fs.write(path, data, defaultOptions);
            
            // Cache file info
            this.fileCache.set(path, {
                name: result.name,
                path: result.path,
                size: result.size,
                created: result.created,
                modified: result.modified || Date.now()
            });
            
            console.log('✅ File written:', result.path);
            return result;
            
        } catch (error) {
            console.error('❌ File write error:', error);
            throw error;
        }
    }
    
    /**
     * Read a file from Puter FS
     * @param {string} path - File path
     * @param {Object} options - Read options
     */
    async readFile(path, options = {}) {
        try {
            const blob = await puter.fs.read(path, options);
            
            // Update cache
            const stat = await this.getFileInfo(path);
            if (stat) {
                this.fileCache.set(path, stat);
            }
            
            return blob;
        } catch (error) {
            console.error('❌ File read error:', error);
            throw error;
        }
    }
    
    /**
     * Read file as text
     */
    async readFileAsText(path) {
        const blob = await this.readFile(path);
        return await blob.text();
    }
    
    /**
     * Read file as data URL
     */
    async readFileAsDataURL(path) {
        const blob = await this.readFile(path);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    /**
     * Create a directory
     */
    async createDirectory(path, options = {}) {
        try {
            const defaultOptions = {
                dedupeName: options.dedupeName ?? false,
                createMissingParents: options.createMissingParents ?? true
            };
            
            const result = await puter.fs.mkdir(path, defaultOptions);
            console.log('✅ Directory created:', result.path);
            return result;
        } catch (error) {
            console.error('❌ Directory creation error:', error);
            throw error;
        }
    }
    
    /**
     * List directory contents
     */
    async listDirectory(path = './') {
        try {
            const items = await puter.fs.readdir(path);
            return items.map(item => ({
                name: item.name,
                path: item.path,
                isDirectory: item.is_dir,
                size: item.size,
                created: item.created,
                modified: item.modified
            }));
        } catch (error) {
            console.error('❌ Directory listing error:', error);
            throw error;
        }
    }
    
    /**
     * Get file/directory information
     */
    async getFileInfo(path) {
        try {
            const info = await puter.fs.stat(path);
            return {
                name: info.name,
                path: info.path,
                isDirectory: info.is_dir,
                size: info.size,
                created: info.created,
                modified: info.modified,
                uid: info.uid
            };
        } catch (error) {
            console.error('❌ File stat error:', error);
            throw error;
        }
    }
    
    /**
     * Rename file or directory
     */
    async rename(path, newName) {
        try {
            const result = await puter.fs.rename(path, newName);
            
            // Update cache
            if (this.fileCache.has(path)) {
                const cached = this.fileCache.get(path);
                this.fileCache.delete(path);
                this.fileCache.set(result.path, { ...cached, name: newName, path: result.path });
            }
            
            console.log('✅ Renamed:', path, '→', result.path);
            return result;
        } catch (error) {
            console.error('❌ Rename error:', error);
            throw error;
        }
    }
    
    /**
     * Copy file or directory
     */
    async copy(source, destination, options = {}) {
        try {
            const defaultOptions = {
                overwrite: options.overwrite ?? false,
                dedupeName: options.dedupeName ?? true,
                newName: options.newName
            };
            
            const result = await puter.fs.copy(source, destination, defaultOptions);
            console.log('✅ Copied:', source, '→', result.path);
            return result;
        } catch (error) {
            console.error('❌ Copy error:', error);
            throw error;
        }
    }
    
    /**
     * Move file or directory
     */
    async move(source, destination, options = {}) {
        try {
            const defaultOptions = {
                overwrite: options.overwrite ?? false,
                createMissingParents: options.createMissingParents ?? true
            };
            
            const result = await puter.fs.move(source, destination, defaultOptions);
            
            // Update cache
            if (this.fileCache.has(source)) {
                const cached = this.fileCache.get(source);
                this.fileCache.delete(source);
                this.fileCache.set(result.path, { ...cached, path: result.path });
            }
            
            console.log('✅ Moved:', source, '→', result.path);
            return result;
        } catch (error) {
            console.error('❌ Move error:', error);
            throw error;
        }
    }
    
    /**
     * Delete file or directory
     */
    async delete(paths, options = {}) {
        try {
            const pathArray = Array.isArray(paths) ? paths : [paths];
            const defaultOptions = {
                recursive: options.recursive ?? true
            };
            
            await puter.fs.delete(pathArray, defaultOptions);
            
            // Clear from cache
            pathArray.forEach(path => this.fileCache.delete(path));
            
            console.log('✅ Deleted:', pathArray);
            return true;
        } catch (error) {
            console.error('❌ Delete error:', error);
            throw error;
        }
    }
    
    /**
     * Get read URL for a file (for embedding images, etc.)
     */
    async getReadURL(path, expiresIn = 3600) {
        try {
            const url = await puter.fs.getReadURL(path, expiresIn);
            return url;
        } catch (error) {
            console.error('❌ Get read URL error:', error);
            throw error;
        }
    }
    
    /**
     * Upload files from file input
     */
    async uploadFiles(files, directory = null, options = {}) {
        try {
            const fileArray = Array.isArray(files) ? files : Array.from(files);
            const targetDir = directory || this.config.chatAttachmentsPath;
            
            const defaultOptions = {
                overwrite: options.overwrite ?? false,
                dedupeName: options.dedupeName ?? true,
                createMissingParents: options.createMissingParents ?? true
            };
            
            const results = await puter.fs.upload(fileArray, targetDir, defaultOptions);
            
            // Normalize results to array
            const resultArray = Array.isArray(results) ? results : [results];
            
            // Cache uploaded files
            resultArray.forEach(result => {
                this.fileCache.set(result.path, {
                    name: result.name,
                    path: result.path,
                    size: result.size,
                    created: result.created,
                    modified: result.modified
                });
            });
            
            console.log('✅ Uploaded files:', resultArray.length);
            return resultArray;
            
        } catch (error) {
            console.error('❌ Upload error:', error);
            throw error;
        }
    }
    
    /**
     * Save chat attachment to Puter FS
     */
    async saveChatAttachment(file) {
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name}`;
        const path = this.config.chatAttachmentsPath + filename;
        
        return await this.writeFile(path, file, {
            overwrite: false,
            dedupeName: true
        });
    }
    
    /**
     * Save document to Puter FS
     */
    async saveDocument(content, filename, format = 'json') {
        const timestamp = Date.now();
        const ext = format === 'json' ? '.json' : '.txt';
        const name = filename || `document_${timestamp}${ext}`;
        const path = this.config.documentStoragePath + name;
        
        let data;
        if (format === 'json') {
            data = JSON.stringify(content, null, 2);
        } else {
            data = content;
        }
        
        return await this.writeFile(path, data, {
            overwrite: true,
            dedupeName: false
        });
    }
    
    /**
     * Load document from Puter FS
     */
    async loadDocument(filename) {
        const path = this.config.documentStoragePath + filename;
        const content = await this.readFileAsText(path);
        
        try {
            return JSON.parse(content);
        } catch {
            return content;
        }
    }
    
    /**
     * List all saved documents
     */
    async listDocuments() {
        try {
            const items = await this.listDirectory(this.config.documentStoragePath);
            return items.filter(item => !item.isDirectory);
        } catch (error) {
            console.error('❌ List documents error:', error);
            return [];
        }
    }
    
    /**
     * List all chat attachments
     */
    async listChatAttachments() {
        try {
            const items = await this.listDirectory(this.config.chatAttachmentsPath);
            return items.filter(item => !item.isDirectory);
        } catch (error) {
            console.error('❌ List attachments error:', error);
            return [];
        }
    }
    
    /**
     * Auto-save current document
     */
    async autoSaveDocument() {
        try {
            if (!window.editorjs) return;
            
            const data = await window.editorjs.save();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `autosave_${timestamp}.json`;
            
            await this.saveDocument(data, filename, 'json');
            console.log('💾 Auto-saved:', filename);
            
            return filename;
        } catch (error) {
            console.error('❌ Auto-save error:', error);
        }
    }
    
    /**
     * Start auto-save timer
     */
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            this.autoSaveDocument();
        }, this.config.autoSaveInterval);
        
        console.log('⏰ Auto-save started (interval:', this.config.autoSaveInterval / 1000, 'seconds)');
    }
    
    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏰ Auto-save stopped');
        }
    }
    
    /**
     * Export document as file
     */
    async exportDocument(format = 'json') {
        try {
            if (!window.editorjs) throw new Error('Editor not available');
            
            const data = await window.editorjs.save();
            let content, filename, mimeType;
            
            if (format === 'json') {
                content = JSON.stringify(data, null, 2);
                filename = `document_${Date.now()}.json`;
                mimeType = 'application/json';
            } else if (format === 'markdown') {
                content = this.convertToMarkdown(data);
                filename = `document_${Date.now()}.md`;
                mimeType = 'text/markdown';
            } else {
                content = this.convertToPlainText(data);
                filename = `document_${Date.now()}.txt`;
                mimeType = 'text/plain';
            }
            
            // Save to Puter FS
            const result = await this.saveDocument(content, filename, format);
            
            return result;
        } catch (error) {
            console.error('❌ Export error:', error);
            throw error;
        }
    }
    
    /**
     * Import document from file
     */
    async importDocument(file) {
        try {
            const text = await file.text();
            let data;
            
            if (file.name.endsWith('.json')) {
                data = JSON.parse(text);
            } else if (file.name.endsWith('.md')) {
                data = this.convertFromMarkdown(text);
            } else {
                data = this.convertFromPlainText(text);
            }
            
            // Save to FS first
            const saved = await this.saveDocument(data, file.name, 'json');
            
            return { data, saved };
        } catch (error) {
            console.error('❌ Import error:', error);
            throw error;
        }
    }
    
    /**
     * Convert Editor.js data to Markdown
     */
    convertToMarkdown(editorData) {
        if (!editorData || !editorData.blocks) return '';
        
        return editorData.blocks.map(block => {
            switch (block.type) {
                case 'header':
                    return '#'.repeat(block.data.level) + ' ' + block.data.text;
                case 'paragraph':
                    return block.data.text;
                case 'list':
                    const marker = block.data.style === 'ordered' ? '1.' : '-';
                    return block.data.items.map(item => `${marker} ${item}`).join('\n');
                case 'quote':
                    return '> ' + block.data.text;
                case 'code':
                    return '```\n' + block.data.code + '\n```';
                case 'delimiter':
                    return '---';
                default:
                    return '';
            }
        }).filter(Boolean).join('\n\n');
    }
    
    /**
     * Convert Editor.js data to plain text
     */
    convertToPlainText(editorData) {
        if (!editorData || !editorData.blocks) return '';
        
        return editorData.blocks.map(block => {
            switch (block.type) {
                case 'header':
                    return block.data.text;
                case 'paragraph':
                    return block.data.text;
                case 'list':
                    return block.data.items.join('\n');
                case 'quote':
                    return '"' + block.data.text + '"';
                case 'code':
                    return block.data.code;
                default:
                    return '';
            }
        }).filter(Boolean).join('\n\n');
    }
    
    /**
     * Convert Markdown to Editor.js format
     */
    convertFromMarkdown(markdown) {
        const lines = markdown.split('\n');
        const blocks = [];
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            if (line.startsWith('# ')) {
                blocks.push({ type: 'header', data: { text: line.substring(2), level: 1 } });
            } else if (line.startsWith('## ')) {
                blocks.push({ type: 'header', data: { text: line.substring(3), level: 2 } });
            } else if (line.startsWith('### ')) {
                blocks.push({ type: 'header', data: { text: line.substring(4), level: 3 } });
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                blocks.push({ type: 'list', data: { style: 'unordered', items: [line.substring(2)] } });
            } else {
                blocks.push({ type: 'paragraph', data: { text: line } });
            }
        }
        
        return { blocks };
    }
    
    /**
     * Convert plain text to Editor.js format
     */
    convertFromPlainText(text) {
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        const blocks = paragraphs.map(p => ({
            type: 'paragraph',
            data: { text: p.trim() }
        }));
        
        return { blocks };
    }
    
    /**
     * Search files by name
     */
    async searchFiles(query, directory = './') {
        try {
            const items = await this.listDirectory(directory);
            const lowerQuery = query.toLowerCase();
            
            return items.filter(item => 
                item.name.toLowerCase().includes(lowerQuery)
            );
        } catch (error) {
            console.error('❌ Search error:', error);
            return [];
        }
    }
    
    /**
     * Get storage usage statistics
     */
    async getStorageStats() {
        try {
            const documents = await this.listDocuments();
            const attachments = await this.listChatAttachments();
            
            const docSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
            const attSize = attachments.reduce((sum, att) => sum + (att.size || 0), 0);
            
            return {
                documents: {
                    count: documents.length,
                    size: docSize,
                    sizeFormatted: this.formatFileSize(docSize)
                },
                attachments: {
                    count: attachments.length,
                    size: attSize,
                    sizeFormatted: this.formatFileSize(attSize)
                },
                total: {
                    size: docSize + attSize,
                    sizeFormatted: this.formatFileSize(docSize + attSize)
                }
            };
        } catch (error) {
            console.error('❌ Stats error:', error);
            return null;
        }
    }
    
    /**
     * Format file size in human-readable format
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.fileCache.clear();
        console.log('🗑️ Cache cleared');
    }
    
    /**
     * Get cached file info
     */
    getCachedFileInfo(path) {
        return this.fileCache.get(path);
    }
}

// Initialize global instance
window.puterFS = new PuterFSManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuterFSManager;
}
