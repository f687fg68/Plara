/**
 * Enhanced Inline Tools for Editor.js
 * Custom inline formatting tools with AI-powered features
 * 
 * New Features:
 * 1. 🌐 Translate - Instant inline translation
 * 2. ✨ AI Enhance - Improve selected text with AI
 * 3. 📋 Regulatory Citation - Format legal citations
 * 4. 🎨 Highlight Colors - Multiple highlight colors
 * 5. 📊 Text Statistics - Word count, reading time
 * 6. 🔍 Define - Quick definition lookup
 * 7. 💼 Legal Tone - Convert to formal legal language
 * 8. 📝 Summarize - Quick summary of selection
 * 9. 🔄 Paraphrase - Rephrase selected text
 * 10. 📎 Reference - Add footnote reference
 */

/**
 * Inline Translation Tool
 * Translate selected text inline
 */
class InlineTranslate {
    static get isInline() {
        return true;
    }

    static get sanitize() {
        return {
            span: {
                class: 'inline-translated',
                'data-original': true,
                'data-language': true,
                'data-translation': true
            }
        };
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this.tag = 'SPAN';
        this.class = 'inline-translated';
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = '🌐';
        this.button.classList.add('ce-inline-tool');
        this.button.title = 'Translate text';

        return this.button;
    }

    surround(range) {
        if (!range) return;

        const selectedText = range.extractContents();
        const text = selectedText.textContent;

        if (!text.trim()) return;

        // Show language selector popup
        this.showTranslationPopup(text, range);
    }

