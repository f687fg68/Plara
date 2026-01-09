/**
 * AppealGuard Display & Document Integration
 * Handles displaying generated appeals and saving to document/Puter FS
 */

(function () {
    'use strict';

    /**
     * Display the generated appeal letter
     */
    window.displayGeneratedAppeal = function (appealText) {
        const content = buildAppealDisplay(appealText);

        appendNotionMessage({
            role: 'assistant',
            content: content
        });

        // Scroll to bottom to show the result
        scrollToNotionBottom();
    };

    /**
     * Build the appeal display HTML
     */
    function buildAppealDisplay(appealText) {
        return `
<div class="appeal-result" style="font-family: 'Inter', sans-serif; border: 2px solid #10b981; border-radius: 12px; overflow: hidden; margin: 1rem 0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">✅</span>
            <div>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">Appeal Letter Generated</h3>
                <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">Professional and ready for submission</p>
            </div>
        </div>
        <div style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 12px;">
            ${new Date().toLocaleDateString()}
        </div>
    </div>

    <!-- Letter Content -->
    <div style="background: #ffffff; padding: 2rem; max-height: 600px; overflow-y: auto; font-family: 'Crimson Pro', Georgia, serif; line-height: 1.8; color: #1a1a1a;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(appealText)}</div>
    </div>

    <!-- Action Buttons -->
    <div style="background: #f9fafb; padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.copyAppealToClipboard()" style="flex: 1; min-width: 140px; padding: 0.75rem 1rem; background: #1e3a5f; color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#2d5a8e'" onmouseout="this.style.background='#1e3a5f'">
            📋 Copy to Clipboard
        </button>
        
        <button onclick="window.saveAppealToPuter()" style="flex: 1; min-width: 140px; padding: 0.75rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
            💾 Save to Puter Cloud
        </button>
        
        <button onclick="window.insertAppealToDocument()" style="flex: 1; min-width: 140px; padding: 0.75rem 1rem; background: #8b5cf6; color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#7c3aed'" onmouseout="this.style.background='#8b5cf6'">
            📄 Insert to Document
        </button>

        <button onclick="window.refineAppeal()" style="flex: 1; min-width: 140px; padding: 0.75rem 1rem; background: #f59e0b; color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'">
            ✨ Refine Further
        </button>
    </div>

    <!-- Tips -->
    <div style="background: #fffbeb; padding: 1rem 1.5rem; border-top: 1px solid #fcd34d;">
        <p style="margin: 0; font-size: 0.85rem; color: #92400e;">
            <strong>⚠️ Important:</strong> Review the letter carefully and personalize with your actual name, student ID, and any specific details. Attach supporting documentation where referenced.
        </p>
    </div>
</div>`;
    }

    /**
     * Copy appeal to clipboard
     */
    window.copyAppealToClipboard = function () {
        const state = window.appealState || {};
        const text = state.currentDraft || '';

        if (!text) {
            showNotification('No appeal text to copy', 'warning');
            return;
        }

        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification('✅ Appeal letter copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Copy failed:', err);
                showNotification('Failed to copy. Please select and copy manually.', 'error');
            });
    };

    /**
     * Save appeal to Puter Cloud Storage
     */
    window.saveAppealToPuter = async function () {
        const state = window.appealState || {};
        const text = state.currentDraft || '';

        if (!text) {
            showNotification('No appeal text to save', 'warning');
            return;
        }

        try {
            // Check if user is signed in
            if (typeof puter !== 'undefined' && !puter.auth.isSignedIn()) {
                await puter.auth.signIn();
            }

            // Generate filename
            const timestamp = new Date().toISOString().slice(0, 10);
            const appealType = state.type || 'appeal';
            const filename = `Appeal_${appealType}_${timestamp}.txt`;

            // Save to Puter FS
            if (window.puterFS && window.puterFS.isInitialized) {
                // Use PuterFS manager for organized storage
                const savedFile = await window.puterFS.saveAppeal(filename, text, {
                    type: state.type,
                    institution: state.institution,
                    date: new Date().toISOString()
                });
                showNotification(`✅ Saved as ${filename} in your Puter Cloud`, 'success');
            } else {
                // Fallback to direct Puter.js
                await puter.fs.write(filename, text);
                showNotification(`✅ Saved as ${filename} in your Puter Cloud`, 'success');
            }

        } catch (error) {
            console.error('Save error:', error);
            showNotification('Failed to save to Puter Cloud', 'error');
        }
    };

    /**
     * Insert appeal into the document editor
     */
    window.insertAppealToDocument = async function () {
        const state = window.appealState || {};
        const text = state.currentDraft || '';

        if (!text) {
            showNotification('No appeal text to insert', 'warning');
            return;
        }

        if (!window.editorjs) {
            showNotification('Document editor not available', 'error');
            return;
        }

        try {
            showNotification('Inserting appeal into document...', 'info');

            // Parse the appeal text into paragraphs
            const lines = text.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();

                if (!trimmed) {
                    // Empty line - just continue
                    continue;
                }

                // Check if it's a header-like line (all caps, short, or ends with colon)
                if (trimmed.length < 60 && (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':'))) {
                    await window.editorjs.blocks.insert('header', {
                        text: trimmed.replace(/:$/, ''),
                        level: 3
                    });
                } else {
                    // Regular paragraph
                    await window.editorjs.blocks.insert('paragraph', {
                        text: trimmed
                    });
                }
            }

            showNotification('✅ Appeal inserted into document', 'success');

        } catch (error) {
            console.error('Insert error:', error);
            showNotification('Failed to insert into document', 'error');
        }
    };

    /**
     * Refine the appeal with additional instructions
     */
    window.refineAppeal = async function () {
        const refinementPrompt = prompt('What would you like to refine or change in the appeal letter?\n\nExamples:\n- "Make it more formal"\n- "Add more detail about the remedial steps"\n- "Emphasize my clean academic record"\n- "Make it shorter and more concise"');

        if (!refinementPrompt) return;

        const state = window.appealState || {};

        // Show loading
        appendNotionMessage({
            role: 'assistant',
            content: `<div style="text-align: center; padding: 2rem;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 1rem; color: #6b7280; font-weight: 500;">Refining your appeal...</p>
            </div>`
        });

        try {
            // Build refinement messages
            const messages = [
                {
                    role: 'system',
                    content: 'You are an expert at refining and improving academic appeal letters. Make the requested changes while maintaining professional tone and structure.'
                },
                {
                    role: 'user',
                    content: `Here is the current appeal letter:\n\n${state.currentDraft}\n\nPlease refine it according to this instruction: ${refinementPrompt}\n\nOutput the complete refined letter.`
                }
            ];

            let refinedText = '';
            const stream = await puter.ai.chat(messages, {
                model: state.selectedModel || 'claude-sonnet-4',
                stream: true
            });

            for await (const chunk of stream) {
                refinedText += chunk?.text || '';
            }

            // Update state
            state.currentDraft = refinedText;

            // Display the refined version
            displayGeneratedAppeal(refinedText);
            showNotification('✅ Appeal refined successfully', 'success');

        } catch (error) {
            console.error('Refinement error:', error);
            showNotification('Failed to refine appeal', 'error');
        }
    };

    /**
     * Export appeal as Word document (using basic formatting)
     */
    window.exportAppealAsDoc = function () {
        const state = window.appealState || {};
        const text = state.currentDraft || '';

        if (!text) {
            showNotification('No appeal text to export', 'warning');
            return;
        }

        // Create a simple HTML document that Word can open
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 1in;
        }
        p {
            margin-bottom: 12pt;
        }
    </style>
</head>
<body>
    ${text.split('\n\n').map(para => `<p>${escapeHtml(para)}</p>`).join('\n')}
</body>
</html>`;

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Appeal_Letter_${new Date().toISOString().slice(0, 10)}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('✅ Appeal exported as Word document', 'success');
    };

    /**
     * HTML escape utility
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format text with basic markdown-like styling
     */
    function formatAppealText(text) {
        // This is kept simple - just preserve line breaks
        return text.replace(/\n/g, '<br>');
    }

    /**
     * Generate PDF (requires additional library - placeholder for now)
     */
    window.exportAppealAsPDF = function () {
        showNotification('PDF export coming soon. Use "Save to Puter Cloud" for now.', 'info');
        // TODO: Integrate jsPDF or similar library
    };

    console.log('✅ AppealGuard Display module loaded');
})();
