/**
 * PriorAuthGuard Display Module
 * Renders P2P Scripts and Appeals
 */

(function () {
    'use strict';

    window.displayPAResult = function (text, type, analysis) {
        const isP2P = type === 'p2p';
        const color = '#be185d';

        const content = `
<div class="pa-result" style="font-family: 'Times New Roman', serif; border: 1px solid #e5e7eb; border-radius: 2px; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background: white;">
    <!-- Header -->
    <div style="background: #fdf2f8; padding: 1rem 1.5rem; border-bottom: 1px solid #fbcfe8; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: ${color};">${isP2P ? 'PEER-TO-PEER SCRIPT' : 'EXPEDITED APPEAL'}</h3>
            <p style="margin: 4px 0 0; font-size: 0.8rem; color: #6b7280;">Pre-Service Denial Response</p>
        </div>
        ${isP2P ? `<div style="font-size: 1.2rem;">📞</div>` : `<div style="font-size: 1.2rem;">📄</div>`}
    </div>

    <!-- Talking Points (if P2P) -->
    ${isP2P && analysis.talking_points ? `
    <div style="background: #fff; padding: 15px; border-bottom: 1px solid #eee; font-family: 'Segoe UI', sans-serif;">
        <strong style="color: #831843; font-size: 0.9rem;">KEY TALKING POINTS:</strong>
        <ul style="margin: 5px 0 0 20px; font-size: 0.9rem; color: #374151;">
            ${analysis.talking_points.map(tp => `<li>${tp}</li>`).join('')}
        </ul>
    </div>` : ''}

    <!-- Content -->
    <div style="padding: 2rem; max-height: 500px; overflow-y: auto; line-height: 1.6; color: #111827; font-size: 1rem;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</div>
    </div>

    <!-- Actions -->
    <div style="background: #f9fafb; padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem;">
        <button onclick="navigator.clipboard.writeText(this.closest('.pa-result').querySelector('div[style*=\\'white-space\\']').innerText)" style="flex: 1; padding: 0.75rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Segoe UI', sans-serif;">
            Copy Script/Letter
        </button>
        <button onclick="window.insertPAToDoc(this)" style="flex: 1; padding: 0.75rem; background: ${color}; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Segoe UI', sans-serif;">
            Save to Auth Record
        </button>
    </div>
</div>`;

        appendNotionMessage({ role: 'assistant', content: content });
        scrollToNotionBottom();
    };

    window.insertPAToDoc = async function (btn) {
        const text = btn.closest('.pa-result').querySelector('div[style*="white-space"]').innerText;
        if (window.editorjs && text) {
            try {
                await window.editorjs.blocks.insert('header', {
                    text: 'PRIOR AUTHORIZATION APPEAL',
                    level: 2
                });
                const paragraphs = text.split(/\n\n+/);
                for (const p of paragraphs) {
                    await window.editorjs.blocks.insert('paragraph', { text: p });
                }
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

    console.log('✅ PriorAuthGuard Display loaded');
})();
