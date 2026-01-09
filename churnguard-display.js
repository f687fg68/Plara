/**
 * ========================================
 * CHURNGUARD DISPLAY MODULE
 * ========================================
 * Output rendering and UI management for churn prevention responses
 */

(function() {
    'use strict';

    /**
     * Main generation orchestrator
     */
    window.generateChurnGuardResponse = async function() {
        const state = window.churnGuardState || {};
        const customerData = state.customerData || {};

        if (!customerData.customerName || !customerData.ticketContent) {
            showNotification('⚠️ Missing required customer data', 'error');
            return;
        }

        try {
            // Step 1: Show loading with progress steps
            showGenerationLoading();

            // Step 2: Analyze sentiment
            updateLoadingStep('sentiment', 'active');
            const sentiment = await window.analyzeCustomerSentiment(
                customerData.ticketContent,
                state.selectedModel
            );
            state.sentimentAnalysis = sentiment;
            updateLoadingStep('sentiment', 'completed');

            // Step 3: Calculate churn risk
            updateLoadingStep('churn', 'active');
            const churnRisk = window.calculateChurnRisk(
                {
                    usageChange: customerData.usageChange || 0,
                    daysSinceLastLogin: customerData.daysSinceLastLogin || 0,
                    supportTicketCount: customerData.supportTicketCount || 1,
                    npsScore: customerData.npsScore || 0,
                    contractValue: customerData.contractValue || 0,
                    daysUntilRenewal: customerData.renewalDays || 180,
                    featureAdoption: 50,
                    paymentDelays: 0,
                    hasChampion: true
                },
                sentiment
            );
            state.churnRisk = churnRisk;
            updateLoadingStep('churn', 'completed');

            // Step 4: Generate response
            updateLoadingStep('response', 'active');
            const response = await window.generateRetentionResponse({
                customerName: customerData.customerName,
                companyName: customerData.companyName,
                ticketContent: customerData.ticketContent,
                sentimentAnalysis: sentiment,
                churnRisk: churnRisk,
                customerTier: customerData.tier || 'professional',
                contractValue: customerData.contractValue,
                issueType: state.responseType || 'retention',
                selectedModel: state.selectedModel
            });
            state.currentResponse = response;
            updateLoadingStep('response', 'completed');

            // Step 5: Hide loading and display results
            hideGenerationLoading();
            displayChurnGuardResults(sentiment, churnRisk, response);

            // Save to history
            saveToHistory(customerData, sentiment, churnRisk, response);

        } catch (error) {
            console.error('❌ ChurnGuard generation failed:', error);
            hideGenerationLoading();
            showErrorMessage(error);
        }
    };

    /**
     * Show generation loading screen
     */
    function showGenerationLoading() {
        const loadingHTML = `
<div id="churnguard-loading" style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; text-align: center;">
    <div style="width: 60px; height: 60px; margin: 0 auto 24px auto; border: 4px solid #334155; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <h3 style="margin: 0 0 8px 0; color: white; font-size: 20px;">Analyzing Customer & Generating Response</h3>
    <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px;">Using ${window.churnGuardState?.selectedModel || 'Claude Sonnet 4.5'}</p>
    
    <div id="churnguard-steps" style="max-width: 400px; margin: 0 auto; text-align: left;">
        <div id="step-sentiment" class="loading-step" style="display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 8px; background: #0f172a; border-radius: 8px; opacity: 0.5;">
            <span class="step-icon" style="width: 32px; height: 32px; background: #334155; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">1</span>
            <span style="flex: 1; color: #e2e8f0; font-size: 14px;">Analyzing sentiment & frustration</span>
            <span class="step-status" style="font-size: 20px; display: none;">⏳</span>
        </div>
        <div id="step-churn" class="loading-step" style="display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 8px; background: #0f172a; border-radius: 8px; opacity: 0.5;">
            <span class="step-icon" style="width: 32px; height: 32px; background: #334155; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">2</span>
            <span style="flex: 1; color: #e2e8f0; font-size: 14px;">Calculating churn risk score</span>
            <span class="step-status" style="font-size: 20px; display: none;">⏳</span>
        </div>
        <div id="step-response" class="loading-step" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #0f172a; border-radius: 8px; opacity: 0.5;">
            <span class="step-icon" style="width: 32px; height: 32px; background: #334155; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">3</span>
            <span style="flex: 1; color: #e2e8f0; font-size: 14px;">Generating personalized response</span>
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
        const loadingEl = document.getElementById('churnguard-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Display complete results
     */
    function displayChurnGuardResults(sentiment, churnRisk, response) {
        const resultsHTML = buildResultsHTML(sentiment, churnRisk, response);
        
        if (window.appendNotionMessage) {
            window.appendNotionMessage({
                role: 'assistant',
                content: resultsHTML
            });
        }

        // Attach action button listeners
        setTimeout(() => {
            attachResultsEventListeners();
        }, 100);
    }

    /**
     * Build results HTML
     */
    function buildResultsHTML(sentiment, churnRisk, response) {
        const customerName = window.churnGuardState?.customerData?.customerName || 'Customer';
        
        return `
<div style="max-width: 1000px; margin: 0 auto;">
    <!-- Header with Customer Info -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div>
                <h2 style="margin: 0 0 8px 0; color: white; font-size: 24px; font-weight: 700;">${customerName}</h2>
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">Customer Success Analysis & Retention Response</p>
            </div>
            <div style="text-align: right;">
                <div style="display: inline-block; padding: 8px 16px; background: ${churnRisk.color}20; border: 2px solid ${churnRisk.color}; border-radius: 8px; font-weight: 600; color: ${churnRisk.color};">
                    ${churnRisk.label}
                </div>
                <div style="margin-top: 8px; font-size: 32px; font-weight: 800; color: ${churnRisk.color};">
                    ${churnRisk.score.toFixed(0)}%
                </div>
            </div>
        </div>
    </div>

    <!-- Analysis Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
        <!-- Sentiment Analysis -->
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px;">
            <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                <span>😤</span>
                <span>Sentiment Analysis</span>
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div>
                    <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Sentiment Score</div>
                    <div style="font-size: 24px; font-weight: 700; color: ${sentiment.sentiment < 0 ? '#ef4444' : '#10b981'};">
                        ${(sentiment.sentiment * 100).toFixed(0)}
                    </div>
                </div>
                <div>
                    <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Frustration Level</div>
                    <div style="font-size: 24px; font-weight: 700; color: ${sentiment.frustrationLevel > 7 ? '#ef4444' : sentiment.frustrationLevel > 4 ? '#f59e0b' : '#10b981'};">
                        ${sentiment.frustrationLevel}/10
                    </div>
                </div>
            </div>
            <div style="margin-bottom: 12px;">
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Emotional Tone</div>
                <div style="display: inline-block; padding: 6px 12px; background: #0f172a; border-radius: 6px; color: #e2e8f0; font-size: 13px; font-weight: 500;">
                    ${sentiment.emotionalTone}
                </div>
            </div>
            <div>
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Urgency Level</div>
                <div style="display: inline-block; padding: 6px 12px; background: ${sentiment.urgencyLevel === 'critical' ? '#7f1d1d' : sentiment.urgencyLevel === 'high' ? '#7c2d12' : '#365314'}; border-radius: 6px; color: white; font-size: 13px; font-weight: 600; text-transform: uppercase;">
                    ${sentiment.urgencyLevel}
                </div>
            </div>
        </div>

        <!-- Churn Risk Factors -->
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px;">
            <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                <span>⚠️</span>
                <span>Top Churn Risk Factors</span>
            </h3>
            ${churnRisk.factors.slice(0, 3).map(factor => `
                <div style="padding: 10px 12px; margin-bottom: 8px; background: #0f172a; border-left: 3px solid ${factor.impact === 'critical' ? '#dc2626' : factor.impact === 'high' ? '#ea580c' : '#ca8a04'}; border-radius: 4px;">
                    <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 4px;">
                        ${factor.factor}
                    </div>
                    <div style="font-size: 12px; color: #94a3b8;">
                        ${factor.detail}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <!-- Escalation Recommendation -->
    ${response.escalation ? `
    <div style="background: ${response.escalation.escalate ? 'linear-gradient(135deg, #7f1d1d20, #991b1b10)' : 'linear-gradient(135deg, #14532d20, #16a34a10)'}; border: 2px solid ${response.escalation.escalate ? '#dc2626' : '#16a34a'}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 48px;">${response.escalation.escalate ? '🚨' : '✅'}</div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 8px 0; color: white; font-size: 18px; font-weight: 700;">
                    ${response.escalation.escalate ? 'Escalation Required' : 'Standard Follow-up'}
                </h3>
                <div style="margin-bottom: 8px; color: #e2e8f0; font-size: 14px;">
                    <strong>Route to:</strong> ${response.escalation.to}
                </div>
                <div style="color: #cbd5e1; font-size: 13px;">
                    ${response.escalation.reason}
                </div>
            </div>
            <div style="text-align: right;">
                <div style="padding: 6px 12px; background: ${response.escalation.escalate ? '#dc2626' : '#16a34a'}; border-radius: 6px; color: white; font-size: 12px; font-weight: 600; margin-bottom: 8px;">
                    ${response.escalation.priority}
                </div>
                <div style="font-size: 12px; color: #cbd5e1;">
                    ${response.escalation.action}
                </div>
            </div>
        </div>
    </div>
    ` : ''}

    <!-- Generated Response -->
    <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <div style="padding: 20px; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; color: #60a5fa; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                <span>📧</span>
                <span>AI-Generated Retention Response</span>
            </h3>
            <div style="display: flex; gap: 8px;">
                <button id="churnguard-copy-btn" style="padding: 8px 16px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                    📋 Copy
                </button>
                <button id="churnguard-download-btn" style="padding: 8px 16px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                    💾 Download
                </button>
                <button id="churnguard-insert-btn" style="padding: 8px 16px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                    📄 Insert to Doc
                </button>
            </div>
        </div>
        <div id="churnguard-response-text" style="padding: 24px; background: #0f172a; color: #e2e8f0; font-size: 14px; line-height: 1.8; white-space: pre-wrap; font-family: 'Inter', sans-serif;">
${response.response}
        </div>
        <div style="padding: 16px 24px; background: #1e293b; border-top: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #94a3b8;">
            <div>
                <span>📊 ${response.wordCount} words</span>
                <span style="margin: 0 12px;">•</span>
                <span>🤖 ${response.model}</span>
                <span style="margin: 0 12px;">•</span>
                <span>⏱️ Generated ${new Date(response.generatedAt).toLocaleTimeString()}</span>
            </div>
            <button id="churnguard-regenerate-btn" style="padding: 6px 12px; background: transparent; border: 1px solid #475569; border-radius: 6px; color: #94a3b8; font-size: 12px; cursor: pointer;">
                🔄 Regenerate
            </button>
        </div>
    </div>

    <!-- Product Solutions -->
    ${response.solutions && response.solutions.length > 0 ? `
    <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>💡</span>
            <span>Recommended Product Solutions</span>
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
            ${response.solutions.map(solution => `
                <div style="padding: 16px; background: #0f172a; border-radius: 8px; border-left: 3px solid ${solution.impact === 'critical' ? '#dc2626' : solution.impact === 'high' ? '#f59e0b' : '#3b82f6'};">
                    <h4 style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 14px; font-weight: 600;">
                        ${solution.title}
                    </h4>
                    <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                        ${solution.description}
                    </p>
                    <div style="font-size: 11px; color: #10b981; font-weight: 500;">
                        ✓ ${solution.benefit}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}
</div>
        `;
    }

    /**
     * Attach event listeners to results
     */
    function attachResultsEventListeners() {
        // Copy button
        const copyBtn = document.getElementById('churnguard-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const responseText = document.getElementById('churnguard-response-text')?.textContent;
                if (responseText) {
                    navigator.clipboard.writeText(responseText.trim());
                    showNotification('✅ Response copied to clipboard!', 'success');
                }
            });
        }

        // Download button
        const downloadBtn = document.getElementById('churnguard-download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadResponse);
        }

        // Insert to doc button
        const insertBtn = document.getElementById('churnguard-insert-btn');
        if (insertBtn) {
            insertBtn.addEventListener('click', insertToDocument);
        }

        // Regenerate button
        const regenBtn = document.getElementById('churnguard-regenerate-btn');
        if (regenBtn) {
            regenBtn.addEventListener('click', () => {
                window.generateChurnGuardResponse();
            });
        }
    }

    /**
     * Download response as text file
     */
    function downloadResponse() {
        const state = window.churnGuardState;
        const response = state?.currentResponse;
        const customerData = state?.customerData;

        if (!response) return;

        const filename = `ChurnGuard_${customerData?.customerName?.replace(/\s+/g, '_')}_${Date.now()}.txt`;
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
        const { customerData, sentimentAnalysis, churnRisk, currentResponse } = state;

        return `========================================
CHURNGUARD CUSTOMER SUCCESS ANALYSIS
========================================

Generated: ${new Date().toLocaleString()}
Customer: ${customerData.customerName}
AI Model: ${state.selectedModel}

========================================
CUSTOMER INFORMATION
========================================

Customer Name: ${customerData.customerName}
Company: ${customerData.companyName || 'N/A'}
Tier: ${customerData.tier}
Contract Value: ${customerData.contractValue ? '$' + customerData.contractValue.toLocaleString() : 'N/A'}
Days Until Renewal: ${customerData.renewalDays}

========================================
SENTIMENT ANALYSIS
========================================

Overall Sentiment: ${(sentimentAnalysis.sentiment * 100).toFixed(1)}%
Frustration Level: ${sentimentAnalysis.frustrationLevel}/10
Emotional Tone: ${sentimentAnalysis.emotionalTone}
Urgency Level: ${sentimentAnalysis.urgencyLevel}

Key Pain Points:
${sentimentAnalysis.painPoints.map(p => `- ${p}`).join('\n')}

========================================
CHURN RISK ASSESSMENT
========================================

Churn Risk Score: ${churnRisk.score.toFixed(1)}%
Risk Level: ${churnRisk.label}

Top Risk Factors:
${churnRisk.factors.map((f, i) => `${i + 1}. ${f.factor} (${f.impact})
   ${f.detail}
   Recommendation: ${f.recommendation}`).join('\n\n')}

========================================
ESCALATION RECOMMENDATION
========================================

Escalate: ${currentResponse.escalation.escalate ? 'YES' : 'NO'}
Route To: ${currentResponse.escalation.to}
Priority: ${currentResponse.escalation.priority}
Reason: ${currentResponse.escalation.reason}
Action: ${currentResponse.escalation.action}

========================================
AI-GENERATED RETENTION RESPONSE
========================================

${currentResponse.response}

========================================
PRODUCT SOLUTIONS
========================================

${currentResponse.solutions.map((s, i) => `${i + 1}. ${s.title}
   ${s.description}
   Benefit: ${s.benefit}
   Implementation: ${s.implementation}`).join('\n\n')}

========================================
Generated by ChurnGuard
Customer Success Churn Prevention Engine
========================================
`;
    }

    /**
     * Insert response to document editor
     */
    async function insertToDocument() {
        const responseText = document.getElementById('churnguard-response-text')?.textContent;
        if (!responseText) return;

        // Check if Editor.js is available
        if (window.editor && typeof window.editor.blocks !== 'undefined') {
            try {
                // Insert as paragraph blocks
                const paragraphs = responseText.trim().split('\n\n');
                for (const para of paragraphs) {
                    if (para.trim()) {
                        await window.editor.blocks.insert('paragraph', {
                            text: para.trim()
                        });
                    }
                }
                showNotification('✅ Response inserted into document!', 'success');
            } catch (error) {
                console.error('Failed to insert into editor:', error);
                showNotification('⚠️ Failed to insert into document', 'error');
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(responseText.trim());
            showNotification('⚠️ Editor not available. Response copied to clipboard instead.', 'warning');
        }
    }

    /**
     * Save to history
     */
    function saveToHistory(customerData, sentiment, churnRisk, response) {
        const state = window.churnGuardState;
        if (!state.history) state.history = [];

        state.history.unshift({
            timestamp: new Date().toISOString(),
            customer: customerData.customerName,
            churnScore: churnRisk.score,
            sentiment: sentiment.sentiment,
            model: state.selectedModel,
            responsePreview: response.response.substring(0, 100)
        });

        // Keep only last 50
        if (state.history.length > 50) {
            state.history = state.history.slice(0, 50);
        }

        // Save to Puter KV if available
        if (window.puterKV && window.puterKV.isInitialized) {
            try {
                window.puterKV.set(`churnguard_history_${Date.now()}`, JSON.stringify({
                    customer: customerData.customerName,
                    churnScore: churnRisk.score,
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
    <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #fecaca; text-align: left;">
        ${error.stack ? error.stack.split('\n')[0] : 'Check console for details'}
    </div>
    <button onclick="window.generateChurnGuardResponse()" style="margin-top: 16px; padding: 10px 20px; background: white; border: none; border-radius: 6px; color: #991b1b; font-weight: 600; cursor: pointer;">
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

    console.log('✅ ChurnGuard Display module loaded');

})();
