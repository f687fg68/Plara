/**
 * ExportManager - Handles document exportation to PDF
 * Aware of FolderAgent for batch exports
 */
class ExportManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('✅ ExportManager initialized');
    }

    /**
     * Get content from Editor.js
     */
    async getEditorData() {
        if (!window.editorjs) {
            console.error('Editor.js not found');
            return null;
        }
        return await window.editorjs.save();
    }

    /**
     * Export to PDF
     */
    async exportToPdf() {
        try {
            const data = await this.getEditorData();
            if (!data) return;

            // Check for folder batch export
            if (window.folderAgent && window.folderAgent.files.length > 0) {
                const proceed = confirm(`Export current document and all files in "${window.folderAgent.folderName}" to PDF?`);
                if (proceed) {
                    await this.batchExport('pdf');
                    return;
                }
            }

            const element = document.getElementById('a4Page');
            const opt = {
                margin: 0,
                filename: `document_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Deep clone to avoid modifying original UI during export
            const clone = element.cloneNode(true);
            clone.style.transform = 'none'; // Remove zoom scale for export

            // Temporary hide elements like toolbar if they are inside
            const toolbars = clone.querySelectorAll('.pagination-toolbar');
            toolbars.forEach(t => t.remove());

            html2pdf().set(opt).from(clone).save();
            this.showNotification('PDF Export started', 'success');

        } catch (error) {
            console.error('PDF Export Error:', error);
            this.showNotification('Failed to export PDF', 'error');
        }
    }

    /**
     * Batch export logic
     */
    async batchExport(format) {
        if (format !== 'pdf') {
            this.showNotification(`Only PDF batch export is supported.`, 'warning');
            return;
        }

        this.showNotification(`Preparing batch export to PDF...`, 'info');

        // 1. Export current doc
        await this.exportSingleDocToPdf('current_session.pdf');

        // 2. Export folder files (filter for exportable types like txt, md)
        for (const file of window.folderAgent.files) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (['txt', 'md', 'html'].includes(ext)) {
                const text = await file.text();
                await this.exportTextToPdf(text, `${file.name}.pdf`);
            }
        }

        this.showNotification('Batch export complete', 'success');
    }

    /**
     * Helper: Export text string to PDF
     */
    async exportTextToPdf(text, filename) {
        const div = document.createElement('div');
        div.style.padding = '20mm';
        div.style.fontFamily = 'serif';
        div.style.whiteSpace = 'pre-wrap';
        div.innerText = text;
        const opt = {
            margin: 0,
            filename: filename,
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        return html2pdf().set(opt).from(div).save();
    }

    /**
     * Simple document download PDF (no prompt)
     */
    async exportSingleDocToPdf(filename) {
        const element = document.getElementById('a4Page');
        const clone = element.cloneNode(true);
        clone.style.transform = 'none';
        const toolbars = clone.querySelectorAll('.pagination-toolbar');
        toolbars.forEach(t => t.remove());
        return html2pdf().set({ filename }).from(clone).save();
    }

    stripHtml(html) {
        let tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    showNotification(message, type) {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Global instance
window.exportManager = new ExportManager();
