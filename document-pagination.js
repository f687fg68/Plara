/**
 * Document Pagination System (Final)
 * Handles multi-page documents with top-bar navigation and removal
 */

class DocumentPagination {
    constructor(options = {}) {
        this.options = {
            maxBlocksPerPage: options.maxBlocksPerPage || 50,
            autoCreatePages: options.autoCreatePages !== false,
            ...options
        };

        this.state = {
            pages: [],
            currentPageIndex: 0,
            totalPages: 0,
            isGenerating: false,
            generationPageIndex: 0
        };

        this.editors = {};
        this.containers = {};

        this.init();
    }

    init() {
        console.log('📄 Initializing Document Pagination System...');

        // Setup toolbar event listeners
        this.setupToolbarListeners();

        // Create first page (if none exist)
        if (this.state.pages.length === 0) {
            this.createPage();
        }

        console.log('✅ Pagination system ready');
    }

    setupToolbarListeners() {
        const addBtn = document.getElementById('addPageBtn');
        const removeBtn = document.getElementById('removePageBtn');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageSelect = document.getElementById('pageSelect');

        if (addBtn) addBtn.onclick = () => this.addNewPage();
        if (removeBtn) removeBtn.onclick = () => this.removeCurrentPage();
        if (prevBtn) prevBtn.onclick = () => this.previousPage();
        if (nextBtn) nextBtn.onclick = () => this.nextPage();
        if (pageSelect) pageSelect.onchange = (e) => this.goToPage(parseInt(e.target.value));
    }

    createPage(data = null) {
        const pageId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const pageNumber = this.state.pages.length + 1;

        const page = {
            id: pageId,
            number: pageNumber,
            created: new Date().toISOString(),
            blocks: [],
            wordCount: 0,
            isEmpty: true
        };

        this.state.pages.push(page);
        this.state.totalPages = this.state.pages.length;

        // Create DOM container for this page
        this.createPageContainer(page);

        // Initialize Editor.js for this page
        this.initializePageEditor(page, data);

        // Update UI
        this.updateUI();

        return page;
    }

    createPageContainer(page) {
        const a4PageContainer = document.getElementById('a4Page');
        if (!a4PageContainer) return;

        // Create page wrapper
        const pageWrapper = document.createElement('div');
        pageWrapper.id = `page-wrapper-${page.id}`;
        pageWrapper.className = 'page-wrapper';
        if (page.number === 1) pageWrapper.classList.add('active');
        pageWrapper.dataset.pageId = page.id;

        // Editor container
        const editorContainer = document.createElement('div');
        editorContainer.id = page.id;
        editorContainer.className = 'page-editor';

        pageWrapper.appendChild(editorContainer);
        a4PageContainer.appendChild(pageWrapper);

        this.containers[page.id] = pageWrapper;
    }

    async initializePageEditor(page, initialData = null) {
        try {
            if (typeof EditorJS === 'undefined') return;

            const editor = new EditorJS({
                holder: page.id,
                autofocus: page.number === 1,
                placeholder: page.number === 1
                    ? "Plara: Type here or press 'Tab' for tools..."
                    : "Content continues from previous page...",

                tools: window.editorTools || {},
                inlineToolbar: ['link', 'marker', 'bold', 'italic', 'inlineTranslate', 'inlineAIEnhance', 'highlightPlus', 'citation', 'stats', 'define'],

                data: initialData || { blocks: [] },

                onChange: async (api) => {
                    await this.handlePageChange(page, api);
                    if (typeof window.debouncedPushSnapshot === 'function') {
                        window.debouncedPushSnapshot();
                    }
                },

                onReady: async () => {
                    if (page.number === 1 && typeof window.docUndoStack !== 'undefined') {
                        try {
                            const data = await editor.save();
                            window.docUndoStack = [data];
                            window.docRedoStack = [];
                        } catch (e) { }
                    }
                    if (page.number === 1) {
                        const holder = document.getElementById(page.id);
                        const input = holder?.querySelector('[contenteditable]');
                        if (input) input.focus();
                    }
                }
            });

            this.editors[page.id] = editor;

        } catch (error) {
            console.error('Failed to initialize page editor:', error);
        }
    }

    async handlePageChange(page, editorAPI) {
        try {
            const data = await editorAPI.saver.save();
            page.blocks = data.blocks;
            page.wordCount = this.calculateWordCount(data.blocks);

            if (this.options.autoCreatePages && !this.state.isGenerating) {
                if (page.blocks.length >= this.options.maxBlocksPerPage) {
                    if (page.number === this.state.totalPages) {
                        this.createPage();
                        showNotification('New page auto-created', 'info');
                    }
                }
            }
        } catch (error) { }
    }

    calculateWordCount(blocks) {
        let count = 0;
        blocks.forEach(b => {
            if (b.data && b.data.text) {
                count += b.data.text.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
            }
        });
        return count;
    }

    updateUI() {
        const currentEl = document.getElementById('currentPageNum');
        const totalEl = document.getElementById('totalPageNum');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const removeBtn = document.getElementById('removePageBtn');
        const pageSelect = document.getElementById('pageSelect');

        if (currentEl) currentEl.textContent = this.state.currentPageIndex + 1;
        if (totalEl) totalEl.textContent = this.state.totalPages;

        if (prevBtn) prevBtn.disabled = this.state.currentPageIndex === 0;
        if (nextBtn) nextBtn.disabled = this.state.currentPageIndex >= this.state.totalPages - 1;
        if (removeBtn) removeBtn.disabled = this.state.totalPages <= 1;

        if (pageSelect) {
            pageSelect.innerHTML = '';
            this.state.pages.forEach((p, i) => {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = `Page ${p.number}`;
                if (i === this.state.currentPageIndex) opt.selected = true;
                pageSelect.appendChild(opt);
            });
        }
    }

