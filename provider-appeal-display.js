/**
 * ProviderGuard Display Module
 * Renders the generated appeal packet.
 */

(function () {
    'use strict';

    window.displayProviderAppealResult = function (text, analysis) {

        const evidenceColor = analysis.strength_of_evidence === 'High' ? 'text-green-600' : (analysis.strength_of_evidence === 'Medium' ? 'text-yellow-600' : 'text-red-600');

        const content = `
<div class="provider-result" style="font-family: 'Times New Roman', serif; border: 1px solid #e5e7eb; border-radius: 2px; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background: white;">
    <!-- Header -->
    <div style="background: #f0fdfa; padding: 1rem 1.5rem; border-bottom: 1px solid #ccfbf1; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f766e;">APPEAL PACKET</h3>
            <p style="margin: 4px 0 0; font-size: 0.8rem; color: #6b7280;">Medical Necessity & Clinical Justification</p>
        </div>
        <div style="text-align: right;">
            <div style="font-size: 0.75rem; font-weight: 600; color: #525252;">EVIDENCE STRENGTH</div>
            <div class="${evidenceColor}" style="font-weight: 700;">${analysis.strength_of_evidence.toUpperCase()}</div>
        </div>
    </div>

    <!-- Content -->
    <div style="padding: 2rem; max-height: 500px; overflow-y: auto; line-height: 1.6; color: #111827; font-size: 1rem;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Footer / Missing Elements Warning -->
    ${analysis.missing_elements && analysis.missing_elements.length > 0 ? `
    <div style="background: #fffbef; padding: 10px 15px; border-top: 1px solid #fef3c7; font-family: 'Segoe UI', sans-serif; font-size: 0.85rem; color: #92400e;">
        <strong>⚠️ Auditor Note:</strong> Consider adding: ${analysis.missing_elements.join(', ')}
    </div>` : ''}

    <!-- Actions -->
    <div style="background: #f9fafb; padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem;">
        <button onclick="navigator.clipboard.writeText(this.closest('.provider-result').querySelector('div[style*=\\'white-space\\']').innerText)" style="flex: 1; padding: 0.75rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Segoe UI', sans-serif;">
            Copy Text
        </button>
        <button onclick="window.insertProviderAppealToDoc(this)" style="flex: 1; padding: 0.75rem; background: #0f766e; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Segoe UI', sans-serif;">
            Add to Patient Record
        </button>
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    };

    window.insertProviderAppealToDoc = async function (btn) {
        const text = btn.closest('.provider-result').querySelector('div[style*="white-space"]').innerText;
        if (window.editorjs && text) {
            try {
                await window.editorjs.blocks.insert('header', {
                    text: 'LETTER OF MEDICAL NECESSITY',
                    level: 2
                });
                const paragraphs = text.split(/\n\n+/);
                for (const p of paragraphs) {
                    await window.editorjs.blocks.insert('paragraph', { text: p });
                }
                showNotification('Filed to EHR Record', 'success');
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

    console.log('✅ ProviderGuard Display loaded');
})();
