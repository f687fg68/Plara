/**
 * Regulatory Translation Backend
 * Free, Unlimited Translation API using Puter.js + AI Models
 * Integrates Gemini 3.0 Pro and Claude Sonnet 4.5 for context-aware translations
 * 
 * Features:
 * - Multi-language translation (50+ languages)
 * - Dual-AI comparison (Gemini vs Claude)
 * - Streaming translations for long documents
 * - Context-aware legal/regulatory terminology
 * - Batch translation support
 * - Translation history with KV storage
 */

class RegulatoryTranslationBackend {
    constructor() {
        this.state = {
            isTranslating: false,
            currentTranslation: null,
            translationHistory: [],
            supportedLanguages: this.initializeSupportedLanguages(),
            defaultModel: 'gemini-3-pro-preview',
            streamingEnabled: true
        };

        // KV Storage keys
        this.KV_KEYS = {
            translationHistory: 'regulatory_translation_history',
            preferences: 'regulatory_translation_preferences'
        };

        // AI Models optimized for translation
        this.models = {
            'gemini-3-pro-preview': {
                name: 'Gemini 3.0 Pro',
                description: 'Best for complex regulatory documents with technical terminology',
                temperature: 0.3,
                maxTokens: 8000,
                strengths: ['Technical accuracy', 'Context preservation', 'Nuanced translations']
            },
            'claude-sonnet-4': {
                name: 'Claude Sonnet 4.5',
                description: 'Excellent for legal/regulatory tone and formal language',
                temperature: 0.2,
                maxTokens: 8000,
                strengths: ['Legal precision', 'Formal tone', 'Cultural sensitivity']
            },
            'claude-opus-4': {
                name: 'Claude Opus 4',
                description: 'Highest quality for critical regulatory translations',
                temperature: 0.15,
                maxTokens: 12000,
                strengths: ['Maximum accuracy', 'Complex documents', 'Multi-stakeholder context']
            }
        };
    }

