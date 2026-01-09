/**
 * PatentGuard Display Module
 * Renders Official USPTO/EPO Response Header.
 */

(function () {
    'use strict';

    window.displayPatentResult = function (text, state) {

        const content = `
<div class="patent-result" style="font-family: 'Times New Roman', serif; border: 1px solid #ccc; padding: 2rem; background: white; margin: 1rem 0;">
    <!-- USPTO Header Style -->
    <div style="text-align: center; margin-bottom: 2rem; font-weight: bold; text-transform: uppercase;">
        IN THE UNITED STATES PATENT AND TRADEMARK OFFICE
    </div>
    
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px; margin-bottom: 2rem; font-size: 0.95rem;">
        <div><strong>Application No.:</strong></div><div>${state.appNo}</div>
        <div><strong>Examiner:</strong></div><div>[Examiner Name]</div>
        <div><strong>Art Unit:</strong></div><div>[Art Unit]</div>
        <div><strong>Confirmation No.:</strong></div><div>[XXXX]</div>
    </div>

    <div style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 1.5rem;">
        REMARKS
    </div>

    <!-- Content -->
    <div style="line-height: 2.0; font-size: 1rem; text-align: justify;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <div style="margin-top: 2rem;">
        Respectfully submitted,<br><br>
        ______________________<br>
        [Attorney Name]<br>
        Reg. No. [XXXXX]
    </div>

    <!-- Actions -->
    <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; display: flex; gap: 0.75rem;">
        <button onclick="navigator.clipboard.writeText(this.closest('.patent-result').querySelector('div[style*=\\'white-space\\']').innerText)" style="padding: 0.5rem 1rem; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">
            Copy Text
        </button>
        <button onclick="window.insertPatentToDoc(this)" style="padding: 0.5rem 1rem; background: #1e3a8a; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Save to Docket
        </button>
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    };

    window.insertPatentToDoc = async function (btn) {
        const text = btn.closest('.patent-result').querySelector('div[style*="white-space"]').innerText;
        if (window.editorjs && text) {
            try {
                await window.editorjs.blocks.insert('header', {
                    text: 'REMARKS / ARGUMENTS',
                    level: 2
                });
                const paragraphs = text.split(/\n\n+/);
                for (const p of paragraphs) {
                    await window.editorjs.blocks.insert('paragraph', { text: p });
                }
                showNotification('Added to Office Action Response', 'success');
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

    console.log('✅ PatentGuard Display loaded');
})();