    goToPage(index) {
        if (index < 0 || index >= this.state.totalPages) return;

        const currentId = this.state.pages[this.state.currentPageIndex].id;
        if (this.containers[currentId]) this.containers[currentId].classList.remove('active');

        this.state.currentPageIndex = index;
        const newId = this.state.pages[index].id;
        if (this.containers[newId]) this.containers[newId].classList.add('active');

        const editor = this.editors[newId];
        if (editor && editor.focus) setTimeout(() => editor.focus(), 100);

        this.updateUI();
    }

    previousPage() {
        this.goToPage(this.state.currentPageIndex - 1);
    }

    nextPage() {
        this.goToPage(this.state.currentPageIndex + 1);
    }

    addNewPage() {
        const page = this.createPage();
        this.goToPage(this.state.totalPages - 1);
        if (window.showNotification) showNotification(`Added Page ${page.number}`, 'success');
        return page;
    }

    async removeCurrentPage() {
        if (this.state.totalPages <= 1) return;

        const currentIndex = this.state.currentPageIndex;
        const page = this.state.pages[currentIndex];

        if (!confirm(`Delete page ${page.number}? This cannot be undone.`)) return;

        // Clean up DOM and Editor
        if (this.containers[page.id]) this.containers[page.id].remove();
        if (this.editors[page.id]) {
            try { await this.editors[page.id].destroy(); } catch (e) { }
            delete this.editors[page.id];
        }
        delete this.containers[page.id];

        // Update state
        this.state.pages.splice(currentIndex, 1);
        this.state.totalPages = this.state.pages.length;

        // Re-index remaining pages
        this.state.pages.forEach((p, i) => p.number = i + 1);

        // Navigate to appropriate page
        const newIndex = Math.min(currentIndex, this.state.totalPages - 1);
        this.state.currentPageIndex = -1; // Force re-render
        this.goToPage(newIndex);

        if (window.showNotification) showNotification('Page removed', 'success');
    }

    getCurrentEditor() {
        const currentPage = this.state.pages[this.state.currentPageIndex];
        return currentPage ? this.editors[currentPage.id] : null;
    }

    async save() {
        const currentEditor = this.getCurrentEditor();
        return currentEditor ? await currentEditor.save() : { blocks: [] };
    }

    async insertBlocks(blocks) {
        if (!blocks || !blocks.length) return;

        console.log('📄 Pagination: Inserting blocks...');
        this.state.isGenerating = true;

        try {
            for (const block of blocks) {
                // Check current page status
                const currentId = this.state.pages[this.state.currentPageIndex].id;
                const currentEditor = this.editors[currentId];

                let blockCount = 0;
                try {
                    const saved = await currentEditor.save();
                    blockCount = saved.blocks.length;
                    this.state.pages[this.state.currentPageIndex].blocks = saved.blocks;
                } catch (e) { }

                // Overflow check
                if (blockCount >= this.options.maxBlocksPerPage) {
                    console.log('📄 Content overflow, creating new page...');
                    this.addNewPage();
                    await new Promise(r => setTimeout(r, 100));
                }

                // Insert into active page
                const activeId = this.state.pages[this.state.currentPageIndex].id;
                const activeEditor = this.editors[activeId];

                if (activeEditor && activeEditor.blocks) {
                    await activeEditor.blocks.insert(block.type, block.data);
                }
            }
        } catch (error) {
            console.error('Pagination block insert error:', error);
        } finally {
            this.state.isGenerating = false;
        }
    }

    async insertContent(text) {
        if (!text) return;

        console.log('📄 Pagination: Inserting content...');
        this.state.isGenerating = true;

        try {
            // Split into paragraphs to process blocks
            const paragraphs = text.split('\n');

            for (const para of paragraphs) {
                const trimmed = para.trim();
                if (!trimmed) continue;

                const currentId = this.state.pages[this.state.currentPageIndex].id;
                const currentEditor = this.editors[currentId];

                // Get current block count
                let blockCount = 0;
                try {
                    const saved = await currentEditor.save();
                    blockCount = saved.blocks.length;

                    // Update state blocks
                    this.state.pages[this.state.currentPageIndex].blocks = saved.blocks;
                } catch (e) { }

                // Check overflow
                if (blockCount >= this.options.maxBlocksPerPage) {
                    console.log('📄 Content overflow, creating new page...');
                    this.addNewPage();
                    // Brief delay to let editor init
                    await new Promise(r => setTimeout(r, 100));
                }

                // Insert into current (possibly new) editor
                const activeId = this.state.pages[this.state.currentPageIndex].id;
                const activeEditor = this.editors[activeId];

                if (activeEditor && activeEditor.blocks) {
                    // Check if headers
                    if (trimmed.length < 60 && (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':'))) {
                        await activeEditor.blocks.insert('header', {
                            text: trimmed.replace(/:$/, ''),
                            level: 3
                        });
                    } else {
                        await activeEditor.blocks.insert('paragraph', {
                            text: trimmed
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Pagination content insert error:', error);
        } finally {
            this.state.isGenerating = false;
        }
    }
}

// Global accessor
window.initDocumentPagination = function (options) {
    window.docPagination = new DocumentPagination(options);
    return window.docPagination;
};

window.DocumentPagination = DocumentPagination;