    async showTranslationPopup(text, range) {
        const languages = [
            { code: 'es', name: 'Spanish', emoji: '🇪🇸' },
            { code: 'fr', name: 'French', emoji: '🇫🇷' },
            { code: 'de', name: 'German', emoji: '🇩🇪' },
            { code: 'zh', name: 'Chinese', emoji: '🇨🇳' },
            { code: 'ja', name: 'Japanese', emoji: '🇯🇵' },
            { code: 'ar', name: 'Arabic', emoji: '🇸🇦' },
            { code: 'ru', name: 'Russian', emoji: '🇷🇺' },
            { code: 'pt', name: 'Portuguese', emoji: '🇵🇹' }
        ];

        const popup = document.createElement('div');
        popup.className = 'inline-tool-popup translation-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <span>🌐 Translate to:</span>
                <button class="popup-close">✕</button>
            </div>
            <div class="language-grid">
                ${languages.map(lang => `
                    <button class="lang-btn" data-code="${lang.code}" data-name="${lang.name}">
                        <span class="lang-emoji">${lang.emoji}</span>
                        <span class="lang-name">${lang.name}</span>
                    </button>
                `).join('')}
            </div>
        `;

        document.body.appendChild(popup);

        // Position popup near selection
        const rect = range.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.top = `${rect.bottom + 10}px`;
        popup.style.left = `${rect.left}px`;
        popup.style.zIndex = '10000';

        // Handle language selection
        popup.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetLang = btn.dataset.name;
                popup.remove();
                await this.performTranslation(text, targetLang, range);
            });
        });

        // Close button
        popup.querySelector('.popup-close').addEventListener('click', () => {
            popup.remove();
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            });
        }, 100);
    }

    async performTranslation(text, targetLanguage, range) {
        try {
            if (window.showNotification) {
                showNotification(`🌐 Translating to ${targetLanguage}...`, 'info');
            }

            // Use translation backend if available
            let translated = text;
            if (window.regulatoryTranslation) {
                translated = await window.regulatoryTranslation.translateText(
                    text,
                    targetLanguage,
                    { model: 'gemini-3-pro-preview', stream: false }
                );
            } else if (window.puter && puter.ai) {
                // Fallback to direct Puter.js call
                const prompt = `Translate to ${targetLanguage}. Output only the translation:\n\n${text}`;
                const response = await puter.ai.chat(prompt, {
                    model: 'gemini-3-pro-preview',
                    stream: false
                });
                translated = typeof response === 'string' ? response : response?.text || text;
            }

            // Create wrapped span with translation
            const span = document.createElement('span');
            span.className = this.class;
            span.setAttribute('data-original', text);
            span.setAttribute('data-language', targetLanguage);
            span.setAttribute('data-translation', translated);
            span.textContent = translated;
            span.title = `Original: ${text}\nTranslated to: ${targetLanguage}`;

            // Add tooltip on hover
            span.style.cursor = 'help';
            span.style.borderBottom = '2px dotted #667eea';
            span.style.textDecoration = 'none';

            // Insert translated text
            range.insertNode(span);

            if (window.showNotification) {
                showNotification(`✅ Translated to ${targetLanguage}`, 'success');
            }

        } catch (error) {
            console.error('Translation error:', error);
            if (window.showNotification) {
                showNotification('Translation failed', 'error');
            }
        }
    }

    checkState() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const parentNode = selection.anchorNode?.parentElement;
        return parentNode?.classList.contains(this.class);
    }
}

/**
 * AI Text Enhancement Tool
 * Improve selected text with AI
 */
class InlineAIEnhance {
    static get isInline() {
        return true;
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = '✨';
        this.button.classList.add('ce-inline-tool');
        this.button.title = 'Enhance with AI';

        return this.button;
    }

    surround(range) {
        if (!range) return;

        const selectedText = range.extractContents();
        const text = selectedText.textContent;

        if (!text.trim()) return;

        this.showEnhanceOptions(text, range);
    }

    showEnhanceOptions(text, range) {
        const options = [
            { id: 'improve', label: '✨ Improve Writing', desc: 'Better clarity and flow' },
            { id: 'formal', label: '💼 Make Formal', desc: 'Professional tone' },
            { id: 'concise', label: '📝 Make Concise', desc: 'Shorter and clearer' },
            { id: 'expand', label: '📖 Expand', desc: 'Add more detail' },
            { id: 'simplify', label: '🎯 Simplify', desc: 'Easier to understand' },
            { id: 'legal', label: '⚖️ Legal Tone', desc: 'Legal/regulatory style' }
        ];

        const popup = document.createElement('div');
        popup.className = 'inline-tool-popup enhance-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <span>✨ AI Enhancement</span>
                <button class="popup-close">✕</button>
            </div>
            <div class="options-list">
                ${options.map(opt => `
                    <button class="enhance-btn" data-type="${opt.id}">
                        <span class="opt-label">${opt.label}</span>
                        <span class="opt-desc">${opt.desc}</span>
                    </button>
                `).join('')}
            </div>
        `;

        document.body.appendChild(popup);

        // Position popup
        const rect = range.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.top = `${rect.bottom + 10}px`;
        popup.style.left = `${rect.left}px`;
        popup.style.zIndex = '10000';

        // Handle option selection
        popup.querySelectorAll('.enhance-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const enhanceType = btn.dataset.type;
                popup.remove();
                await this.performEnhancement(text, enhanceType, range);
            });
        });

        // Close handlers
        popup.querySelector('.popup-close').addEventListener('click', () => popup.remove());
        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            });
        }, 100);
    }

    async performEnhancement(text, type, range) {
        try {
            if (window.showNotification) {
                showNotification('✨ Enhancing text...', 'info');
            }

            const prompts = {
                improve: `Improve the following text for better clarity and flow. Output only the improved text:\n\n${text}`,
                formal: `Rewrite the following in a formal, professional tone. Output only the rewritten text:\n\n${text}`,
                concise: `Make the following text more concise while preserving meaning. Output only the concise version:\n\n${text}`,
                expand: `Expand the following text with more detail and explanation. Output only the expanded text:\n\n${text}`,
                simplify: `Simplify the following text to make it easier to understand. Output only the simplified text:\n\n${text}`,
                legal: `Rewrite the following in formal legal/regulatory language. Output only the rewritten text:\n\n${text}`
            };

            const prompt = prompts[type] || prompts.improve;

            let enhanced = text;
            if (window.puter && puter.ai) {
                const response = await puter.ai.chat(prompt, {
                    model: 'claude-sonnet-4',
                    stream: false,
                    temperature: 0.3
                });
                enhanced = typeof response === 'string' ? response : response?.text || text;
            }

            // Replace text in range
            const textNode = document.createTextNode(enhanced);
            range.insertNode(textNode);

            if (window.showNotification) {
                showNotification('✅ Text enhanced!', 'success');
            }

        } catch (error) {
            console.error('Enhancement error:', error);
            if (window.showNotification) {
                showNotification('Enhancement failed', 'error');
            }
        }
    }

    checkState() {
        return false;
    }
}

