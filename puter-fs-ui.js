/**
 * Puter.js FS UI Components
 * File browser and document manager UI for Plara
 */

class PuterFSUI {
    constructor(fsManager) {
        this.fs = fsManager;
        this.currentView = 'documents'; // 'documents' or 'attachments'
        this.selectedFiles = [];
        
        this.init();
    }
    
    init() {
        this.createFileBrowserButton();
        this.createFileBrowserModal();
        console.log('✅ PuterFS UI initialized');
    }
    
    /**
     * Create file browser button in the toolbar
     */
    createFileBrowserButton() {
        const toolbar = document.querySelector('.editorjs-toolbar-wrapper .editorjs-actions');
        if (!toolbar) return;
        
        const browserBtn = document.createElement('button');
        browserBtn.className = 'btn-signin';
        browserBtn.id = 'ejFileBrowserBtn';
        browserBtn.title = 'Browse saved documents';
        browserBtn.innerHTML = '📁 My Documents';
        browserBtn.style.marginRight = '8px';
        
        browserBtn.addEventListener('click', () => this.openFileBrowser());
        
        // Insert before save button
        const saveBtn = document.getElementById('ejSaveBtn');
        if (saveBtn) {
            toolbar.insertBefore(browserBtn, saveBtn);
        } else {
            toolbar.appendChild(browserBtn);
        }
    }
    
