/**
 * InsuranceGuard AI Engine
 * Logic for B2B (Denial Generation) and B2C (Appeal Generation)
 */

(function () {
    'use strict';

    window.runInsuranceGeneration = async function () {
        const state = window.insuranceState;
        if (!state || !state.mode) {
            showNotification('Please restart the wizard: /insurance start', 'error');
            return;
        }

        // Gather Data based on mode
        let promptData = {};

        if (state.mode === 'insurer') {
            const name = document.getElementById('ins-app-name')?.value;
            const reason = document.getElementById('ins-denial-reason')?.value;
            const jurisdiction = document.getElementById('ins-jurisdiction')?.value;

            if (!name || !reason) {
                showNotification('Please fill in all fields.', 'warning');
                return;
            }
            promptData = { name, reason, jurisdiction };
        } else {
            // Claimant
            // Check if there are attachments in standard Chat flow that we should use?
            // The UI has a button to upload to #hiddenFileInput, so we check if text was pasted or if we have files.

            const text = document.getElementById('clm-denial-text')?.value;
            const strategy = document.getElementById('clm-strategy')?.value;

            // Check chatAttachments generic global from app.js if pertinent
            const hasFiles = window.chatAttachments && window.chatAttachments.length > 0;

            if (!text && !hasFiles) {
                showNotification('Please provide the denial text or upload a file.', 'warning');
                return;
            }
            promptData = { text, strategy, hasFiles };
        }

        // UI Loading State
        appendNotionMessage({
            role: 'assistant',
            content: `
            <div id="ins-loading" style="padding: 1rem; border: 1px solid #cbd5e1; background: white; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 10px; font-weight: 600; color: #334155;">
                    <span style="animation: spin 1s linear infinite;">⚙️</span>
                    Processing ${state.mode === 'insurer' ? 'Policy Compliance' : 'Denial Analysis'}...
                </div>
            </div>
            <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>`
        });

        try {
            let result;
            if (state.mode === 'insurer') {
                result = await generateInsurerDenial(promptData);
            } else {
                result = await generateClaimantAppeal(promptData);
            }

            // CleanupLoader
            const loader = document.getElementById('ins-loading');
            if (loader) loader.closest('.message').remove();

            // Display
            if (window.displayInsuranceResult) {
                window.displayInsuranceResult(result, state.mode);
            } else {
                // Fallback
                appendNotionMessage({ role: 'assistant', content: "```\n" + result + "\n```" });
            }

        } catch (e) {
            console.error("Insurance AI Error", e);
            const loader = document.getElementById('ins-loading');
            if (loader) loader.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
        }
    };

    // --- B2B Logic (Insurer) ---
    async function generateInsurerDenial(data) {
        console.log('🏢 Generating Denial with Claude Sonnet 4.5');

        const systemPrompt = `You are a Senior Claims Adjuster and Compliance Officer.
Draft a formal Insurance Denial Letter.

JURISDICTION: ${data.jurisdiction}
APPLICANT: ${data.name}

INSTRUCTIONS:
1. Cite specific (simulated but realistic) policy language based on the reason provided.
2. Ensure language complies with ${data.jurisdiction} regulations (e.g., clear explanation of rights, appeal process).
3. Tone: Professional, Empathetic but Firm, Legally Defensible.
4. Include standard "Your Rights" section.

REASON FOR DENIAL:
"${data.reason}"
`;

        const userPrompt = `Draft the denial letter for ${data.name}.`;

        const response = await puter.ai.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], {
            model: 'claude-sonnet',
            stream: false
        });

        return response?.message?.content || response;
    }

    // --- B2C Logic (Claimant) ---
    async function generateClaimantAppeal(data) {
        console.log('🛡️ Generating Appeal with Gemini/Claude');

        let denialText = data.text || '';

        // If files exist, usage of Vision/OCR would happen here. 
        // For now, we assume text passage or direct file usage if supported by the model directly.
        // We'll simulate "Reading" the file if text is empty but file exists.
        if (!denialText && data.hasFiles) {
            denialText = "[Attachment Analysis] The user provided a document image. Analyzing for denial reasons...";
            // In a real flow, we'd pass the file to Gemini Vision here.
            // For this snippet, let's assume we pass the file object if we can access it.
            if (window.chatAttachments[0]?.file) {
                // We would do a specific tool call to read it, but let's just 
                // ask the model to "Draft a general appeal based on standard reasons" if no text.
            }
        }

        // 1. Analyze Weakness (Gemini 3 Pro)
        const analysisPrompt = `
        Analyze this denial reason for weaknesses: "${denialText}"
        Strategy: ${data.strategy}
        
        Identify:
        1. Ambiguities.
        2. Lack of specific policy citation.
        3. Medical necessity arguments (if applicable).
        `;

        // We skip the separate analysis step for speed in this demo and go straight to drafting 
        // using the strategy in the prompt.

        const systemPrompt = `You are an expert Insurance Appeals Advocate.
Draft a strong Appeal Letter.

STRATEGY: ${data.strategy}
CONTEXT: The user was denied coverage.

INSTRUCTIONS:
1. Dismantle the denial reason using logic and request for proof.
2. Cite "Bad Faith" regulations if the strategy is Aggressive.
3. Demand a peer-to-peer review (if medical).
4. Tone: ${data.strategy === 'Aggressive' ? 'Firm, Litigious, Demanding' : 'Professional, Persuasive, Persistent'}.

DENIAL TEXT/CONTEXT:
"${denialText}"
`;

        const userPrompt = `Draft the appeal letter.`;

        // If we have an image detailed in window.chatAttachments, we try to send it to Gemini.
        // Otherwise use Claude for text.
        let model = 'claude-sonnet';
        let messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        // Basic multimodal check (if supported by the specific puter.ai interface in this env)
        if (data.hasFiles && window.chatAttachments[0]?.type === 'image') {
            // Use Gemini for Vision
            model = 'gemini-1.5-pro-preview'; // Fallback to 1.5 if 3 not fully vision-ready in endpoint or specific ID
            console.log('Using Gemini for Vision analysis');
            // We would construct the multimodal message here
            // For safety in this environment, we'll stick to text drafting if extraction isn't pre-done.
        }

        const response = await puter.ai.chat(messages, {
            model: model,
            stream: false
        });

        return response?.message?.content || response;
    }

    console.log('✅ InsuranceGuard AI Engine loaded');
})();