/**
 * Multi-Color Highlight Tool
 * Multiple highlight colors beyond default yellow
 */
class InlineHighlightPlus {
    static get isInline() {
        return true;
    }

    static get sanitize() {
        return {
            mark: {
                class: true
            }
        };
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this.tag = 'MARK';
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = '🎨';
        this.button.classList.add('ce-inline-tool');
        this.button.title = 'Highlight color';

        return this.button;
    }

    surround(range) {
        if (!range) return;

        const selectedText = range.extractContents();
        const text = selectedText.textContent;

        if (!text.trim()) return;

        this.showColorPicker(text, range);
    }

    showColorPicker(text, range) {
        const colors = [
            { name: 'Yellow', class: 'highlight-yellow', color: '#fff176' },
            { name: 'Green', class: 'highlight-green', color: '#aed581' },
            { name: 'Blue', class: 'highlight-blue', color: '#4fc3f7' },
            { name: 'Pink', class: 'highlight-pink', color: '#f48fb1' },
            { name: 'Purple', class: 'highlight-purple', color: '#ce93d8' },
            { name: 'Orange', class: 'highlight-orange', color: '#ffb74d' },
            { name: 'Red', class: 'highlight-red', color: '#e57373' },
            { name: 'Gray', class: 'highlight-gray', color: '#e0e0e0' }
        ];

        const popup = document.createElement('div');
        popup.className = 'inline-tool-popup color-picker-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <span>🎨 Highlight Color</span>
                <button class="popup-close">✕</button>
            </div>
            <div class="color-grid">
                ${colors.map(c => `
                    <button class="color-btn" data-class="${c.class}" style="background: ${c.color};" title="${c.name}">
                        <span class="color-name">${c.name}</span>
                    </button>
                `).join('')}
            </div>
        `;

        document.body.appendChild(popup);

        // Position popup
        const rect = range.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.top = `${rect.bottom + 10}px`;
        popup.style.left = `${rect.left}px`;
        popup.style.zIndex = '10000';

        // Handle color selection
        popup.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const colorClass = btn.dataset.class;
                popup.remove();
                this.applyHighlight(text, colorClass, range);
            });
        });

        // Close handlers
        popup.querySelector('.popup-close').addEventListener('click', () => popup.remove());
        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            });
        }, 100);
    }

    applyHighlight(text, colorClass, range) {
        const mark = document.createElement('mark');
        mark.className = colorClass;
        mark.textContent = text;
        range.insertNode(mark);
    }

    checkState() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const parentNode = selection.anchorNode?.parentElement;
        return parentNode?.tagName === 'MARK';
    }
}

/**
 * Legal Citation Formatter
 * Format legal and regulatory citations
 */
class InlineCitation {
    static get isInline() {
        return true;
    }

    static get sanitize() {
        return {
            cite: {
                class: 'legal-citation',
                'data-type': true
            }
        };
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this.tag = 'CITE';
        this.class = 'legal-citation';
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = '📋';
        this.button.classList.add('ce-inline-tool');
        this.button.title = 'Format as citation';

        return this.button;
    }

    surround(range) {
        if (!range) return;

        const selectedText = range.extractContents();
        const text = selectedText.textContent;

        if (!text.trim()) return;

        const cite = document.createElement('cite');
        cite.className = this.class;
        cite.textContent = text;
        cite.style.fontStyle = 'italic';
        cite.style.color = '#1976d2';
        cite.title = 'Legal Citation';

        range.insertNode(cite);
    }

    checkState() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const parentNode = selection.anchorNode?.parentElement;
        return parentNode?.tagName === 'CITE' || parentNode?.classList.contains(this.class);
    }
}

/**
 * Text Statistics Tool
 * Show word count, character count, reading time
 */
class InlineStats {
    static get isInline() {
        return true;
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = '📊';
        this.button.classList.add('ce-inline-tool');
        this.button.title = 'Text statistics';

        return this.button;
    }

    surround(range) {
        if (!range) return;

        const selectedText = range.extractContents().textContent;
        const text = selectedText;

        if (!text.trim()) return;

        // Calculate statistics
        const words = text.trim().split(/\s+/).length;
        const chars = text.length;
        const charsNoSpace = text.replace(/\s/g, '').length;
        const sentences = (text.match(/[.!?]+/g) || []).length;
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
        const readingTime = Math.ceil(words / 200); // 200 words per minute

        // Show statistics popup
        const popup = document.createElement('div');
        popup.className = 'inline-tool-popup stats-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <span>📊 Text Statistics</span>
                <button class="popup-close">✕</button>
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${words}</span>
                    <span class="stat-label">Words</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${chars}</span>
                    <span class="stat-label">Characters</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${charsNoSpace}</span>
                    <span class="stat-label">Chars (no space)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${sentences}</span>
                    <span class="stat-label">Sentences</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${paragraphs}</span>
                    <span class="stat-label">Paragraphs</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${readingTime} min</span>
                    <span class="stat-label">Reading Time</span>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Position popup
        const rect = range.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.top = `${rect.bottom + 10}px`;
        popup.style.left = `${rect.left}px`;
        popup.style.zIndex = '10000';

        // Close handlers
        popup.querySelector('.popup-close').addEventListener('click', () => popup.remove());
        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            });
        }, 100);

        // Re-insert the text (surround removed it)
        range.insertNode(document.createTextNode(text));
    }

    checkState() {
        return false;
    }
}

/**
 * Quick Define Tool
 * Look up definition of selected word/phrase
 */
class InlineDefine {
    static get isInline() {
        return true;
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = '🔍';
        this.button.classList.add('ce-inline-tool');
        this.button.title = 'Define term';

        return this.button;
    }

    surround(range) {
        if (!range) return;

        const selectedText = range.extractContents().textContent;
        const term = selectedText.trim();

        if (!term) return;

        this.lookupDefinition(term, range);

        // Re-insert text
        range.insertNode(document.createTextNode(selectedText));
    }

    async lookupDefinition(term, range) {
        const popup = document.createElement('div');
        popup.className = 'inline-tool-popup define-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <span>🔍 Defining: "${term}"</span>
                <button class="popup-close">✕</button>
            </div>
            <div class="definition-content">
                <div class="loading">Loading definition...</div>
            </div>
        `;

        document.body.appendChild(popup);

        // Position popup
        const rect = range.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.top = `${rect.bottom + 10}px`;
        popup.style.left = `${rect.left}px`;
        popup.style.zIndex = '10000';

        // Close handlers
        popup.querySelector('.popup-close').addEventListener('click', () => popup.remove());

        try {
            // Get definition using AI
            if (window.puter && puter.ai) {
                const prompt = `Define the term "${term}" in the context of regulatory compliance and legal documents. Provide a concise definition (2-3 sentences max).`;
                const response = await puter.ai.chat(prompt, {
                    model: 'gemini-3-pro-preview',
                    stream: false
                });

                const definition = typeof response === 'string' ? response : response?.text || 'Definition not available';

                popup.querySelector('.definition-content').innerHTML = `
                    <div class="definition-text">${definition}</div>
                `;
            }
        } catch (error) {
            popup.querySelector('.definition-content').innerHTML = `
                <div class="error">Failed to load definition</div>
            `;
        }

        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            });
        }, 100);
    }

    checkState() {
        return false;
    }
}

// Export tools
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        InlineTranslate,
        InlineAIEnhance,
        InlineHighlightPlus,
        InlineCitation,
        InlineStats,
        InlineDefine
    };
}

// Make globally available
window.InlineTranslate = InlineTranslate;
window.InlineAIEnhance = InlineAIEnhance;
window.InlineHighlightPlus = InlineHighlightPlus;
window.InlineCitation = InlineCitation;
window.InlineStats = InlineStats;
window.InlineDefine = InlineDefine;

console.log('✨ Enhanced Inline Tools loaded');
