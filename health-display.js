/**
 * HealthGuard Display Module
 * Handles UI updates, streaming, and document insertion.
 */

(function () {
    'use strict';

    window.generateHealthResponse = async function () {
        // Collect Data
        const input = document.getElementById('health-patient-input')?.value;
        if (!input) {
            showNotification('Please enter the patient\'s message.', 'warning');
            return;
        }

        // Show Loading / Stream Container
        const loadingDiv = appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="health-loading" style="padding: 1.5rem; border: 1px solid #e0f2fe; background: #f0f9ff; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #0369a1; font-weight: 500; margin-bottom: 1rem;">
                    <div style="width: 20px; height: 20px; border: 2px solid #0ea5e9; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    Thinking like a clinician...
                </div>
                <div id="health-stream-preview" style="font-family: 'Georgia', serif; font-size: 0.95rem; color: #334155; line-height: 1.6;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`
        });

        // Set up Stream Callback
        let streamedText = '';
        window.onHealthStreamUpdate = function (text) {
            streamedText += text;
            const preview = document.getElementById('health-stream-preview');
            if (preview) {
                preview.innerText = streamedText; // Safe update
            }
        };

        try {
            const response = await window.generateHealthResponseWithAI();

            // Remove Loading
            const loader = document.getElementById('health-loading');
            if (loader) loader.closest('.message').remove();

            // Store in History/State
            window.healthState.currentDraft = response;
            window.healthState.history.push({
                timestamp: new Date().toISOString(),
                type: window.healthState.type,
                response: response
            });

            // Display Final
            displayHealthResult(response);

        } catch (error) {
            showNotification('Error generating response: ' + error.message, 'error');
            const loader = document.getElementById('health-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
        } finally {
            window.onHealthStreamUpdate = null;
        }
    };

    function displayHealthResult(text) {
        const typeConfig = window.healthState.type ?
            (window.healthState.type.charAt(0).toUpperCase() + window.healthState.type.slice(1)) : 'Response';

        const content = `
<div class="health-result" style="font-family: 'Inter', sans-serif; border: 2px solid #0ea5e9; border-radius: 12px; overflow: hidden; margin: 1rem 0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">🩺</span>
            <div>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">Draft Response</h3>
                <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">${typeConfig} • Review before sending</p>
            </div>
        </div>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 2rem; max-height: 600px; overflow-y: auto; font-family: 'Georgia', serif; line-height: 1.8; color: #1a1a1a;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Actions -->
    <div style="background: #f8fafc; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.copyHealthToClipboard()" style="flex: 1; padding: 0.75rem; background: #0ea5e9; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            📋 Copy
        </button>
        <button onclick="window.insertHealthToDoc()" style="flex: 1; padding: 0.75rem; background: #6366f1; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            📄 Insert to Chart
        </button>
        <button onclick="window.refineHealthResponse()" style="flex: 1; padding: 0.75rem; background: #f59e0b; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            ✨ Refine
        </button>
    </div>
    
    <!-- Disclaimer -->
    <div style="background: #fef2f2; padding: 0.75rem 1.5rem; border-top: 1px solid #fee2e2; font-size: 0.8rem; color: #991b1b;">
        <strong>⚠️ Clinical Safety Warning:</strong> AI drafts may contain errors. Verify all medical details, dosage, and advice against patient's actual chart before sending.
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    }

    // --- Utilities ---

    window.copyHealthToClipboard = function () {
        if (!window.healthState.currentDraft) return;
        navigator.clipboard.writeText(window.healthState.currentDraft)
            .then(() => showNotification('Copied to clipboard', 'success'));
    };

    window.insertHealthToDoc = async function () {
        if (!window.healthState.currentDraft) return;
        if (!window.editorjs) {
            showNotification('Editor not found', 'error');
            return;
        }

        try {
            await window.editorjs.blocks.insert('paragraph', {
                text: window.healthState.currentDraft
            });
            showNotification('Inserted into document', 'success');
        } catch (e) {
            console.error(e);
            showNotification('Failed to insert', 'error');
        }
    };

    window.refineHealthResponse = async function () {
        const instruction = prompt("How should we refine this? (e.g., 'Make it simpler', 'Mention Dr. Smith')");
        if (!instruction || !window.healthState.currentDraft) return;

        showNotification('Refining...', 'info');
        // Simple refinement using existing engine endpoint could be added,
        // For now, we'll re-run with context modified or add a specific refinement function.
        // Quick implementation: adding the instruction to context and regenerating is safest for consistency.

        const currentInput = document.getElementById('health-patient-input');
        const currentContext = document.getElementById('health-clinical-context');

        if (currentContext) {
            currentContext.value += `\n[REFINEMENT: ${instruction}]`;
            await window.generateHealthResponse();
        }
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    console.log('✅ HealthGuard Display loaded');
})();
