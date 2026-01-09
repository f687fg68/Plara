/**
 * GovProposal Display Module
 * Handles UI updates, streaming, and proposal formatting.
 */

(function () {
    'use strict';

    window.generateRfpResponse = async function () {
        // Collect Data
        const input = document.getElementById('rfp-requirement-input')?.value;
        if (!input) {
            showNotification('Please enter the RFP Requirement text.', 'warning');
            return;
        }

        // Show Loading / Stream Container
        const loadingDiv = appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="rfp-loading" style="padding: 1.5rem; border: 1px solid #1e40af; background: #eff6ff; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #1e40af; font-weight: 500; margin-bottom: 1rem;">
                    <div style="width: 20px; height: 20px; border: 2px solid #1d4ed8; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    Analyzing requirements & drafting compliant narrative...
                </div>
                <div id="rfp-stream-preview" style="font-family: 'Times New Roman', serif; font-size: 0.95rem; color: #334155; line-height: 1.6;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`
        });

        // Set up Stream Callback
        let streamedText = '';
        window.onRfpStreamUpdate = function (text) {
            streamedText += text;
            const preview = document.getElementById('rfp-stream-preview');
            if (preview) {
                preview.innerText = streamedText;
            }
        };

        try {
            const response = await window.generateRfpResponseWithAI();

            // Remove Loading
            const loader = document.getElementById('rfp-loading');
            if (loader) loader.closest('.message').remove();

            // Store in History/State
            window.rfpState.currentDraft = response;
            window.rfpState.history.push({
                timestamp: new Date().toISOString(),
                type: window.rfpState.sectionType,
                response: response
            });

            // Display Final
            displayRfpResult(response);

        } catch (error) {
            showNotification('Error generating proposal: ' + error.message, 'error');
            const loader = document.getElementById('rfp-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
        } finally {
            window.onRfpStreamUpdate = null;
        }
    };

    function displayRfpResult(text) {
        const content = `
<div class="rfp-result" style="font-family: 'Inter', sans-serif; border: 2px solid #1e40af; border-radius: 12px; overflow: hidden; margin: 1rem 0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e40af 0%, #172554 100%); color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">🏛️</span>
            <div>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">Proposal Draft</h3>
                <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">Compliant & Review Ready</p>
            </div>
        </div>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 2rem; max-height: 600px; overflow-y: auto; font-family: 'Times New Roman', 'Georgia', serif; line-height: 1.6; color: #1a1a1a; font-size: 1.05rem;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Actions -->
    <div style="background: #f8fafc; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.copyRfpToClipboard()" style="flex: 1; padding: 0.75rem; background: #1e40af; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            📋 Copy
        </button>
        <button onclick="window.insertRfpToDoc()" style="flex: 1; padding: 0.75rem; background: #4338ca; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            📄 Insert to Proposal
        </button>
        <button onclick="window.refineRfpResponse()" style="flex: 1; padding: 0.75rem; background: #f59e0b; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            ✨ Refine
        </button>
    </div>
    
    <!-- Compliance Note -->
    <div style="background: #f0fdf4; padding: 0.75rem 1.5rem; border-top: 1px solid #bbf7d0; font-size: 0.8rem; color: #166534;">
        <strong>✅ Compliance Check:</strong> Verify all "Showstoppers" and mandatory requirements (Shall/Must) against the solicitation before submission.
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    }

    // --- Utilities ---

    window.copyRfpToClipboard = function () {
        if (!window.rfpState.currentDraft) return;
        navigator.clipboard.writeText(window.rfpState.currentDraft)
            .then(() => showNotification('Copied to clipboard', 'success'));
    };

    window.insertRfpToDoc = async function () {
        if (!window.rfpState.currentDraft) return;
        if (!window.editorjs) {
            showNotification('Editor not found', 'error');
            return;
        }

        try {
            await window.editorjs.blocks.insert('paragraph', {
                text: window.rfpState.currentDraft
            });
            showNotification('Inserted into document', 'success');
        } catch (e) {
            console.error(e);
            showNotification('Failed to insert', 'error');
        }
    };

    window.refineRfpResponse = async function () {
        const instruction = prompt("Refinement instruction (e.g., 'Emphasize low risk', 'Cut word count by 10%')");
        if (!instruction || !window.rfpState.currentDraft) return;

        // Quick refinement via re-generation with instruction
        const currentReq = document.getElementById('rfp-requirement-input');
        if (currentReq) {
            const originalVal = currentReq.value;
            currentReq.value += `\n\n[REFINEMENT INSTRUCTION: ${instruction}]`;
            await window.generateRfpResponse();
            currentReq.value = originalVal; // Restore original after trigger
        }
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    console.log('✅ GovProposal Display loaded');
})();
