/**
 * ========================================
 * SAFERESPONSE DISPLAY MODULE
 * ========================================
 * Output rendering and UI management for de-escalation responses
 */

(function() {
    'use strict';

    /**
     * Main generation orchestrator
     */
    window.generateSafeResponse = async function() {
        const state = window.safeResponseState || {};
        const message = state.currentMessage;

        if (!message) {
            showNotification('⚠️ No message to analyze', 'error');
            return;
        }

        try {
            // Show loading state
            showGenerationLoading();

            // Step 1: Analyze harassment message
            updateLoadingStep('analysis', 'active');
            const analysis = await window.analyzeHarassmentMessage(message);
            state.analysis = analysis;
            updateLoadingStep('analysis', 'completed');

            // Step 2: Generate de-escalation response
            updateLoadingStep('response', 'active');
            const response = await window.generateDeescalationResponse({
                message: message,
                analysis: analysis,
                style: state.responseStyle || 'professional',
                platform: state.platform || 'general',
                selectedModel: state.selectedModel || 'claude-sonnet-4.5'
            });
            state.generatedResponse = response;
            updateLoadingStep('response', 'completed');

            // Step 3: Generate reporting guidance
            updateLoadingStep('guidance', 'active');
            const reportingGuidance = window.generateReportingGuidance(analysis, state.platform);
            updateLoadingStep('guidance', 'completed');

            // Hide loading and display results
            hideGenerationLoading();
            displaySafeResponseResults(analysis, response, reportingGuidance);

            // Save to history
            saveToHistory(message, analysis, response);

        } catch (error) {
            console.error('❌ SafeResponse generation failed:', error);
            hideGenerationLoading();
            showErrorMessage(error);
        }
    };

    /**
     * Show generation loading screen
     */
    function showGenerationLoading() {
        const loadingHTML = `
<div id="saferesponse-loading" style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; text-align: center;">
    <div style="width: 60px; height: 60px; margin: 0 auto 24px auto; border: 4px solid #334155; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <h3 style="margin: 0 0 8px 0; color: white; font-size: 20px;">Analyzing Message & Generating Response</h3>
    <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px;">Using ${window.safeResponseState?.selectedModel || 'Claude Sonnet 4.5'}</p>
    
    <div id="saferesponse-steps" style="max-width: 450px; margin: 0 auto; text-align: left;">
        <div id="step-analysis" class="loading-step" style="display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 8px; background: #0f172a; border-radius: 8px; opacity: 0.5;">
            <span class="step-icon" style="width: 32px; height: 32px; background: #334155; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">1</span>
            <span style="flex: 1; color: #e2e8f0; font-size: 14px;">Analyzing toxicity & risk level</span>
            <span class="step-status" style="font-size: 20px; display: none;">⏳</span>
        </div>
        <div id="step-response" class="loading-step" style="display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 8px; background: #0f172a; border-radius: 8px; opacity: 0.5;">
            <span class="step-icon" style="width: 32px; height: 32px; background: #334155; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">2</span>
            <span style="flex: 1; color: #e2e8f0; font-size: 14px;">Generating de-escalation response</span>
            <span class="step-status" style="font-size: 20px; display: none;">⏳</span>
        </div>
        <div id="step-guidance" class="loading-step" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #0f172a; border-radius: 8px; opacity: 0.5;">
            <span class="step-icon" style="width: 32px; height: 32px; background: #334155; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">3</span>
            <span style="flex: 1; color: #e2e8f0; font-size: 14px;">Preparing reporting guidance</span>
            <span class="step-status" style="font-size: 20px; display: none;">⏳</span>
        </div>
    </div>

    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</div>`;

        if (window.appendNotionMessage) {
            window.appendNotionMessage({
                role: 'assistant',
                content: loadingHTML
            });
        }
    }

    /**
     * Update loading step status
     */
    function updateLoadingStep(stepName, status) {
        const stepEl = document.getElementById(`step-${stepName}`);
        if (!stepEl) return;

        const icon = stepEl.querySelector('.step-icon');
        const statusEl = stepEl.querySelector('.step-status');

        if (status === 'active') {
            stepEl.style.opacity = '1';
            stepEl.style.background = 'linear-gradient(135deg, #6366f120, #8b5cf610)';
            stepEl.style.border = '1px solid #6366f1';
            icon.style.background = '#6366f1';
            icon.style.color = 'white';
            statusEl.style.display = 'block';
            statusEl.textContent = '⏳';
        } else if (status === 'completed') {
            icon.textContent = '✓';
            icon.style.background = '#10b981';
            statusEl.textContent = '✅';
        }
    }

    /**
     * Hide loading screen
     */
    function hideGenerationLoading() {
        const loadingEl = document.getElementById('saferesponse-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Display complete results
     */
    function displaySafeResponseResults(analysis, response, reportingGuidance) {
        const resultsHTML = buildResultsHTML(analysis, response, reportingGuidance);
        
        if (window.appendNotionMessage) {
            window.appendNotionMessage({
                role: 'assistant',
                content: resultsHTML
            });
        }

        // Attach action button listeners
        setTimeout(() => {
            attachResultsEventListeners(response);
        }, 100);
    }

    /**
     * Build results HTML
     */
    function buildResultsHTML(analysis, response, reportingGuidance) {
        const message = window.safeResponseState?.currentMessage || '';
        
        // Determine risk color
        const riskColors = {
            critical: '#dc2626',
            high: '#ea580c',
            medium: '#ca8a04',
            low: '#16a34a'
        };
        const riskColor = riskColors[analysis.riskLevel] || '#64748b';

        // Build harassment types display
        const harassmentTypesHTML = analysis.harassmentTypes.map(type => {
            const typeIcons = {
                sexual: '🚫',
                racial: '⚠️',
                threats: '☠️',
                identity: '🎯',
                personal: '💔',
                cyberbullying: '😢',
                general: '📢'
            };
            return `<span style="display: inline-block; padding: 4px 10px; background: rgba(239,68,68,0.15); border-radius: 6px; font-size: 12px; color: #fca5a5; margin-right: 6px; margin-bottom: 6px;">${typeIcons[type] || '📢'} ${type}</span>`;
        }).join('');

        return `
<div style="max-width: 1000px; margin: 0 auto;">
    <!-- Analysis Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div>
                <h2 style="margin: 0 0 8px 0; color: white; font-size: 24px; font-weight: 700;">📊 Harassment Analysis</h2>
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">AI-powered toxicity detection and risk assessment</p>
            </div>
            <div style="text-align: right;">
                <div style="display: inline-block; padding: 10px 18px; background: ${riskColor}20; border: 2px solid ${riskColor}; border-radius: 10px; font-weight: 700; color: ${riskColor}; font-size: 14px; text-transform: uppercase;">
                    ${analysis.riskLevel === 'critical' ? '🚨' : analysis.riskLevel === 'high' ? '⚠️' : analysis.riskLevel === 'medium' ? '🟡' : '🟢'} ${analysis.riskLevel} RISK
                </div>
                <div style="margin-top: 8px; font-size: 32px; font-weight: 800; color: ${riskColor};">
                    ${(analysis.toxicityScore * 100).toFixed(0)}%
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">TOXICITY</div>
            </div>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px; border-left: 3px solid ${riskColor};">
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">HARASSMENT TYPES DETECTED:</div>
            ${harassmentTypesHTML}
        </div>
    </div>

    <!-- Analysis Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px; text-align: center;">
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Toxicity Level</div>
            <div style="font-size: 28px; font-weight: 800; color: ${riskColor}; margin-bottom: 4px;">
                ${analysis.toxicityLevel.toUpperCase()}
            </div>
            <div style="font-size: 12px; color: #64748b;">${(analysis.toxicityScore * 100).toFixed(1)}% toxic</div>
        </div>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px; text-align: center;">
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Contains Threats</div>
            <div style="font-size: 28px; font-weight: 800; color: ${analysis.containsThreat ? '#dc2626' : '#10b981'}; margin-bottom: 4px;">
                ${analysis.containsThreat ? '⚠️ YES' : '✓ NO'}
            </div>
            <div style="font-size: 12px; color: #64748b;">${analysis.containsThreat ? 'Direct threats detected' : 'No direct threats'}</div>
        </div>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px; text-align: center;">
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Recommended Action</div>
            <div style="font-size: 18px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px;">
                ${getRecommendedActionText(analysis.recommendedAction)}
            </div>
        </div>
    </div>

    ${analysis.riskLevel === 'critical' || analysis.containsThreat ? `
    <div style="background: linear-gradient(135deg, #7f1d1d20, #991b1b10); border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 48px;">🚨</div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 8px 0; color: #fca5a5; font-size: 18px; font-weight: 700;">
                    CRITICAL: Report Immediately
                </h3>
                <div style="color: #fecaca; font-size: 14px; line-height: 1.6;">
                    This message contains serious threats or severely abusive content. <strong>Report to platform authorities and law enforcement immediately.</strong> Do not respond. Document everything with screenshots.
                </div>
            </div>
        </div>
    </div>
    ` : ''}

    <!-- Generated Response -->
    <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <div style="padding: 20px; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; background: #0f172a;">
            <h3 style="margin: 0; color: #60a5fa; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                <span>✨</span>
                <span>AI-Generated De-escalation Response</span>
            </h3>
            <div style="display: flex; gap: 8px;">
                <button id="saferesponse-copy-btn" style="padding: 8px 16px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                    📋 Copy
                </button>
                <button id="saferesponse-download-btn" style="padding: 8px 16px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                    💾 Download
                </button>
                <button id="saferesponse-regenerate-btn" style="padding: 8px 16px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                    🔄 Regenerate
                </button>
            </div>
        </div>
        <div id="saferesponse-response-text" style="padding: 24px; background: #0f172a; color: #e2e8f0; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
${response.main}
        </div>
        <div style="padding: 16px 24px; background: #1e293b; border-top: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #94a3b8;">
            <div>
                <span>💬 ${response.characterCount} characters</span>
                <span style="margin: 0 12px;">•</span>
                <span>🎨 ${response.style}</span>
                <span style="margin: 0 12px;">•</span>
                <span>🤖 ${response.model}</span>
            </div>
        </div>
    </div>

    <!-- Alternative Responses -->
    ${response.alternatives && response.alternatives.length > 0 ? `
    <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 16px;">🔄 Alternative Approaches</h3>
        ${response.alternatives.map((alt, i) => `
            <div style="padding: 14px; background: #0f172a; border-radius: 8px; margin-bottom: ${i < response.alternatives.length - 1 ? '10px' : '0'}; border-left: 3px solid #6366f1;">
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; font-weight: 600;">Style: ${alt.style}</div>
                <div style="color: #e2e8f0; font-size: 14px; line-height: 1.6;">${alt.text}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <!-- Reporting Guidance -->
    ${reportingGuidance.shouldReport ? `
    <div style="background: ${reportingGuidance.urgency === 'immediate' ? 'linear-gradient(135deg, #7f1d1d, #991b1b)' : 'linear-gradient(135deg, #1e293b, #0f172a)'}; border: 1px solid ${reportingGuidance.urgency === 'immediate' ? '#dc2626' : '#334155'}; border-radius: 12px; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <span style="font-size: 36px;">${reportingGuidance.urgency === 'immediate' ? '🚨' : '📢'}</span>
            <div>
                <h3 style="margin: 0 0 4px 0; color: white; font-size: 20px; font-weight: 700;">How to Report This</h3>
                <p style="margin: 0; color: ${reportingGuidance.urgency === 'immediate' ? '#fecaca' : '#94a3b8'}; font-size: 14px;">
                    ${reportingGuidance.urgency === 'immediate' ? 'URGENT: Take immediate action' : 'Recommended reporting steps'}
                </p>
            </div>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 18px; border-radius: 8px; margin-bottom: 16px;">
            <h4 style="margin: 0 0 12px 0; color: white; font-size: 15px;">Platform Reporting Steps:</h4>
            <ol style="margin: 0; padding-left: 20px; color: #e2e8f0; line-height: 1.8;">
                ${reportingGuidance.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>

        ${reportingGuidance.resources.length > 0 ? `
        <div>
            <h4 style="margin: 0 0 12px 0; color: white; font-size: 15px;">Support Resources:</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
                ${reportingGuidance.resources.map(resource => `
                    <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px;">
                        <div style="font-weight: 600; color: white; margin-bottom: 4px; font-size: 14px;">${resource.name}</div>
                        <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 8px;">${resource.description}</div>
                        ${resource.phone ? `<div style="font-size: 13px; color: #60a5fa; font-weight: 600;">📞 ${resource.phone}</div>` : ''}
                        <a href="${resource.url}" target="_blank" style="color: #60a5fa; text-decoration: none; font-size: 12px; font-weight: 500;">Visit Website ↗</a>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 14px; margin-top: 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">💚</span>
            <div style="color: #6ee7b7; font-size: 13px; line-height: 1.6;">
                <strong>Remember:</strong> You deserve respect. Setting boundaries is healthy. You can choose not to respond at all and simply block/report. Your safety and well-being come first.
            </div>
        </div>
    </div>
</div>
        `;
    }

    /**
     * Get recommended action text
     */
    function getRecommendedActionText(action) {
        const actions = {
            'report_immediately': '🚨 Report NOW',
            'report_and_block': '🚫 Report & Block',
            'respond_or_ignore': '💬 Respond or Ignore',
            'respond': '💬 Safe to Respond'
        };
        return actions[action] || action;
    }

    /**
     * Attach event listeners to results
     */
    function attachResultsEventListeners(response) {
        // Copy button
        const copyBtn = document.getElementById('saferesponse-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const responseText = document.getElementById('saferesponse-response-text')?.textContent;
                if (responseText) {
                    navigator.clipboard.writeText(responseText.trim());
                    showNotification('✅ Response copied to clipboard!', 'success');
                    copyBtn.textContent = '✅ Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy';
                    }, 2000);
                }
            });
        }

        // Download button
        const downloadBtn = document.getElementById('saferesponse-download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => downloadResponse());
        }

        // Regenerate button
        const regenBtn = document.getElementById('saferesponse-regenerate-btn');
        if (regenBtn) {
            regenBtn.addEventListener('click', () => {
                window.generateSafeResponse();
            });
        }
    }

    /**
     * Download response as text file
     */
    function downloadResponse() {
        const state = window.safeResponseState;
        const response = state?.generatedResponse;
        const analysis = state?.analysis;

        if (!response) return;

        const filename = `SafeResponse_${Date.now()}.txt`;
        const content = buildDownloadContent(state);

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('✅ Response downloaded!', 'success');
    }

    /**
     * Build download content
     */
    function buildDownloadContent(state) {
        const { currentMessage, analysis, generatedResponse } = state;

        return `========================================
SAFERESPONSE DE-ESCALATION ANALYSIS
========================================

Generated: ${new Date().toLocaleString()}
AI Model: ${state.selectedModel}
Response Style: ${state.responseStyle}

========================================
HARASSMENT MESSAGE ANALYSIS
========================================

Risk Level: ${analysis.riskLevel.toUpperCase()}
Toxicity Score: ${(analysis.toxicityScore * 100).toFixed(1)}%
Contains Threats: ${analysis.containsThreat ? 'YES' : 'No'}

Harassment Types Detected:
${analysis.harassmentTypes.map(t => `- ${t}`).join('\n')}

Recommended Action: ${analysis.recommendedAction}

========================================
AI-GENERATED DE-ESCALATION RESPONSE
========================================

${generatedResponse.main}

========================================
ALTERNATIVE APPROACHES
========================================

${generatedResponse.alternatives.map((alt, i) => `Alternative ${i + 1} (${alt.style}):
${alt.text}`).join('\n\n')}

========================================
SAFETY REMINDER
========================================

If you feel physically unsafe or receive credible threats:
- Contact law enforcement immediately
- Document everything with screenshots
- Report to the platform
- Block the harasser
- Seek support from trusted friends/family

========================================
Generated by SafeResponse
AI De-escalation Assistant for Online Harassment
========================================
`;
    }

    /**
     * Save to history
     */
    function saveToHistory(message, analysis, response) {
        const state = window.safeResponseState;
        if (!state.history) state.history = [];

        state.history.unshift({
            timestamp: new Date().toISOString(),
            message: message.substring(0, 100),
            riskLevel: analysis.riskLevel,
            toxicityScore: analysis.toxicityScore,
            model: state.selectedModel,
            responsePreview: response.main.substring(0, 100)
        });

        // Keep only last 50
        if (state.history.length > 50) {
            state.history = state.history.slice(0, 50);
        }

        // Save to Puter KV if available
        if (window.puterKV && window.puterKV.isInitialized) {
            try {
                window.puterKV.set(`saferesponse_history_${Date.now()}`, JSON.stringify({
                    riskLevel: analysis.riskLevel,
                    timestamp: new Date().toISOString()
                }));
            } catch (error) {
                console.warn('Failed to save to KV:', error);
            }
        }
    }

    /**
     * Show error message
     */
    function showErrorMessage(error) {
        const errorHTML = `
<div style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); border: 2px solid #dc2626; border-radius: 12px; padding: 24px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
    <h3 style="margin: 0 0 8px 0; color: white; font-size: 20px;">Generation Failed</h3>
    <p style="margin: 0 0 16px 0; color: #fca5a5; font-size: 14px;">
        ${error.message || 'An unexpected error occurred'}
    </p>
    <button onclick="window.generateSafeResponse()" style="padding: 10px 20px; background: white; border: none; border-radius: 6px; color: #991b1b; font-weight: 600; cursor: pointer;">
        🔄 Try Again
    </button>
</div>`;

        if (window.appendNotionMessage) {
            window.appendNotionMessage({
                role: 'assistant',
                content: errorHTML
            });
        }
    }

    /**
     * Show notification helper
     */
    function showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        if (window.showToast) {
            window.showToast(message, type);
        }
    }

    console.log('✅ SafeResponse Display module loaded');

})();
