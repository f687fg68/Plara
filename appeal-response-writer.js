/**
 * AppealGuard - AI Academic Appeal Response Writer
 * Integrated with Puter.js, Gemini 3.0 Pro, and Claude Sonnet 4.5
 * 
 * This module provides intelligent appeal response generation for:
 * - Academic Misconduct Appeals
 * - Financial Aid Appeals
 * - Grade Appeals
 * - Disciplinary Action Appeals
 */

(function () {
    'use strict';

    // Appeal Types Configuration
    const APPEAL_TYPES = {
        'misconduct': {
            name: 'Academic Misconduct',
            icon: '📚',
            description: 'Appeal academic integrity violations',
            defaultTone: 'contrite',
            placeholder: 'Explain what happened in your own words. Be honest about the situation.'
        },
        'financial': {
            name: 'Financial Aid Appeal',
            icon: '💰',
            description: 'Appeal financial aid suspension or denial',
            defaultTone: 'desperate',
            placeholder: 'Explain your change in financial circumstances (job loss, medical bills, etc.)'
        },
        'grade': {
            name: 'Grade Appeal',
            icon: '📊',
            description: 'Appeal final grade or assignment grade',
            defaultTone: 'factual',
            placeholder: 'Explain why the grade is incorrect based on syllabus or grading rubric.'
        },
        'disciplinary': {
            name: 'Disciplinary Action',
            icon: '⚖️',
            description: 'Appeal disciplinary sanctions',
            defaultTone: 'contrite',
            placeholder: 'Explain the circumstances and why you believe the sanction should be reconsidered.'
        }
    };

    // Tone Configurations
    const TONE_CONFIGS = {
        'contrite': {
            name: 'Contrite & Reform-Oriented',
            description: 'Admitting fault, showing remorse and commitment to improvement',
            systemModifier: 'The student admits fault and seeks to demonstrate growth, maturity, and commitment to academic integrity.'
        },
        'factual': {
            name: 'Factual & Evidence-Based',
            description: 'Denying fault with evidence and procedural arguments',
            systemModifier: 'The student disputes the allegation with factual evidence, syllabus citations, and procedural concerns.'
        },
        'desperate': {
            name: 'Urgent & Need-Based',
            description: 'Emphasizing financial hardship and need',
            systemModifier: 'The student faces significant financial hardship and needs immediate aid restoration to continue education.'
        },
        'procedural': {
            name: 'Procedural & Technical',
            description: 'Focusing on process violations or errors',
            systemModifier: 'The student identifies procedural errors, due process violations, or administrative mistakes in their case.'
        }
    };

    // State Management
    let appealState = {
        type: 'misconduct',
        tone: 'contrite',
        institution: '',
        allegation: '',
        rawInput: '',
        selectedModel: 'claude-sonnet-4',
        currentDraft: '',
        history: []
    };

    /**
     * Initialize AppealGuard Command Handler
     */
    window.appealCommandHandler = async function (command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        switch (subCommand) {
            case 'start':
            case 'new':
                await startAppealWizard();
                break;
            case 'type':
                if (parts[2]) await setAppealType(parts[2]);
                break;
            case 'tone':
                if (parts[2]) await setAppealTone(parts[2]);
                break;
            case 'model':
                if (parts[2]) await setAppealModel(parts[2]);
                break;
            case 'help':
                showAppealHelp();
                break;
            default:
                await startAppealWizard();
        }
    };

    /**
     * Start the Appeal Wizard UI
     */
    async function startAppealWizard() {
        appendNotionMessage({
            role: 'assistant',
            content: buildWizardUI()
        });
    }

    /**
     * Build Interactive Wizard UI
     */
    function buildWizardUI() {
        return `
<div class="appealguard-wizard" style="font-family: 'Inter', sans-serif;">
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; background: #c9a227; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🛡️</div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">AppealGuard</h2>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">AI-Powered Academic Appeal Response Writer</p>
        <div style="margin-top: 12px; padding: 8px 12px; background: rgba(255,255,255,0.15); border-radius: 6px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
            🔒 Client-Side Encrypted • Zero Data Retention
        </div>
    </div>

    <div style="padding: 0 1rem 1rem;">
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 1</span>
                Select Appeal Type
            </h3>
            ${buildAppealTypeButtons()}
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 2</span>
                Choose Response Tone
            </h3>
            ${buildToneButtons()}
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e3a5f;">
                <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 3</span>
                Select AI Model
            </h3>
            ${buildModelButtons()}
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #1e3a5f;">
                <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">STEP 4</span>
                Provide Details
            </h3>
            <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.75rem;">Be honest and thorough. The AI will refine your tone and structure.</p>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Institution Name</label>
                <input type="text" id="appeal-institution" placeholder="e.g., University of Michigan" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem;" value="${appealState.institution}">
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Specific Issue/Allegation</label>
                <input type="text" id="appeal-allegation" placeholder="e.g., Plagiarism in CS101 Final Project" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem;" value="${appealState.allegation}">
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Your Explanation (Be Honest & Detailed)</label>
                <textarea id="appeal-raw-input" rows="6" placeholder="${APPEAL_TYPES[appealState.type].placeholder}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; font-family: inherit; resize: vertical;">${appealState.rawInput}</textarea>
            </div>
        </div>

        <button onclick="window.generateAppeal()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(30, 58, 95, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(30, 58, 95, 0.3)';">
            🚀 Generate Professional Appeal Letter
        </button>

        <div style="margin-top: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 0.85rem; color: #374151;">
                <strong>💡 Tips:</strong> Type naturally and include all relevant details. The AI will transform your raw explanation into a professional, structured appeal letter suitable for submission to university committees.
            </p>
        </div>
    </div>
</div>`;
    }

    /**
     * Build Appeal Type Selection Buttons
     */
    function buildAppealTypeButtons() {
        return Object.keys(APPEAL_TYPES).map(type => {
            const config = APPEAL_TYPES[type];
            const isActive = appealState.type === type;
            return `
<button onclick="window.setAppealType('${type}')" style="
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border: 2px solid ${isActive ? '#1e3a5f' : '#e5e7eb'};
    background: ${isActive ? 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)' : '#ffffff'};
    color: ${isActive ? '#ffffff' : '#374151'};
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
" onmouseover="if(this.style.background === 'rgb(255, 255, 255)') this.style.background='#f9fafb'" onmouseout="if(!this.style.background.includes('gradient')) this.style.background='#ffffff'">
    <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2rem;">${config.icon}</span>
        <div>
            <div style="font-weight: 600;">${config.name}</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">${config.description}</div>
        </div>
    </div>
</button>`;
        }).join('');
    }

    /**
     * Build Tone Selection Buttons
     */
    function buildToneButtons() {
        return Object.keys(TONE_CONFIGS).map(tone => {
            const config = TONE_CONFIGS[tone];
            const isActive = appealState.tone === tone;
            return `
<button onclick="window.setAppealTone('${tone}')" style="
    display: inline-block;
    padding: 0.6rem 1rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    border: 2px solid ${isActive ? '#c9a227' : '#e5e7eb'};
    background: ${isActive ? '#c9a227' : '#ffffff'};
    color: ${isActive ? '#ffffff' : '#374151'};
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
" onmouseover="if(this.style.background === 'rgb(255, 255, 255)') this.style.background='#f9fafb'" onmouseout="if(this.style.background !== 'rgb(201, 162, 39)') this.style.background='#ffffff'" title="${config.description}">
    ${config.name}
</button>`;
        }).join('');
    }

    /**
     * Build Model Selection Buttons
     */
    function buildModelButtons() {
        const models = [
            { id: 'claude-sonnet-4', name: 'Claude 4.5 Sonnet', icon: '🎯', desc: 'Best for nuanced legal writing' },
            { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', icon: '🧠', desc: 'Advanced reasoning & strategy' },
            { id: 'gpt-4o', name: 'GPT-4o', icon: '⚡', desc: 'Fast and reliable' }
        ];

        return models.map(model => {
            const isActive = appealState.selectedModel === model.id;
            return `
<button onclick="window.setAppealModel('${model.id}')" style="
    display: inline-block;
    padding: 0.6rem 1rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    border: 2px solid ${isActive ? '#10b981' : '#e5e7eb'};
    background: ${isActive ? '#10b981' : '#ffffff'};
    color: ${isActive ? '#ffffff' : '#374151'};
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
" onmouseover="if(this.style.background === 'rgb(255, 255, 255)') this.style.background='#f9fafb'" onmouseout="if(this.style.background !== 'rgb(16, 185, 129)') this.style.background='#ffffff'" title="${model.desc}">
    ${model.icon} ${model.name}
</button>`;
        }).join('');
    }

    // Global functions for UI interaction
    window.setAppealType = function (type) {
        if (APPEAL_TYPES[type]) {
            appealState.type = type;
            appealState.tone = APPEAL_TYPES[type].defaultTone;
            startAppealWizard();
            showNotification(`Appeal type set to ${APPEAL_TYPES[type].name}`, 'success');
        }
    };

    window.setAppealTone = function (tone) {
        if (TONE_CONFIGS[tone]) {
            appealState.tone = tone;
            startAppealWizard();
            showNotification(`Tone set to ${TONE_CONFIGS[tone].name}`, 'success');
        }
    };

    window.setAppealModel = function (model) {
        appealState.selectedModel = model;
        startAppealWizard();
        const modelNames = {
            'claude-sonnet-4': 'Claude 4.5 Sonnet',
            'gemini-3-pro-preview': 'Gemini 3.0 Pro',
            'gpt-4o': 'GPT-4o'
        };
        showNotification(`Model set to ${modelNames[model]}`, 'success');
    };

    /**
     * Generate Appeal Letter
     */
    window.generateAppeal = async function () {
        // Capture form data
        appealState.institution = document.getElementById('appeal-institution')?.value?.trim() || '';
        appealState.allegation = document.getElementById('appeal-allegation')?.value?.trim() || '';
        appealState.rawInput = document.getElementById('appeal-raw-input')?.value?.trim() || '';

        // Validation
        if (!appealState.rawInput) {
            showNotification('Please provide your explanation', 'warning');
            return;
        }

        // Show loading state
        appendNotionMessage({
            role: 'assistant',
            content: `<div style="text-align: center; padding: 2rem;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top-color: #1e3a5f; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 1rem; color: #6b7280; font-weight: 500;">Analyzing institutional policy and structuring formal arguments...</p>
                <p style="margin-top: 0.5rem; color: #9ca3af; font-size: 0.9rem;">Using ${appealState.selectedModel === 'claude-sonnet-4' ? 'Claude 4.5 Sonnet' : 'Gemini 3.0 Pro'} for best results</p>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>`
        });

        try {
            const appealLetter = await generateAppealWithAI();
            appealState.currentDraft = appealLetter;
            appealState.history.push({
                timestamp: new Date().toISOString(),
                type: appealState.type,
                draft: appealLetter
            });

            // Display the generated appeal
            displayGeneratedAppeal(appealLetter);

        } catch (error) {
            console.error('Appeal generation error:', error);
            appendNotionMessage({
                role: 'assistant',
                content: `<div style="padding: 1rem; background: #fee; border-left: 4px solid #dc2626; border-radius: 8px; color: #991b1b;">
                    <strong>❌ Error generating appeal:</strong><br>
                    ${error.message || 'Please try again or contact support.'}
                </div>`
            });
        }
    };

    /**
     * Show Help Information
     */
    function showAppealHelp() {
        const helpContent = `
<div style="font-family: 'Inter', sans-serif; padding: 1rem;">
    <h3 style="color: #1e3a5f; margin-bottom: 1rem;">📚 AppealGuard Help</h3>
    
    <h4 style="color: #374151; margin-top: 1rem;">Commands:</h4>
    <ul style="line-height: 1.8; color: #6b7280;">
        <li><code>/appeal start</code> - Start the appeal wizard</li>
        <li><code>/appeal type [type]</code> - Set appeal type (misconduct/financial/grade/disciplinary)</li>
        <li><code>/appeal tone [tone]</code> - Set tone (contrite/factual/desperate/procedural)</li>
        <li><code>/appeal model [model]</code> - Set AI model (claude-sonnet-4/gemini-3-pro-preview/gpt-4o)</li>
    </ul>

    <h4 style="color: #374151; margin-top: 1rem;">Appeal Types:</h4>
    <ul style="line-height: 1.8; color: #6b7280;">
        ${Object.keys(APPEAL_TYPES).map(key => {
            const type = APPEAL_TYPES[key];
            return `<li><strong>${type.icon} ${type.name}:</strong> ${type.description}</li>`;
        }).join('')}
    </ul>

    <h4 style="color: #374151; margin-top: 1rem;">Privacy & Security:</h4>
    <p style="color: #6b7280; line-height: 1.6;">
        ✅ All processing happens client-side<br>
        ✅ Your data never leaves your browser<br>
        ✅ Drafts can be saved to your private Puter cloud<br>
        ✅ Zero retention policy - we don't store anything
    </p>
</div>`;

        appendNotionMessage({
            role: 'assistant',
            content: helpContent
        });
    }

    // More functions to follow in next file...
    console.log('✅ AppealGuard module loaded');
})();
