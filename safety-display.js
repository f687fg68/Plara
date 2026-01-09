/**
 * SafeSpace Display Module
 * Handles UI updates, streaming, and safety dashboard.
 */

(function () {
    'use strict';

    window.generateSafetyResponse = async function () {
        // Collect Data
        const input = document.getElementById('safety-input')?.value;
        if (!input) {
            showNotification('Please enter the message.', 'warning');
            return;
        }

        // Show Loading
        const loadingDiv = appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="safety-loading" style="padding: 1.5rem; border: 1px solid #0d9488; background: #f0fdfa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #0d9488; font-weight: 500; margin-bottom: 1rem;">
                    <div style="width: 20px; height: 20px; border: 2px solid #0f766e; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <span>Analyzing Risks & De-Escalating...</span>
                </div>
                <div id="safety-stream-preview" style="font-family: 'Helvetica', sans-serif; font-size: 0.95rem; color: #334155; line-height: 1.6;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`
        });

        // Set up Stream Callback
        let streamedText = '';
        window.onSafetyStreamUpdate = function (text) {
            streamedText += text;
            const preview = document.getElementById('safety-stream-preview');
            if (preview) {
                preview.innerText = streamedText;
            }
        };

        try {
            const response = await window.generateSafetyResponseWithAI();

            // Remove Loading
            const loader = document.getElementById('safety-loading');
            if (loader) loader.closest('.message').remove();

            // Store in History/State
            window.safetyState.currentDraft = response;
            window.safetyState.history.push({
                timestamp: new Date().toISOString(),
                intent: window.safetyState.analysis?.intent,
                response: response
            });

            // Display Final
            displaySafetyResult(response, window.safetyState.analysis);

        } catch (error) {
            showNotification('Error generating response: ' + error.message, 'error');
            const loader = document.getElementById('safety-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
        } finally {
            window.onSafetyStreamUpdate = null;
        }
    };

    function displaySafetyResult(text, analysis) {
        // Threat Color Coding
        const level = analysis?.threat_level?.toLowerCase() || 'low';
        let color = '#059669'; // Green (Low)
        if (level.includes('medium')) color = '#d97706'; // Yellow
        if (level.includes('high') || level.includes('critical')) color = '#dc2626'; // Red

        const content = `
<div class="safety-result" style="font-family: 'Inter', sans-serif; border: 2px solid ${color}; border-radius: 12px; overflow: hidden; margin: 1rem 0;">
    <!-- Header -->
    <div style="background: ${color}; color: white; padding: 1rem 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: white;">Analysis Complete</h3>
                <p style="margin: 4px 0 0; font-size: 0.85rem; opacity: 0.9;">Intent: ${analysis?.intent || 'Unknown'}</p>
            </div>
            <div style="text-align: right;">
                <div style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem; display: inline-block;">
                    ${analysis?.threat_level || 'ANALYZING...'}
                </div>
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div style="margin-top: 1rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; font-size: 0.85rem;">
            <strong>Recommended Action:</strong> ${analysis?.recommendation || 'Block & Ignore'}
        </div>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 2rem; max-height: 500px; overflow-y: auto; font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Actions -->
    <div style="background: #f8fafc; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.copySafetyToClipboard()" style="flex: 1; padding: 0.75rem; background: #0d9488; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            📋 Copy Reply
        </button>
        <button onclick="window.insertSafetyToDoc()" style="flex: 1; padding: 0.75rem; background: #0f766e; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            🗂️ Log Incident
        </button>
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    }

    // --- Utilities ---

    window.copySafetyToClipboard = function () {
        if (!window.safetyState.currentDraft) return;
        navigator.clipboard.writeText(window.safetyState.currentDraft)
            .then(() => showNotification('Copied', 'success'));
    };

    window.insertSafetyToDoc = async function () {
        if (!window.safetyState.currentDraft) return;
        if (window.editorjs) {
            try {
                // Log with timestamp and context
                const logEntry = `INCIDENT LOG [${new Date().toLocaleDateString()}]\nResponse Strategy: ${window.safetyState.strategy}\nDraft:\n${window.safetyState.currentDraft}`;
                await window.editorjs.blocks.insert('paragraph', {
                    text: logEntry
                });
                showNotification('Incident Logged to Document', 'success');
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

    console.log('✅ SafeSpace Display loaded');
})();
