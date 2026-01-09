/**
 * ExecWriter Display Module
 * Handles UI updates, streaming, and "Executive Brief" presentation.
 */

(function () {
    'use strict';

    window.generateExecResponse = async function () {
        // Collect Data
        const context = document.getElementById('exec-context')?.value;
        if (!context) {
            showNotification('Please provide context for the email.', 'warning');
            return;
        }

        // Show Loading
        const loadingDiv = appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="exec-loading" style="padding: 1.5rem; border: 1px solid #111827; background: #f3f4f6; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #111827; font-weight: 500; margin-bottom: 1rem;">
                    <div style="width: 20px; height: 20px; border: 2px solid #000; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <span>Analyzing Voice & Drafting...</span>
                </div>
                <div id="exec-stream-preview" style="font-family: 'Georgia', serif; font-size: 0.95rem; color: #374151; line-height: 1.6;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`
        });

        // Set up Stream Callback
        let streamedText = '';
        window.onExecStreamUpdate = function (text) {
            streamedText += text;
            const preview = document.getElementById('exec-stream-preview');
            if (preview) {
                preview.innerText = streamedText;
            }
        };

        try {
            const response = await window.generateExecResponseWithAI();

            // Remove Loading
            const loader = document.getElementById('exec-loading');
            if (loader) loader.closest('.message').remove();

            // Store in History/State
            window.execState.currentDraft = response;
            window.execState.history.push({
                timestamp: new Date().toISOString(),
                type: window.execState.type,
                response: response
            });

            // Display Final
            displayExecResult(response, window.execState.styleAnalysis);

        } catch (error) {
            showNotification('Error generating draft: ' + error.message, 'error');
            const loader = document.getElementById('exec-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
        } finally {
            window.onExecStreamUpdate = null;
        }
    };

    function displayExecResult(text, styleAnalysis) {
        const content = `
<div class="exec-result" style="font-family: 'Inter', sans-serif; border: 2px solid #111827; border-radius: 12px; overflow: hidden; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: #111827; color: white; padding: 1rem 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="display: flex; gap: 12px; align-items: center;">
                <span style="font-size: 1.5rem;">✒️</span>
                <div>
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: white; letter-spacing: 0.025em;">CONFIDENTIAL DRAFT</h3>
                    <p style="margin: 4px 0 0; font-size: 0.8rem; opacity: 0.7; text-transform: uppercase;">For C-Suite Review Only</p>
                </div>
            </div>
        </div>
        
        <!-- Voice Analysis -->
        ${styleAnalysis ? `
        <div style="margin-top: 1rem; font-size: 0.85rem; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 6px; font-style: italic; color: #d1d5db;">
            ${styleAnalysis}
        </div>` : ''}
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 3rem 2.5rem; max-height: 600px; overflow-y: auto; font-family: 'Georgia', serif; line-height: 1.7; color: #1a1a1a; font-size: 1.05rem;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Actions -->
    <div style="background: #f9fafb; padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.copyExecToClipboard()" style="flex: 1; padding: 0.75rem; background: #ffffff; color: #1f2937; border: 1px solid #d1d5db; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#9ca3af'" onmouseout="this.style.borderColor='#d1d5db'">
            📋 Copy
        </button>
        <button onclick="window.insertExecToDoc()" style="flex: 1; padding: 0.75rem; background: #111827; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
            📄 Insert
        </button>
        <button onclick="window.refineExecResponse()" style="flex: 1; padding: 0.75rem; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; border-radius: 6px; font-weight: 500; cursor: pointer;">
            ✨ Refine
        </button>
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    }

    // --- Utilities ---

    window.copyExecToClipboard = function () {
        if (!window.execState.currentDraft) return;
        navigator.clipboard.writeText(window.execState.currentDraft)
            .then(() => showNotification('Copied', 'success'));
    };

    window.insertExecToDoc = async function () {
        if (!window.execState.currentDraft) return;
        if (window.editorjs) {
            try {
                await window.editorjs.blocks.insert('paragraph', {
                    text: window.execState.currentDraft
                });
                showNotification('Inserted', 'success');
            } catch (e) {
                console.error(e);
            }
        }
    };

    window.refineExecResponse = async function () {
        const instruction = prompt("Refinement instruction (e.g., 'Make it friendlier', 'More formal')");
        if (instruction) {
            const context = document.getElementById('exec-context');
            if (context) {
                context.value += `\n[REFINEMENT: ${instruction}]`;
                await window.generateExecResponse();
            }
        }
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    console.log('✅ ExecWriter Display loaded');
})();