    /**
     * Create file browser modal
     */
    createFileBrowserModal() {
        const modal = document.createElement('div');
        modal.id = 'puterFSBrowserModal';
        modal.className = 'puter-fs-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div class="puter-fs-modal-content" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,248,255,0.95));
                border-radius: 16px;
                padding: 24px;
                width: 90%;
                max-width: 800px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 24px; color: #1e293b;">
                        📁 Cloud Storage
                    </h2>
                    <button id="closeFSBrowser" style="
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: #64748b;
                        line-height: 1;
                        padding: 0;
                        width: 32px;
                        height: 32px;
                    ">×</button>
                </div>
                
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <button class="fs-view-tab active" data-view="documents">📄 Documents</button>
                    <button class="fs-view-tab" data-view="attachments">📎 Attachments</button>
                    <div style="flex: 1;"></div>
                    <button id="fsRefreshBtn" class="fs-action-btn" title="Refresh">🔄</button>
                    <button id="fsStatsBtn" class="fs-action-btn" title="Storage Stats">📊</button>
                </div>
                
                <div id="fsFileList" style="
                    flex: 1;
                    overflow-y: auto;
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 8px;
                    padding: 12px;
                    background: rgba(255,255,255,0.5);
                    min-height: 300px;
                "></div>
                
                <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="fsLoadBtn" class="fs-modal-btn fs-modal-btn-primary" disabled>Load Selected</button>
                    <button id="fsDeleteBtn" class="fs-modal-btn fs-modal-btn-danger" disabled>Delete Selected</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles
        this.addStyles();
        
        // Event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeFileBrowser();
        });
        
        document.getElementById('closeFSBrowser').addEventListener('click', () => this.closeFileBrowser());
        document.getElementById('fsRefreshBtn').addEventListener('click', () => this.refreshFileList());
        document.getElementById('fsStatsBtn').addEventListener('click', () => this.showStorageStats());
        document.getElementById('fsLoadBtn').addEventListener('click', () => this.loadSelectedFile());
        document.getElementById('fsDeleteBtn').addEventListener('click', () => this.deleteSelectedFiles());
        
        // View tabs
        document.querySelectorAll('.fs-view-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
    }
    
    /**
     * Add CSS styles for file browser
     */
    addStyles() {
        if (document.getElementById('puterFSUIStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'puterFSUIStyles';
        style.textContent = `
            .fs-view-tab {
                padding: 8px 16px;
                border: 1px solid rgba(0,0,0,0.1);
                background: rgba(255,255,255,0.6);
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            .fs-view-tab:hover {
                background: rgba(255,255,255,0.9);
            }
            .fs-view-tab.active {
                background: linear-gradient(135deg, #2563eb, #10b981);
                color: white;
                border-color: transparent;
            }
            .fs-action-btn {
                padding: 8px 12px;
                border: 1px solid rgba(0,0,0,0.1);
                background: rgba(255,255,255,0.8);
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s ease;
            }
            .fs-action-btn:hover {
                background: rgba(255,255,255,1);
                transform: scale(1.05);
            }
            .fs-file-item {
                display: flex;
                align-items: center;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 8px;
                background: rgba(255,255,255,0.7);
                border: 1px solid rgba(0,0,0,0.05);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .fs-file-item:hover {
                background: rgba(255,255,255,0.95);
                border-color: rgba(37,99,235,0.3);
                transform: translateX(4px);
            }
            .fs-file-item.selected {
                background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(16,185,129,0.1));
                border-color: rgba(37,99,235,0.4);
            }
            .fs-file-icon {
                font-size: 24px;
                margin-right: 12px;
            }
            .fs-file-info {
                flex: 1;
            }
            .fs-file-name {
                font-weight: 500;
                color: #1e293b;
                margin-bottom: 4px;
            }
            .fs-file-meta {
                font-size: 12px;
                color: #64748b;
            }
            .fs-file-actions {
                display: flex;
                gap: 8px;
            }
            .fs-file-action-btn {
                padding: 6px 10px;
                border: 1px solid rgba(0,0,0,0.1);
                background: rgba(255,255,255,0.9);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            .fs-file-action-btn:hover {
                background: white;
                border-color: rgba(37,99,235,0.3);
            }
            .fs-modal-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            .fs-modal-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .fs-modal-btn-primary {
                background: linear-gradient(135deg, #2563eb, #10b981);
                color: white;
            }
            .fs-modal-btn-primary:not(:disabled):hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(37,99,235,0.3);
            }
            .fs-modal-btn-danger {
                background: #ef4444;
                color: white;
            }
            .fs-modal-btn-danger:not(:disabled):hover {
                background: #dc2626;
                transform: translateY(-2px);
            }
            .fs-empty-state {
                text-align: center;
                padding: 48px 24px;
                color: #64748b;
            }
            .fs-empty-state-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Open file browser modal
     */
    async openFileBrowser() {
        const modal = document.getElementById('puterFSBrowserModal');
        if (!modal) return;
        
        modal.style.display = 'block';
        await this.refreshFileList();
    }
    
    /**
     * Close file browser modal
     */
    closeFileBrowser() {
        const modal = document.getElementById('puterFSBrowserModal');
        if (modal) modal.style.display = 'none';
        this.selectedFiles = [];
    }
    
    /**
     * Switch between documents and attachments view
     */
    switchView(view) {
        this.currentView = view;
        this.selectedFiles = [];
        
        // Update active tab
        document.querySelectorAll('.fs-view-tab').forEach(tab => {
            if (tab.dataset.view === view) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        this.refreshFileList();
    }
    
    /**
     * Refresh file list
     */
    async refreshFileList() {
        const container = document.getElementById('fsFileList');
        if (!container) return;
        
        container.innerHTML = '<div style="text-align: center; padding: 24px;">Loading...</div>';
        
        try {
            let files;
            if (this.currentView === 'documents') {
                files = await this.fs.listDocuments();
            } else {
                files = await this.fs.listChatAttachments();
            }
            
            if (files.length === 0) {
                container.innerHTML = `
                    <div class="fs-empty-state">
                        <div class="fs-empty-state-icon">📭</div>
                        <div style="font-size: 16px; margin-bottom: 8px;">No ${this.currentView} yet</div>
                        <div style="font-size: 14px;">Start creating documents or uploading files</div>
                    </div>
                `;
                return;
            }
            
            // Sort by modified date (newest first)
            files.sort((a, b) => new Date(b.modified || b.created) - new Date(a.modified || a.created));
            
            container.innerHTML = '';
            files.forEach(file => {
                const item = this.createFileItem(file);
                container.appendChild(item);
            });
            
        } catch (error) {
            console.error('Failed to load files:', error);
            container.innerHTML = `
                <div class="fs-empty-state">
                    <div class="fs-empty-state-icon">⚠️</div>
                    <div>Failed to load files</div>
                    <div style="font-size: 12px; margin-top: 8px;">${error.message}</div>
                </div>
            `;
        }
    }
    
    /**
     * Create file item element
     */
    createFileItem(file) {
        const item = document.createElement('div');
        item.className = 'fs-file-item';
        item.dataset.path = file.path;
        
        const icon = this.getFileIcon(file);
        const size = this.fs.formatFileSize(file.size || 0);
        const date = new Date(file.modified || file.created).toLocaleString();
        
        item.innerHTML = `
            <div class="fs-file-icon">${icon}</div>
            <div class="fs-file-info">
                <div class="fs-file-name">${file.name}</div>
                <div class="fs-file-meta">${size} • ${date}</div>
            </div>
            <div class="fs-file-actions">
                <button class="fs-file-action-btn" data-action="load">Load</button>
                <button class="fs-file-action-btn" data-action="download">Download</button>
            </div>
        `;
        
        // Click to select
        item.addEventListener('click', (e) => {
            if (e.target.closest('.fs-file-action-btn')) return;
            this.toggleFileSelection(file.path, item);
        });
        
        // Action buttons
        item.querySelector('[data-action="load"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.loadFile(file);
        });
        
        item.querySelector('[data-action="download"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadFile(file);
        });
        
        return item;
    }
    
    /**
     * Get file icon based on file type
     */
    getFileIcon(file) {
        if (file.name.endsWith('.json')) return '📄';
        if (file.name.endsWith('.md')) return '📝';
        if (file.name.endsWith('.txt')) return '📃';
        if (file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return '🖼️';
        if (file.name.match(/\.(pdf)$/i)) return '📕';
        return '📎';
    }
    
    /**
     * Toggle file selection
     */
    toggleFileSelection(path, element) {
        const index = this.selectedFiles.indexOf(path);
        
        if (index > -1) {
            this.selectedFiles.splice(index, 1);
            element.classList.remove('selected');
        } else {
            this.selectedFiles.push(path);
            element.classList.add('selected');
        }
        
        // Update button states
        const loadBtn = document.getElementById('fsLoadBtn');
        const deleteBtn = document.getElementById('fsDeleteBtn');
        
        if (loadBtn) loadBtn.disabled = this.selectedFiles.length !== 1;
        if (deleteBtn) deleteBtn.disabled = this.selectedFiles.length === 0;
    }
    
    /**
     * Load selected file into editor
     */
    async loadSelectedFile() {
        if (this.selectedFiles.length !== 1) return;
        
        const path = this.selectedFiles[0];
        const filename = path.split('/').pop();
        
        try {
            const content = await this.fs.readFileAsText(path);
            const data = JSON.parse(content);
            
            if (window.editorjs && data.blocks) {
                await window.editorjs.render(data);
                this.closeFileBrowser();
                this.showNotification(`📂 Loaded: ${filename}`, 'success');
            } else {
                this.showNotification('Invalid document format', 'error');
            }
        } catch (error) {
            console.error('Load failed:', error);
            this.showNotification('Failed to load document', 'error');
        }
    }
    
    /**
     * Load a specific file
     */
    async loadFile(file) {
        try {
            const content = await this.fs.readFileAsText(file.path);
            const data = JSON.parse(content);
            
            if (window.editorjs && data.blocks) {
                await window.editorjs.render(data);
                this.closeFileBrowser();
                this.showNotification(`📂 Loaded: ${file.name}`, 'success');
            } else {
                this.showNotification('Invalid document format', 'error');
            }
        } catch (error) {
            console.error('Load failed:', error);
            this.showNotification('Failed to load document', 'error');
        }
    }
    
    /**
     * Download a file
     */
    async downloadFile(file) {
        try {
            const blob = await this.fs.readFile(file.path);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification(`⬇️ Downloaded: ${file.name}`, 'success');
        } catch (error) {
            console.error('Download failed:', error);
            this.showNotification('Failed to download file', 'error');
        }
    }
    
    /**
     * Delete selected files
     */
    async deleteSelectedFiles() {
        if (this.selectedFiles.length === 0) return;
        
        const confirmed = confirm(`Delete ${this.selectedFiles.length} file(s)? This cannot be undone.`);
        if (!confirmed) return;
        
        try {
            await this.fs.delete(this.selectedFiles);
            this.showNotification(`🗑️ Deleted ${this.selectedFiles.length} file(s)`, 'success');
            this.selectedFiles = [];
            await this.refreshFileList();
        } catch (error) {
            console.error('Delete failed:', error);
            this.showNotification('Failed to delete files', 'error');
        }
    }
    
    /**
     * Show storage statistics
     */
    async showStorageStats() {
        try {
            const stats = await this.fs.getStorageStats();
            if (!stats) {
                this.showNotification('Could not retrieve storage stats', 'warning');
                return;
            }
            
            const message = `
📊 Storage Statistics

📄 Documents: ${stats.documents.count} files (${stats.documents.sizeFormatted})
📎 Attachments: ${stats.attachments.count} files (${stats.attachments.sizeFormatted})
💾 Total: ${stats.total.sizeFormatted}
            `.trim();
            
            alert(message);
        } catch (error) {
            console.error('Stats failed:', error);
            this.showNotification('Failed to get storage stats', 'error');
        }
    }
    
    /**
     * Show notification helper
     */
    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize UI when PuterFS is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Wait for PuterFS to initialize
        const checkFS = setInterval(() => {
            if (window.puterFS && window.puterFS.isInitialized) {
                clearInterval(checkFS);
                window.puterFSUI = new PuterFSUI(window.puterFS);
                console.log('✅ PuterFS UI ready');
            }
        }, 500);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkFS), 10000);
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuterFSUI;
}
