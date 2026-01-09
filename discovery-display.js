/**
 * LegalMind Display Module
 * Handles UI updates, streaming, and legal review display.
 */

(function () {
    'use strict';

    window.generateDiscoveryResponse = async function () {
        // Collect Data
        const input = document.getElementById('discovery-input')?.value;
        if (!input) {
            showNotification('Please enter the discovery requests.', 'warning');
            return;
        }

        // Show Loading
        const loadingDiv = appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="discovery-loading" style="padding: 1.5rem; border: 1px solid #3730a3; background: #e0e7ff; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #3730a3; font-weight: 500; margin-bottom: 1rem;">
                    <div style="width: 20px; height: 20px; border: 2px solid #312e81; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <span>Analyzing FRCP Objections & Drafting...</span>
                </div>
                <div id="discovery-stream-preview" style="font-family: 'Times New Roman', serif; font-size: 0.95rem; color: #374151; line-height: 1.6;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`
        });

        // Set up Stream Callback
        let streamedText = '';
        window.onDiscoveryStreamUpdate = function (text) {
            streamedText += text;
            const preview = document.getElementById('discovery-stream-preview');
            if (preview) {
                preview.innerText = streamedText;
            }
        };

        try {
            const response = await window.generateDiscoveryResponseWithAI();

            // Remove Loading
            const loader = document.getElementById('discovery-loading');
            if (loader) loader.closest('.message').remove();

            // Store in History/State
            window.discoveryState.currentDraft = response;
            window.discoveryState.history.push({
                timestamp: new Date().toISOString(),
                type: window.discoveryState.type,
                response: response
            });

            // Display Final
            displayDiscoveryResult(response, window.discoveryState.analysis);

        } catch (error) {
            showNotification('Error generating response: ' + error.message, 'error');
            const loader = document.getElementById('discovery-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
        } finally {
            window.onDiscoveryStreamUpdate = null;
        }
    };

    function displayDiscoveryResult(text, analysis) {
        // Generate Objection Summary
        let totalObjections = 0;
        let objectionList = [];
        if (Array.isArray(analysis)) {
            analysis.forEach(item => {
                if (item.objections && item.objections.length > 0) {
                    totalObjections += item.objections.length;
                    objectionList.push(`${item.id}: ${item.objections.join(', ')}`);
                }
            });
        }

        const content = `
<div class="discovery-result" style="font-family: 'Inter', sans-serif; border: 2px solid #3730a3; border-radius: 12px; overflow: hidden; margin: 1rem 0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3730a3 0%, #312e81 100%); color: white; padding: 1rem 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: white;">Discovery Responses</h3>
                <p style="margin: 4px 0 0; font-size: 0.85rem; opacity: 0.8;">Drafted by LegalMind AI</p>
            </div>
            <div style="text-align: right;">
                <div style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 0.8rem; display: inline-block;">
                    ${totalObjections} Potential Objections Found
                </div>
            </div>
        </div>
        
        <!-- Quick Objection View -->
        ${totalObjections > 0 ? `
        <div style="margin-top: 1rem; font-size: 0.85rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; max-height: 100px; overflow-y: auto;">
            <strong>Objection Summary:</strong><br>
            ${objectionList.map(o => `• ${o}`).join('<br>')}
        </div>` : ''}
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 2rem; max-height: 500px; overflow-y: auto; font-family: 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; font-size: 1.05rem;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Actions -->
    <div style="background: #f8fafc; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.copyDiscoveryToClipboard()" style="flex: 1; padding: 0.75rem; background: #3730a3; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            📋 Copy
        </button>
        <button onclick="window.insertDiscoveryToDoc()" style="flex: 1; padding: 0.75rem; background: #6366f1; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            📄 Insert to Brief
        </button>
        <button onclick="window.refineDiscoveryResponse()" style="flex: 1; padding: 0.75rem; background: #f59e0b; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            ✨ Refine
        </button>
    </div>
    
    <!-- Disclaimer -->
    <div style="background: #fef2f2; padding: 0.75rem 1.5rem; border-top: 1px solid #fee2e2; font-size: 0.8rem; color: #991b1b;">
        <strong>⚠️ Attorney Review Required:</strong> These draft responses are for drafting aid only. Licensed counsel must review all objections and responses before meaningful service.
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    }

    // --- Utilities ---

    window.copyDiscoveryToClipboard = function () {
        if (!window.discoveryState.currentDraft) return;
        navigator.clipboard.writeText(window.discoveryState.currentDraft)
            .then(() => showNotification('Copied', 'success'));
    };

    window.insertDiscoveryToDoc = async function () {
        if (!window.discoveryState.currentDraft) return;
        if (window.editorjs) {
            try {
                await window.editorjs.blocks.insert('paragraph', {
                    text: window.discoveryState.currentDraft
                });
                showNotification('Inserted', 'success');
            } catch (e) {
                console.error(e);
            }
        }
    };

    window.refineDiscoveryResponse = async function () {
        // Simple re-run with added instruction
        const instruction = prompt("Refinement (e.g., 'Remove the General Objection', 'Be more aggressive')");
        if (instruction) {
            const context = document.getElementById('discovery-context');
            if (context) {
                context.value += `\n[REFINEMENT: ${instruction}]`;
                await window.generateDiscoveryResponse();
            }
        }
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    console.log('✅ LegalMind Display loaded');
})();
