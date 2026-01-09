/**
 * CivilMind Display Module
 * Handles UI updates, streaming, and analysis dashboard.
 */

(function () {
    'use strict';

    window.generateCivilResponse = async function () {
        // Collect Data
        const input = document.getElementById('civil-input')?.value;
        if (!input) {
            showNotification('Please input an argument to analyze.', 'warning');
            return;
        }

        // Show Loading
        const loadingDiv = appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="civil-loading" style="padding: 1.5rem; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #475569; font-weight: 500; margin-bottom: 1rem;">
                    <div style="width: 20px; height: 20px; border: 2px solid #64748b; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <span>Searching for Common Ground...</span>
                </div>
                <div id="civil-stream-preview" style="font-family: 'Georgia', serif; font-size: 0.95rem; color: #334155; line-height: 1.6;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`
        });

        // Set up Stream Callback
        let streamedText = '';
        window.onCivilStreamUpdate = function (text) {
            streamedText += text;
            const preview = document.getElementById('civil-stream-preview');
            if (preview) {
                preview.innerText = streamedText;
            }
        };

        try {
            const response = await window.generateCivilResponseWithAI();

            // Remove Loading
            const loader = document.getElementById('civil-loading');
            if (loader) loader.closest('.message').remove();

            // Store in History/State
            window.civilState.currentDraft = response;
            window.civilState.history.push({
                timestamp: new Date().toISOString(),
                tone: window.civilState.tone,
                response: response
            });

            // Display Final
            displayCivilResult(response, window.civilState.analysis);

        } catch (error) {
            showNotification('Error generating response: ' + error.message, 'error');
            const loader = document.getElementById('civil-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
        } finally {
            window.onCivilStreamUpdate = null;
        }
    };

    function displayCivilResult(text, analysis) {
        const content = `
<div class="civil-result" style="font-family: 'Inter', sans-serif; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background: #f1f5f9; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <h3 style="margin: 0; font-size: 1rem; font-weight: 600; color: #334155;">Analysis</h3>
                <p style="margin: 4px 0 0; font-size: 0.8rem; opacity: 0.8;">Constructiveness: ${analysis?.constructiveness || 'Analyzing...'}</p>
            </div>
            ${analysis?.fallacies?.length > 0 ? `
            <div style="text-align: right;">
                <span style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 4px;">Potential Fallacies</span>
                ${analysis.fallacies.map(f => `<span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; display: inline-block; margin-left: 4px;">${f}</span>`).join('')}
            </div>` : ''}
        </div>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 2rem; max-height: 500px; overflow-y: auto; font-family: 'Georgia', serif; line-height: 1.6; color: #1e293b; font-size: 1.05rem;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Actions -->
    <div style="background: #f8fafc; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.copyCivilToClipboard()" style="flex: 1; padding: 0.75rem; background: #ffffff; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#94a3b8'" onmouseout="this.style.borderColor='#cbd5e1'">
            📋 Copy Text
        </button>
        <button onclick="window.insertCivilToDoc()" style="flex: 1; padding: 0.75rem; background: #475569; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            📄 Insert to Doc
        </button>
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    }

    // --- Utilities ---

    window.copyCivilToClipboard = function () {
        if (!window.civilState.currentDraft) return;
        navigator.clipboard.writeText(window.civilState.currentDraft)
            .then(() => showNotification('Copied', 'success'));
    };

    window.insertCivilToDoc = async function () {
        if (!window.civilState.currentDraft) return;
        if (window.editorjs) {
            try {
                // Determine header based on stance
                let header = `Response from ${window.civilState.userStance} Perspective`;

                await window.editorjs.blocks.insert('header', {
                    text: header,
                    level: 3
                });
                await window.editorjs.blocks.insert('paragraph', {
                    text: window.civilState.currentDraft
                });
                showNotification('Inserted to Document', 'success');
            } catch (e) {
                console.error(e);
            }
        }
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    console.log('✅ CivilMind Display loaded');
})();
