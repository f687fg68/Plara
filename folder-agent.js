/**
 * Plara Folder Upload Agent
 * Handles folder uploads, visualizes them as chips, and provides a file browser modal.
 */

class FolderAgent {
    constructor() {
        this.files = [];
        this.folderName = '';
        this.msgInput = document.getElementById('chatInput');
        this.container = document.getElementById('notionChatContainer');
        this.init();
    }

    init() {
        this.createElements();
        this.attachListeners();
    }

    createElements() {
        // 1. Hidden Directory Input
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.webkitdirectory = true;
        this.fileInput.multiple = true;
        this.fileInput.style.display = 'none';
        this.fileInput.id = 'folderInput';
        document.body.appendChild(this.fileInput);

        // 2. Folder Chip Container (Above Chat Input)
        this.chipContainer = document.createElement('div');
        this.chipContainer.className = 'folder-chip-container';
        this.chipContainer.style.display = 'none'; // Hidden by default

        // Insert chip container inside the chat container, but before the input area
        const inputArea = document.querySelector('.floating-chat-input-area');
        if (inputArea && this.container) {
            this.container.insertBefore(this.chipContainer, inputArea);
        }

        // 3. File Browser Modal
        this.modal = document.createElement('div');
        this.modal.className = 'file-browser-modal';
        this.modal.innerHTML = `
            <div class="file-browser-content">
                <div class="file-browser-header">
                    <h3 class="browser-title"></h3>
                    <button class="browser-close-btn">&times;</button>
                </div>
                <div class="file-grid" id="fileGrid"></div>
            </div>
        `;
        document.body.appendChild(this.modal);

        this.modalTitle = this.modal.querySelector('.browser-title');
        this.fileGrid = this.modal.querySelector('#fileGrid');
        this.closeBtn = this.modal.querySelector('.browser-close-btn');
    }

    attachListeners() {
        // Trigger generic attach -> Check if user holds specific key or just standard click?
        // For now, we'll hook into the existing attach button if possible, 
        // OR we can rely on a specific "Upload Folder" action if we add one.
        // Let's assume the user might drag-drop or we intercept the attach button.
        // Ideally, we add a specific "Upload Folder" logic, or just use the generic input.

        // For this task, let's bind it to the "Project" button (folder icon) since that fits semantically.
        const projectBtn = document.getElementById('projectBtn');
        if (projectBtn) {
            projectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.fileInput.click();
            });
        }

        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Modal Close
        this.closeBtn.addEventListener('click', () => this.toggleModal(false));
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.toggleModal(false);
        });
    }

    handleFiles(fileList) {
        if (!fileList || fileList.length === 0) return;

        this.files = Array.from(fileList);
        // Extract folder name from the first file's webkitRelativePath
        // format: "FolderName/Subfolder/file.txt"
        const firstPath = this.files[0].webkitRelativePath;
        this.folderName = firstPath.split('/')[0] || 'Unknown Folder';

        this.renderChip();
    }

    renderChip() {
        this.chipContainer.innerHTML = `
            <div class="folder-chip">
                <span class="folder-icon">📁</span>
                <span class="folder-name">${this.folderName}</span>
                <span class="file-count">${this.files.length} files</span>
                <button class="chip-close-btn" aria-label="Remove folder">&times;</button>
            </div>
        `;
        this.chipContainer.style.display = 'flex';

        // Chip Interactions
        const chip = this.chipContainer.querySelector('.folder-chip');
        const close = this.chipContainer.querySelector('.chip-close-btn');

        chip.addEventListener('click', (e) => {
            if (e.target !== close) {
                this.toggleModal(true);
            }
        });

        close.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearFolder();
        });
    }

    toggleModal(show) {
        if (show) {
            this.modal.classList.add('active');
            this.renderFileGrid();
            this.modalTitle.textContent = this.folderName;
        } else {
            this.modal.classList.remove('active');
        }
    }

    renderFileGrid() {
        this.fileGrid.innerHTML = '';

        this.files.sort((a, b) => a.name.localeCompare(b.name)).forEach(file => {
            const el = document.createElement('div');
            el.className = 'file-item';

            const type = this.getFileIcon(file.name);

            el.innerHTML = `
                <div class="file-item-icon">${type}</div>
                <div class="file-item-name" title="${file.name}">${file.name}</div>
                <div class="file-item-size">${this.formatSize(file.size)}</div>
            `;
            this.fileGrid.appendChild(el);
        });
    }

    clearFolder() {
        this.files = [];
        this.folderName = '';
        this.chipContainer.style.display = 'none';
        this.fileInput.value = ''; // Reset input
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return '🖼️';
        if (['js', 'html', 'css', 'json', 'py', 'ts', 'jsx'].includes(ext)) return '📜';
        if (['pdf', 'doc', 'docx'].includes(ext)) return '📄';
        if (['mp4', 'mov', 'avi'].includes(ext)) return '🎥';
        if (['mp3', 'wav'].includes(ext)) return '🎵';
        if (['zip', 'rar', 'tar'].includes(ext)) return '📦';
        return '📑';
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.folderAgent = new FolderAgent();
});
