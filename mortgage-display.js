/**
 * MortgageGuard Display Module
 * Handles UI updates, streaming, and document rendering.
 */

(function () {
    'use strict';

    window.generateMortgageLetter = async function () {
        // Validation handled in AI engine wrapper mostly, but check here too
        const name = document.getElementById('mortgage-name')?.value;
        const details = document.getElementById('mortgage-details')?.value;
        if (!name || !details) {
            showNotification('Applicant Name and Denial Details required.', 'warning');
            return;
        }
        window.mortgageState.applicantName = name;

        // Show Loading
        const loadingDiv = appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="mortgage-loading" style="padding: 1.5rem; border: 1px solid #d1d5db; background: white; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #1e3a8a; font-weight: 600; margin-bottom: 1rem;">
                    <span style="animation: pulse 1.5s infinite;">🏦 Compliance Check Initiated...</span>
                </div>
                <div id="mortgage-stream-preview" style="font-family: 'Times New Roman', serif; font-size: 0.95rem; color: #374151;"></div>
            </div>
            <style>@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }</style>`
        });

        // Set up Stream Callback
        let streamedText = '';
        window.onMortgageStreamUpdate = function (text) {
            streamedText += text;
            const preview = document.getElementById('mortgage-stream-preview');
            if (preview) {
                preview.innerText = streamedText;
            }
        };

        try {
            const response = await window.generateMortgageLetterWithAI();

            // Remove Loading
            const loader = document.getElementById('mortgage-loading');
            if (loader) loader.closest('.message').remove();

            // Store in History/State
            window.mortgageState.currentDraft = response;
            window.mortgageState.history.push({
                timestamp: new Date().toISOString(),
                applicant: name,
                response: response
            });

            // Display Final
            displayMortgageResult(response, window.mortgageState.analysis);

        } catch (error) {
            showNotification('Generation Error: ' + error.message, 'error');
            const loader = document.getElementById('mortgage-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
        } finally {
            window.onMortgageStreamUpdate = null;
        }
    };

    function displayMortgageResult(text, analysis) {
        const content = `
<div class="mortgage-result" style="font-family: 'Times New Roman', serif; border: 1px solid #e5e7eb; border-radius: 2px; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background: white;">
    <!-- Header -->
    <div style="background: #f3f4f6; padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e3a8a;">ADVERSE ACTION NOTICE</h3>
            <p style="margin: 4px 0 0; font-size: 0.8rem; color: #6b7280;">Statement of Denial, Termination, or Change</p>
        </div>
        ${analysis?.is_compliant_explanation ?
                `<span style="background: #ecfdf5; color: #047857; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; border: 1px solid #a7f3d0;">✓ FCRA COMPLIANT</span>` :
                `<span style="background: #fef2f2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; border: 1px solid #fecaca;">⚠ NEEDS REVIEW</span>`
            }
    </div>

    <!-- Content -->
    <div style="padding: 2rem; max-height: 500px; overflow-y: auto; line-height: 1.6; color: #111827; font-size: 1rem;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Actions -->
    <div style="background: #f9fafb; padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem;">
        <button onclick="window.copyMortgageToClipboard()" style="flex: 1; padding: 0.75rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Segoe UI', sans-serif;" onmouseover="this.style.borderColor='#9ca3af'" onmouseout="this.style.borderColor='#d1d5db'">
            Copy Text
        </button>
        <button onclick="window.insertMortgageToDoc()" style="flex: 1; padding: 0.75rem; background: #1e3a8a; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Segoe UI', sans-serif;" onmouseover="this.style.background='#1e40af'" onmouseout="this.style.background='#1e3a8a'">
            Save to Record
        </button>
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    }

    // --- Utilities ---

    window.copyMortgageToClipboard = function () {
        if (!window.mortgageState.currentDraft) return;
        navigator.clipboard.writeText(window.mortgageState.currentDraft)
            .then(() => showNotification('Copied', 'success'));
    };

    window.insertMortgageToDoc = async function () {
        if (!window.mortgageState.currentDraft) return;
        if (window.editorjs) {
            try {
                const header = `NOTICE OF ACTION TAKEN`;
                const meta = `Applicant: ${window.mortgageState.applicantName}\nDate: ${new Date().toLocaleDateString()}`;

                await window.editorjs.blocks.insert('header', {
                    text: header,
                    level: 2
                });
                await window.editorjs.blocks.insert('paragraph', {
                    text: meta
                });
                await window.editorjs.blocks.insert('paragraph', {
                    text: window.mortgageState.currentDraft
                });
                showNotification('Filed to Record', 'success');
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

    console.log('✅ MortgageGuard Display loaded');
})();