    /**
     * Initialize supported languages
     */
    initializeSupportedLanguages() {
        return [
            // European Languages
            { code: 'es', name: 'Spanish', native: 'Español', region: 'Europe/Americas' },
            { code: 'fr', name: 'French', native: 'Français', region: 'Europe/Africa' },
            { code: 'de', name: 'German', native: 'Deutsch', region: 'Europe' },
            { code: 'it', name: 'Italian', native: 'Italiano', region: 'Europe' },
            { code: 'pt', name: 'Portuguese', native: 'Português', region: 'Europe/Americas' },
            { code: 'pt-br', name: 'Portuguese (Brazil)', native: 'Português (Brasil)', region: 'Americas' },
            { code: 'nl', name: 'Dutch', native: 'Nederlands', region: 'Europe' },
            { code: 'pl', name: 'Polish', native: 'Polski', region: 'Europe' },
            { code: 'ru', name: 'Russian', native: 'Русский', region: 'Europe/Asia' },
            { code: 'uk', name: 'Ukrainian', native: 'Українська', region: 'Europe' },
            { code: 'cs', name: 'Czech', native: 'Čeština', region: 'Europe' },
            { code: 'sv', name: 'Swedish', native: 'Svenska', region: 'Europe' },
            { code: 'da', name: 'Danish', native: 'Dansk', region: 'Europe' },
            { code: 'no', name: 'Norwegian', native: 'Norsk', region: 'Europe' },
            { code: 'fi', name: 'Finnish', native: 'Suomi', region: 'Europe' },
            { code: 'el', name: 'Greek', native: 'Ελληνικά', region: 'Europe' },
            { code: 'tr', name: 'Turkish', native: 'Türkçe', region: 'Europe/Asia' },
            
            // Asian Languages
            { code: 'zh', name: 'Chinese (Simplified)', native: '简体中文', region: 'Asia' },
            { code: 'zh-tw', name: 'Chinese (Traditional)', native: '繁體中文', region: 'Asia' },
            { code: 'ja', name: 'Japanese', native: '日本語', region: 'Asia' },
            { code: 'ko', name: 'Korean', native: '한국어', region: 'Asia' },
            { code: 'th', name: 'Thai', native: 'ไทย', region: 'Asia' },
            { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', region: 'Asia' },
            { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', region: 'Asia' },
            { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', region: 'Asia' },
            { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'Asia' },
            { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'Asia' },
            { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'Asia' },
            { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'Asia' },
            
            // Middle Eastern & African Languages
            { code: 'ar', name: 'Arabic', native: 'العربية', region: 'Middle East/Africa' },
            { code: 'he', name: 'Hebrew', native: 'עברית', region: 'Middle East' },
            { code: 'fa', name: 'Persian', native: 'فارسی', region: 'Middle East' },
            { code: 'ur', name: 'Urdu', native: 'اردو', region: 'Asia' },
            { code: 'sw', name: 'Swahili', native: 'Kiswahili', region: 'Africa' },
            
            // Other Languages
            { code: 'ro', name: 'Romanian', native: 'Română', region: 'Europe' },
            { code: 'hu', name: 'Hungarian', native: 'Magyar', region: 'Europe' },
            { code: 'bg', name: 'Bulgarian', native: 'Български', region: 'Europe' },
            { code: 'sr', name: 'Serbian', native: 'Српски', region: 'Europe' },
            { code: 'hr', name: 'Croatian', native: 'Hrvatski', region: 'Europe' },
            { code: 'sk', name: 'Slovak', native: 'Slovenčina', region: 'Europe' },
            { code: 'sl', name: 'Slovenian', native: 'Slovenščina', region: 'Europe' },
            { code: 'lt', name: 'Lithuanian', native: 'Lietuvių', region: 'Europe' },
            { code: 'lv', name: 'Latvian', native: 'Latviešu', region: 'Europe' },
            { code: 'et', name: 'Estonian', native: 'Eesti', region: 'Europe' }
        ];
    }

    /**
     * Initialize the translation backend
     */
    async initialize() {
        try {
            console.log('🌐 Initializing Regulatory Translation Backend...');
            
            // Load saved preferences
            await this.loadPreferences();
            
            // Load translation history
            await this.loadTranslationHistory();
            
            console.log('✅ Translation backend ready');
            console.log(`📚 ${this.state.supportedLanguages.length} languages available`);
            console.log(`🤖 ${Object.keys(this.models).length} AI models configured`);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize translation backend:', error);
            return false;
        }
    }

    /**
     * Load saved preferences from Puter KV
     */
    async loadPreferences() {
        try {
            if (!window.puter || !puter.kv) return;
            
            const saved = await puter.kv.get(this.KV_KEYS.preferences);
            if (saved) {
                const prefs = JSON.parse(saved);
                this.state.defaultModel = prefs.defaultModel || this.state.defaultModel;
                this.state.streamingEnabled = prefs.streamingEnabled !== false;
                console.log('Loaded translation preferences');
            }
        } catch (error) {
            console.warn('Failed to load preferences:', error);
        }
    }

    /**
     * Save preferences to Puter KV
     */
    async savePreferences() {
        try {
            if (!window.puter || !puter.kv) return;
            
            await puter.kv.set(this.KV_KEYS.preferences, JSON.stringify({
                defaultModel: this.state.defaultModel,
                streamingEnabled: this.state.streamingEnabled
            }));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    /**
     * Load translation history from Puter KV
     */
    async loadTranslationHistory() {
        try {
            if (!window.puter || !puter.kv) return;
            
            const saved = await puter.kv.get(this.KV_KEYS.translationHistory);
            if (saved) {
                this.state.translationHistory = JSON.parse(saved);
                console.log(`Loaded ${this.state.translationHistory.length} translation records`);
            }
        } catch (error) {
            console.warn('Failed to load translation history:', error);
        }
    }

    /**
     * Save translation to history
     */
    async saveToHistory(translation) {
        try {
            const record = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                sourceText: translation.sourceText.substring(0, 500), // Store preview
                targetLanguage: translation.targetLanguage,
                model: translation.model,
                wordCount: translation.sourceText.split(/\s+/).length,
                success: translation.success
            };

            this.state.translationHistory.unshift(record);

            // Keep only last 100 translations
            if (this.state.translationHistory.length > 100) {
                this.state.translationHistory = this.state.translationHistory.slice(0, 100);
            }

            if (window.puter && puter.kv) {
                await puter.kv.set(this.KV_KEYS.translationHistory, JSON.stringify(this.state.translationHistory));
            }
        } catch (error) {
            console.error('Failed to save translation history:', error);
        }
    }

    /**
     * Build translation prompt with regulatory context
     */
    buildTranslationPrompt(text, targetLanguage, options = {}) {
        const {
            context = 'regulatory',
            preserveFormatting = true,
            includeGlossary = false,
            tone = 'formal'
        } = options;

        const contextInstructions = {
            regulatory: `This is a REGULATORY DOCUMENT translation. Requirements:
- Maintain legal precision and formal terminology
- Preserve regulatory references and citations exactly
- Use official regulatory language conventions for the target language
- Keep technical terms accurate and consistent
- Maintain formal business tone`,

            legal: `This is a LEGAL DOCUMENT translation. Requirements:
- Use precise legal terminology
- Preserve legal concepts and frameworks
- Maintain formal legal register
- Keep contractual language exact`,

            technical: `This is a TECHNICAL REGULATORY document. Requirements:
- Preserve technical terminology
- Maintain technical accuracy
- Use industry-standard terminology
- Keep measurements and standards exact`,

            correspondence: `This is REGULATORY CORRESPONDENCE. Requirements:
- Maintain professional business tone
- Preserve formal letter structure
- Use appropriate honorifics and titles
- Keep official language conventions`
        };

        const formattingInstructions = preserveFormatting ? `
FORMATTING PRESERVATION:
- Maintain paragraph breaks and structure
- Preserve bullet points and numbering
- Keep section headings and subheadings
- Maintain any special formatting markers` : '';

        const language = this.state.supportedLanguages.find(l => 
            l.code === targetLanguage || l.name.toLowerCase() === targetLanguage.toLowerCase()
        );
        const languageName = language ? language.name : targetLanguage;

        return `You are a professional translator specializing in regulatory and legal documents.

TRANSLATION TASK:
Translate the following text to ${languageName}.

${contextInstructions[context] || contextInstructions.regulatory}

${formattingInstructions}

CRITICAL RULES:
1. Output ONLY the translated text - no explanations, comments, or additional notes
2. Do not add prefixes like "Translation:" or "Here is the translation:"
3. Do not include your own commentary
4. Preserve all dates, numbers, and reference codes exactly
5. If uncertain about a technical term, prefer accuracy over fluency
6. Maintain the same level of formality as the source text
7. Preserve proper names, company names, and titles

TEXT TO TRANSLATE:

${text}

TRANSLATION (${languageName} only):`;
    }

    /**
     * Translate text using specified AI model
     */
    async translateText(text, targetLanguage, options = {}) {
        const {
            model = this.state.defaultModel,
            stream = this.state.streamingEnabled,
            onProgress = null,
            context = 'regulatory'
        } = options;

        if (!text || !text.trim()) {
            throw new Error('No text provided for translation');
        }

        if (!targetLanguage) {
            throw new Error('Target language not specified');
        }

        this.state.isTranslating = true;

        try {
            const modelConfig = this.models[model];
            if (!modelConfig) {
                throw new Error(`Unknown model: ${model}`);
            }

            // Build prompt
            const prompt = this.buildTranslationPrompt(text, targetLanguage, { context, ...options });

            // Show notification
            if (window.showNotification) {
                showNotification(`🌐 Translating with ${modelConfig.name}...`, 'info');
            }

            // Configure AI options
            const aiOptions = {
                model: model,
                stream: stream,
                temperature: modelConfig.temperature,
                max_tokens: modelConfig.maxTokens
            };

            let translatedText = '';

            if (stream) {
                // Streaming translation
                const streamResponse = await puter.ai.chat(prompt, aiOptions);

                for await (const part of streamResponse) {
                    if (part?.text) {
                        translatedText += part.text;
                        
                        // Call progress callback if provided
                        if (onProgress) {
                            onProgress(translatedText);
                        }
                    }
                }
            } else {
                // Non-streaming translation
                const response = await puter.ai.chat(prompt, aiOptions);
                translatedText = typeof response === 'string' ? response : 
                                (response?.message?.content || response?.text || response?.toString() || '');
            }

            // Clean up translation (remove any prefixes or suffixes)
            translatedText = this.cleanTranslation(translatedText);

            // Save to history
            await this.saveToHistory({
                sourceText: text,
                targetLanguage: targetLanguage,
                model: model,
                success: true
            });

            this.state.isTranslating = false;
            this.state.currentTranslation = {
                source: text,
                target: translatedText,
                language: targetLanguage,
                model: model,
                timestamp: new Date().toISOString()
            };

            if (window.showNotification) {
                showNotification('✅ Translation complete!', 'success');
            }

            return translatedText;

        } catch (error) {
            this.state.isTranslating = false;
            console.error('Translation error:', error);
            
            if (window.showNotification) {
                showNotification(`Translation failed: ${error.message}`, 'error');
            }

            throw error;
        }
    }

    /**
     * Clean up translated text (remove AI prefixes/suffixes)
     */
    cleanTranslation(text) {
        // Remove common AI response prefixes
        const prefixes = [
            /^Translation:\s*/i,
            /^Here is the translation:\s*/i,
            /^Translated text:\s*/i,
            /^Translation to [^:]+:\s*/i,
            /^\[Translation\]\s*/i
        ];

        let cleaned = text.trim();
        for (const prefix of prefixes) {
            cleaned = cleaned.replace(prefix, '');
        }

        return cleaned.trim();
    }

    /**
     * Dual-AI translation comparison (Gemini 3.0 Pro vs Claude Sonnet 4.5)
     */
    async translateDualAI(text, targetLanguage, options = {}) {
        if (!text || !text.trim()) {
            throw new Error('No text provided for translation');
        }

        if (!targetLanguage) {
            throw new Error('Target language not specified');
        }

        const { context = 'regulatory' } = options;

        if (window.showNotification) {
            showNotification('🔄 Dual-AI translation (Gemini + Claude)...', 'info');
        }

        const models = [
            { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', emoji: '🧠' },
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4.5', emoji: '📝' }
        ];

        const results = {};

        try {
            // Build prompt
            const prompt = this.buildTranslationPrompt(text, targetLanguage, { context, ...options });

            // Translate with both models in parallel
            const promises = models.map(async (modelInfo) => {
                try {
                    const modelConfig = this.models[modelInfo.id];
                    const aiOptions = {
                        model: modelInfo.id,
                        stream: false, // Non-streaming for parallel execution
                        temperature: modelConfig.temperature,
                        max_tokens: modelConfig.maxTokens
                    };

                    const response = await puter.ai.chat(prompt, aiOptions);
                    const translatedText = typeof response === 'string' ? response :
                                         (response?.message?.content || response?.text || response?.toString() || '');

                    const cleaned = this.cleanTranslation(translatedText);

                    return { 
                        model: modelInfo, 
                        text: cleaned, 
                        success: true 
                    };
                } catch (error) {
                    console.error(`Translation failed with ${modelInfo.name}:`, error);
                    return { 
                        model: modelInfo, 
                        text: '', 
                        success: false, 
                        error: error.message 
                    };
                }
            });

            const responses = await Promise.all(promises);

            // Build comparison document
            const language = this.state.supportedLanguages.find(l => 
                l.code === targetLanguage || l.name.toLowerCase() === targetLanguage.toLowerCase()
            );
            const languageName = language ? language.name : targetLanguage;

            let comparisonDoc = `# Translation Comparison - ${languageName}\n\n`;
            comparisonDoc += `**Original Language:** English\n`;
            comparisonDoc += `**Target Language:** ${languageName}\n`;
            comparisonDoc += `**Generated:** ${new Date().toISOString()}\n\n`;
            comparisonDoc += `---\n\n`;
            comparisonDoc += `## 📄 Original Text\n\n${text}\n\n---\n\n`;

            for (const resp of responses) {
                comparisonDoc += `## ${resp.model.emoji} ${resp.model.name} Translation\n\n`;
                if (resp.success) {
                    comparisonDoc += resp.text + '\n\n';
                    results[resp.model.id] = resp.text;
                } else {
                    comparisonDoc += `*Translation failed: ${resp.error}*\n\n`;
                }
                comparisonDoc += `---\n\n`;
            }

            // Save to history
            await this.saveToHistory({
                sourceText: text,
                targetLanguage: targetLanguage,
                model: 'dual-ai-comparison',
                success: true
            });

            this.state.currentTranslation = {
                source: text,
                comparison: comparisonDoc,
                results: results,
                language: targetLanguage,
                timestamp: new Date().toISOString()
            };

            if (window.showNotification) {
                showNotification('✅ Dual-AI translation comparison complete!', 'success');
            }

            return {
                comparison: comparisonDoc,
                results: results
            };

        } catch (error) {
            console.error('Dual-AI translation error:', error);
            
            if (window.showNotification) {
                showNotification(`Dual-AI translation failed: ${error.message}`, 'error');
            }

            throw error;
        }
    }

    /**
     * Batch translate multiple texts
     */
    async batchTranslate(texts, targetLanguage, options = {}) {
        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error('No texts provided for batch translation');
        }

        const { model = this.state.defaultModel, context = 'regulatory' } = options;

        if (window.showNotification) {
            showNotification(`🌐 Batch translating ${texts.length} items...`, 'info');
        }

        const results = [];

        for (let i = 0; i < texts.length; i++) {
            try {
                const translated = await this.translateText(texts[i], targetLanguage, {
                    model,
                    stream: false,
                    context
                });

                results.push({
                    index: i,
                    original: texts[i],
                    translated: translated,
                    success: true
                });

                // Progress notification
                if (window.showNotification && (i + 1) % 5 === 0) {
                    showNotification(`Translated ${i + 1}/${texts.length}...`, 'info');
                }

            } catch (error) {
                console.error(`Failed to translate text ${i}:`, error);
                results.push({
                    index: i,
                    original: texts[i],
                    translated: '',
                    success: false,
                    error: error.message
                });
            }
        }

        if (window.showNotification) {
            const successful = results.filter(r => r.success).length;
            showNotification(`✅ Batch translation complete: ${successful}/${texts.length} successful`, 'success');
        }

        return results;
    }

    /**
     * Get language by code or name
     */
    getLanguage(identifier) {
        return this.state.supportedLanguages.find(lang => 
            lang.code === identifier || 
            lang.name.toLowerCase() === identifier.toLowerCase() ||
            lang.native.toLowerCase() === identifier.toLowerCase()
        );
    }

    /**
     * Get translation history
     */
    getHistory(limit = 20) {
        return this.state.translationHistory.slice(0, limit);
    }

    /**
     * Clear translation history
     */
    async clearHistory() {
        this.state.translationHistory = [];
        
        try {
            if (window.puter && puter.kv) {
                await puter.kv.del(this.KV_KEYS.translationHistory);
            }
            
            if (window.showNotification) {
                showNotification('Translation history cleared', 'success');
            }
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }

    /**
     * Get supported languages by region
     */
    getLanguagesByRegion(region) {
        return this.state.supportedLanguages.filter(lang => 
            lang.region.toLowerCase().includes(region.toLowerCase())
        );
    }

    /**
     * Set default model
     */
    async setDefaultModel(modelId) {
        if (!this.models[modelId]) {
            throw new Error(`Unknown model: ${modelId}`);
        }

        this.state.defaultModel = modelId;
        await this.savePreferences();

        if (window.showNotification) {
            const model = this.models[modelId];
            showNotification(`Default model set to: ${model.name}`, 'success');
        }
    }

    /**
     * Get model info
     */
    getModelInfo(modelId) {
        return this.models[modelId] || null;
    }

    /**
     * Get all available models
     */
    getAllModels() {
        return Object.entries(this.models).map(([id, config]) => ({
            id,
            ...config
        }));
    }
}

// Export for global access
window.RegulatoryTranslationBackend = RegulatoryTranslationBackend;

// Create global instance
window.regulatoryTranslation = new RegulatoryTranslationBackend();

console.log('🌐 Regulatory Translation Backend loaded');
