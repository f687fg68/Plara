/**
 * ScamBaiter Display Module
 * Handles UI updates, streaming, and "Hacker" dashboard.
 */

(function () {
    'use strict';

    window.generateScamResponse = async function () {
        // Collect Data
        const input = document.getElementById('scam-input')?.value;
        if (!input) {
            showNotification('FEED THE BAIT! (Input required)', 'warning');
            return;
        }

        // Show Loading
        const loadingDiv = appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="scam-loading" style="padding: 1.5rem; border: 1px solid #00ff00; background: #000; border-radius: 4px; font-family: 'Courier New', monospace;">
                <div style="display: flex; align-items: center; gap: 10px; color: #00ff00; font-weight: 700; margin-bottom: 1rem;">
                    <span class="blink">>> ANALYZING SCAM VECTOR...</span>
                </div>
                <div id="scam-stream-preview" style="font-size: 0.9rem; color: #00cc00;"></div>
            </div>
            <style>
                .blink { animation: blinker 1s linear infinite; }
                @keyframes blinker { 50% { opacity: 0; } }
            </style>`
        });

        // Set up Stream Callback
        let streamedText = '';
        window.onScamStreamUpdate = function (text) {
            streamedText += text;
            const preview = document.getElementById('scam-stream-preview');
            if (preview) {
                preview.innerText = streamedText;
            }
        };

        try {
            const response = await window.generateScamResponseWithAI();

            // Remove Loading
            const loader = document.getElementById('scam-loading');
            if (loader) loader.closest('.message').remove();

            // Store in History/State
            window.scamState.currentDraft = response;
            window.scamState.history.push({
                timestamp: new Date().toISOString(),
                type: window.scamState.analysis?.type,
                response: response
            });

            // Display Final
            displayScamResult(response, window.scamState.analysis);

        } catch (error) {
            showNotification('Error generating bait: ' + error.message, 'error');
            const loader = document.getElementById('scam-loading');
            if (loader) loader.innerHTML = `<span style="color:red">ERROR: ${error.message}</span>`;
        } finally {
            window.onScamStreamUpdate = null;
        }
    };

    function displayScamResult(text, analysis) {
        const content = `
<div class="scam-result" style="font-family: 'Courier New', monospace; border: 1px solid #00ff00; background: #000; margin: 1rem 0; box-shadow: 0 0 10px rgba(0,255,0,0.2);">
    <!-- Header -->
    <div style="background: #001100; color: #00ff00; padding: 1rem; border-bottom: 1px solid #00ff00;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1rem; font-weight: 700;">>> COUNTER-SCRIPT GENERATED</h3>
            <div style="background: #00ff00; color: #000; padding: 2px 8px; font-weight: 800; font-size: 0.8rem;">
                DETECTED: ${analysis?.type?.toUpperCase() || 'UNKNOWN'}
            </div>
        </div>
        <p style="margin: 5px 0 0; font-size: 0.8rem; opacity: 0.8;">PROBABILITY: ${analysis?.score || 99}% // TARGET: ${analysis?.requested_info || 'Unknown'}</p>
    </div>

    <!-- Content -->
    <div style="background: #050505; padding: 1.5rem; max-height: 500px; overflow-y: auto; line-height: 1.5; color: #eee;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Actions -->
    <div style="background: #001100; padding: 1rem; border-top: 1px solid #00ff00; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.copyScamToClipboard()" style="flex: 1; padding: 0.75rem; background: #000; color: #00ff00; border: 1px solid #00ff00; font-weight: 600; cursor: pointer; font-family: 'Courier New', monospace;" onmouseover="this.style.background='#003300'" onmouseout="this.style.background='#000'">
            [COPY_TO_CLIPBOARD]
        </button>
        <button onclick="window.insertScamToDoc()" style="flex: 1; padding: 0.75rem; background: #003300; color: #00ff00; border: 1px solid #00ff00; font-weight: 600; cursor: pointer; font-family: 'Courier New', monospace;">
            [SAVE_TO_ARCHIVE]
        </button>
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    }

    // --- Utilities ---

    window.copyScamToClipboard = function () {
        if (!window.scamState.currentDraft) return;
        navigator.clipboard.writeText(window.scamState.currentDraft)
            .then(() => showNotification('COPIED!', 'success'));
    };

    window.insertScamToDoc = async function () {
        if (!window.scamState.currentDraft) return;
        if (window.editorjs) {
            try {
                const logEntry = `SCAMBAIT LOG [${new Date().toLocaleDateString()}]
Target: ${window.scamState.analysis?.type}
Persona: ${window.scamState.persona}
----------------------------------------
${window.scamState.currentDraft}`;

                await window.editorjs.blocks.insert('paragraph', {
                    text: logEntry
                });
                showNotification('Archived to Document', 'success');
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

    console.log('✅ ScamBaiter Display loaded');
})();
