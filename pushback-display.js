/**
 * PushbackPro Display & Document Integration
 * Handles displaying generated responses and saving to document/Puter FS
 */

(function () {
    'use strict';

    /**
     * Generate Pushback Response (Main Entry Point)
     */
    window.generatePushbackResponse = async function () {
        // Capture form data
        const formData = {
            vendorName: document.getElementById('pushback-vendor-name')?.value?.trim() || '',
            companyName: document.getElementById('pushback-company-name')?.value?.trim() || '',
            issueDescription: document.getElementById('pushback-issue-description')?.value?.trim() || '',
            desiredOutcome: document.getElementById('pushback-desired-outcome')?.value?.trim() || '',
            additionalContext: document.getElementById('pushback-additional-context')?.value?.trim() || ''
        };

        // Validation
        if (!formData.vendorName || !formData.companyName || !formData.issueDescription || !formData.desiredOutcome) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }

        // Update state
        window.pushbackState.formData = formData;

        // Show loading state
        // Show loading with real-time streaming support
        const modelNames = {
            'claude-sonnet-4': 'Claude Sonnet 4.5',
            'claude-sonnet-4.5': 'Claude Sonnet 4.5',
            'claude-3.5-sonnet': 'Claude Sonnet 4.5',
            'gemini-3-pro-preview': 'Gemini 3.0 Pro',
            'gemini-3-pro': 'Gemini 3.0 Pro',
            'gpt-4o': 'GPT-4o'
        };
        const modelName = modelNames[window.pushbackState.selectedModel] || 'AI';

        const loadingDiv = appendNotionMessage({
            role: 'assistant',
            content: `<div id="pushback-loading" style="text-align: center; padding: 2rem;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 1rem; color: #6b7280; font-weight: 500;">🤖 Crafting your strategic negotiation response...</p>
                <p style="margin-top: 0.5rem; color: #9ca3af; font-size: 0.9rem;">Using <strong>${modelName}</strong></p>
                <div id="pushback-stream-preview" style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px; text-align: left; font-size: 0.85rem; color: #6b7280; max-height: 200px; overflow-y: auto; display: none;"></div>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>`
        });

        // Set up streaming callback
        let streamedText = '';
        window.onPushbackStreamUpdate = function (text) {
            streamedText += text;
            const previewDiv = document.getElementById('pushback-stream-preview');
            if (previewDiv && streamedText.length > 50) {
                previewDiv.style.display = 'block';
                previewDiv.textContent = streamedText.substring(0, 300) + (streamedText.length > 300 ? '...' : '');
            }
        };

        try {
            const response = await window.generatePushbackWithAI();

            // Clean up streaming callback
            window.onPushbackStreamUpdate = null;

            // Remove loading message
            const loadingDiv = document.getElementById('pushback-loading');
            if (loadingDiv && loadingDiv.closest('.message')) {
                loadingDiv.closest('.message').remove();
            }

            window.pushbackState.currentDraft = response;

            // Add to history
            window.pushbackState.history.push({
                timestamp: new Date().toISOString(),
                type: window.pushbackState.responseType,
                draft: response,
                formData: formData,
                model: window.pushbackState.selectedModel
            });

            // Save to Puter KV if available
            if (window.puterKV && window.puterKV.isInitialized) {
                try {
                    await window.puterKV.set(`pushback_history_${Date.now()}`, JSON.stringify({
                        timestamp: new Date().toISOString(),
                        type: window.pushbackState.responseType,
                        vendor: formData.vendorName,
                        model: window.pushbackState.selectedModel
                    }));
                } catch (kvError) {
                    console.warn('Failed to save to KV:', kvError);
                }
            }

            // Display the generated response
            displayGeneratedPushback(response, formData);

            // Calculate savings if applicable
            if (window.pushbackState.responseType === 'price-increase') {
                const savings = window.calculateNegotiationSavings(formData);
                if (savings) {
                    showSavingsCalculation(savings);
                }
            }

        } catch (error) {
            console.error('Pushback generation error:', error);

            // Clean up streaming callback
            window.onPushbackStreamUpdate = null;

            // Remove loading message
            const loadingDiv = document.getElementById('pushback-loading');
            if (loadingDiv && loadingDiv.closest('.message')) {
                loadingDiv.closest('.message').remove();
            }

            appendNotionMessage({
                role: 'assistant',
                content: `<div style="padding: 1rem; background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 8px; color: #991b1b;">
                    <strong>❌ Error Generating Response</strong><br>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">${error.message || 'An unexpected error occurred. Please try again.'}</p>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #dc2626;">
                        <strong>Troubleshooting:</strong><br>
                        • Check your internet connection<br>
                        • Try a different AI model<br>
                        • Simplify your input<br>
                        • Refresh the page if the issue persists
                    </p>
                </div>`
            });
        }
    };

    /**
     * Display the generated pushback response
     */
    function displayGeneratedPushback(responseText, formData) {
        const content = buildPushbackDisplay(responseText, formData);

        appendNotionMessage({
            role: 'assistant',
            content: content
        });

        // Scroll to bottom to show the result
        scrollToNotionBottom();
    }

    /**
     * Build the pushback display HTML
     */
    function buildPushbackDisplay(responseText, formData) {
        const tips = window.generateNegotiationTips(
            window.pushbackState.responseType,
            window.pushbackState.leveragePoints
        );

        return `
<div class="pushback-result" style="font-family: 'Inter', sans-serif; border: 2px solid #2563eb; border-radius: 12px; overflow: hidden; margin: 1rem 0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">✅</span>
            <div>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">Negotiation Response Generated</h3>
                <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">Professional and ready to send</p>
            </div>
        </div>
        <div style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 12px;">
            ${new Date().toLocaleDateString()}
        </div>
    </div>

    <!-- Response Preview Badge -->
    <div style="background: #eff6ff; padding: 0.75rem 1.5rem; border-bottom: 1px solid #bfdbfe; display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 0.85rem; color: #1e40af; font-weight: 500;">
            📧 ${getResponseTypeName(window.pushbackState.responseType)} • 
            ${getNegotiationToneName(window.pushbackState.negotiationTone)} Tone • 
            To: ${formData.vendorName}
        </span>
    </div>

    <!-- Letter Content -->
    <div style="background: #ffffff; padding: 2rem; max-height: 600px; overflow-y: auto; font-family: 'Georgia', serif; line-height: 1.8; color: #1a1a1a;">
        <div style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(responseText)}</div>
    </div>

    <!-- Action Buttons -->
    <div style="background: #f9fafb; padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.copyPushbackToClipboard()" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
            📋 Copy to Clipboard
        </button>
        
        <button onclick="window.savePushbackToPuter()" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
            💾 Save to Puter
        </button>
        
        <button onclick="window.insertPushbackToDocument()" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; background: #8b5cf6; color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#7c3aed'" onmouseout="this.style.background='#8b5cf6'">
            📄 Insert to Doc
        </button>

        <button onclick="window.refinePushback()" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; background: #f59e0b; color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'">
            ✨ Refine
        </button>

        <button onclick="window.downloadPushback()" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#4b5563'" onmouseout="this.style.background='#6b7280'">
            📥 Download
        </button>
    </div>

    <!-- Negotiation Tips -->
    <div style="background: #fffbeb; padding: 1rem 1.5rem; border-top: 1px solid #fcd34d;">
        <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #92400e; display: flex; align-items: center; gap: 8px;">
            💡 Negotiation Tips for This Response
        </h4>
        <ul style="margin: 0; padding-left: 1.5rem; color: #78350f; font-size: 0.85rem; line-height: 1.6;">
            ${tips.slice(0, 5).map(tip => `<li style="margin-bottom: 0.4rem;">${tip}</li>`).join('')}
        </ul>
    </div>

    <!-- Warning -->
    <div style="background: #fef2f2; padding: 1rem 1.5rem; border-top: 1px solid #fecaca;">
        <p style="margin: 0; font-size: 0.85rem; color: #991b1b;">
            <strong>⚠️ Important:</strong> Review and personalize this response. Replace placeholders with your actual name, title, and company. Have an attorney review if significant financial or legal risk is involved.
        </p>
    </div>
</div>`;
    }

    /**
     * Show savings calculation for price increases
     */
    function showSavingsCalculation(savings) {
        const savingsHtml = `
<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 1.5rem; border-radius: 12px; margin: 1rem 0; font-family: 'Inter', sans-serif;">
    <h4 style="margin: 0 0 1rem 0; font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
        💰 Potential Savings Analysis
    </h4>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px;">
            <div style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.25rem;">Current Annual Cost</div>
            <div style="font-size: 1.5rem; font-weight: 700;">$${savings.currentAnnual.toLocaleString()}</div>
        </div>
        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px;">
            <div style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.25rem;">Proposed Annual Cost</div>
            <div style="font-size: 1.5rem; font-weight: 700;">$${savings.proposedAnnual.toLocaleString()}</div>
        </div>
        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px;">
            <div style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.25rem;">Increase Amount</div>
            <div style="font-size: 1.5rem; font-weight: 700;">$${savings.increaseAmount.toLocaleString()} (${savings.increasePercent}%)</div>
        </div>
        <div style="background: rgba(255,255,255,0.25); padding: 1rem; border-radius: 8px; border: 2px solid rgba(255,255,255,0.5);">
            <div style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.25rem;">Estimated Savings</div>
            <div style="font-size: 1.5rem; font-weight: 700;">$${Number(savings.estimatedSavings).toLocaleString()}</div>
            <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">Based on 50% negotiation success</div>
        </div>
    </div>
</div>`;

        appendNotionMessage({
            role: 'assistant',
            content: savingsHtml
        });
    }

    /**
     * Copy pushback response to clipboard
     */
    window.copyPushbackToClipboard = function () {
        const state = window.pushbackState || {};
        const text = state.currentDraft || '';

        if (!text) {
            showNotification('No response to copy', 'warning');
            return;
        }

        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification('✅ Response copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Copy failed:', err);
                showNotification('Failed to copy. Please select and copy manually.', 'error');
            });
    };

    /**
     * Save pushback response to Puter Cloud Storage
     */
    window.savePushbackToPuter = async function () {
        const state = window.pushbackState || {};
        const text = state.currentDraft || '';

        if (!text) {
            showNotification('⚠️ No response to save', 'warning');
            return;
        }

        try {
            // Check if user is signed in
            if (typeof puter !== 'undefined' && !puter.auth.isSignedIn()) {
                showNotification('🔐 Sign in to save to Puter Cloud...', 'info');
                await puter.auth.signIn();
            }

            // Generate filename with metadata
            const timestamp = new Date().toISOString().slice(0, 10);
            const responseType = state.responseType || 'pushback';
            const vendorName = (state.formData?.vendorName || 'vendor').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
            const modelShort = (state.selectedModel || 'ai').replace(/[^a-z0-9]/gi, '_').substring(0, 15);
            const filename = `PushbackPro_${responseType}_${vendorName}_${timestamp}_${modelShort}.txt`;

            // Create rich content with metadata
            const fileContent = `========================================
PUSHBACKPRO AI NEGOTIATION RESPONSE
========================================

Generated: ${new Date().toLocaleString()}
Response Type: ${getResponseTypeName(state.responseType)}
Negotiation Tone: ${getNegotiationToneName(state.negotiationTone)}
AI Model: ${state.selectedModel}
Vendor: ${state.formData?.vendorName || 'N/A'}
Company: ${state.formData?.companyName || 'N/A'}

========================================
PROFESSIONAL RESPONSE
========================================

${text}

========================================
METADATA
========================================

Issue Description:
${state.formData?.issueDescription || 'N/A'}

Desired Outcome:
${state.formData?.desiredOutcome || 'N/A'}

Leverage Points:
${state.leveragePoints.length > 0 ? state.leveragePoints.join(', ') : 'None specified'}

Additional Context:
${state.formData?.additionalContext || 'None provided'}

========================================
Generated by PushbackPro - AI Vendor & Contract Response Writer
Powered by Puter.js
========================================
`;

            // Use PuterFS manager if available, otherwise direct save
            if (window.puterFS && window.puterFS.isInitialized) {
                const savedFile = await window.puterFS.saveFile(filename, fileContent, 'pushback');
                showNotification(`✅ Saved: ${savedFile.name}`, 'success');
            } else {
                await puter.fs.write(filename, fileContent);
                showNotification(`✅ Saved as ${filename}`, 'success');
            }

        } catch (error) {
            console.error('Save error:', error);
            if (error.message && error.message.includes('sign')) {
                showNotification('⚠️ Please sign in to Puter to save files', 'warning');
            } else {
                showNotification('❌ Failed to save to Puter Cloud', 'error');
            }
        }
    };

    /**
     * Insert pushback response into the document editor
     */
    window.insertPushbackToDocument = async function () {
        const state = window.pushbackState || {};
        const text = state.currentDraft || '';

        if (!text) {
            showNotification('No response to insert', 'warning');
            return;
        }

        if (!window.editorjs) {
            showNotification('Document editor not available', 'error');
            return;
        }

        try {
            showNotification('Inserting response into document...', 'info');

            // Parse the response text into sections
            const lines = text.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();

                if (!trimmed) continue;

                // Check if it's a subject line or header
                if (trimmed.startsWith('Subject:') || trimmed.startsWith('Re:') || trimmed.startsWith('Dear')) {
                    await window.editorjs.blocks.insert('header', {
                        text: trimmed,
                        level: 3
                    });
                } else if (trimmed.length < 80 && !trimmed.includes('.')) {
                    // Short line without period - likely a header
                    await window.editorjs.blocks.insert('header', {
                        text: trimmed,
                        level: 4
                    });
                } else {
                    // Regular paragraph
                    await window.editorjs.blocks.insert('paragraph', {
                        text: trimmed
                    });
                }
            }

            showNotification('✅ Response inserted into document', 'success');

        } catch (error) {
            console.error('Insert error:', error);
            showNotification('Failed to insert into document', 'error');
        }
    };

    /**
     * Refine the pushback response with additional instructions
     */
    window.refinePushback = async function () {
        const refinementPrompt = prompt('💡 How would you like to refine this response?\n\nExamples:\n• "Make it more assertive and direct"\n• "Add specific dollar amounts and percentages"\n• "Make it shorter (under 300 words)"\n• "Emphasize our 5-year partnership"\n• "Add legal implications"\n• "Soften the tone but stay firm"');

        if (!refinementPrompt || !refinementPrompt.trim()) return;

        const state = window.pushbackState || {};

        if (!state.currentDraft) {
            showNotification('⚠️ No response to refine', 'warning');
            return;
        }

        // Map model for refinement
        const modelMap = {
            'claude-sonnet-4': 'claude-sonnet',
            'claude-sonnet-4.5': 'claude-sonnet',
            'claude-3.5-sonnet': 'claude-sonnet',
            'gemini-3-pro-preview': 'gemini-3-pro-preview',
            'gemini-3-pro': 'gemini-3-pro-preview',
            'gpt-4o': 'gpt-4o'
        };
        const puterModel = modelMap[state.selectedModel] || 'claude-sonnet';

        // Show loading
        const loadingMsg = appendNotionMessage({
            role: 'assistant',
            content: `<div style="text-align: center; padding: 2rem;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 1rem; color: #6b7280; font-weight: 500;">✨ Refining your response...</p>
                <p style="margin-top: 0.5rem; color: #9ca3af; font-size: 0.85rem;">"${refinementPrompt.substring(0, 60)}${refinementPrompt.length > 60 ? '...' : ''}"</p>
            </div>`
        });

        try {
            // Build refinement messages
            const messages = [
                {
                    role: 'system',
                    content: 'You are an expert at refining business negotiation responses. Make the requested changes while maintaining professional tone, strategic effectiveness, and proper structure. Preserve the core arguments unless explicitly asked to change them.'
                },
                {
                    role: 'user',
                    content: `Here is the current negotiation response:\n\n${state.currentDraft}\n\nRefinement Request: ${refinementPrompt}\n\nProvide the complete refined response with all improvements applied. Maintain professional formatting.`
                }
            ];

            let refinedText = '';
            const stream = await puter.ai.chat(messages, {
                model: puterModel,
                stream: true,
                temperature: 0.7
            });

            for await (const chunk of stream) {
                refinedText += chunk?.text || '';
            }

            // Remove loading message
            if (loadingMsg) loadingMsg.remove();

            // Update state
            state.currentDraft = refinedText;
            window.pushbackState = state;

            // Add to history
            state.history.push({
                timestamp: new Date().toISOString(),
                type: state.responseType,
                draft: refinedText,
                formData: state.formData,
                model: state.selectedModel,
                refinement: refinementPrompt
            });

            // Display the refined version
            displayGeneratedPushback(refinedText, state.formData);
            showNotification('✅ Response refined successfully!', 'success');

        } catch (error) {
            console.error('Refinement error:', error);
            if (loadingMsg) loadingMsg.remove();
            showNotification('❌ Failed to refine response: ' + (error.message || 'Unknown error'), 'error');
        }
    };

    /**
     * Download pushback response as text file
     */
    window.downloadPushback = function () {
        const state = window.pushbackState || {};
        const text = state.currentDraft || '';

        if (!text) {
            showNotification('No response to download', 'warning');
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 10);
        const responseType = state.responseType || 'pushback';
        const filename = `Pushback_${responseType}_${timestamp}.txt`;

        // Create blob and download
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('✅ Response downloaded', 'success');
    };

    /**
     * Generate comparison with different tones
     */
    window.compareTones = async function () {
        showNotification('Generating responses with all tones...', 'info');

        try {
            const results = await window.generateMultipleTones();

            let comparisonHtml = `
<div style="font-family: 'Inter', sans-serif; padding: 1rem;">
    <h3 style="color: #1e3a5f; margin-bottom: 1rem;">📊 Tone Comparison</h3>
`;

            Object.keys(results).forEach(tone => {
                const toneName = window.getNegotiationToneName(tone);
                comparisonHtml += `
    <div style="margin-bottom: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #f9fafb; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb;">
            <strong style="color: #374151;">${toneName}</strong>
        </div>
        <div style="padding: 1rem; max-height: 200px; overflow-y: auto; font-size: 0.85rem; white-space: pre-wrap;">
            ${escapeHtml(results[tone].substring(0, 500))}...
        </div>
    </div>
`;
            });

            comparisonHtml += `</div>`;

            appendNotionMessage({
                role: 'assistant',
                content: comparisonHtml
            });

        } catch (error) {
            console.error('Comparison error:', error);
            showNotification('Failed to generate tone comparison', 'error');
        }
    };

    /**
     * Utility Functions
     */
    function getResponseTypeName(type) {
        const types = {
            'price-increase': 'Price Increase Pushback',
            'unfair-clause': 'Contract Clause Challenge',
            'sla-violation': 'SLA Violation Response',
            'termination': 'Termination Notice Response',
            'payment-terms': 'Payment Terms Negotiation',
            'scope-creep': 'Scope Creep Response',
            'auto-renewal': 'Auto-Renewal Dispute',
            'liability-cap': 'Liability Cap Negotiation'
        };
        return types[type] || type;
    }

    window.getResponseTypeName = getResponseTypeName;

    function getNegotiationToneName(tone) {
        const tones = {
            'diplomatic': 'Diplomatic & Collaborative',
            'firm': 'Firm & Professional',
            'assertive': 'Assertive & Direct',
            'final-warning': 'Final Warning & Ultimatum'
        };
        return tones[tone] || tone;
    }

    window.getNegotiationToneName = getNegotiationToneName;

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    console.log('✅ PushbackPro Display module loaded');
})();
